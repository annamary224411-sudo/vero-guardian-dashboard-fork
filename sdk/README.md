# Vero Guardian Frontend SDK

`@vero-guardian/frontend-sdk` is a typed browser client for the public Vero
Guardian Soroban contract entrypoints: `register_task`, `cast_vote`,
`tally_votes`, `set_role`, `get_reputation`, and `halt`.

## Install

```bash
npm install @vero-guardian/frontend-sdk @stellar/stellar-sdk
```

## Quick start

```ts
import { signTransaction } from '@stellar/freighter-api';
import { StellarStreamSDK } from '@vero-guardian/frontend-sdk';

const sdk = new StellarStreamSDK('C...CONTRACT_ID', {
  sorobanRpcUrl: 'https://soroban-testnet.stellar.org',
  networkPassphrase: 'Test SDF Network ; September 2015',
}, { signer: signTransaction });

await sdk.castVote({ sourceAccount: 'G...GUARDIAN', taskId: '42', approved: true });
const reputation = await sdk.getReputation({ sourceAccount: 'G...GUARDIAN', account: 'G...GUARDIAN' });
```

Mutating methods simulate before requesting a wallet signature. Catch
`StellarStreamSDKError` and inspect its stable `code` to present an appropriate
message. `buildTransaction` is available when an application needs to preview
or use its own signing flow. See [API.md](./API.md) for the complete API.

Run `npm run docs` to generate HTML API documentation in `sdk/docs`.
