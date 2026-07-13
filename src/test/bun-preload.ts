/**
 * Preload for `bun test` (native runner without Vitest).
 * Provides a minimal DOM so React Testing Library tests do not crash.
 * Prefer `bun run test` (vitest + jsdom) for the full suite.
 */
import { JSDOM } from "jsdom";

const dom = new JSDOM("<!DOCTYPE html><html><body></body></html>", {
  url: "http://localhost/",
  pretendToBeVisual: true,
});

const { window } = dom;

// Assign globals expected by React / Testing Library / Supabase auth
const g = globalThis as any;
g.window = window;
g.document = window.document;
g.navigator = window.navigator;
g.HTMLElement = window.HTMLElement;
g.Element = window.Element;
g.Node = window.Node;
g.DocumentFragment = window.DocumentFragment;
g.localStorage = window.localStorage;
g.sessionStorage = window.sessionStorage;
g.MutationObserver = window.MutationObserver;
g.getComputedStyle = window.getComputedStyle.bind(window);
g.requestAnimationFrame = (cb: FrameRequestCallback) => setTimeout(() => cb(Date.now()), 0);
g.cancelAnimationFrame = (id: number) => clearTimeout(id);

// matchMedia stub
if (!window.matchMedia) {
  window.matchMedia = (query: string) =>
    ({
      matches: false,
      media: query,
      onchange: null,
      addListener: () => {},
      removeListener: () => {},
      addEventListener: () => {},
      removeEventListener: () => {},
      dispatchEvent: () => false,
    }) as MediaQueryList;
}
