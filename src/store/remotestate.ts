import {
  createLocalStateClient,
  getPathAt,
  setPathAt,
  type Path,
  type RemoteStateClient,
  type Store,
} from "remotestate";

import type { ProcessRequest } from "@/service";
import type { AppState } from "@/state/types";
import { getAppStore } from "./store";
import { setProcessRequest } from "./actions";

export type ProcessRequestsService = {
  setProcessRequest(
    processId: string,
    processRequest: ProcessRequest,
  ): Promise<void>;
};

export function createFallbackProcessRequestsClient(): RemoteStateClient<ProcessRequestsService> {
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
    actions: { setProcessRequest },
  });
}
