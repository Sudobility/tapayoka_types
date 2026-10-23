/**
 * @sudobility/tapayoka_types
 * TypeScript types for Tapayoka - QR-to-device cashless payment system
 */

// Re-export common types from @sudobility/types
export type {
  ApiResponse,
  BaseResponse,
  NetworkClient,
  Optional,
  PaginatedResponse,
  PaginationInfo,
  PaginationOptions,
} from '@sudobility/types';

import type { BaseResponse } from '@sudobility/types';

// =============================================================================
// Enums
// =============================================================================

export type OfferingType = 'TRIGGER' | 'FIXED' | 'TIMED';

export type OrderStatus =
  'CREATED' | 'PAID' | 'AUTHORIZED' | 'RUNNING' | 'DONE' | 'FAILED';

export type UserRole = 'vendor' | 'buyer';

export type LogDirection = 'PI_TO_SRV' | 'SRV_TO_PI';

export type VendorModelType =
  | 'Washer'
  | 'Dryer'
  | 'Parking'
  | 'Charging'
  | 'Locker'
  | 'Vending'
  | 'Tourist Binocular';

export type VendorModelPricing = 'fixed' | 'variable';

export type VendorModelAction = 'timed' | 'sequence';

export type VendorModelInterruption = 'stop' | 'continue';

export type VendorModelPayment = 'atStart' | 'atEnd';

export type VendorModelSlot = 'single' | 'multi1D' | 'multi2D';

export type VendorModelSlotPricing = 'Tiered' | 'Unique';

export type VendorEntityStatus = 'Active' | 'Inactive' | 'Deleted';

export type DurationUnit = 'minutes' | 'hours';

export type DayOfWeek =
  | 'Monday'
  | 'Tuesday'
  | 'Wednesday'
  | 'Thursday'
  | 'Friday'
  | 'Saturday'
  | 'Sunday';

export interface DailySchedule {
  dayOfWeek: DayOfWeek;
  startTime: string;
  endTime: string;
}

// =============================================================================
// Pricing Types
// =============================================================================

export interface OfferingSignal {
  pinNumber: number;
  duration: number;
}

/**
 * The relay behaviour associated with a purchase, decoupled from pricing.
 *
 * `start` fires when the session begins; `end` fires when it ends and is only
 * present for two-phase / `atEnd` models (e.g. a locker: on at start, off at
 * end — end-phase execution is a separate, later workstream).
 *
 * For a `timed` action, `start` is a single signal whose pin is held for the
 * purchased `authorizedSeconds` (the server sets its `duration` accordingly at
 * authorization time). For a `sequence` action, `start` is a one-shot pulse
 * list run in order.
 *
 * Location depends on the model's slot type:
 * - single-slot models (parking, laundromat) define the action on the shared
 *   {@link PricingTier} so every same-tier device behaves identically;
 * - multi-slot models (locker, vending) define it per {@link VendorInstallationSlot}
 *   because each door/column is wired to its own pin.
 *
 * Resolved at execution time as `slot.action ?? tier.action` — see
 * {@link resolveEffectiveAction}.
 */
export interface SlotAction {
  type: VendorModelAction;
  start: OfferingSignal[];
  end?: OfferingSignal[];
}

export interface TimedPricingTier {
  type: 'timed';
  id: string;
  name: string;
  currencyCode: string;
  startPrice: string;
  startDuration: number;
  startDurationUnit: DurationUnit;
  marginalPrice: string;
  marginalDuration: number;
  marginalDurationUnit: DurationUnit;
  /** Relay behaviour for single-slot models. Preferred over {@link pinNumber}. */
  action?: SlotAction;
  /** @deprecated Relay pin moved to {@link action}; retained for back-compat/migration. */
  pinNumber?: number;
}

export interface FixedPricingTier {
  type: 'fixed';
  id: string;
  name: string;
  currencyCode: string;
  price: string;
  /** Relay behaviour for single-slot models. Preferred over {@link signals}. */
  action?: SlotAction;
  /** @deprecated Relay pulses moved to {@link action}; retained for back-compat/migration. */
  signals?: OfferingSignal[];
}

export type PricingTier = TimedPricingTier | FixedPricingTier;

// =============================================================================
// Domain Models (database entities)
// =============================================================================

export interface User {
  id: string;
  firebaseUid: string;
  email: string | null;
  displayName: string | null;
  role: UserRole;
  tosAcceptedAt: Date | null;
  createdAt: Date | null;
  updatedAt: Date | null;
}

