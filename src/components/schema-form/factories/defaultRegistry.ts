import { FieldFactoryRegistry } from "../generator";
import { jsonFallbackFieldFactory } from "./jsonFallback";
import { nullableFieldFactory } from "./nullable";
import { objectFieldFactory } from "./object";
import { primitiveFieldFactory } from "./primitive";

export function createDefaultFieldFactoryRegistry(): FieldFactoryRegistry {
  return new FieldFactoryRegistry([
    nullableFieldFactory,
    objectFieldFactory,
    primitiveFieldFactory,
    jsonFallbackFieldFactory,
  ]);
}
