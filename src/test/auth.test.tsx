import { describe, it, expect, vi, beforeEach } from 'vitest';
import { render, screen, act } from '@testing-library/react';
import { AuthProvider, useAuth } from '@/contexts/AuthContext';
import { supabase } from '@/integrations/supabase/client';

let authChangeCallback: any = null;

// Mock Supabase client
vi.mock('@/integrations/supabase/client', () => {
  const mockSubscription = {
    unsubscribe: vi.fn(),
  };

  const mockSupabase = {
    auth: {
      signUp: vi.fn(),
      signInWithPassword: vi.fn(),
      signOut: vi.fn(async () => {
        if (authChangeCallback) {
          await authChangeCallback('SIGNED_OUT', null);
        }
        return { error: null };
      }),
      onAuthStateChange: vi.fn((cb) => {
        authChangeCallback = cb;
        return { data: { subscription: mockSubscription } };
      }),
      getSession: vi.fn(() => Promise.resolve({ data: { session: null } })),
    },
    from: vi.fn(),
  };

  return { supabase: mockSupabase };
});

// A test helper component to consume and trigger auth methods
function TestAuthComponent() {
  const { user, signUp, signIn, signOut, farmName, currency, farmReady } = useAuth();

  return (
    <div>
      <div data-testid="user">{user ? user.email : 'guest'}</div>
      <div data-testid="farm-name">{farmName}</div>
      <div data-testid="currency">{currency}</div>
      <div data-testid="farm-ready">{farmReady === null ? 'null' : String(farmReady)}</div>
      
      <button onClick={() => signUp('test@example.com', 'pwd123', 'John Doe', 'Johns Coop')}>Sign Up</button>
      <button onClick={() => signIn('test@example.com', 'pwd123')}>Sign In</button>
      <button onClick={() => signOut()}>Sign Out</button>
    </div>
  );
}

