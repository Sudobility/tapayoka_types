# tapayoka_types

> **Git policy — never auto-commit or auto-push.** Leave your work in the working tree.
> Run `git commit`, `git push`, `gh pr create`, or `scripts/push_all.sh` **only when the user
> explicitly asks in that turn**. Approval for an earlier change does not carry forward, and
> finishing a task is not permission to commit it. Do not use feature branches — stay on the
> current branch.

Shared TypeScript definitions **and framework-agnostic runtime helpers** for the
Tapayoka QR-to-device cashless payment system. Consumed by `tapayoka_api`, the
RN apps, and `tapayoka_client` / `tapayoka_lib`.

## Stack
- **Language**: TypeScript ~5.9, strict mode, target ES2020.
- **Runtime/tooling**: Bun. ESLint 9 (flat config), Prettier, Vitest 4.
- **Package**: `@sudobility/tapayoka_types`, published to **GitHub Packages**
  (not public npm) via CI `publish-target: github`. License BUSL-1.1.

## Commands (all verified)
```bash
bun install          # needs GitHub Packages auth for @sudobility scope (see .npmrc)
bun run typecheck    # tsc --noEmit
bun run lint         # eslint src/
bun run build        # ESM-only emit to dist/ (tsc -p tsconfig.esm.json)
bun run test:unit    # vitest run    (NOTE: no `test` script; use test:unit / test:watch)
bun run verify       # typecheck + lint + build  — run before committing
```

## Architecture (critical, non-obvious)
- **Single source file**: everything is exported from `src/index.ts`. Tests live
  in `src/__tests__/`. There are no other source modules.
- **Not just types**: the package exports pure runtime functions alongside the
  type declarations — response builders (`successResponse`, `errorResponse`,
  `piSuccessResponse`), Ethereum signing (`signData`, `verifySignedData`,
  `verifySignedDataSignature`), pricing math (`calculateAuthorizedSeconds`,
  `computeFromSteps`, `tier*`/`format*` helpers), and the buyer-flow navigation
  state machine (`initialStep`, `nextStepAfterSlot`, `resolveServiceOptions`, …).
- **Dependency-free by design**: crypto verify/sign functions are **injected**
  as callbacks so this package depends on no ethers/crypto lib. Keep it that way.
- **Pricing lives here, not in tapayoka_lib**: so the API can reuse it without
  depending on a frontend library.
- **Relay-action model**: `SlotAction` decouples relay behaviour from pricing.
  Resolve order is per-slot `slot.action` → tier `tier.action` → legacy inline
  tier fields (`resolveEffectiveAction` → `tierAction` → `legacyTierAction`).
  `PricingTier.pinNumber`/`signals` and `tierAuthorizationFields()` are
  **deprecated** back-compat paths — prefer `action` and
  `actionAuthorizationFields()`.
- **Enums are string-literal unions**, not TS `enum`s. Key one: `OfferingType`
  is `TRIGGER | FIXED | TIMED` (there is no `ServiceType`/`VARIABLE`/
  `DeviceStatus`/`BleDeviceChallenge` type — don't reference those).
- **Pi/BLE protocol**: `PiCommand` (`BleCommand` = deprecated alias) carries
  signed `SETUP_SERVER`/`EXECUTE` commands; any API response may include a `pi`
  field (`PiApiResponse`) the app relays to the device verbatim. Ping/pong
  control messages (`BLE_PING`/`BLE_PONG`, `isBleControlMessage`) are unsigned,
  keyed off `type`, and handled by the transport, never surfaced to app code.
- **Peer dep** `@sudobility/types`: common envelope types (`BaseResponse`,
  `ApiResponse`, pagination, `Entity*`) are re-exported from it.

## Conventions / gotchas
- Two ESLint configs exist: **`eslint.config.js` is the active one** (flat
  config, chosen by default over `.mjs`). `eslint.config.mjs` is stale/unused.
- Build and `exports` are **ESM-only** — there is no CJS/`.cjs` output despite
  what older docs claimed. `main` = `dist/index.js`, `types` = `dist/index.d.ts`.
- Money is integer cents (`amountCents`); prices are decimal strings on tiers.
  Devices are keyed by Ethereum `walletAddress`.
- Deprecated exports are kept for migration — don't delete without checking
  consumers; prefer the documented replacement.
