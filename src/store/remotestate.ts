import {
  createLocalStateClient,
  getPathAt,
  setPathAt,
  type Path,
  type RemoteStateClient,
  type Store,
} from "remotestate";

import type { AppState } from "@/state/types";
import { getAppStore } from "./store";

export type ProcessRequestsService = {};

// TODO:the fallback created here, is a quite common pattern
//  to connect a Zustand store to a RemoteStateClient.
//  Maybe move into remotestate/remotestate-ts into with an optional
//  Zustand dependency.
export function createFallbackProcessRequestsClient(): RemoteStateClient<ProcessRequestsService> {
  // noinspection JSUnusedGlobalSymbols
  const store: Store = {
    get: (path: Path) => {
      return getPathAt(getAppStore().getState(), path);
    },
    set: (path: Path, value: unknown) => {
      const oldState = getAppStore().getState();
      const newState = setPathAt(oldState, path, value) as AppState;
      if (newState !== oldState) {
        getAppStore().setState(newState);
      }
    },
    provide: (_path: Path) => {},
    subscribe: (path: Path, listener: () => void) => {
      if (path[0] !== "processRequests") {
        return () => {};
      }
      return getAppStore().subscribe(listener);
    },
    dispose: () => {},
  };

  return createLocalStateClient<ProcessRequestsService>({ store });
}