export interface UserProfile {
  id: string;
  firebaseUid: string;
  email: string | null;
  displayName: string | null;
  role: UserRole;
  tosAcceptedAt: string | null;
}

export interface Order {
  id: string;
  deviceWalletAddress: string;
  offeringId: string | null;
  pricingTierId: string | null;
  buyerUid: string | null;
  amountCents: number;
  authorizedSeconds: number;
  status: OrderStatus;
  stripePaymentIntentId: string | null;
  slotId: string | null;
  createdAt: Date | null;
  updatedAt: Date | null;
}

export interface Authorization {
  id: string;
  orderId: string;
  payloadJson: string;
  serverSignature: string;
  expiresAt: Date;
  createdAt: Date | null;
}

export interface DeviceLog {
  id: string;
  deviceWalletAddress: string;
  direction: LogDirection;
  ok: boolean;
  details: string | null;
  createdAt: Date | null;
}

export interface AdminLog {
  id: string;
  userId: string;
  action: string;
  entityType: string | null;
  entityId: string | null;
  details: string | null;
  createdAt: Date | null;
}

// =============================================================================
// Domain Models — Vendor Management
// =============================================================================

export interface VendorLocation {
  id: string;
  entityId: string;
  name: string;
  address: string;
  city: string;
  stateProvince: string;
  zipcode: string;
  country: string;
  status: VendorEntityStatus;
  createdAt: Date | null;
  updatedAt: Date | null;
  offeringCount?: number;
}

export interface VendorModel {
  id: string;
  entityId: string;
  name: string;
  type: VendorModelType | null;
  pricing: VendorModelPricing | null;
  slot: VendorModelSlot | null;
  slotPricing: VendorModelSlotPricing | null;
  action: VendorModelAction | null;
  interruption: VendorModelInterruption | null;
  payment: VendorModelPayment | null;
  status: VendorEntityStatus;
  createdAt: Date | null;
  updatedAt: Date | null;
  offeringCount?: number;
}

export interface VendorOffering {
  id: string;
  vendorLocationId: string;
  vendorModelId: string;
  name: string;
  pricingTiers: PricingTier[];
  schedule: DailySchedule[] | null;
  status: VendorEntityStatus;
  createdAt: Date | null;
  updatedAt: Date | null;
  installationCount?: number;
  modelName?: string;
  locationName?: string;
}

export interface VendorInstallation {
  walletAddress: string;
  vendorOfferingId: string;
  label: string;
  connectionString: string | null;
  status: VendorEntityStatus;
  createdAt: Date | null;
  updatedAt: Date | null;
  slotCount?: number;
}

export interface VendorInstallationSlot {
  id: string;
  installationWalletAddress: string;
  label: string;
  row: string | null;
  column: string | null;
  sortOrder: number;
  pricingTierId: string | null;
  pricingTier: PricingTier | null;
  /**
   * Per-slot relay behaviour for multi-slot models (each door/column has its own
   * pin). Null for single-slot models, which define the action on the tier.
   * Overrides the tier's action when present.
   */
  action: SlotAction | null;
  status: VendorEntityStatus;
  available?: boolean;
  createdAt: Date | null;
  updatedAt: Date | null;
}

// =============================================================================
// Request Types — Buyer Endpoints
// =============================================================================

/** Buyer sends device signature to server for verification */
export interface DeviceVerifyRequest {
  deviceWalletAddress: string;
  signedPayload: string;
  signature: string;
}

/** Create a new order */
export interface CreateOrderRequest {
  deviceWalletAddress: string;
  pricingTierId: string;
  amountCents: number;
  slotId?: string;
}

/** Process payment for an order */
export interface ProcessPaymentRequest {
  orderId: string;
  paymentMethodId: string;
}

/** Request authorization after payment */
export interface CreateAuthorizationRequest {
  orderId: string;
}

/** Report telemetry event from device */
export interface TelemetryEventRequest {
  deviceWalletAddress: string;
  direction: LogDirection;
  ok: boolean;
  details?: string;
}

// =============================================================================
// Types — Payment Methods
// =============================================================================

/** A saved payment method (card) */
export interface PaymentMethod {
  id: string;
  brand: string;
  last4: string;
  expMonth: number;
  expYear: number;
  isDefault: boolean;
}

