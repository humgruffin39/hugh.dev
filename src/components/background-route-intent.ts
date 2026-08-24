export const BACKGROUND_ROUTE_INTENT_EVENT = "hugh:background-route-intent";

export type BackgroundRouteIntentDetail = {
  isHome: boolean;
  pathname: string;
};

export function requestBackgroundRoute(pathname: string) {
  window.dispatchEvent(
    new CustomEvent<BackgroundRouteIntentDetail>(
      BACKGROUND_ROUTE_INTENT_EVENT,
      { detail: { isHome: pathname === "/", pathname } },
    ),
  );
}
