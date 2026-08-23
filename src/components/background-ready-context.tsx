"use client";

import {
  createContext,
  useCallback,
  useContext,
  useState,
  type ReactNode,
} from "react";

type BackgroundReadyContextValue = {
  isReady: boolean;
  markReady: () => void;
};

const BackgroundReadyContext =
  createContext<BackgroundReadyContextValue | null>(null);

export function BackgroundReadyProvider({ children }: { children: ReactNode }) {
  const [isReady, setIsReady] = useState(false);
  const markReady = useCallback(() => setIsReady(true), []);

  return (
    <BackgroundReadyContext.Provider value={{ isReady, markReady }}>
      {children}
    </BackgroundReadyContext.Provider>
  );
}

export function useBackgroundReady() {
  const context = useContext(BackgroundReadyContext);

  if (!context) {
    throw new Error(
      "useBackgroundReady must be used within BackgroundReadyProvider",
    );
  }

  return context;
}
