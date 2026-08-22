# API reference

## `StellarStreamSDK`

`new StellarStreamSDK(contractId, network, options?)` creates a client. Network
requires `sorobanRpcUrl` and `networkPassphrase`; `fee` and `timeoutSeconds` are
optional. Options accept an injectable RPC server (useful for tests) and a
wallet `signer`.

| Method | Parameters | Result |
| --- | --- | --- |
| `registerTask` | `sourceAccount`, `taskId`, optional `repository` | `TransactionResult` |
| `castVote` | `sourceAccount`, `taskId`, `approved` | `TransactionResult` |
| `tallyVotes` | `sourceAccount`, `taskId` | `TransactionResult` |
| `setRole` | `sourceAccount`, `account`, `role` | `TransactionResult` |
| `getReputation` | `sourceAccount`, `account` | native contract return value |
| `halt` | `sourceAccount` | `TransactionResult` |
| `buildTransaction` | source account, method, native arguments | assembled Soroban transaction |

`TransactionResult` includes the network transaction hash and both unsigned and
signed XDR values. `parseContractEvent` converts RPC ScVal event topics and data
to native JavaScript values. Failures throw `StellarStreamSDKError`, whose code
is one of `INVALID_CONTRACT_ID`, `INVALID_ARGUMENT`, `SIMULATION_FAILED`,
`SIGNER_UNAVAILABLE`, `SIGNING_FAILED`, `SUBMISSION_FAILED`, or `RPC_ERROR`.
