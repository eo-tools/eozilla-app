import type { Field } from "@/utils/field";
import {
  getCompositionOptionDiscriminatorValue,
  isJsonObjectValue,
  validateJsonValue,
  type Discriminator,
  type JsonValue,
} from "@/utils/json";

export function findActiveOptionIndex(
  value: JsonValue | undefined,
  options: Field[],
  discriminator: Discriminator | undefined,
) {
  if (value === undefined) {
    return 0;
  }

  if (discriminator && isJsonObjectValue(value)) {
    const discriminatorValue = value[discriminator.propertyName];
    if (typeof discriminatorValue === "string") {
      const index = options.findIndex(
        (option, optionIndex) =>
          getCompositionOptionDiscriminatorValue(
            option.schema,
            discriminator,
            optionIndex,
          ) === discriminatorValue,
      );
      if (index >= 0) {
        return index;
      }
    }
  }

  const index = options.findIndex((option) => {
    try {
      validateJsonValue(option.name, value, option.schema);
      return true;
    } catch {
      return false;
    }
  });
  return index >= 0 ? index : 0;
}
