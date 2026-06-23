import {
  createLocalStateClient,
  type RemoteStateClient,
  type Store,
} from "remotestate";
import {
  getPathAt,
  isPrefixPath,
  setPathAt,
  type Path,
} from "remotestate/path";

import type { AppState } from "@/state/types";
import { getAppStore } from "./store";

export interface ProcessRequestsService {
  // Define any server-side Python queries or actions here

  /** Placeholder until any methods are added */
  _?: never;
}

const allowedPaths: Path[] = [["processRequests"]];
function isAllowedPath(path: Path) {
  return allowedPaths.some((allowedPath) => isPrefixPath(allowedPath, path));
}

// TODO:the fallback created here, is a quite common pattern
//  to connect a Zustand store to a RemoteStateClient.
//  Maybe move into remotestate/remotestate-ts into with an optional
//  Zustand dependency.
export function createFallbackAppRemoteStateClient(): RemoteStateClient<ProcessRequestsService> {
  // noinspection JSUnusedGlobalSymbols
  const store: Store = {
    get: (path: Path) => {
      if (isAllowedPath(path)) {
        return getPathAt(getAppStore().getState(), path);
      }
    },
    set: (path: Path, value: unknown) => {
      if (isAllowedPath(path)) {
        const oldState = getAppStore().getState();
        const newState = setPathAt(oldState, path, value) as AppState;
        if (newState !== oldState) {
          getAppStore().setState(newState);
        }
      }
    },
    subscribe: (path: Path, listener: () => void) => {
      if (isAllowedPath(path)) {
        return getAppStore().subscribe(listener);
      }
      return () => {};
    },
    provide: (_path: Path) => {},
    dispose: () => {},
  };

  return createLocalStateClient<ProcessRequestsService>({ store });
}
