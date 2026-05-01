import { describe, it, expect, afterEach, vi } from 'vitest';
import { renderHook, act } from '@testing-library/react';
import { useRateAlert } from '../hooks/useRateAlert';

afterEach(() => {
  vi.clearAllMocks();
  localStorage.clear();
});

describe('useRateAlert', () => {
  it('no thresholds configured → alertActive is false', () => {
    const { result } = renderHook(() => useRateAlert(1.12, {}));
    expect(result.current.alertActive).toBe(false);
    expect(result.current.direction).toBeNull();
  });

  it('rate above upper threshold → alertActive true, direction upper, threshold matches', () => {
    const { result } = renderHook(() => useRateAlert(1.15, { upper: 1.10 }));
    expect(result.current.alertActive).toBe(true);
    expect(result.current.direction).toBe('upper');
    expect(result.current.threshold).toBe(1.10);
    expect(result.current.currentRate).toBe(1.15);
  });

  it('rate below lower threshold → alertActive true, direction lower', () => {
    const { result } = renderHook(() => useRateAlert(0.90, { lower: 0.95 }));
    expect(result.current.alertActive).toBe(true);
    expect(result.current.direction).toBe('lower');
    expect(result.current.threshold).toBe(0.95);
    expect(result.current.currentRate).toBe(0.90);
  });

  it('rate oscillates above upper threshold (anti-spam) → alertActive stays true, no duplicate state change', () => {
    const { result, rerender } = renderHook(
      ({ rate }) => useRateAlert(rate, { upper: 1.10 }),
      { initialProps: { rate: 1.12 } }
    );
    expect(result.current.alertActive).toBe(true);

    // Stays in zone — should remain alertActive without re-triggering
    rerender({ rate: 1.13 });
    expect(result.current.alertActive).toBe(true);
    expect(result.current.direction).toBe('upper');

    rerender({ rate: 1.11 });
    expect(result.current.alertActive).toBe(true);
    expect(result.current.direction).toBe('upper');
  });

  it('rate returns below upper threshold → alertActive becomes false, direction null', () => {
    const { result, rerender } = renderHook(
      ({ rate }) => useRateAlert(rate, { upper: 1.10 }),
      { initialProps: { rate: 1.12 } }
    );
    expect(result.current.alertActive).toBe(true);

    rerender({ rate: 1.05 });
    expect(result.current.alertActive).toBe(false);
    expect(result.current.direction).toBeNull();
  });

  it('rate re-crosses upper threshold after reset → new alert fires (alertActive true again)', () => {
    const { result, rerender } = renderHook(
      ({ rate }) => useRateAlert(rate, { upper: 1.10 }),
      { initialProps: { rate: 1.12 } }
    );
    expect(result.current.alertActive).toBe(true);

    // Rate drops below threshold — auto-reset
    rerender({ rate: 1.05 });
    expect(result.current.alertActive).toBe(false);

    // Rate crosses again
    rerender({ rate: 1.15 });
    expect(result.current.alertActive).toBe(true);
    expect(result.current.direction).toBe('upper');
  });

  it('dismiss() → alertActive false', () => {
    const { result } = renderHook(() => useRateAlert(1.15, { upper: 1.10 }));
    expect(result.current.alertActive).toBe(true);

    act(() => {
      result.current.dismiss();
    });
    expect(result.current.alertActive).toBe(false);
  });

  it('after dismiss + rate drops below threshold then re-crosses → new alert fires', () => {
    const { result, rerender } = renderHook(
      ({ rate }) => useRateAlert(rate, { upper: 1.10 }),
      { initialProps: { rate: 1.12 } }
    );
    expect(result.current.alertActive).toBe(true);

    // User dismisses
    act(() => { result.current.dismiss(); });
    expect(result.current.alertActive).toBe(false);

    // Rate drops below threshold → direction ref resets
    rerender({ rate: 1.05 });
    expect(result.current.alertActive).toBe(false);

    // Rate re-crosses → new alert fires
    rerender({ rate: 1.15 });
    expect(result.current.alertActive).toBe(true);
    expect(result.current.direction).toBe('upper');
  });

  it('only upper threshold defined + rate below threshold → no alert', () => {
    const { result } = renderHook(() => useRateAlert(0.90, { upper: 1.10 }));
    expect(result.current.alertActive).toBe(false);
  });

  it('only lower threshold defined + rate above threshold → no alert', () => {
    const { result } = renderHook(() => useRateAlert(1.20, { lower: 0.95 }));
    expect(result.current.alertActive).toBe(false);
  });

  it('rate as string "1.12" → parsed and evaluated correctly', () => {
    const { result } = renderHook(() => useRateAlert('1.12', { upper: 1.10 }));
    expect(result.current.alertActive).toBe(true);
    expect(result.current.currentRate).toBe(1.12);
  });

  it('rate null → alertActive false', () => {
    const { result } = renderHook(() => useRateAlert(null, { upper: 1.10 }));
    expect(result.current.alertActive).toBe(false);
  });

  it('rate NaN string "abc" → alertActive false', () => {
    const { result } = renderHook(() => useRateAlert('abc', { upper: 1.10 }));
    expect(result.current.alertActive).toBe(false);
  });

  it('both thresholds defined: rate between them → no alert', () => {
    const { result } = renderHook(() => useRateAlert(1.05, { upper: 1.20, lower: 0.90 }));
    expect(result.current.alertActive).toBe(false);
  });

  it('both thresholds: rate at exact upper value → upper direction fires', () => {
    const { result } = renderHook(() => useRateAlert(1.20, { upper: 1.20, lower: 0.90 }));
    expect(result.current.alertActive).toBe(true);
    expect(result.current.direction).toBe('upper');
  });

  it('both thresholds: rate at exact lower value → lower direction fires', () => {
    const { result } = renderHook(() => useRateAlert(0.90, { upper: 1.20, lower: 0.90 }));
    expect(result.current.alertActive).toBe(true);
    expect(result.current.direction).toBe('lower');
  });
});
