import { describe, it, expect, vi, afterEach } from 'vitest';
import { render, screen, cleanup } from '@testing-library/react';
import { PrivacyMask } from '@/components/ui/PrivacyMask';
import { mockAppStoreState } from '../setup';

describe('PrivacyMask', () => {
  afterEach(() => {
    cleanup();
  });

  it('renders value when not masked', () => {
    mockAppStoreState.costPrivacyEnabled = false;
    render(<PrivacyMask value="GHS 150.00" />);
    expect(screen.getByText('GHS 150.00')).toBeDefined();
  });

  it('renders default mask when cost privacy is enabled', () => {
    mockAppStoreState.costPrivacyEnabled = true;
    render(<PrivacyMask value="GHS 150.00" />);
    expect(screen.getByText('\u25CF\u25CF\u25CF\u25CF')).toBeDefined();
  });

  it('renders custom mask when provided', () => {
    mockAppStoreState.costPrivacyEnabled = true;
    render(<PrivacyMask value="GHS 150.00" mask="***" />);
    expect(screen.getByText('***')).toBeDefined();
  });

  it('applies custom className to span element', () => {
    mockAppStoreState.costPrivacyEnabled = false;
    const { container } = render(<PrivacyMask value="test" className="font-bold" />);
    const span = container.querySelector('span');
    expect(span?.className).toContain('font-bold');
  });

  it('renders numeric values as text', () => {
    mockAppStoreState.costPrivacyEnabled = false;
    render(<PrivacyMask value={42} />);
    expect(screen.getByText('42')).toBeDefined();
  });
});
