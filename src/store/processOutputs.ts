import type { Store } from "remotestate";
import type { Output, ProcessRequest } from "@/service";

/**
 * Create an output setter; undefined deselects an output.
 * Queued writes protect edits through this setter, not concurrent external edits.
 */
export function createProcessOutputSetter(store: Store) {
  // Read the next snapshot only after the previous write is acknowledged.
  let pending = Promise.resolve();

  return (processId: string, name: string, value: Output | undefined) => {
    const update = pending.then(async () => {
      const requests = store.get(["processRequests"]) as
        | Record<string, ProcessRequest>
        | undefined;
      const request = requests?.[processId];
      if (!request) {
        return;
      }

      // Remove the key because RemoteState serializes undefined as null.
      const outputs = { ...request.outputs, [name]: value };
      if (value === undefined) {
        delete outputs[name];
      }
      await store.set(["processRequests", processId, "outputs"], outputs);
    });

    // Recover the queue while keeping the original error visible to callers.
    pending = update.catch(() => {});
    return update;
  };
}
