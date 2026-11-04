import { describe, expect, it } from 'vitest';
import type { BuyerVerifyResponse, PricingTier } from '../index';
import {
  calculateAuthorizedSeconds,
  computeFromSteps,
  fixedTierAmountAndSeconds,
  formatDuration,
  formatPrice,
  initialStep,
  nextStepAfterSlot,
  resolveServiceOptions,
  tierAuthorizationFields,
  tierBaseSeconds,
  tierMinCents,
  tierStepSeconds,
} from '../index';

const fixed = (id = 'fixed', name = 'Fixed'): PricingTier => ({
  type: 'fixed',
  id,
  name,
  currencyCode: 'USD',
  price: '1.25',
  signals: [{ pinNumber: 2, duration: 3 }],
});

const timed = (id = 'timed', name = 'Timed'): PricingTier => ({
  type: 'timed',
  id,
  name,
  currencyCode: 'USD',
  startPrice: '2.00',
  startDuration: 30,
  startDurationUnit: 'minutes',
  marginalPrice: '0.50',
  marginalDuration: 5,
  marginalDurationUnit: 'minutes',
  pinNumber: 17,
});

function slot(
  id: string,
  pricingTier: PricingTier | null
): BuyerVerifyResponse['slots'][number] {
  return {
    id,
    label: id,
    row: null,
    column: null,
    sortOrder: 0,
    pricingTier,
    available: true,
  };
}

function verify(overrides: Partial<BuyerVerifyResponse>): BuyerVerifyResponse {
  return {
    model: {
      name: 'Model',
      slot: null,
      pricing: null,
      slotPricing: null,
      action: null,
      interruption: null,
      payment: null,
    },
    device: { name: 'Device' },
    operating: true,
    operatingPeriod: null,
    slots: [],
    ...overrides,
  };
}

describe('derived pricing', () => {
  it('derives cents, durations, and timed step totals', () => {
    const tier = timed();
    expect(tierMinCents(tier)).toBe(200);
    expect(tierBaseSeconds(tier)).toBe(1800);
    expect(tierStepSeconds(tier)).toBe(300);
    expect(computeFromSteps(tier, 2)).toEqual({
      amountCents: 300,
      seconds: 2400,
    });
    expect(calculateAuthorizedSeconds(tier, 300)).toBe(2400);
  });

  it('derives fixed totals and authorization fields', () => {
    const tier = fixed();
    expect(fixedTierAmountAndSeconds(tier)).toEqual({
      amountCents: 125,
      seconds: 3,
    });
    expect(tierAuthorizationFields(tier)).toEqual({
      offeringType: 'FIXED',
      signals: [{ pinNumber: 2, duration: 3 }],
    });
    expect(tierAuthorizationFields(timed()).offeringType).toBe('TIMED');
    expect(tierAuthorizationFields(null).offeringType).toBe('TRIGGER');
  });

  it('formats price and duration consistently', () => {
    expect(formatPrice(125)).toBe('$1.25');
    expect(formatDuration(0)).toBe('0 min');
    expect(formatDuration(3900)).toBe('1 h 5 min');
  });
});

describe('derived buyer flow', () => {
  it('starts multi-slot devices at slot selection', () => {
    const result = initialStep(
      verify({ slots: [slot('A', fixed('a')), slot('B', fixed('b'))] })
    );
    expect(result).toEqual({ screen: 'SlotSelection' });
  });

  it('uses offering tiers as service options for single-slot devices', () => {
    const wash = timed('wash', 'Wash');
    const dry = timed('dry', 'Dry');
    const v = verify({ slots: [slot('S', wash)], offeringTiers: [wash, dry] });
    expect(resolveServiceOptions(v, v.slots[0])).toEqual([wash, dry]);
    expect(nextStepAfterSlot(v, v.slots[0])).toEqual({
      screen: 'ServiceSelection',
      slot: v.slots[0],
    });
  });

  it('skips service selection when only one service exists', () => {
    const tier = fixed();
    const v = verify({ slots: [slot('S', tier)] });
    expect(initialStep(v)).toEqual({
      screen: 'Payment',
      tier,
      slot: v.slots[0],
    });
  });
});
