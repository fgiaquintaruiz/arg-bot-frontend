const LS_KEY = 'onboarding_completed';

export function isOnboardingCompleted(): boolean {
  return localStorage.getItem(LS_KEY) === 'true';
}

export function markOnboardingCompleted(): void {
  try {
    localStorage.setItem(LS_KEY, 'true');
  } catch {
    // silent fail — localStorage unavailable
  }
}
