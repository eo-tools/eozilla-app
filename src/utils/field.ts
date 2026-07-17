import {
  type AllOfSchema,
  type AnyOfSchema,
  type ArraySchema,
  type BooleanSchema,
  type NumericSchema,
  type ObjectSchema,
  type OneOfSchema,
  type JsonSchema,
  type StringSchema,
  type UntypedSchema,
  isAllOfSchema,
  isAnyOfSchema,
  isArraySchema,
  isOneOfSchema,
  isObjectSchema,
} from "@/utils/json";
import { isObject } from "@/utils/common";
import type { InputDescription, ProcessDescription } from "@/service";
import {
  compileExpression,
  type CompiledUiExpressions,
  type UiConditionName,
} from "@/components/dynamic-expressions";

export interface FieldGroup {
  type: "row" | "column";
  items?: (FieldGroup | string)[];
  name?: string;
  title?: string;
}

export type FieldLayout = "row" | "column" | FieldGroup;
export type UiConditionExpression = boolean | string;

export interface XUi {
  widget?: string;
  layout?: FieldLayout;
  order?: number;
  advanced?: boolean;
  visible?: UiConditionExpression;
  hidden?: UiConditionExpression;
  enabled?: UiConditionExpression;
  disabled?: UiConditionExpression;
  placeholder?: string;
  password?: boolean;
  minimum?: number;
  maximum?: number;
  step?: number;
  separator?: string;
}

export interface FieldBase<S extends JsonSchema> extends XUi {
  name: string;
  schema: S;
  dynamicExpressions?: CompiledUiExpressions;
  hasDynamicExpressions?: true;
}

export type UntypedField = FieldBase<UntypedSchema>;

export type PrimitiveField = FieldBase<
  BooleanSchema | NumericSchema | StringSchema
>;

export interface ArrayField extends FieldBase<ArraySchema> {
  items: Field;
}

export interface ObjectField extends FieldBase<ObjectSchema> {
  properties: Record<string, Field>;
  additionalProperties?: Field;
}

export interface OneOfField extends FieldBase<OneOfSchema> {
  oneOf: Field[];
}

export interface AnyOfField extends FieldBase<AnyOfSchema> {
  anyOf: Field[];
}

export interface AllOfField extends FieldBase<AllOfSchema> {
  allOf: Field[];
}

export type Field =
  | UntypedField
  | PrimitiveField
  | ArrayField
  | ObjectField
  | OneOfField
  | AnyOfField
  | AllOfField;

export function getFieldFromProcessDescriptionInputs(
  processDescription: ProcessDescription,
): ObjectField {
  const objectSchema =
    getSchemaFromProcessDescriptionInputs(processDescription);
  return getFieldFromSchema("inputs", objectSchema) as ObjectField;
}

export function getVisibleInputFields(
  inputsField: ObjectField,
  options?: { hideAdvanced?: boolean },
): Field[] {
  const hideAdvanced = options?.hideAdvanced ?? false;
  return Object.keys(inputsField.properties)
    .map((name, index) => ({
      index,
      field: inputsField.properties[name]!,
    }))
    .filter(({ field }) => field.hidden !== true && field.visible !== false)
    .filter(({ field }) => !(hideAdvanced && field.advanced))
    .sort((a, b) => {
      const aHasOrder = Number.isFinite(a.field.order);
      const bHasOrder = Number.isFinite(b.field.order);
      if (aHasOrder && bHasOrder) {
        return (
          (a.field.order as number) - (b.field.order as number) ||
          a.index - b.index
        );
      }
      if (aHasOrder) {
        return -1;
      }
      if (bHasOrder) {
        return 1;
      }
      return a.index - b.index;
    })
    .map(({ field }) => field);
}

