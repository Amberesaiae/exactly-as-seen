import { describe, it, expect, vi, beforeEach, afterEach } from 'vitest';
import { render, screen, fireEvent, cleanup } from '@testing-library/react';
import { BirdSaleDialog } from '@/components/BirdSaleDialog';

vi.mock('@/components/ui/dialog', () => ({
  Dialog: ({ children, open }: any) => open ? <div data-testid="dialog">{children}</div> : null,
  DialogContent: ({ children }: any) => <div data-testid="dialog-content">{children}</div>,
  DialogHeader: ({ children }: any) => <div>{children}</div>,
  DialogTitle: ({ children }: any) => <h2>{children}</h2>,
  DialogDescription: ({ children }: any) => <p>{children}</p>,
  DialogFooter: ({ children }: any) => <div>{children}</div>,
}));

vi.mock('@/components/ui/button', () => ({
  Button: ({ children, onClick, disabled, variant }: any) => (
    <button onClick={onClick} disabled={disabled} data-variant={variant}>{children}</button>
  ),
}));

vi.mock('@/components/ui/input', () => ({
  Input: (props: any) => <input {...props} />,
}));

vi.mock('@/components/ui/label', () => ({
  Label: ({ children, ...props }: any) => <label {...props}>{children}</label>,
}));

vi.mock('@/components/ui/textarea', () => ({
  Textarea: (props: any) => <textarea {...props} />,
}));

vi.mock('@/contexts/AuthContext', () => ({
  useAuth: vi.fn(() => ({
    currency: 'GHS',
    user: { id: 'user-1' },
  })),
}));

vi.mock('@/lib/synergy', () => ({
  recordBirdSale: vi.fn().mockResolvedValue({ newPop: 90 }),
}));

vi.mock('sonner', () => ({
  toast: { success: vi.fn(), error: vi.fn() },
}));

const mockBatch = {
  id: 'batch-1',
  name: 'Broiler Batch A',
  current_population: 100,
  species: 'broiler',
  status: 'active',
  farm_id: 'farm-1',
} as any;

const defaultProps = {
  batch: mockBatch,
  onClose: vi.fn(),
  onSuccess: vi.fn(),
  farmId: 'farm-1',
};

describe('BirdSaleDialog', () => {
  afterEach(() => {
    cleanup();
  });

  beforeEach(() => {
    vi.clearAllMocks();
  });

  it('renders when batch is provided', () => {
    render(<BirdSaleDialog {...defaultProps} />);
    expect(screen.getByText(/Record Bird Sale/)).toBeDefined();
  });

  it('shows quantity and unit price fields', () => {
    render(<BirdSaleDialog {...defaultProps} />);
    expect(screen.getByLabelText(/Quantity/)).toBeDefined();
    expect(screen.getByLabelText(/Unit Price/)).toBeDefined();
  });

  it('shows buyer name field', () => {
    render(<BirdSaleDialog {...defaultProps} />);
    expect(screen.getByLabelText(/Buyer/)).toBeDefined();
  });

  it('validates quantity must be positive', async () => {
    const { recordBirdSale } = await import('@/lib/synergy');
    render(<BirdSaleDialog {...defaultProps} />);
    const quantityInput = screen.getByLabelText(/Quantity/);
    fireEvent.change(quantityInput, { target: { value: '0' } });
    fireEvent.click(screen.getByText('Record Sale'));
    expect(recordBirdSale).not.toHaveBeenCalled();
  });

  it('validates quantity cannot exceed population', async () => {
    const { recordBirdSale } = await import('@/lib/synergy');
    render(<BirdSaleDialog {...defaultProps} />);
    const quantityInput = screen.getByLabelText(/Quantity/);
    fireEvent.change(quantityInput, { target: { value: '200' } });
    fireEvent.click(screen.getByText('Record Sale'));
    expect(recordBirdSale).not.toHaveBeenCalled();
  });

  it('shows withdrawal warning when batch has active withdrawal', () => {
    render(<BirdSaleDialog {...defaultProps} batch={{ ...mockBatch, has_active_withdrawal: true }} />);
    expect(screen.getByText(/ACTIVE WITHDRAWAL/i)).toBeDefined();
  });

  it('disables submit when batch has active withdrawal', () => {
    render(<BirdSaleDialog {...defaultProps} batch={{ ...mockBatch, has_active_withdrawal: true }} />);
    const submitBtn = screen.getByText('Record Sale').closest('button');
    expect(submitBtn?.disabled).toBe(true);
  });

  it('does not render when batch is null', () => {
    render(<BirdSaleDialog {...defaultProps} batch={null} />);
    expect(screen.queryByText(/Record Bird Sale/)).toBeNull();
  });
});
