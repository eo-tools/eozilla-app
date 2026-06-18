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

export type ProcessRequestsService = {
  set(path: Path, value: unknown): Promise<void>;
};

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

  return createLocalStateClient<ProcessRequestsService>({
    store,
    actions: {
      set: (path: Path, value: unknown) => {
        store.set(path, value);
        return Promise.resolve();
      },
    },
  });
}