/** Response from creating a SetupIntent */
export interface SetupIntentResponse {
  clientSecret: string;
}

// =============================================================================
// Request Types — Vendor Management
// =============================================================================

export interface VendorLocationCreateRequest {
  name: string;
  address: string;
  city: string;
  stateProvince: string;
  zipcode: string;
  country: string;
}

export interface VendorLocationUpdateRequest {
  name?: string;
  address?: string;
  city?: string;
  stateProvince?: string;
  zipcode?: string;
  country?: string;
}

export interface VendorModelCreateRequest {
  name: string;
  type?: VendorModelType;
  pricing?: VendorModelPricing;
  slot?: VendorModelSlot;
  slotPricing?: VendorModelSlotPricing;
  action?: VendorModelAction;
  interruption?: VendorModelInterruption;
  payment?: VendorModelPayment;
}

export interface VendorModelUpdateRequest {
  name?: string;
  type?: VendorModelType;
  pricing?: VendorModelPricing;
  slot?: VendorModelSlot;
  slotPricing?: VendorModelSlotPricing;
  action?: VendorModelAction;
  interruption?: VendorModelInterruption;
  payment?: VendorModelPayment;
}

export interface VendorOfferingCreateRequest {
  vendorLocationId: string;
  vendorModelId: string;
  name: string;
  pricingTiers: PricingTier[];
  schedule?: DailySchedule[];
}

export interface VendorOfferingUpdateRequest {
  vendorLocationId?: string;
  vendorModelId?: string;
  name?: string;
  pricingTiers?: PricingTier[];
  schedule?: DailySchedule[] | null;
}

export interface VendorInstallationCreateRequest {
  deviceProof: SignedData<{ walletAddress: string }>;
  vendorOfferingId: string;
  label: string;
  connectionString?: string;
}

export interface VendorInstallationUpdateRequest {
  label?: string;
  vendorOfferingId?: string;
}

export interface VendorInstallationSlotCreateRequest {
  label: string;
  row?: string;
  column?: string;
  sortOrder?: number;
  pricingTierId?: string;
  pricingTier?: PricingTier;
  action?: SlotAction | null;
}

export interface VendorInstallationSlotUpdateRequest {
  label?: string;
  row?: string | null;
  column?: string | null;
  sortOrder?: number;
  pricingTierId?: string | null;
  pricingTier?: PricingTier | null;
  action?: SlotAction | null;
}

export interface VendorInstallationSlotBulkCreateRequest {
  rows: string[];
  columns: string[];
}

/** Generate QR code for a device */
export interface QrGenerateRequest {
  deviceWalletAddress: string;
  format?: 'svg' | 'png';
  size?: number;
}

// =============================================================================
// Response Types — Buyer
// =============================================================================

/** Combined response after verifying device signature */
export interface BuyerVerifyResponse {
  model: {
    name: string;
    slot: VendorModelSlot | null;
    pricing: VendorModelPricing | null;
    slotPricing: VendorModelSlotPricing | null;
    action: VendorModelAction | null;
    interruption: VendorModelInterruption | null;
    payment: VendorModelPayment | null;
  };
  installation: {
    name: string;
  };
  /** Full offering pricing-tier menu. Used by buyers to pick a service on single-slot installations. */
  offeringTiers?: PricingTier[];
  operating: boolean;
  operatingPeriod: {
    start: string;
    end: string;
  } | null;
  slots: Array<{
    id: string;
    label: string;
    row: string | null;
    column: string | null;
    sortOrder: number;
    pricingTier: PricingTier | null;
    available: boolean;
  }>;
}

// =============================================================================
// Response Types — Vendor
// =============================================================================

/** Dashboard stats overview */
export interface DashboardStats {
  totalDevices: number;
  activeDevices: number;
  totalOrders: number;
  activeOrders: number;
  revenueTodayCents: number;
  revenueThisWeekCents: number;
  successRate: number;
}

/** Orders chart data point */
export interface OrdersChartData {
  date: string;
  count: number;
  revenueCents: number;
}

/** Order with joined details */
export interface OrderDetailed extends Order {
  deviceLabel: string;
  offeringName: string;
  offeringType: OfferingType;
}

/** QR code generation response */
export interface QrCodeResponse {
  deviceWalletAddress: string;
  qrData: string;
  format: 'svg' | 'png';
}

// =============================================================================
// Query Parameter Types
// =============================================================================

