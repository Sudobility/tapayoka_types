# @sudobility/tapayoka_types

Shared TypeScript definitions **and framework-agnostic runtime helpers** for the
Tapayoka QR-to-device cashless payment system. Consumed by the API server, the
React/React Native apps, and the client/lib packages so they all speak the same
request/response, domain-model, and BLE/Pi protocol shapes.

Despite the name, this package ships more than types: it also exports pure
runtime functions for building API responses, signing/verifying Ethereum
payloads, computing pricing, and driving the buyer purchase flow (see
[Exports](#exports)).

## Install

This package is published to **GitHub Packages** under the `@sudobility` scope
(not the public npm registry). Consumers need an `.npmrc` that points the scope
at GitHub Packages and authenticates with a token that has `read:packages`:

```
@sudobility:registry=https://npm.pkg.github.com
//npm.pkg.github.com/:_authToken=${GH_PACKAGES_READ_TOKEN}
```

Then:

```bash
bun add @sudobility/tapayoka_types
```

`@sudobility/types` is a **peer dependency** — the consuming project must also
install it.

## Usage

```typescript
import type {
  Order, Authorization, VendorDevice, VendorOffering,
  OfferingType, OrderStatus, PricingTier,
  AuthorizationPayload, PiCommand, BuyerVerifyResponse,
} from '@sudobility/tapayoka_types';

import {
  successResponse, errorResponse, signData, verifySignedData,
  calculateAuthorizedSeconds, formatPrice, initialStep,
  BLE_SERVICE_UUID,
} from '@sudobility/tapayoka_types';
```

The package is ESM-only. The build target is ES2020.

## Exports

All exports live in a single file, `src/index.ts`.

### Enums (string-literal unions)
- `OfferingType`: `TRIGGER | FIXED | TIMED`
- `OrderStatus`: `CREATED | PAID | AUTHORIZED | RUNNING | DONE | FAILED`
- `UserRole`: `vendor | buyer`
- `LogDirection`: `PI_TO_SRV | SRV_TO_PI`
- Vendor-model configuration unions: `VendorModelType`, `VendorModelPricing`,
  `VendorModelAction`, `VendorModelSlot`, `VendorModelSlotPricing`,
  `VendorEntityStatus`, `DurationUnit`, `DayOfWeek`

### Domain models (database entities)
- `User`, `UserProfile`, `Order`, `Authorization`, `DeviceLog`, `AdminLog`
- Vendor management: `VendorLocation`, `VendorModel`, `VendorOffering`,
  `VendorDevice` (keyed by Ethereum `walletAddress`), `VendorDeviceSlot`,
  `VendorDeviceLookup`
- Pricing: `PricingTier` (`TimedPricingTier | FixedPricingTier`), `SlotAction`,
  `OfferingSignal`, `DailySchedule`

### Request / Response types
- Buyer requests: `DeviceVerifyRequest`, `CreateOrderRequest`,
  `ProcessPaymentRequest`, `CreateAuthorizationRequest`, `TelemetryEventRequest`
- Vendor requests: create/update for location, model, offering, device, and
  device-slot; `QrGenerateRequest`
- Responses: `BuyerVerifyResponse`, `DashboardStats`, `OrdersChartData`,
  `OrderDetailed`, `QrCodeResponse`, plus `BaseResponse<T>`-wrapped aliases
  (e.g. `OrderResponse`, `VendorDeviceListResponse`, `AuthorizationApiResponse`)

### BLE / Pi protocol
- `AuthorizationPayload`, `PiCommand` (`BleCommand` is a deprecated alias),
  `BleDeviceResponse`, `BleDeviceInfo`, `PiApiResponse<T>`
- Streaming liveness: `BleControlMessage`, `BLE_PING`, `BLE_PONG`,
  `isBleControlMessage()`
- UUID / name constants: `BLE_SERVICE_UUID`, `BLE_CHAR_DEVICE_INFO_UUID`,
  `BLE_CHAR_COMMAND_UUID`, `BLE_CHAR_RESPONSE_UUID`, `BLE_DEVICE_NAME_PREFIX`

### Ethereum / crypto
- `EthSignedMessage`, `SignedData<T>`
- Functions: `signData()`, `signedSuccessResponse()`, `verifySignedData()`,
  `verifySignedDataSignature()` — signing/verifying functions are injected so
  this package stays dependency-free

### Runtime helper functions
- Response builders: `successResponse()`, `errorResponse()`,
  `piSuccessResponse()`
- Pricing: `calculateAuthorizedSeconds()`, `computeFromSteps()`,
  `fixedTierAmountAndSeconds()`, `tierMinCents()`, `tierBaseSeconds()`,
  `tierStepSeconds()`, `priceStringToCents()`, `durationUnitSeconds()`
- Relay/authorization: `resolveEffectiveAction()`, `tierAction()`,
  `actionAuthorizationFields()` (`tierAuthorizationFields()` is deprecated)
- Formatting: `formatPrice()`, `formatTierPrice()`, `formatDuration()`,
  `formatPricingSubtitle()`
- Buyer flow (UI-neutral navigation state): `initialStep()`,
  `nextStepAfterSlot()`, `nextStepAfterService()`, `resolveServiceOptions()`,
  `needsSlotStep()`

Common types are also re-exported from `@sudobility/types`: `ApiResponse`,
`BaseResponse`, `NetworkClient`, `Optional`, `PaginatedResponse`,
`PaginationInfo`, `PaginationOptions`, `Entity`, `EntityWithRole`,
`EntityMember`, `EntityInvitation`.

## Development

Requires [Bun](https://bun.sh).

```bash
bun install          # install deps (needs GitHub Packages auth, see Install)
bun run typecheck    # tsc --noEmit
bun run lint         # ESLint over src/
bun run lint:fix     # ESLint --fix
bun run format       # Prettier --write src/
bun run format:check # Prettier --check src/
bun run build        # emit ESM to dist/ (tsc -p tsconfig.esm.json)
bun run clean        # rm -rf dist
bun run test:unit    # Vitest (run once)
bun run test:watch   # Vitest (watch mode)
bun run verify       # typecheck + lint + build
bun run dev          # tsc --watch
```

`bun run verify` is the gate to run before committing; `prepublishOnly` runs
`clean` + `verify` automatically on publish.

### Local linking

```bash
bun link                              # in this repo
bun link @sudobility/tapayoka_types   # in a consuming project
```

## CI/CD & publishing

`.github/workflows/ci-cd.yml` delegates to the shared
`johnqh/workflows/.github/workflows/unified-cicd.yml` reusable workflow on push
to `main`/`develop`, with `publish-target: github` (GitHub Packages). Version
is bumped in `package.json` per release.

## Related packages

- `@sudobility/tapayoka_client` — React hooks for the Tapayoka API
- `@sudobility/tapayoka_lib` — business logic with Zustand stores
- `tapayoka_api` — backend API server
- `tapayoka_buyer_app_rn` / `tapayoka_vendor_app` — consumer apps

## License

BUSL-1.1
