import { renderToStaticMarkup } from "react-dom/server";
import { describe, expect, it } from "vitest";

import { getFieldFromSchema, type ObjectField } from "@/utils/field";
import type { JsonObject, JsonSchema } from "@/utils/json";
import { SchemaForm } from "./SchemaForm";
import { FieldFactoryRegistry } from "./generator";
import type { FieldFactory, FieldRenderContext } from "./types";

const testFactory: FieldFactory = {
  getScore: () => 1,
  render(ctx) {
    if (ctx.field.schema.type === "object" && "properties" in ctx.field) {
      return renderObject(ctx, ctx.field as ObjectField);
    }
    return (
      <input
        data-field={ctx.field.name}
        disabled={ctx.disabled}
        value={String(ctx.value ?? "")}
        readOnly
      />
    );
  },
};

describe("SchemaForm dynamic expressions", () => {
  it("updates visibility and enablement from sibling values", () => {
    const field = createConditionalField();
    const registry = new FieldFactoryRegistry([testFactory]);

    const anonymous = renderToStaticMarkup(
      <SchemaForm
        field={field}
        value={{ auth_type: "anonymous", password: "secret", token: "abc" }}
        onChange={() => undefined}
        registry={registry}
      />,
    );
    expect(anonymous).not.toContain('data-field="password"');
    expect(anonymous).toContain('data-field="token" disabled=""');

    const login = renderToStaticMarkup(
      <SchemaForm
        field={field}
        value={{ auth_type: "login", password: "secret", token: "abc" }}
        onChange={() => undefined}
        registry={registry}
      />,
    );
    expect(login).toContain('data-field="password"');
    expect(login).toContain('data-field="token"');
    expect(login).not.toContain('data-field="token" disabled=""');
  });
});

function createConditionalField() {
  return getFieldFromSchema("inputs", {
    type: "object",
    properties: {
      auth_type: { type: "string" },
      password: {
        type: "string",
        "x-ui-visible": "auth_type === 'login'",
      },
      token: {
        type: "string",
        "x-ui-disabled": "auth_type !== 'login'",
      },
    },
  } as unknown as JsonSchema) as ObjectField;
}

function renderObject(ctx: FieldRenderContext, field: ObjectField) {
  const value = (ctx.value ?? {}) as JsonObject;
  return (
    <>
      {Object.values(field.properties).map((property) =>
        ctx.generator.renderField(
          property,
          value[property.name],
          () => undefined,
          {
            disabled: ctx.disabled,
            path: [...ctx.path, property.name],
            valuePath: [...ctx.valuePath, property.name],
          },
        ),
      )}
    </>
  );
}
