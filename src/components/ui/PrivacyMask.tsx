import React from 'react';
import { useAppStore } from '@/stores/useAppStore';

interface PrivacyMaskProps {
  value: string | number;
  mask?: string;
  className?: string;
}

/**
 * Lean UX Utility: PrivacyMask
 * Automatically hides financial data when Cost Privacy is enabled.
 */
export function PrivacyMask({ value, mask = '●●●●', className = '' }: PrivacyMaskProps) {
  const { costPrivacyEnabled } = useAppStore();

  return (
    <span className={className}>
      {costPrivacyEnabled ? mask : value}
    </span>
  );
}
