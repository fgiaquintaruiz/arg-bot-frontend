import { describe, it, expect, beforeEach, vi } from 'vitest';
import { isOnboardingCompleted, markOnboardingCompleted } from '../utils/onboardingStorage';

describe('onboardingStorage', () => {
  beforeEach(() => {
    localStorage.clear();
    vi.clearAllMocks();
  });

  describe('isOnboardingCompleted()', () => {
    it('returns false when localStorage key is absent', () => {
      expect(isOnboardingCompleted()).toBe(false);
    });

    it('returns false when localStorage key is empty string', () => {
      localStorage.setItem('onboarding_completed', '');
      expect(isOnboardingCompleted()).toBe(false);
    });

    it('returns true when localStorage key is "true"', () => {
      localStorage.setItem('onboarding_completed', 'true');
      expect(isOnboardingCompleted()).toBe(true);
    });

    it('returns false for any value other than "true"', () => {
      localStorage.setItem('onboarding_completed', 'yes');
      expect(isOnboardingCompleted()).toBe(false);
    });
  });

  describe('markOnboardingCompleted()', () => {
    it('sets localStorage key "onboarding_completed" to "true"', () => {
      markOnboardingCompleted();
      expect(localStorage.getItem('onboarding_completed')).toBe('true');
    });

    it('after markOnboardingCompleted(), isOnboardingCompleted() returns true', () => {
      markOnboardingCompleted();
      expect(isOnboardingCompleted()).toBe(true);
    });

    it('does not throw when localStorage.setItem throws', () => {
      vi.spyOn(Storage.prototype, 'setItem').mockImplementation(() => {
        throw new Error('QuotaExceededError');
      });
      expect(() => markOnboardingCompleted()).not.toThrow();
    });
  });
});