export function getFieldFromSchema(name: string, schema: JsonSchema): Field {
  const schemaObject = schema as Record<string, unknown>;
  const xUi: Record<string, unknown> =
    "x-ui" in schemaObject && isObject(schemaObject["x-ui"])
      ? { ...schemaObject["x-ui"] }
      : {};
  Object.keys(schemaObject).forEach((key) => {
    if (key === "x-ui") {
      return;
    }
    if (key.startsWith("x-ui-") || key.startsWith("x-ui:")) {
      xUi[key.substring(5)] = schemaObject[key];
    } else if (key.startsWith("ui-") || key.startsWith("ui:")) {
      xUi[key.substring(3)] = schemaObject[key];
    } else if (key.startsWith("x-")) {
      xUi[key.substring(2)] = schemaObject[key];
    }
  });

  const dynamicExpressions = compileUiExpressions(xUi);
  const fieldBase = { name, schema, ...xUi };
  if (isArraySchema(schema)) {
    const items = getFieldFromSchema(`${name}Items`, schema.items || {});
    return addExpressionMetadata(
      {
        ...fieldBase,
        items,
      } as ArrayField,
      dynamicExpressions,
      [items],
    );
  } else if (isObjectSchema(schema)) {
    const properties = schema.properties || {};
    const properties_: Record<string, Field> = {};
    Object.keys(properties).forEach((propName) => {
      properties_[propName] = getFieldFromSchema(
        propName,
        properties[propName],
      );
    });

    const additionalProperties = schema.additionalProperties;
    let additionalProperties_: Field | undefined = undefined;
    if (additionalProperties === true || additionalProperties === undefined) {
      additionalProperties_ = fieldBase as Field;
    } else if (isObject(additionalProperties)) {
      additionalProperties_ = getFieldFromSchema(
        `${name}`,
        additionalProperties as JsonSchema,
      );
    }

    return addExpressionMetadata(
      {
        ...fieldBase,
        properties: properties_,
        additionalProperties: additionalProperties_,
      } as ObjectField,
      dynamicExpressions,
      [
        ...Object.values(properties_),
        ...(additionalProperties_ ? [additionalProperties_] : []),
      ],
    );
  } else if (isOneOfSchema(schema)) {
    const oneOf = schema.oneOf.map((option, index) =>
      getFieldFromSchema(`${name}Option${index}`, option),
    );
    return addExpressionMetadata(
      {
        ...fieldBase,
        oneOf,
      } as OneOfField,
      dynamicExpressions,
      oneOf,
    );
  } else if (isAnyOfSchema(schema)) {
    const anyOf = schema.anyOf.map((option, index) =>
      getFieldFromSchema(`${name}Option${index}`, option),
    );
    return addExpressionMetadata(
      {
        ...fieldBase,
        anyOf,
      } as AnyOfField,
      dynamicExpressions,
      anyOf,
    );
  } else if (isAllOfSchema(schema)) {
    const allOf = schema.allOf.map((part, index) =>
      getFieldFromSchema(`${name}Part${index}`, part),
    );
    return addExpressionMetadata(
      {
        ...fieldBase,
        allOf,
      } as AllOfField,
      dynamicExpressions,
      allOf,
    );
  }
  return addExpressionMetadata(fieldBase as Field, dynamicExpressions);
}

const uiConditionNames: UiConditionName[] = [
  "visible",
  "hidden",
  "enabled",
  "disabled",
];
const reportedExpressionErrors = new Set<string>();

function compileUiExpressions(xUi: Record<string, unknown>) {
  let compiled: CompiledUiExpressions | undefined;
  for (const name of uiConditionNames) {
    const source = xUi[name];
    if (typeof source !== "string") {
      continue;
    }
    try {
      compiled ??= {};
      compiled[name] = compileExpression(source);
    } catch (error) {
      const key = `${name}:${source}`;
      if (!reportedExpressionErrors.has(key)) {
        reportedExpressionErrors.add(key);
        console.error(`Invalid x-ui-${name} expression '${source}'.`, error);
      }
    }
  }
  return compiled;
}

function addExpressionMetadata<T extends Field>(
  field: T,
  dynamicExpressions: CompiledUiExpressions | undefined,
  children: Field[] = [],
): T {
  if (dynamicExpressions) {
    field.dynamicExpressions = dynamicExpressions;
  }
  if (
    dynamicExpressions ||
    children.some((child) => child.hasDynamicExpressions)
  ) {
    field.hasDynamicExpressions = true;
  }
  return field;
}

export function getSchemaFromProcessDescriptionInputs(
  processDescription: ProcessDescription,
): ObjectSchema {
  const properties: Record<string, JsonSchema> = {};
  const requiredInputNames: string[] = [];
  Object.keys(processDescription.inputs || {}).forEach((inputName) => {
    const [schema, required] = getInputDescriptionSchema(
      processDescription.inputs[inputName],
    );
    properties[inputName] = schema;
    if (required) {
      requiredInputNames.push(inputName);
    }
  });
  return {
    type: "object",
    properties,
    additionalProperties: false,
    required: requiredInputNames,
    nullable: false,
  };
}

function getInputDescriptionSchema(
  inputDescription: InputDescription,
): [JsonSchema, boolean] {
  const {
    minOccurs,
    maxOccurs,
    schema,
    keywords: _kw,
    metadata: _md,
    ...meta
  } = inputDescription;
  const required = typeof minOccurs === "number" && minOccurs === 1;
  let newSchema: JsonSchema;
  if (typeof maxOccurs === "number" && maxOccurs >= 1) {
    newSchema = {
      type: "array",
      minItems: minOccurs,
      maxItems: maxOccurs,
      items: schema || {},
      ...meta,
    };
  } else if (
    maxOccurs === "unbounded" ||
    (typeof minOccurs === "number" && minOccurs > 1)
  ) {
    newSchema = {
      type: "array",
      minItems: minOccurs,
      items: schema || {},
      ...meta,
    };
  } else {
    newSchema = { ...schema, ...meta } as JsonSchema;
  }
  return [newSchema, required];
}
