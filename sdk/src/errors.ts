export type StellarStreamSDKErrorCode =
  | 'INVALID_CONTRACT_ID' | 'INVALID_ARGUMENT' | 'SIMULATION_FAILED'
  | 'SIGNER_UNAVAILABLE' | 'SIGNING_FAILED' | 'SUBMISSION_FAILED' | 'RPC_ERROR';

/** Error with a stable code suitable for frontend error handling. */
export class StellarStreamSDKError extends Error {
  constructor(public readonly code: StellarStreamSDKErrorCode, message: string, public readonly cause?: unknown) {
    super(message);
    this.name = 'StellarStreamSDKError';
  }
}
