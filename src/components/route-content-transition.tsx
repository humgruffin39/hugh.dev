"use client";

import {
  useCallback,
  useEffect,
  useLayoutEffect,
  useRef,
  useState,
  type AnimationEvent,
  type CSSProperties,
  type ReactNode,
  type TransitionEvent,
} from "react";
import {
  BACKGROUND_ROUTE_INTENT_EVENT,
  type BackgroundRouteIntentDetail,
} from "@/components/background-route-intent";

const HOME_CONTENT_CLASS_NAME =
  "flex h-[100dvh] min-h-0 items-center justify-center overflow-hidden px-6 py-16 sm:px-8";
const SCROLL_CONTENT_CLASS_NAME = "min-h-[100dvh] px-6 py-16 sm:px-8";

type ContentStatus = "entering" | "hidden" | "idle";

type ContentSnapshot = {
  html: string;
  id: number;
  opacity: number;
  pathname: string;
};

function getLayoutClassName(pathname: string) {
  return pathname === "/" ? HOME_CONTENT_CLASS_NAME : SCROLL_CONTENT_CLASS_NAME;
}

function createSnapshotHtml(element: HTMLDivElement) {
  const snapshot = element.cloneNode(true) as HTMLDivElement;
  snapshot.removeAttribute("id");
  snapshot
    .querySelectorAll("[id]")
    .forEach((node) => node.removeAttribute("id"));
  return snapshot.innerHTML;
}

export default function RouteContentTransition({
  children,
  pathname,
}: {
  children: ReactNode;
  pathname: string;
}) {
  const [contentStatus, setContentStatus] = useState<ContentStatus>(
    pathname === "/" ? "hidden" : "idle",
  );
  const [snapshot, setSnapshot] = useState<ContentSnapshot | null>(null);
  const contentRef = useRef<HTMLDivElement>(null);
  const currentPathnameRef = useRef(pathname);
  const initialEntryPathnameRef = useRef(pathname);
  const snapshotIdRef = useRef(0);

  useEffect(() => {
    if (initialEntryPathnameRef.current !== "/") {
      return;
    }

    const frame = window.requestAnimationFrame(() => {
      setContentStatus("entering");
    });

    return () => window.cancelAnimationFrame(frame);
  }, []);

  const beginTransition = useCallback((targetPathname: string) => {
    if (currentPathnameRef.current === targetPathname) {
      return;
    }

    snapshotIdRef.current += 1;
    const content = contentRef.current;

    if (content) {
      setSnapshot({
        html: createSnapshotHtml(content),
        id: snapshotIdRef.current,
        opacity: Number.parseFloat(getComputedStyle(content).opacity),
        pathname: currentPathnameRef.current,
      });
    }

    setContentStatus("hidden");
  }, []);

  useEffect(() => {
    const handleRouteIntent = (event: Event) => {
      const routeEvent = event as CustomEvent<BackgroundRouteIntentDetail>;
      beginTransition(routeEvent.detail.pathname);
    };
    const handlePopState = () => beginTransition(window.location.pathname);

    window.addEventListener(BACKGROUND_ROUTE_INTENT_EVENT, handleRouteIntent);
    window.addEventListener("popstate", handlePopState);

    return () => {
      window.removeEventListener(
        BACKGROUND_ROUTE_INTENT_EVENT,
        handleRouteIntent,
      );
      window.removeEventListener("popstate", handlePopState);
    };
  }, [beginTransition]);

  useLayoutEffect(() => {
    if (currentPathnameRef.current === pathname) {
      return;
    }

    currentPathnameRef.current = pathname;
    setContentStatus("hidden");
    const frame = window.requestAnimationFrame(() => {
      setContentStatus("entering");
    });

    return () => window.cancelAnimationFrame(frame);
  }, [pathname]);

  const handleContentTransitionEnd = (
    event: TransitionEvent<HTMLDivElement>,
  ) => {
    if (
      event.target === event.currentTarget &&
      event.propertyName === "opacity" &&
      contentStatus === "entering"
    ) {
      setContentStatus("idle");
    }
  };

  const handleSnapshotAnimationEnd = (
    snapshotId: number,
    event: AnimationEvent<HTMLDivElement>,
  ) => {
    if (event.target === event.currentTarget) {
      setSnapshot((currentSnapshot) =>
        currentSnapshot?.id === snapshotId ? null : currentSnapshot,
      );
    }
  };

  return (
    <>
      {snapshot ? (
        <div
          key={snapshot.id}
          aria-hidden="true"
          className={`route-content-layer route-content-exit relative col-start-1 row-start-1 ${getLayoutClassName(snapshot.pathname)}`}
          dangerouslySetInnerHTML={{ __html: snapshot.html }}
          inert
          onAnimationEnd={(event) =>
            handleSnapshotAnimationEnd(snapshot.id, event)
          }
          style={
            {
              "--route-content-start-opacity": snapshot.opacity,
            } as CSSProperties
          }
        />
      ) : null}
      <div
        ref={contentRef}
        className={`route-content-layer relative col-start-1 row-start-1 ${getLayoutClassName(pathname)} ${contentStatus === "hidden" ? "route-content-hidden" : ""} ${contentStatus === "entering" ? "route-content-enter" : ""}`}
        onTransitionEnd={handleContentTransitionEnd}
      >
        {children}
      </div>
    </>
  );
}
