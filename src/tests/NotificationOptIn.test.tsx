import React from 'react';
import { render, screen, fireEvent, waitFor } from '@testing-library/react';
import { describe, it, expect, vi, beforeEach, afterEach } from 'vitest';
import NotificationOptIn from '../components/NotificationOptIn';

// Mock swRegistration
vi.mock('../utils/swRegistration', () => ({
  requestNotificationPermission: vi.fn().mockResolvedValue('granted'),
  isIOS: vi.fn().mockReturnValue(false),
  isPeriodicSyncSupported: vi.fn().mockReturnValue(true),
  isPushSupported: vi.fn().mockReturnValue(false),
  subscribeToPush: vi.fn().mockResolvedValue(undefined),
}));

import { requestNotificationPermission, isIOS, isPeriodicSyncSupported, isPushSupported, subscribeToPush } from '../utils/swRegistration';

describe('NotificationOptIn', () => {
  const DISMISS_KEY = 'argbot_notif_opt_in_dismissed';

  beforeEach(() => {
    localStorage.clear();
    vi.clearAllMocks();
    (isIOS as ReturnType<typeof vi.fn>).mockReturnValue(false);
    (isPeriodicSyncSupported as ReturnType<typeof vi.fn>).mockReturnValue(true);
    (isPushSupported as ReturnType<typeof vi.fn>).mockReturnValue(false);
    (subscribeToPush as ReturnType<typeof vi.fn>).mockResolvedValue(undefined);
  });

  afterEach(() => {
    vi.clearAllMocks();
  });

  it('renders opt-in button when not dismissed and not iOS', () => {
    render(<NotificationOptIn />);
    expect(screen.getByRole('button', { name: /enable notifications/i })).toBeInTheDocument();
  });

  it('does not render on iOS', () => {
    (isIOS as ReturnType<typeof vi.fn>).mockReturnValue(true);
    render(<NotificationOptIn />);
    expect(screen.queryByRole('button', { name: /enable notifications/i })).not.toBeInTheDocument();
  });

  it('does not render when Periodic Sync is not supported', () => {
    (isPeriodicSyncSupported as ReturnType<typeof vi.fn>).mockReturnValue(false);
    render(<NotificationOptIn />);
    expect(screen.queryByRole('button', { name: /enable notifications/i })).not.toBeInTheDocument();
  });

  it('clicking Enable Notifications calls requestNotificationPermission', async () => {
    render(<NotificationOptIn />);
    fireEvent.click(screen.getByRole('button', { name: /enable notifications/i }));
    await waitFor(() => {
      expect(requestNotificationPermission).toHaveBeenCalled();
    });
  });

  it('shows success message after permission granted', async () => {
    (requestNotificationPermission as ReturnType<typeof vi.fn>).mockResolvedValue('granted');
    render(<NotificationOptIn />);
    fireEvent.click(screen.getByRole('button', { name: /enable notifications/i }));
    await waitFor(() => {
      expect(screen.queryByRole('button', { name: /enable notifications/i })).not.toBeInTheDocument();
    });
  });

  it('shows denied message after permission denied', async () => {
    (requestNotificationPermission as ReturnType<typeof vi.fn>).mockResolvedValue('denied');
    render(<NotificationOptIn />);
    fireEvent.click(screen.getByRole('button', { name: /enable notifications/i }));
    await waitFor(() => {
      expect(screen.getByText(/notificaciones bloqueadas/i)).toBeInTheDocument();
    });
  });

  it('clicking Dismiss hides the component', async () => {
    render(<NotificationOptIn />);
    fireEvent.click(screen.getByRole('button', { name: /dismiss/i }));
    await waitFor(() => {
      expect(screen.queryByRole('button', { name: /enable notifications/i })).not.toBeInTheDocument();
    });
  });

  it('writes dismissed timestamp to localStorage when Dismiss is clicked', () => {
    render(<NotificationOptIn />);
    fireEvent.click(screen.getByRole('button', { name: /dismiss/i }));
    expect(localStorage.setItem).toHaveBeenCalledWith(DISMISS_KEY, expect.any(String));
  });

  it('does not render when dismissed recently (localStorage flag set)', () => {
    const oneHourAgo = Date.now() - 60 * 60 * 1000;
    localStorage.setItem(DISMISS_KEY, oneHourAgo.toString());
    render(<NotificationOptIn />);
    expect(screen.queryByRole('button', { name: /enable notifications/i })).not.toBeInTheDocument();
  });

  it('does not render when Notification.permission is already granted', () => {
    // Simulate browser where permission was already granted (e.g., after a reload)
    vi.stubGlobal('Notification', { permission: 'granted', requestPermission: vi.fn() });
    render(<NotificationOptIn />);
    expect(screen.queryByRole('button', { name: /enable notifications/i })).not.toBeInTheDocument();
    vi.unstubAllGlobals();
  });

  it('does not render when argbot_notif_banner_enabled is false', () => {
    localStorage.setItem('argbot_notif_banner_enabled', 'false');
    render(<NotificationOptIn />);
    expect(screen.queryByRole('button', { name: /enable notifications/i })).not.toBeInTheDocument();
  });

  it('renders when isPushSupported is true (even if isPeriodicSyncSupported is false)', () => {
    (isPeriodicSyncSupported as ReturnType<typeof vi.fn>).mockReturnValue(false);
    (isPushSupported as ReturnType<typeof vi.fn>).mockReturnValue(true);
    render(<NotificationOptIn />);
    expect(screen.getByRole('button', { name: /enable notifications/i })).toBeInTheDocument();
  });

  it('calls subscribeToPush when push is supported and permission granted', async () => {
    (requestNotificationPermission as ReturnType<typeof vi.fn>).mockResolvedValue('granted');
    (isPushSupported as ReturnType<typeof vi.fn>).mockReturnValue(true);
    const mockReady = Promise.resolve({
      pushManager: { subscribe: vi.fn().mockResolvedValue({ toJSON: () => ({}) }) },
    });
    vi.stubGlobal('navigator', {
      serviceWorker: { ready: mockReady, controller: null },
    });
    render(<NotificationOptIn />);
    fireEvent.click(screen.getByRole('button', { name: /enable notifications/i }));
    await waitFor(() => {
      expect(subscribeToPush).toHaveBeenCalled();
    });
    vi.unstubAllGlobals();
  });
});
