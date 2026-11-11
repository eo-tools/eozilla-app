import { describe, expect, it } from "vitest";
import {
  getFieldFromProcessDescriptionInputs,
  getFieldFromSchema,
  getSchemaFromProcessDescriptionInputs,
  getVisibleInputFields,
} from "./field";
import type { JsonSchema } from "@/utils/json";
import { createJsonValueForSchema, validateJsonValue } from "@/utils/json";
import type { ProcessDescription } from "@/service";
import type { ObjectField } from "./field";

describe("field helpers", () => {
  describe.each([0, 1])(
    "single-occurrence inputs with minOccurs %i",
    (minOccurs) => {
      it.each([
        {
          name: "scalar",
          inputSchema: { type: "string", default: "Hello World" },
          value: "Hello World",
        },
        {
          name: "array-valued",
          inputSchema: {
            type: "array",
            items: { type: "string" },
            minItems: 2,
            default: ["red", "nir"],
          },
          value: ["red", "nir"],
        },
      ])(
        "preserves the $name schema without an extra array",
        ({ inputSchema, value }) => {
          const schema = getSchemaFromProcessDescriptionInputs({
            id: "single-occurrence",
            version: "1.0.0",
            inputs: {
              value: {
                minOccurs,
                maxOccurs: 1,
                schema: inputSchema as JsonSchema,
              },
            },
            outputs: {},
          });

          expect(schema.properties?.value).toEqual(inputSchema);
          expect(schema.required).toEqual(minOccurs === 1 ? ["value"] : []);
          expect(createJsonValueForSchema(schema)).toEqual({ value });
          expect(() =>
            validateJsonValue("inputs", { value }, schema),
          ).not.toThrow();
          expect(() =>
            validateJsonValue("inputs", { value: [value] }, schema),
          ).toThrow();
        },
      );
    },
  );

  it.each([4, "unbounded", undefined] as const)(
    "requires repeated inputs with minOccurs 2 and maxOccurs %s",
    (maxOccurs) => {
      const schema = getSchemaFromProcessDescriptionInputs({
        id: "repeated-input",
        version: "1.0.0",
        inputs: {
          values: {
            minOccurs: 2,
            maxOccurs,
            schema: { type: "string" },
          },
        },
        outputs: {},
      });

      expect(schema.required).toEqual(["values"]);
      expect(() => validateJsonValue("inputs", {}, schema)).toThrow(
        "missing required property 'values'",
      );
      expect(() =>
        validateJsonValue("inputs", { values: ["first"] }, schema),
      ).toThrow("must not have less than 2 items");
      expect(() =>
        validateJsonValue("inputs", { values: ["first", "second"] }, schema),
      ).not.toThrow();
    },
  );

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
      required: ["title", "tags"],
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

  it("turns composition schemas into composition fields", () => {
    const oneOfField = getFieldFromSchema("input", {
      oneOf: [{ type: "string" }, { type: "number" }],
    } as JsonSchema);
    const anyOfField = getFieldFromSchema("input", {
      anyOf: [{ type: "boolean" }, { type: "integer" }],
    } as JsonSchema);
    const allOfField = getFieldFromSchema("input", {
      allOf: [
        {
          type: "object",
          properties: { bucket: { type: "string" } },
        },
        {
          type: "object",
          properties: { object: { type: "string" } },
        },
      ],
    } as JsonSchema);

    expect(oneOfField).toMatchObject({
      name: "input",
      oneOf: [
        { name: "inputOption0", schema: { type: "string" } },
        { name: "inputOption1", schema: { type: "number" } },
      ],
    });
    expect(anyOfField).toMatchObject({
      name: "input",
      anyOf: [
        { name: "inputOption0", schema: { type: "boolean" } },
        { name: "inputOption1", schema: { type: "integer" } },
      ],
    });
    expect(allOfField).toMatchObject({
      name: "input",
      allOf: [{ name: "inputPart0" }, { name: "inputPart1" }],
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

  it("compiles dynamic UI expressions and marks only affected subtrees", () => {
    const field = getFieldFromSchema("inputs", {
      type: "object",
      properties: {
        mode: { type: "string" },
        staticGroup: {
          type: "object",
          properties: { name: { type: "string" } },
        },
        dynamicGroup: {
          type: "object",
          properties: {
            password: {
              type: "string",
              "x-ui-visible": "mode === 'login'",
            },
          },
        },
      },
    } as unknown as JsonSchema) as ObjectField;

    expect(field.hasDynamicExpressions).toBe(true);
    expect(field.properties.staticGroup!.hasDynamicExpressions).toBeUndefined();
    expect(field.properties.dynamicGroup!.hasDynamicExpressions).toBe(true);
    expect(
      (field.properties.dynamicGroup as ObjectField).properties.password!
        .dynamicExpressions?.visible?.references,
    ).toEqual([{ base: "sibling", path: ["mode"] }]);
  });

  it("keeps static schemas on the no-expression fast path", () => {
    const field = getFieldFromSchema("inputs", {
      type: "object",
      properties: {
        visible: { type: "string" },
        hidden: { type: "string", "x-ui-hidden": true },
      },
    } as unknown as JsonSchema) as ObjectField;

    expect(field.hasDynamicExpressions).toBeUndefined();
    expect(field.properties.visible!.dynamicExpressions).toBeUndefined();
  });

  it("does not statically filter string-valued visibility expressions", () => {
    const field = getFieldFromSchema("inputs", {
      type: "object",
      properties: {
        dynamicHidden: { type: "string", "x-ui-hidden": "hide_field" },
        dynamicVisible: { type: "string", "x-ui-visible": "show_field" },
      },
    } as unknown as JsonSchema) as ObjectField;

    expect(getVisibleInputFields(field)).toEqual([
      field.properties.dynamicHidden!,
      field.properties.dynamicVisible!,
    ]);
  });
});
