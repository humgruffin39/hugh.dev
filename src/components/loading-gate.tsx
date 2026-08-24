"use client";

import dynamic from "next/dynamic";
import { usePathname } from "next/navigation";
import { useCallback, useState, type ReactNode } from "react";
import RouteContentTransition from "@/components/route-content-transition";
import Spinner from "@/components/spinner";

const Background = dynamic(() => import("./background"), {
  ssr: false,
});

type LoadingGateProps = {
  children: ReactNode;
};

export default function LoadingGate({ children }: LoadingGateProps) {
  const [isReady, setIsReady] = useState(false);
  const pathname = usePathname();
  const isHome = pathname === "/";
  const markReady = useCallback(() => setIsReady(true), []);

  return (
    <main className="relative grid min-h-[100dvh] overflow-x-hidden bg-background">
      <div className="absolute inset-0">
        <Background isHome={isHome} onReady={markReady} />
      </div>
      <div
        aria-hidden="true"
        className="pointer-events-none absolute top-1/2 left-1/2 z-10 h-[min(20rem,48vh)] w-[min(76vw,36rem)] -translate-x-1/2 -translate-y-1/2 scale-110 bg-[radial-gradient(ellipse_at_center,rgba(5,7,11,0.66)_0%,rgba(5,7,11,0.44)_34%,rgba(5,7,11,0.18)_62%,rgba(5,7,11,0.04)_78%,transparent_100%)] blur-[18px]"
      />
      {isReady ? (
        <RouteContentTransition pathname={pathname}>
          {children}
        </RouteContentTransition>
      ) : null}
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
