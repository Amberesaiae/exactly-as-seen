import "@testing-library/jest-dom";
import { cleanup } from "@testing-library/react";
import { afterEach, vi } from "vitest";

afterEach(() => {
  cleanup();
});

export const mockAppStoreState = {
  costPrivacyEnabled: false as boolean,
};

vi.mock('@/stores/useAppStore', () => ({
  useAppStore: () => ({
    costPrivacyEnabled: mockAppStoreState.costPrivacyEnabled,
  }),
}));