export interface OrderQueryParams {
  status?: OrderStatus;
  deviceWalletAddress?: string;
  limit?: number;
  offset?: number;
}

export interface LogQueryParams {
  deviceWalletAddress?: string;
  direction?: LogDirection;
  limit?: number;
  offset?: number;
}

// =============================================================================
// BLE Protocol Types
// =============================================================================

/** Authorization payload sent to device via BLE */
export interface AuthorizationPayload {
  orderId: string;
  offeringType: OfferingType;
  seconds: number;
  /**
   * The relay pulses the device runs at session start. Present for both
   * `sequence` actions (the pulse list) and `timed` actions (a single signal
   * whose pin is held for `seconds`). Absent only for a bare TRIGGER.
   */
  signals?: OfferingSignal[];
  /**
   * The relay pulses to run at session end, for two-phase `atEnd` models
   * (e.g. a locker's off pulse). Carried in a separate end authorization;
   * end-phase execution is a later workstream.
   */
  end?: OfferingSignal[];
  nonce: string;
  exp: number;
}

/** Command sent to a Pi device via BLE or WebSocket.
 *
 * SETUP_SERVER: Vendor flow — verify signature, save server wallet address on device.
 * EXECUTE:      Buyer flow — verify signature AND signer matches stored server wallet, then execute.
 *
 * The Pi never accepts unsigned commands. Every command includes signed data.
 * The `pi` field in API responses contains this object, ready to relay to the device.
 */
export interface PiCommand {
  command: 'SETUP_SERVER' | 'EXECUTE';
  data: Record<string, unknown>;
  signing: EthSignedMessage;
}

/** @deprecated Use PiCommand instead */
export type BleCommand = PiCommand;

/** BLE response from device */
export interface BleDeviceResponse {
  status: 'OK' | 'ERROR' | 'BUSY' | 'UNAUTHORIZED' | 'NOT_CONFIGURED';
  message?: string;
  data?: string;
}

/** Device info read from BLE characteristic */
export interface BleDeviceInfo {
  walletAddress: string;
  firmwareVersion: string;
  hasServerWallet: boolean;
  timestamp: number;
  nonce: string;
}

// =============================================================================
// BLE Service UUIDs
// =============================================================================

export const BLE_SERVICE_UUID = '000088F4-0000-1000-8000-00805f9b34fb';
export const BLE_CHAR_DEVICE_INFO_UUID = '00000E32-0000-1000-8000-00805f9b34fb';
export const BLE_CHAR_COMMAND_UUID = '00000E33-0000-1000-8000-00805f9b34fb';
export const BLE_CHAR_RESPONSE_UUID = '00000E34-0000-1000-8000-00805f9b34fb';
export const BLE_DEVICE_NAME_PREFIX = 'tapayoka-';

// =============================================================================
// Ethereum / Crypto Types
// =============================================================================

/** Signed message with Ethereum wallet */
export interface EthSignedMessage {
  walletAddress: string;
  message: string;
  signature: string;
}

/** Generic signed data envelope — data + cryptographic proof.
 * T must be an object because signing_timestamp is injected into the message. */
export interface SignedData<T extends object = Record<string, unknown>> {
  data: T;
  signing: EthSignedMessage;
}

// =============================================================================
// Pi API Response
// =============================================================================

/** API response that includes a Pi command to relay to the device.
 *
 * Any API endpoint can include a `pi` field. When the app sees `pi` in a response,
 * it sends the object directly to the connected Pi device via BLE — no app logic needed.
 */
export interface PiApiResponse<T = unknown> extends BaseResponse<T> {
  pi?: PiCommand;
}

// =============================================================================
// Response Helper Functions
// =============================================================================

/** Create a success response */
export function successResponse<T>(data: T): BaseResponse<T> {
  return {
    success: true,
    data,
    timestamp: new Date().toISOString(),
  };
}

/** Create a success response with a Pi command to relay to the device */
export function piSuccessResponse<T>(data: T, pi: PiCommand): PiApiResponse<T> {
  return {
    success: true,
    data,
    pi,
    timestamp: new Date().toISOString(),
  };
}

/** Create an error response */
export function errorResponse(error: string): BaseResponse<never> {
  return {
    success: false,
    error,
    timestamp: new Date().toISOString(),
  };
}

/** Sign data and wrap into a SignedData envelope.
 * Injects signing_timestamp into the message to prevent replay attacks. */
