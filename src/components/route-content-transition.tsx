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
  return pathname === "/"
    ? `route-content-home ${HOME_CONTENT_CLASS_NAME}`
    : SCROLL_CONTENT_CLASS_NAME;
}

function createSnapshotHtml(element: HTMLDivElement) {
  const snapshot = element.cloneNode(true) as HTMLDivElement;
  const sourceStaggerItems =
    element.querySelectorAll<HTMLElement>(".home-stagger-item");
  const snapshotStaggerItems =
    snapshot.querySelectorAll<HTMLElement>(".home-stagger-item");

  sourceStaggerItems.forEach((sourceItem, index) => {
    const snapshotItem = snapshotStaggerItems[index];
    if (snapshotItem) {
      const computedStyle = getComputedStyle(sourceItem);
      snapshotItem.style.opacity = computedStyle.opacity;
    }
  });

  snapshot.removeAttribute("id");
  snapshot
    .querySelectorAll("[id]")
    .forEach((node) => node.removeAttribute("id"));
  return snapshot.innerHTML;
}

export default function RouteContentTransition({
  children,
  homeEntryStartTime,
  pathname,
}: {
  children: ReactNode;
  homeEntryStartTime: number | null;
  pathname: string;
}) {
  const [contentStatus, setContentStatus] = useState<ContentStatus>(
    pathname === "/" ? "hidden" : "idle",
  );
  const [snapshot, setSnapshot] = useState<ContentSnapshot | null>(null);
  const contentRef = useRef<HTMLDivElement>(null);
  const currentPathnameRef = useRef(pathname);
  const handledHomeEntryRef = useRef(homeEntryStartTime);
  const snapshotIdRef = useRef(0);
  const pendingTargetRef = useRef<string | null>(null);

  const beginTransition = useCallback((targetPathname: string) => {
    if (
      currentPathnameRef.current === targetPathname ||
      pendingTargetRef.current === targetPathname
    ) {
      return;
    }

    pendingTargetRef.current = targetPathname;
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
    window.addEventListener("popstate", handlePopState, { capture: true });

    return () => {
      window.removeEventListener(
        BACKGROUND_ROUTE_INTENT_EVENT,
        handleRouteIntent,
      );
      window.removeEventListener("popstate", handlePopState, { capture: true });
    };
  }, [beginTransition]);

  useLayoutEffect(() => {
    if (currentPathnameRef.current === pathname) {
      return;
    }

    currentPathnameRef.current = pathname;
    pendingTargetRef.current = null;
    setContentStatus("hidden");
    if (pathname === "/") {
      return;
    }

    const frame = window.requestAnimationFrame(() => {
      setContentStatus("entering");
    });

    return () => window.cancelAnimationFrame(frame);
  }, [pathname]);

  useLayoutEffect(() => {
    if (
      pathname !== "/" ||
      homeEntryStartTime === null ||
      handledHomeEntryRef.current === homeEntryStartTime
    ) {
      return;
    }

    handledHomeEntryRef.current = homeEntryStartTime;
    setContentStatus("entering");
  }, [homeEntryStartTime, pathname]);

  const handleContentAnimationEnd = (event: AnimationEvent<HTMLDivElement>) => {
    const target = event.target as HTMLElement;
    const completedHomeStagger = target.dataset.homeStaggerEnd === "true";
    const completedLayerFade = event.target === event.currentTarget;

    const completedEntry =
      pathname === "/" ? completedHomeStagger : completedLayerFade;

    if (contentStatus === "entering" && completedEntry) {
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
        onAnimationEnd={handleContentAnimationEnd}
      >
        {children}
      </div>
    </>
  );
}
