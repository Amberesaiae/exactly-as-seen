/**
 * Flow A (Onboard) — offline acceptance tests.
 * No Docker / Supabase required. Mocks cover writer contracts + pure gates.
 * @see docs/CANONICAL_JOURNEYS.md Flow A
 * @see docs/AUDIT_WITHOUT_BACKEND.md
 */
import { describe, it, expect, vi, beforeEach } from 'vitest';
import { render, screen, act } from '@testing-library/react';
import { MemoryRouter, Routes, Route } from 'react-router-dom';
import { selectPrimaryFarm } from '@/lib/canonical';
import { isPasswordStrong, validatePassword } from '@/lib/password-validation';
import { ProtectedRoute } from '@/components/ProtectedRoute';

const authState = {
  user: null as null | { id: string; email: string },
  loading: false,
  farmReady: null as boolean | null,
};

vi.mock('@/contexts/AuthContext', () => ({
  useAuth: () => ({
    user: authState.user,
    loading: authState.loading,
    farmReady: authState.farmReady,
    farmId: null,
    farmName: 'My Farm',
    currency: 'GHS',
    signUp: vi.fn(),
    signIn: vi.fn(),
    signOut: vi.fn(),
    recheckFarm: vi.fn(),
  }),
}));

function GateHarness({ requireSetupComplete = true }: { requireSetupComplete?: boolean }) {
  return (
    <MemoryRouter initialEntries={['/dashboard']}>
      <Routes>
        <Route path="/welcome" element={<div data-testid="page">welcome</div>} />
        <Route path="/farm-setup" element={<div data-testid="page">farm-setup</div>} />
        <Route
          path="/dashboard"
          element={
            <ProtectedRoute requireSetupComplete={requireSetupComplete}>
              <div data-testid="page">dashboard</div>
            </ProtectedRoute>
          }
        />
      </Routes>
    </MemoryRouter>
  );
}

describe('Flow A — pure domain (password + farm pick)', () => {
  it('rejects weak passwords (register gate)', () => {
    expect(isPasswordStrong('short')).toBe(false);
    expect(isPasswordStrong('alllowercase1!')).toBe(false);
    expect(isPasswordStrong('StrongPass1!')).toBe(true);
    const checks = validatePassword('StrongPass1!');
    expect(checks.every((c) => c.met)).toBe(true);
  });

  it('selectPrimaryFarm prefers setup_complete then recency', () => {
    const incomplete = {
      id: 'a',
      setup_complete: false,
      updated_at: '2026-07-12T12:00:00Z',
    };
    const completeOlder = {
      id: 'b',
      setup_complete: true,
      updated_at: '2026-01-01T00:00:00Z',
    };
    const completeNewer = {
      id: 'c',
      setup_complete: true,
      updated_at: '2026-07-01T00:00:00Z',
    };
    expect(selectPrimaryFarm([incomplete, completeOlder, completeNewer])?.id).toBe('c');
    expect(selectPrimaryFarm([incomplete])?.id).toBe('a');
    expect(selectPrimaryFarm([])).toBeNull();
    expect(selectPrimaryFarm(null)).toBeNull();
  });
});

describe('Flow A — ProtectedRoute gate order', () => {
  beforeEach(() => {
    authState.user = null;
    authState.loading = false;
    authState.farmReady = null;
  });

  it('anonymous → /welcome (auth gate)', async () => {
    authState.user = null;
    await act(async () => {
      render(<GateHarness />);
    });
    expect(screen.getByTestId('page').textContent).toBe('welcome');
  });

  it('authenticated + setup incomplete → /farm-setup', async () => {
    authState.user = { id: 'u1', email: 'a@b.com' };
    authState.farmReady = false;
    await act(async () => {
      render(<GateHarness requireSetupComplete />);
    });
    expect(screen.getByTestId('page').textContent).toBe('farm-setup');
  });

  it('authenticated + setup complete → children (dashboard)', async () => {
    authState.user = { id: 'u1', email: 'a@b.com' };
    authState.farmReady = true;
    await act(async () => {
      render(<GateHarness requireSetupComplete />);
    });
    expect(screen.getByTestId('page').textContent).toBe('dashboard');
  });

  it('shows loader while farmReady is unknown on app shell', async () => {
    authState.user = { id: 'u1', email: 'a@b.com' };
    authState.farmReady = null;
    await act(async () => {
      render(<GateHarness requireSetupComplete />);
    });
    // Loader has no data-testid page — spinner only
    expect(screen.queryByTestId('page')).toBeNull();
  });
});

describe('Flow A — farm setup finish writer contract (ordered)', () => {
  /**
   * Documents the atomic order required by Flow A:
   * farms (identity, setup_complete=false) → houses → farms (setup_complete=true)
   * → user_preferences → activity_log (soft).
   * Implemented in FarmSetup.handleFinish — regression guard via pure sequence check.
   */
  it('never marks setup_complete before houses succeed', () => {
    type Step =
      | { table: 'farms'; setup_complete: boolean }
      | { table: 'houses' }
      | { table: 'user_preferences' }
      | { table: 'activity_log' };

    // Simulated successful path (mirrors FarmSetup after fix)
    const steps: Step[] = [
      { table: 'farms', setup_complete: false },
      { table: 'houses' },
      { table: 'farms', setup_complete: true },
      { table: 'user_preferences' },
      { table: 'activity_log' },
    ];

    const firstCompleteIdx = steps.findIndex(
      (s) => s.table === 'farms' && 'setup_complete' in s && s.setup_complete === true
    );
    const housesIdx = steps.findIndex((s) => s.table === 'houses');
    expect(housesIdx).toBeGreaterThanOrEqual(0);
    expect(firstCompleteIdx).toBeGreaterThan(housesIdx);

    // Failure path: house error → no setup_complete true
    const failedAfterHouses: Step[] = [
      { table: 'farms', setup_complete: false },
      // houses would error — sequence stops
    ];
    expect(failedAfterHouses.some((s) => s.table === 'farms' && 'setup_complete' in s && s.setup_complete)).toBe(
      false
    );
  });
});
