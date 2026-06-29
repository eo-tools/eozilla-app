import { FieldFactoryRegistry } from "../generator";
import { jsonFallbackFieldFactory } from "./jsonFallback";
import { mapFieldFactory } from "./map";
import { nullableFieldFactory } from "./nullable";
import { objectFieldFactory } from "./object";
import { primitiveFieldFactory } from "./primitive";

export function createDefaultFieldFactoryRegistry(): FieldFactoryRegistry {
  return new FieldFactoryRegistry([
    nullableFieldFactory,
    mapFieldFactory,
    objectFieldFactory,
    primitiveFieldFactory,
    jsonFallbackFieldFactory,
  ]);
}
