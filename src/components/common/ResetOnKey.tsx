import { Fragment, type Key, type ReactNode } from "react";

export interface ResetOnKeyProps {
  children: ReactNode;
  resetKey: Key;
}

/**
 * Remounts its children whenever `resetKey` changes.
 *
 * Use this when local state should be discarded for a new identity, such as a
 * form that should return to its initial draft values when editing a different
 * item. This makes the reset an explicit React remount instead of synchronizing
 * derived local state with a setState call inside an effect.
 */
export function ResetOnKey({ children, resetKey }: ResetOnKeyProps) {
  return <Fragment key={resetKey}>{children}</Fragment>;
}
