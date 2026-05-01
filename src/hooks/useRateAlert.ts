import { useState, useEffect, useRef } from 'react';
import type { RateAlertThresholds } from '../utils/rateAlertStorage';

export interface UseRateAlertResult {
  alertActive: boolean;
  direction: 'upper' | 'lower' | null;
  currentRate: number | null;
  threshold: number | null;
  dismiss: () => void;
}

export function useRateAlert(
  rate: string | number | null | undefined,
  pairLabel: string,
  thresholds: RateAlertThresholds
): UseRateAlertResult {
  const [alertActive, setAlertActive] = useState(false);
  const [direction, setDirection] = useState<'upper' | 'lower' | null>(null);
  const [threshold, setThreshold] = useState<number | null>(null);
  const lastTriggerDirectionRef = useRef<'upper' | 'lower' | null>(null);

  useEffect(() => {
    const n = parseFloat(String(rate));

    if (Number.isNaN(n)) {
      setAlertActive(false);
      setDirection(null);
      setThreshold(null);
      lastTriggerDirectionRef.current = null;
      return;
    }

    if (thresholds.upper !== undefined && n >= thresholds.upper) {
      if (lastTriggerDirectionRef.current !== 'upper') {
        setAlertActive(true);
        setDirection('upper');
        setThreshold(thresholds.upper);
        lastTriggerDirectionRef.current = 'upper';
      }
      return;
    }

    if (thresholds.lower !== undefined && n <= thresholds.lower) {
      if (lastTriggerDirectionRef.current !== 'lower') {
        setAlertActive(true);
        setDirection('lower');
        setThreshold(thresholds.lower);
        lastTriggerDirectionRef.current = 'lower';
      }
      return;
    }

    // Neither condition met — auto-clear if we were previously triggered
    if (lastTriggerDirectionRef.current !== null) {
      setAlertActive(false);
      setDirection(null);
      setThreshold(null);
      lastTriggerDirectionRef.current = null;
    }
  }, [rate, thresholds.upper, thresholds.lower]);

  const dismiss = () => {
    setAlertActive(false);
    // lastTriggerDirectionRef stays set — prevents re-trigger on next tick.
    // Only an opposite-direction crossing resets it.
  };

  return { alertActive, direction, currentRate: Number.isNaN(parseFloat(String(rate))) ? null : parseFloat(String(rate)), threshold, dismiss };
}
