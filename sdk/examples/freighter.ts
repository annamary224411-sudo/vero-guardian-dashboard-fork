import { signTransaction } from '@stellar/freighter-api';
import { StellarStreamSDK } from '../src';

const sdk = new StellarStreamSDK(process.env.NEXT_PUBLIC_VERO_CONTRACT_ID!, {
  sorobanRpcUrl: process.env.NEXT_PUBLIC_SOROBAN_RPC_URL ?? 'https://soroban-testnet.stellar.org',
  networkPassphrase: 'Test SDF Network ; September 2015',
}, { signer: signTransaction });

export async function vote(sourceAccount: string, taskId: string) {
  return sdk.castVote({ sourceAccount, taskId, approved: true });
}
