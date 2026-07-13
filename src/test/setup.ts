import "@testing-library/jest-dom";

/** In-memory Storage for environments where localStorage is missing (e.g. bun test without jsdom). */
function createMemoryStorage(): Storage {
  const map = new Map<string, string>();
  return {
    get length() {
      return map.size;
    },
    clear() {
      map.clear();
    },
    getItem(key: string) {
      return map.has(key) ? map.get(key)! : null;
    },
    key(index: number) {
      return Array.from(map.keys())[index] ?? null;
    },
    removeItem(key: string) {
      map.delete(key);
    },
    setItem(key: string, value: string) {
      map.set(key, String(value));
    },
  };
}

const g = globalThis as typeof globalThis & {
  localStorage?: Storage;
  sessionStorage?: Storage;
  window?: Window & typeof globalThis;
};

if (typeof g.localStorage === "undefined" || !g.localStorage) {
  const mem = createMemoryStorage();
  g.localStorage = mem;
  if (g.window) {
    try {
      Object.defineProperty(g.window, "localStorage", { value: mem, configurable: true });
    } catch {
      (g.window as any).localStorage = mem;
    }
  }
}

if (typeof g.sessionStorage === "undefined" || !g.sessionStorage) {
  g.sessionStorage = createMemoryStorage();
}

if (typeof window !== "undefined") {
  Object.defineProperty(window, "matchMedia", {
    writable: true,
    value: (query: string) => ({
      matches: false,
      media: query,
      onchange: null,
      addListener: () => {},
      removeListener: () => {},
      addEventListener: () => {},
      removeEventListener: () => {},
      dispatchEvent: () => {},
    }),
  });
}