describe('AuthContext - Complete Authentication Flow', () => {
  beforeEach(() => {
    vi.clearAllMocks();
  });

  it('should initialize as guest user and call onAuthStateChange', async () => {
    await act(async () => {
      render(
        <AuthProvider>
          <TestAuthComponent />
        </AuthProvider>
      );
    });

    expect(screen.getByTestId('user').textContent).toBe('guest');
    expect(screen.getByTestId('farm-name').textContent).toBe('My Farm');
    expect(screen.getByTestId('currency').textContent).toBe('GHS');
    expect(supabase.auth.onAuthStateChange).toHaveBeenCalled();
  });

  it('should complete registration (signUp) flow and provision farm/preferences', async () => {
    const mockUser = { id: 'user-123', email: 'test@example.com' };
    
    // Mock signUp API
    vi.mocked(supabase.auth.signUp).mockResolvedValue({
      data: { user: mockUser },
      error: null
    });

    // Mock no existing farm, returning mock created farm & preferences
    const selectMock = vi.fn().mockReturnValue({
      eq: vi.fn().mockResolvedValue({ data: [], error: null })
    });
    
    const insertMock = vi.fn().mockReturnValue({
      select: vi.fn().mockReturnValue({
        single: vi.fn().mockResolvedValue({ data: { id: 'farm-123', name: 'Johns Coop' }, error: null })
      })
    });

    vi.mocked(supabase.from).mockImplementation((table: string) => {
      if (table === 'farms') {
        return { select: selectMock, insert: insertMock };
      }
      if (table === 'user_preferences') {
        return { insert: vi.fn().mockResolvedValue({ error: null }) };
      }
      return {};
    });

    render(
      <AuthProvider>
        <TestAuthComponent />
      </AuthProvider>
    );

    await act(async () => {
      screen.getByText('Sign Up').click();
    });

    expect(supabase.auth.signUp).toHaveBeenCalledWith({
      email: 'test@example.com',
      password: 'pwd123',
      options: {
        data: { full_name: 'John Doe' },
        emailRedirectTo: window.location.origin
      }
    });

    // Verify insertion of new farm & user preferences
    expect(supabase.from).toHaveBeenCalledWith('farms');
    expect(supabase.from).toHaveBeenCalledWith('user_preferences');
  });

  it('should complete sign in flow and normalize unsupported currencies to GHS', async () => {
    vi.mocked(supabase.auth.signInWithPassword).mockResolvedValue({
      data: {},
      error: null
    });

    // Mock getSession to simulate logged in user
    const mockUser = { id: 'user-123', email: 'test@example.com' };
    vi.mocked(supabase.auth.getSession).mockResolvedValue({
      data: { session: { user: mockUser } }
    });

    // Mock fetching farm (setup complete) and preferences (unsupported currency 'USD' -> should normalize to 'GHS')
    const selectMock = vi.fn().mockImplementation((fields: string) => {
      return {
        eq: vi.fn().mockImplementation(() => {
          if (fields.includes('setup_complete') || fields.includes('updated_at')) {
            const farmData = [{ id: 'farm-123', name: 'Johns Coop', setup_complete: true, updated_at: new Date().toISOString() }];
            const promise = Promise.resolve({ data: farmData, error: null });
            Object.assign(promise, {
              maybeSingle: vi.fn().mockResolvedValue({ data: farmData[0], error: null }),
              single: vi.fn().mockResolvedValue({ data: farmData[0], error: null })
            });
            return promise;
          }
          if (fields.includes('currency')) {
            const prefsData = { currency: 'USD', cost_privacy_enabled: false };
            const promise = Promise.resolve({ data: [prefsData], error: null });
            Object.assign(promise, {
              maybeSingle: vi.fn().mockResolvedValue({ data: prefsData, error: null }),
              single: vi.fn().mockResolvedValue({ data: prefsData, error: null })
            });
            return promise;
          }
          const promise = Promise.resolve({ data: null, error: null });
          Object.assign(promise, {
            maybeSingle: vi.fn().mockResolvedValue({ data: null, error: null }),
            single: vi.fn().mockResolvedValue({ data: null, error: null })
          });
          return promise;
        })
      };
    });

    const updateMock = vi.fn().mockReturnValue({
      eq: vi.fn().mockResolvedValue({ error: null })
    });

    vi.mocked(supabase.from).mockImplementation(() => {
      return { select: selectMock, update: updateMock };
    });

    let rendered: any;
    await act(async () => {
      rendered = render(
        <AuthProvider>
          <TestAuthComponent />
        </AuthProvider>
      );
    });

    // Sign in trigger
    await act(async () => {
      screen.getByText('Sign In').click();
    });

    expect(supabase.auth.signInWithPassword).toHaveBeenCalledWith({
      email: 'test@example.com',
      password: 'pwd123'
    });

    // Wait for the currency normalization side effect
    await act(async () => {
      await new Promise(resolve => setTimeout(resolve, 10));
    });

    // Verify USD gets normalized to GHS (Rule T3)
    expect(screen.getByTestId('currency').textContent).toBe('GHS');
    expect(screen.getByTestId('farm-name').textContent).toBe('Johns Coop');
    expect(screen.getByTestId('farm-ready').textContent).toBe('true');
  });

  it('should complete sign out flow and reset context parameters', async () => {
    render(
      <AuthProvider>
        <TestAuthComponent />
      </AuthProvider>
    );

    // Simulate active logged-in user session first
    const mockUser = { id: 'user-123', email: 'test@example.com' };
    await act(async () => {
      if (authChangeCallback) {
        await authChangeCallback('SIGNED_IN', { user: mockUser });
      }
    });

    expect(screen.getByTestId('user').textContent).toBe('test@example.com');

    // Trigger Sign Out
    await act(async () => {
      screen.getByText('Sign Out').click();
    });

    await act(async () => {
      await new Promise(resolve => setTimeout(resolve, 10));
    });

    expect(supabase.auth.signOut).toHaveBeenCalled();
    expect(screen.getByTestId('user').textContent).toBe('guest');
    expect(screen.getByTestId('farm-name').textContent).toBe('My Farm');
    expect(screen.getByTestId('currency').textContent).toBe('GHS');
    expect(screen.getByTestId('farm-ready').textContent).toBe('null');
  });
});
