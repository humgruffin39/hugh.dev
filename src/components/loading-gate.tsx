"use client";

import dynamic from "next/dynamic";
import type { ReactNode } from "react";
import {
  BackgroundReadyProvider,
  useBackgroundReady,
} from "@/components/background-ready-context";
import Spinner from "@/components/spinner";

const Background = dynamic(() => import("./background"), {
  ssr: false,
});

type LoadingGateProps = {
  children: ReactNode;
};

function LoadingGateContent({ children }: LoadingGateProps) {
  const { isReady } = useBackgroundReady();

  return (
    <main className="relative flex h-[100dvh] min-h-0 items-center justify-center overflow-hidden bg-background px-6 py-16 sm:px-8">
      <div className="absolute inset-0">
        <Background />
      </div>
      <div
        aria-hidden="true"
        className="pointer-events-none absolute top-1/2 left-1/2 z-10 h-[min(20rem,48vh)] w-[min(76vw,36rem)] -translate-x-1/2 -translate-y-1/2 scale-110 bg-[radial-gradient(ellipse_at_center,rgba(5,7,11,0.66)_0%,rgba(5,7,11,0.44)_34%,rgba(5,7,11,0.18)_62%,rgba(5,7,11,0.04)_78%,transparent_100%)] blur-[18px]"
      />
      {isReady ? children : null}
      {!isReady ? (
        <div className="fixed inset-0 z-20 flex items-center justify-center bg-black">
          <div aria-label="Loading" role="status">
            <Spinner />
          </div>
        </div>
      ) : null}
    </main>
  );
}

export default function LoadingGate({ children }: LoadingGateProps) {
  return (
    <BackgroundReadyProvider>
      <LoadingGateContent>{children}</LoadingGateContent>
    </BackgroundReadyProvider>
  );
}
