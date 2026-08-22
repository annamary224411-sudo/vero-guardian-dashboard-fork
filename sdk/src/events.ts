import * as StellarSdk from '@stellar/stellar-sdk';
import type { ContractEvent } from './types';
import { StellarStreamSDKError } from './errors';

/** Convert Soroban RPC event values into plain JavaScript data. */
export function parseContractEvent(event: { contractId: string; topics: StellarSdk.xdr.ScVal[]; data: StellarSdk.xdr.ScVal }): ContractEvent {
  try {
    return {
      contractId: event.contractId,
      topics: event.topics.map((topic) => StellarSdk.scValToNative(topic)),
      data: StellarSdk.scValToNative(event.data),
    };
  } catch (cause) {
    throw new StellarStreamSDKError('RPC_ERROR', 'Unable to parse Soroban contract event.', cause);
  }
}
