import * as StellarSdk from '@stellar/stellar-sdk';
import { StellarStreamSDKError } from './errors';
import type { CastVoteParams, GetReputationParams, HaltParams, NetworkConfig, RegisterTaskParams, SDKOptions, SetRoleParams, SorobanServer, TallyVotesParams, TransactionResult } from './types';

export * from './types';
export * from './errors';
export * from './events';

const DEFAULT_FEE = StellarSdk.BASE_FEE;
const DEFAULT_TIMEOUT_SECONDS = 30;

/**
 * Typed browser client for every public Vero Guardian contract entrypoint.
 * Mutating calls build, simulate, sign, and submit a Soroban transaction.
 */
export class StellarStreamSDK {
  private readonly server: SorobanServer;
  private readonly fee: string | number;
  private readonly timeoutSeconds: number;

  constructor(public readonly contractId: string, public readonly network: NetworkConfig, private readonly options: SDKOptions = {}) {
    if (!contractId.trim()) throw new StellarStreamSDKError('INVALID_CONTRACT_ID', 'A Soroban contract ID is required.');
    if (!network.sorobanRpcUrl || !network.networkPassphrase) throw new StellarStreamSDKError('INVALID_ARGUMENT', 'Network RPC URL and passphrase are required.');
    this.server = options.server ?? new StellarSdk.SorobanRpc.Server(network.sorobanRpcUrl) as unknown as SorobanServer;
    this.fee = options.fee ?? network.fee ?? DEFAULT_FEE;
    this.timeoutSeconds = options.timeoutSeconds ?? network.timeoutSeconds ?? DEFAULT_TIMEOUT_SECONDS;
  }

  async registerTask(params: RegisterTaskParams): Promise<TransactionResult> {
    return this.invoke(params.sourceAccount, 'register_task', [params.taskId, params.repository ?? '']);
  }
  async castVote(params: CastVoteParams): Promise<TransactionResult> {
    return this.invoke(params.sourceAccount, 'cast_vote', [params.taskId, params.approved]);
  }
  async tallyVotes(params: TallyVotesParams): Promise<TransactionResult> {
    return this.invoke(params.sourceAccount, 'tally_votes', [params.taskId]);
  }
  async setRole(params: SetRoleParams): Promise<TransactionResult> {
    return this.invoke(params.sourceAccount, 'set_role', [params.account, params.role]);
  }
  async halt(params: HaltParams): Promise<TransactionResult> { return this.invoke(params.sourceAccount, 'halt', []); }

  /** Simulates the read-only contract entrypoint and returns its native value. */
  async getReputation(params: GetReputationParams): Promise<unknown> {
    const { simulation } = await this.simulate(params.sourceAccount, 'get_reputation', [params.account]);
    const result = simulation.result;
    if (!result?.retval) return undefined;
    return StellarSdk.scValToNative(result.retval);
  }

  /** Build and simulate a call without signing it, useful for wallet previews. */
  async buildTransaction(sourceAccount: string, method: string, args: unknown[] = []): Promise<StellarSdk.Transaction> {
    const { transaction, simulation } = await this.simulate(sourceAccount, method, args);
    return StellarSdk.SorobanRpc.assembleTransaction(transaction, simulation).build();
  }

  private async invoke(sourceAccount: string, method: string, args: unknown[]): Promise<TransactionResult> {
    const signer = this.options.signer;
    if (!signer) throw new StellarStreamSDKError('SIGNER_UNAVAILABLE', 'A transaction signer is required for mutating contract calls.');
    const transaction = await this.buildTransaction(sourceAccount, method, args);
    const unsignedEnvelopeXdr = transaction.toXDR();
    let signed;
    try { signed = await signer(unsignedEnvelopeXdr, { networkPassphrase: this.network.networkPassphrase, address: sourceAccount }); }
    catch (cause) { throw new StellarStreamSDKError('SIGNING_FAILED', 'Wallet signing failed.', cause); }
    if (!signed.signedTxXdr || signed.error) throw new StellarStreamSDKError('SIGNING_FAILED', signed.error?.message ?? 'Wallet did not return signed transaction XDR.');
    try {
      const response = await this.server.sendTransaction(StellarSdk.TransactionBuilder.fromXDR(signed.signedTxXdr, this.network.networkPassphrase));
      if (response.status === 'ERROR') throw new Error('RPC returned ERROR status.');
      return { hash: response.hash, unsignedEnvelopeXdr, signedEnvelopeXdr: signed.signedTxXdr };
    } catch (cause) { throw new StellarStreamSDKError('SUBMISSION_FAILED', 'Unable to submit the Soroban transaction.', cause); }
  }

  private async simulate(sourceAccount: string, method: string, args: unknown[]): Promise<{ transaction: StellarSdk.Transaction; simulation: StellarSdk.SorobanRpc.Api.SimulateTransactionSuccessResponse }> {
    if (!sourceAccount.trim() || !method.trim()) throw new StellarStreamSDKError('INVALID_ARGUMENT', 'A source account and contract method are required.');
    const account = await this.server.getAccount(sourceAccount);
    const values = args.map((arg) => StellarSdk.nativeToScVal(arg));
    const transaction = new StellarSdk.TransactionBuilder(account, { fee: String(this.fee), networkPassphrase: this.network.networkPassphrase })
      .addOperation(new StellarSdk.Contract(this.contractId).call(method, ...values)).setTimeout(this.timeoutSeconds).build();
    let simulation: StellarSdk.SorobanRpc.Api.SimulateTransactionResponse;
    try { simulation = await this.server.simulateTransaction(transaction); }
    catch (cause) { throw new StellarStreamSDKError('RPC_ERROR', 'Soroban RPC simulation request failed.', cause); }
    if (StellarSdk.SorobanRpc.Api.isSimulationError(simulation)) throw new StellarStreamSDKError('SIMULATION_FAILED', simulation.error);
    return { transaction, simulation };
  }
}