export async function signData<T extends object>(
  data: T,
  walletAddress: string,
  signFn: (message: string) => Promise<string>
): Promise<SignedData<T>> {
  const messageObj = { ...data, signing_timestamp: new Date().toISOString() };
  const message = JSON.stringify(messageObj);
  const signature = await signFn(message);
  return {
    data,
    signing: { walletAddress, message, signature },
  };
}

/** Create a signed success response: ApiResponse<SignedData<T>> */
export async function signedSuccessResponse<T extends object>(
  data: T,
  walletAddress: string,
  signFn: (message: string) => Promise<string>
): Promise<BaseResponse<SignedData<T>>> {
  const signed = await signData(data, walletAddress, signFn);
  return {
    success: true,
    data: signed,
    timestamp: new Date().toISOString(),
  };
}

/**
 * Verify that a SignedData's data matches its signing.message.
 * Checks signing_timestamp is present and within maxAgeMs (default 30s),
 * then removes it and deep-compares the rest with data.
 */
export function verifySignedData<T extends object>(
  signed: SignedData<T>,
  maxAgeMs = 30_000
): boolean {
  if (!signed.signing || signed.data == null) return false;
  try {
    const decoded = JSON.parse(signed.signing.message);
    const { signing_timestamp, ...rest } = decoded;

    if (!signing_timestamp) return false;
    const ts = new Date(signing_timestamp).getTime();
    if (isNaN(ts)) return false;
    if (Math.abs(Date.now() - ts) > maxAgeMs) return false;

    return JSON.stringify(rest) === JSON.stringify(signed.data);
  } catch {
    return false;
  }
}

/**
 * Verify that a signing payload's signature is valid.
 * Accepts an injected verifyFn so the types package stays dependency-free.
 */
export function verifySignedDataSignature(
  signing: EthSignedMessage,
  verifyFn: (
    message: string,
    signature: string,
    walletAddress: string
  ) => boolean
): boolean {
  return verifyFn(signing.message, signing.signature, signing.walletAddress);
}

// =============================================================================
// API Response Type Aliases
// =============================================================================

// Buyer responses
export type BuyerVerifyApiResponse = BaseResponse<BuyerVerifyResponse>;

// Order responses
export type OrderListResponse = BaseResponse<Order[]>;
export type OrderDetailedListResponse = BaseResponse<OrderDetailed[]>;
export type OrderResponse = BaseResponse<Order>;

// Authorization responses (returns the Order with a PiCommand)
export type AuthorizationApiResponse = PiApiResponse<Order>;

// Dashboard responses
export type DashboardStatsResponse = BaseResponse<DashboardStats>;
export type OrdersChartResponse = BaseResponse<OrdersChartData[]>;

// QR responses
export type QrCodeApiResponse = BaseResponse<QrCodeResponse>;

// Log responses
export type DeviceLogListResponse = BaseResponse<DeviceLog[]>;
export type AdminLogListResponse = BaseResponse<AdminLog[]>;

// Vendor management responses
export type VendorLocationListResponse = BaseResponse<VendorLocation[]>;
export type VendorLocationResponse = BaseResponse<VendorLocation>;
export type VendorModelListResponse = BaseResponse<VendorModel[]>;
export type VendorModelResponse = BaseResponse<VendorModel>;
export type VendorOfferingListResponse = BaseResponse<VendorOffering[]>;
export type VendorOfferingResponse = BaseResponse<VendorOffering>;
export type VendorInstallationListResponse = BaseResponse<VendorInstallation[]>;
export type VendorInstallationResponse = BaseResponse<VendorInstallation>;
export type VendorInstallationSlotListResponse = BaseResponse<
  VendorInstallationSlot[]
>;
export type VendorInstallationSlotResponse =
  BaseResponse<VendorInstallationSlot>;

// Delete response
export interface DeleteResult {
  deleted: true;
}
export type DeleteResponse = BaseResponse<DeleteResult>;

// Health check
export interface HealthCheckData {
  name: string;
  version: string;
  status: string;
}
export type HealthCheckResponse = BaseResponse<HealthCheckData>;

// Entity types (re-exported from @sudobility/types)
export type {
  Entity,
  EntityWithRole,
  EntityMember,
  EntityInvitation,
} from '@sudobility/types';

// =============================================================================
// Derived business logic (pricing)
//
// Framework-agnostic pricing/authorization helpers shared by frontend and
// backend. Lives here (not in tapayoka_lib) so the API never depends on a
// frontend library. DurationUnit is already declared above and reused here.
// =============================================================================

