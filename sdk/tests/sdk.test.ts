import * as StellarSdk from '@stellar/stellar-sdk';
import { StellarStreamSDK, StellarStreamSDKError } from '../src';

const source = StellarSdk.Keypair.random().publicKey();
const contractId = 'CA3D5KRYM6CB7OWQ6TWYRR3Z4T7GNZLKERYNZGGA5SOAOPIFY6YQGAXE';
const account = new StellarSdk.Account(source, '1');
const server = {
  getAccount: jest.fn(async () => account),
  simulateTransaction: jest.fn(),
  sendTransaction: jest.fn(),
};
const network = { sorobanRpcUrl: 'https://example.test', networkPassphrase: StellarSdk.Networks.TESTNET };

function successSimulation() {
  return {
    _parsed: true,
    transactionData: new StellarSdk.SorobanDataBuilder(),
    minResourceFee: '0',
    result: { auth: [], retval: StellarSdk.nativeToScVal(7) },
  } as unknown as StellarSdk.SorobanRpc.Api.SimulateTransactionSuccessResponse;
}

describe('StellarStreamSDK', () => {
  beforeEach(() => { jest.clearAllMocks(); server.simulateTransaction.mockResolvedValue(successSimulation()); });

  it('uses the typed cast_vote entrypoint and submits signed XDR', async () => {
    const signer = jest.fn(async (xdr: string) => ({ signedTxXdr: xdr }));
    server.sendTransaction.mockResolvedValue({ hash: 'abc', status: 'PENDING' });
    const sdk = new StellarStreamSDK(contractId, network, { server, signer });
    await expect(sdk.castVote({ sourceAccount: source, taskId: '42', approved: true })).resolves.toMatchObject({ hash: 'abc' });
    expect(signer).toHaveBeenCalledWith(expect.any(String), expect.objectContaining({ address: source }));
    expect(server.sendTransaction).toHaveBeenCalledTimes(1);
  });

  it('returns the native value from get_reputation simulations', async () => {
    const sdk = new StellarStreamSDK(contractId, network, { server });
    await expect(sdk.getReputation({ sourceAccount: source, account: source })).resolves.toBe(7n);
  });

  it('provides a stable error when no signer is configured', async () => {
    const sdk = new StellarStreamSDK(contractId, network, { server });
    await expect(sdk.halt({ sourceAccount: source })).rejects.toMatchObject({ code: 'SIGNER_UNAVAILABLE' } as Partial<StellarStreamSDKError>);
  });
});
