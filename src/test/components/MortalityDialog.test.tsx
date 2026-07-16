import { describe, it, expect, vi, beforeEach, afterEach } from 'vitest';
import { render, screen, fireEvent, cleanup } from '@testing-library/react';
import { MortalityDialog } from '@/components/MortalityDialog';

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

vi.mock('@/lib/batch-utils', () => ({
  recordMortality: vi.fn().mockResolvedValue(95),
}));

vi.mock('sonner', () => ({
  toast: { success: vi.fn(), error: vi.fn() },
}));

const mockBatch = {
  id: 'batch-1',
  name: 'Broiler Batch A',
  current_population: 100,
  farm_id: 'farm-1',
} as any;

const defaultProps = {
  batch: mockBatch,
  onClose: vi.fn(),
  onSuccess: vi.fn(),
  farmId: 'farm-1',
};

describe('MortalityDialog', () => {
  afterEach(() => {
    cleanup();
  });

  beforeEach(() => {
    vi.clearAllMocks();
  });

  it('renders when batch is provided', () => {
    render(<MortalityDialog {...defaultProps} />);
    expect(screen.getByText(/Record Mortality — Broiler Batch A/)).toBeDefined();
  });

  it('shows count, cause, and notes fields', () => {
    render(<MortalityDialog {...defaultProps} />);
    expect(screen.getByLabelText(/Number of birds/)).toBeDefined();
    expect(screen.getByLabelText(/Cause/)).toBeDefined();
    expect(screen.getByLabelText(/Notes/)).toBeDefined();
  });

  it('defaults count to 1', () => {
    render(<MortalityDialog {...defaultProps} />);
    expect(screen.getByLabelText(/Number of birds/)).toHaveProperty('value', '1');
  });

  it('validates count must be positive', () => {
    const { recordMortality } = require('@/lib/batch-utils');
    render(<MortalityDialog {...defaultProps} />);
    const countInput = screen.getByLabelText(/Number of birds/);
    fireEvent.change(countInput, { target: { value: '0' } });
    fireEvent.click(screen.getByText('Record Mortality'));
    expect(recordMortality).not.toHaveBeenCalled();
  });

  it('validates count cannot exceed population', () => {
    const { recordMortality } = require('@/lib/batch-utils');
    render(<MortalityDialog {...defaultProps} />);
    const countInput = screen.getByLabelText(/Number of birds/);
    fireEvent.change(countInput, { target: { value: '200' } });
    fireEvent.click(screen.getByText('Record Mortality'));
    expect(recordMortality).not.toHaveBeenCalled();
  });

  it('does not render when batch is null', () => {
    render(<MortalityDialog {...defaultProps} batch={null} />);
    expect(screen.queryByText(/Record Mortality/)).toBeNull();
  });
});