export interface AmountAndSeconds {
  amountCents: number;
  seconds: number;
}

export interface TierAuthorizationFields {
  offeringType: OfferingType;
  /** Relay pulses to run at session start. */
  signals?: OfferingSignal[];
  /** Relay pulses to run at session end (two-phase `atEnd` models). */
  end?: OfferingSignal[];
}

/** Derive a {@link SlotAction} from a tier's deprecated inline relay fields. */
function legacyTierAction(
  tier: PricingTier | null | undefined
): SlotAction | null {
  if (!tier) return null;
  if (tier.type === 'fixed') {
    return tier.signals && tier.signals.length > 0
      ? { type: 'sequence', start: tier.signals }
      : null;
  }
  return typeof tier.pinNumber === 'number'
    ? { type: 'timed', start: [{ pinNumber: tier.pinNumber, duration: 0 }] }
    : null;
}

/** The action defined on a tier (single-slot models), preferring the new field. */
export function tierAction(
  tier: PricingTier | null | undefined
): SlotAction | null {
  return tier?.action ?? legacyTierAction(tier);
}

/**
 * Resolve the relay behaviour for a purchase: a per-slot action (multi-slot
 * models) wins; otherwise the tier's action (single-slot models).
 */
export function resolveEffectiveAction(
  slot: { action?: SlotAction | null } | null | undefined,
  tier: PricingTier | null | undefined
): SlotAction | null {
  return slot?.action ?? tierAction(tier);
}

/**
 * Build the device-facing authorization fields from a resolved action.
 * `seconds` is the purchased duration; for a `timed` action it becomes the hold
 * time of the single start pin. This is the function the API should use once a
 * slot + tier are resolved for an order.
 */
export function actionAuthorizationFields(
  action: SlotAction | null | undefined,
  seconds: number
): TierAuthorizationFields {
  if (!action || action.start.length === 0) return { offeringType: 'TRIGGER' };
  if (action.type === 'timed') {
    return {
      offeringType: 'TIMED',
      signals: [{ pinNumber: action.start[0].pinNumber, duration: seconds }],
      ...(action.end ? { end: action.end } : {}),
    };
  }
  return {
    offeringType: 'FIXED',
    signals: action.start,
    ...(action.end ? { end: action.end } : {}),
  };
}

export function durationUnitSeconds(unit: DurationUnit): number {
  return unit === 'hours' ? 3600 : 60;
}

export function priceStringToCents(price: string): number {
  return Math.round(Number.parseFloat(price) * 100);
}

export function tierMinCents(tier: PricingTier): number {
  return tier.type === 'fixed'
    ? priceStringToCents(tier.price)
    : priceStringToCents(tier.startPrice);
}

export function tierBaseSeconds(tier: PricingTier): number {
  if (tier.type === 'fixed') {
    const start = tierAction(tier)?.start ?? [];
    return start.reduce((sum, signal) => sum + signal.duration, 0);
  }
  return tier.startDuration * durationUnitSeconds(tier.startDurationUnit);
}

export function tierStepSeconds(tier: PricingTier): number {
  if (tier.type !== 'timed') return 0;
  return tier.marginalDuration * durationUnitSeconds(tier.marginalDurationUnit);
}

export function fixedTierAmountAndSeconds(tier: PricingTier): AmountAndSeconds {
  return { amountCents: tierMinCents(tier), seconds: tierBaseSeconds(tier) };
}

export function computeFromSteps(
  tier: PricingTier,
  steps: number
): AmountAndSeconds {
  if (tier.type === 'fixed') {
    return fixedTierAmountAndSeconds(tier);
  }

  const count = Math.max(0, Math.floor(steps));
  return {
    amountCents:
      tierMinCents(tier) + count * priceStringToCents(tier.marginalPrice),
    seconds: tierBaseSeconds(tier) + count * tierStepSeconds(tier),
  };
}

export function calculateAuthorizedSeconds(
  tier: PricingTier,
  amountCents: number
): number {
  if (tier.type === 'fixed') {
    return tierBaseSeconds(tier);
  }

  const startCents = tierMinCents(tier);
  const startSeconds = tierBaseSeconds(tier);
  if (amountCents <= startCents) return startSeconds;

  const marginalCents = priceStringToCents(tier.marginalPrice);
  if (marginalCents <= 0) return startSeconds;

  const extraUnits = Math.floor((amountCents - startCents) / marginalCents);
  return startSeconds + extraUnits * tierStepSeconds(tier);
}

