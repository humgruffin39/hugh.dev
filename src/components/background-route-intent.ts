export const BACKGROUND_ROUTE_INTENT_EVENT = "hugh:background-route-intent";

export type BackgroundRouteIntentDetail = {
  isHome: boolean;
};

export function requestBackgroundRoute(isHome: boolean) {
  window.dispatchEvent(
    new CustomEvent<BackgroundRouteIntentDetail>(
      BACKGROUND_ROUTE_INTENT_EVENT,
      { detail: { isHome } },
    ),
  );
}
