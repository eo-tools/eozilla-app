import { FieldFactoryRegistry } from "../generator";
import { arrayFieldFactory } from "./array";
import { booleanFieldFactory } from "./boolean";
import { integerFieldFactory } from "./integer";
import { jsonFallbackFieldFactory } from "./jsonFallback";
import { nullableFieldFactory } from "./nullable";
import { numberFieldFactory } from "./number";
import { objectFieldFactory } from "./object";
import { stringFieldFactory } from "./string";

export function createDefaultFieldFactoryRegistry(): FieldFactoryRegistry {
  return new FieldFactoryRegistry([
    nullableFieldFactory,
    booleanFieldFactory,
    integerFieldFactory,
    numberFieldFactory,
    stringFieldFactory,
    arrayFieldFactory,
    objectFieldFactory,
    jsonFallbackFieldFactory,
  ]);
}
