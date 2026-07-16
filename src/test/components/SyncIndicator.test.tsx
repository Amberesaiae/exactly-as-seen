import { describe, it, expect, vi, beforeEach, afterEach } from 'vitest';
import { render, screen, fireEvent, act } from '@testing-library/react';
import { SyncIndicator } from '@/components/SyncIndicator';

const mockStore = {
  isOnline: true,
  isSyncing: false,
  setOnline: vi.fn(),
  setSyncing: vi.fn(),
};

vi.mock('@/stores/useAppStore', () => ({
  useAppStore: vi.fn(() => mockStore),
}));

const mockGetFailedItems = vi.fn().mockReturnValue([]);
const mockRetryAllFailedItems = vi.fn().mockResolvedValue(undefined);

vi.mock('@/lib/sync', () => ({
  getFailedItems: (...args: any[]) => mockGetFailedItems(...args),
  retryAllFailedItems: (...args: any[]) => mockRetryAllFailedItems(...args),
}));

vi.mock('sonner', () => ({
  toast: { info: vi.fn() },
}));

describe('SyncIndicator', () => {
  beforeEach(() => {
    vi.useFakeTimers();
    vi.clearAllMocks();
    mockStore.isOnline = true;
    mockStore.isSyncing = false;
    mockGetFailedItems.mockReturnValue([]);
  });

  afterEach(() => {
    vi.useRealTimers();
  });

  it('shows green dot when online and not syncing', () => {
    render(<SyncIndicator />);
    expect(screen.getByTitle('Connected & Online')).toBeDefined();
  });

  it('shows syncing indicator when isSyncing is true', () => {
    mockStore.isSyncing = true;
    render(<SyncIndicator />);
    expect(screen.getByTitle('Syncing data...')).toBeDefined();
  });

  it('shows offline indicator when offline', () => {
    mockStore.isOnline = false;
    render(<SyncIndicator />);
    expect(screen.getByTitle('Offline mode')).toBeDefined();
  });

  it('shows failed items count with retry button', () => {
    mockGetFailedItems.mockReturnValue([{ id: 1 }, { id: 2 }]);
    render(<SyncIndicator />);
    act(() => {
      vi.advanceTimersByTime(2500);
    });
    const btn = screen.getByTitle(/2 sync items failed/);
    expect(btn).toBeDefined();
    expect(btn.tagName).toBe('BUTTON');
  });

  it('calls retryAllFailedItems on retry click', () => {
    mockGetFailedItems.mockReturnValue([{ id: 1 }]);
    render(<SyncIndicator />);
    act(() => {
      vi.advanceTimersByTime(2500);
    });
    const btn = screen.getByTitle(/1 sync item/);
    fireEvent.click(btn);
    expect(mockRetryAllFailedItems).toHaveBeenCalled();
  });
});