/**
 * @deprecated Prefer {@link resolveEffectiveAction} + {@link actionAuthorizationFields},
 * which incorporate the per-slot action and the purchased `seconds`. Kept for
 * callers that only have a tier; sources its result from the tier's action.
 */
export function tierAuthorizationFields(
  tier: PricingTier | null | undefined
): TierAuthorizationFields {
  const action = tierAction(tier);
  if (!action || action.start.length === 0) return { offeringType: 'TRIGGER' };
  if (action.type === 'timed') return { offeringType: 'TIMED' };
  return { offeringType: 'FIXED', signals: action.start };
}

export function formatPrice(cents: number, currency = 'USD'): string {
  if (currency === 'USD') return `$${(cents / 100).toFixed(2)}`;
  return `${currency} ${(cents / 100).toFixed(2)}`;
}

export function formatTierPrice(tier: PricingTier): string {
  return formatPrice(tierMinCents(tier), tier.currencyCode);
}

export function formatDuration(seconds: number): string {
  if (seconds <= 0) return '0 min';
  const totalMin = Math.round(seconds / 60);
  if (totalMin < 60) return `${totalMin} min`;
  const hours = Math.floor(totalMin / 60);
  const minutes = totalMin % 60;
  return minutes === 0 ? `${hours} h` : `${hours} h ${minutes} min`;
}

export function formatPricingSubtitle(tiers: PricingTier[]): string {
  if (tiers.length === 0) return 'No pricing';
  const first = tiers[0];
  if (first.type === 'timed') {
    const unit = first.startDurationUnit === 'hours' ? 'hr' : 'min';
    const base = `${formatPrice(priceStringToCents(first.startPrice), first.currencyCode)} / ${first.startDuration}${unit}`;
    return tiers.length > 1 ? `${base} (+${tiers.length - 1} more)` : base;
  }

  const base = formatPrice(priceStringToCents(first.price), first.currencyCode);
  return tiers.length > 1 ? `${base} (+${tiers.length - 1} more)` : base;
}

// =============================================================================
// Derived business logic (buyer flow)
//
// Pure navigation/state helpers for the buyer purchase flow. Screen names are
// UI-neutral string tags; no rendering happens here.
// =============================================================================

export type VerifySlot = BuyerVerifyResponse['slots'][number];

export type TierStep =
  | { screen: 'DurationAdjust'; tier: PricingTier; slot: VerifySlot | null }
  | { screen: 'Payment'; tier: PricingTier; slot: VerifySlot | null };

export type AfterSlotStep =
  { screen: 'ServiceSelection'; slot: VerifySlot | null } | TierStep;

export type NextStep = { screen: 'SlotSelection' } | AfterSlotStep;

export function needsSlotStep(verify: BuyerVerifyResponse): boolean {
  return verify.slots.length > 1;
}

export function resolveServiceOptions(
  verify: BuyerVerifyResponse,
  slot: VerifySlot | null
): PricingTier[] {
  if (verify.slots.length > 1) {
    return slot?.pricingTier ? [slot.pricingTier] : [];
  }

  if (verify.offeringTiers && verify.offeringTiers.length > 0) {
    return verify.offeringTiers;
  }

  const only = verify.slots[0]?.pricingTier;
  return only ? [only] : [];
}

function stepForTier(tier: PricingTier, slot: VerifySlot | null): TierStep {
  return tier.type === 'timed'
    ? { screen: 'DurationAdjust', tier, slot }
    : { screen: 'Payment', tier, slot };
}

export function nextStepAfterService(
  tier: PricingTier,
  slot: VerifySlot | null
): TierStep {
  return stepForTier(tier, slot);
}

export function nextStepAfterSlot(
  verify: BuyerVerifyResponse,
  slot: VerifySlot | null
): AfterSlotStep | null {
  const services = resolveServiceOptions(verify, slot);
  if (services.length === 0) return null;
  if (services.length > 1) return { screen: 'ServiceSelection', slot };
  return stepForTier(services[0], slot);
}

export function initialStep(verify: BuyerVerifyResponse): NextStep | null {
  if (needsSlotStep(verify)) return { screen: 'SlotSelection' };
  return nextStepAfterSlot(verify, verify.slots[0] ?? null);
}
