import { create, type StoreApi } from "zustand";
import type { UseBoundStore } from "zustand/react";

import { type AppState, createInitialAppState } from "../state/types";

let _store: UseBoundStore<StoreApi<AppState>> | null = null;

export function initAppStore(initialize: () => void) {
  initialize();
  _store = create<AppState>()(() => {
    const state = createInitialAppState();
    console.debug("initial state:", state);
    return state;
  });
}

export function getAppStore() {
  if (!_store) {
    throw new Error("getAppStore() called before initAppStore()");
  }
  return _store!;
}

export function getAppState(): AppState {
  return getAppStore().getState();
}

export function setAppState(state: Partial<AppState>): void;
export function setAppState(state: AppState, replace: true): void;
export function setAppState(state: Partial<AppState>, replace?: boolean): void {
  if (replace) {
    getAppStore().setState(state as AppState, true);
  } else {
    getAppStore().setState(state);
  }
}
