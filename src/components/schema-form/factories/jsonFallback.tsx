import { JsonFallbackField } from "../JsonFallbackField";
import type { FieldFactory } from "../types";

export const jsonFallbackFieldFactory: FieldFactory = {
  getScore() {
    return 1;
  },
  render(ctx) {
    return (
      <JsonFallbackField
        field={ctx.field}
        value={ctx.value}
        onChange={ctx.onChange}
        labelHidden={ctx.labelHidden}
      />
    );
  },
};
