import { describe, expect, it } from "vitest";
import {
  getFieldFromProcessDescriptionInputs,
  getFieldFromSchema,
  getSchemaFromProcessDescriptionInputs,
  getVisibleInputFields,
} from "./field";
import type { JsonSchema } from "@/utils/json";
import type { ProcessDescription } from "@/service";
import type { ObjectField } from "./field";

describe("field helpers", () => {
  it("converts process inputs into a schema object", () => {
    const processDescription = {
      inputs: {
        title: {
          schema: { type: "string" },
          minOccurs: 1,
        },
        tags: {
          schema: { type: "number" },
          minOccurs: 2,
          maxOccurs: 4,
        },
        flag: {
          schema: { type: "boolean" },
          maxOccurs: "unbounded",
        },
      },
      outputs: {},
    } as unknown as ProcessDescription;

    const schema = getSchemaFromProcessDescriptionInputs(processDescription);

    expect(schema).toEqual({
      type: "object",
      properties: {
        title: { type: "string" },
        tags: {
          type: "array",
          minItems: 2,
          maxItems: 4,
          items: { type: "number" },
        },
        flag: {
          type: "array",
          items: { type: "boolean" },
        },
      },
      additionalProperties: false,
      required: ["title"],
      nullable: false,
    });
  });

  it("turns schemas into fields and preserves x-ui metadata", () => {
    const field = getFieldFromSchema("root", {
      type: "object",
      "x-ui": { widget: "card", layout: "row", hidden: true },
      "x-ui-order": 3,
      "x-note": "custom",
      properties: {
        name: { type: "string" },
        tags: {
          type: "array",
          items: { type: "number" },
        },
      },
      additionalProperties: { type: "boolean" },
    } as unknown as JsonSchema);

    expect(field).toMatchObject({
      name: "root",
      widget: "card",
      layout: "row",
      hidden: true,
      order: 3,
      note: "custom",
      properties: {
        name: { name: "name", schema: { type: "string" } },
        tags: {
          name: "tags",
          schema: { type: "array", items: { type: "number" } },
          items: { name: "tagsItems", schema: { type: "number" } },
        },
      },
      additionalProperties: {
        name: "root",
        schema: { type: "boolean" },
      },
    });
  });

  it("extracts colon-prefixed x-ui metadata", () => {
    const field = getFieldFromSchema("root", {
      type: "number",
      "x-ui:widget": "slider",
      "x-ui:minimum": 1,
      "x-ui:maximum": 10,
      "ui:step": 0.5,
    } as unknown as JsonSchema);

    expect(field).toMatchObject({
      widget: "slider",
      minimum: 1,
      maximum: 10,
      step: 0.5,
    });
  });

  it("wraps process descriptions in a top-level inputs field", () => {
    const field = getFieldFromProcessDescriptionInputs({
      inputs: {
        name: { schema: { type: "string" }, minOccurs: 1 },
      },
      outputs: {},
    } as unknown as ProcessDescription);

    expect(field.name).toBe("inputs");
    expect(field.properties.name.name).toBe("name");
  });

  it("filters hidden inputs before advanced handling", () => {
    const field = getFieldFromSchema("inputs", {
      type: "object",
      properties: {
        visible: { type: "string" },
        advancedVisible: { type: "string", "x-ui-advanced": true },
        hidden: { type: "string", "x-ui-hidden": true },
        hiddenAdvanced: {
          type: "string",
          "x-ui-advanced": true,
          "x-ui-hidden": true,
        },
      },
    } as unknown as JsonSchema) as ObjectField;

    expect(getVisibleInputFields(field)).toEqual([
      field.properties.visible!,
      field.properties.advancedVisible!,
    ]);
    expect(getVisibleInputFields(field, { hideAdvanced: true })).toEqual([
      field.properties.visible!,
    ]);
  });

  it("sorts ordered inputs first and keeps the rest in original order", () => {
    const field = getFieldFromSchema("inputs", {
      type: "object",
      properties: {
        firstUnordered: { type: "string" },
        secondOrdered: { type: "string", "x-ui-order": 2 },
        firstOrdered: { type: "string", "x-ui-order": 1 },
        secondUnordered: { type: "string" },
        alsoFirstOrdered: { type: "string", "x-ui-order": 1 },
      },
    } as unknown as JsonSchema) as ObjectField;

    expect(getVisibleInputFields(field).map(({ name }) => name)).toEqual([
      "firstOrdered",
      "alsoFirstOrdered",
      "secondOrdered",
      "firstUnordered",
      "secondUnordered",
    ]);
  });
});
