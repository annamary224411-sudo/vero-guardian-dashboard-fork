import type * as StellarSdk from '@stellar/stellar-sdk';

/** RPC and network details used for all contract calls. */
export interface NetworkConfig {
  sorobanRpcUrl: string;
  networkPassphrase: string;
  fee?: string | number;
  timeoutSeconds?: number;
}

/** A browser wallet adapter. Freighter can be adapted to this interface. */
export type TransactionSigner = (xdr: string, options: {
  networkPassphrase: string;
  address: string;
}) => Promise<{ signedTxXdr?: string; error?: { message?: string } }>;

export interface SDKOptions {
  signer?: TransactionSigner;
  server?: SorobanServer;
  fee?: string | number;
  timeoutSeconds?: number;
}

export interface SorobanServer {
  getAccount(address: string): Promise<StellarSdk.Account>;
  simulateTransaction(transaction: StellarSdk.Transaction | StellarSdk.FeeBumpTransaction): Promise<StellarSdk.SorobanRpc.Api.SimulateTransactionResponse>;
  sendTransaction(transaction: StellarSdk.Transaction | StellarSdk.FeeBumpTransaction): Promise<{ hash: string; status: string }>;
}

export interface TransactionResult {
  hash: string;
  unsignedEnvelopeXdr: string;
  signedEnvelopeXdr: string;
}

export interface RegisterTaskParams { sourceAccount: string; taskId: string; repository?: string; }
export interface CastVoteParams { sourceAccount: string; taskId: string; approved: boolean; }
export interface SetRoleParams { sourceAccount: string; account: string; role: string; }
export interface TallyVotesParams { sourceAccount: string; taskId: string; }
export interface GetReputationParams { sourceAccount: string; account: string; }
export interface HaltParams { sourceAccount: string; }

export interface ContractEvent {
  contractId: string;
  topics: unknown[];
  data: unknown;
}
