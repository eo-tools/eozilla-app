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
  isArraySchema,
  isObjectSchema,
} from "@/utils/json";
import { isObject } from "@/utils/common";
import type { InputDescription, ProcessDescription } from "@/service";

export interface FieldGroup {
  type: "row" | "column";
  items?: (FieldGroup | string)[];
  name?: string;
  title?: string;
}

export type FieldLayout = "row" | "column" | FieldGroup;

export interface XUi {
  widget?: string;
  layout?: FieldLayout;
  order?: number;
  advanced?: boolean;
  hidden?: boolean;
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
  anyOf: Field[];
}

export interface AnyOfField extends FieldBase<AnyOfSchema> {
  anyOf: Field[];
}

export interface AllOfField extends FieldBase<AllOfSchema> {
  anyOf: Field[];
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
    .filter(({ field }) => !field.hidden)
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

  const fieldBase = { name, schema, ...xUi };
  if (isArraySchema(schema)) {
    return {
      ...fieldBase,
      items: getFieldFromSchema(`${name}Items`, schema.items || {}),
    } as ArrayField;
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

    return {
      ...fieldBase,
      properties: properties_,
      additionalProperties: additionalProperties_,
    } as ObjectField;
  }
  return fieldBase as Field;
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
