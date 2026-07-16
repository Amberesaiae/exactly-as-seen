import { describe, it, expect, vi, beforeEach, afterEach } from 'vitest';
import { render, screen, fireEvent, cleanup } from '@testing-library/react';
import { EggSaleDialog } from '@/components/eggs/EggSaleDialog';

vi.mock('@/components/ui/dialog', () => ({
  Dialog: ({ children, open }: any) => open ? <div data-testid="dialog">{children}</div> : null,
  DialogContent: ({ children }: any) => <div data-testid="dialog-content">{children}</div>,
  DialogHeader: ({ children }: any) => <div>{children}</div>,
  DialogTitle: ({ children }: any) => <h2>{children}</h2>,
  DialogDescription: ({ children }: any) => <p>{children}</p>,
  DialogFooter: ({ children }: any) => <div>{children}</div>,
}));

vi.mock('@/components/ui/button', () => ({
  Button: ({ children, onClick, disabled, type, variant }: any) => (
    <button onClick={onClick} disabled={disabled} type={type} data-variant={variant}>{children}</button>
  ),
}));

vi.mock('@/components/ui/input', () => ({
  Input: (props: any) => <input {...props} />,
}));

vi.mock('@/components/ui/label', () => ({
  Label: ({ children, ...props }: any) => <label {...props}>{children}</label>,
}));

vi.mock('@/components/ui/select', () => ({
  Select: ({ children, value }: any) => <div data-value={value}>{children}</div>,
  SelectContent: ({ children }: any) => <div>{children}</div>,
  SelectItem: ({ children, value }: any) => <option value={value}>{children}</option>,
  SelectTrigger: ({ children }: any) => <div>{children}</div>,
  SelectValue: () => null,
}));

vi.mock('@/components/ui/textarea', () => ({
  Textarea: (props: any) => <textarea {...props} />,
}));

vi.mock('@/contexts/AuthContext', () => ({
  useAuth: vi.fn(() => ({
    currency: 'GHS',
    user: { id: 'user-1' },
    farmId: 'farm-1',
  })),
}));

const defaultProps = {
  open: true,
  onOpenChange: vi.fn(),
  onSubmit: vi.fn().mockResolvedValue(undefined),
  submitting: false,
  hasActiveWithdrawal: false,
};

describe('EggSaleDialog', () => {
  afterEach(() => {
    cleanup();
  });

  beforeEach(() => {
    vi.clearAllMocks();
  });

  it('renders when open', () => {
    render(<EggSaleDialog {...defaultProps} />);
    expect(screen.getByText('Record Egg Sale')).toBeDefined();
  });

  it('shows crates and loose quantity fields', () => {
    render(<EggSaleDialog {...defaultProps} />);
    expect(screen.getByLabelText(/Crates/)).toBeDefined();
    expect(screen.getByLabelText(/Loose Eggs/)).toBeDefined();
  });

  it('shows price per crate and price per loose fields', () => {
    render(<EggSaleDialog {...defaultProps} />);
    expect(screen.getByLabelText(/Price \/ Crate/)).toBeDefined();
    expect(screen.getByLabelText(/Price \/ Loose/)).toBeDefined();
  });

  it('shows withdrawal warning when hasActiveWithdrawal is true', () => {
    render(<EggSaleDialog {...defaultProps} hasActiveWithdrawal={true} />);
    expect(screen.getByText(/BLOCK: ACTIVE WITHDRAWAL PERIOD/)).toBeDefined();
  });

  it('disables submit when hasActiveWithdrawal is true', () => {
    render(<EggSaleDialog {...defaultProps} hasActiveWithdrawal={true} />);
    const submitBtn = screen.getByText('Confirm & Ledger Sale').closest('button');
    expect(submitBtn?.disabled).toBe(true);
  });

  it('does not render when open is false', () => {
    render(<EggSaleDialog {...defaultProps} open={false} />);
    expect(screen.queryByText('Record Egg Sale')).toBeNull();
  });

  it('shows size category selector with default medium', () => {
    render(<EggSaleDialog {...defaultProps} />);
    expect(screen.getByText(/Medium Eggs/)).toBeDefined();
  });
});
