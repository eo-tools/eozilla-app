import type { JsonSchema } from "@/utils/json";

export interface SchemaFixture {
  id: string;
  title: string;
  description: string;
  fileName: string;
  schema: JsonSchema;
}

const schemaModules = import.meta.glob("./schemas/*.json", {
  eager: true,
  import: "default",
}) as Record<string, JsonSchema>;

export const schemaFixtures = Object.entries(schemaModules)
  .sort(([pathA], [pathB]) => pathA.localeCompare(pathB))
  .map(([path, schema]) => {
    const resolvedSchema = resolveSchemaRefs(schema);
    const fileName = path.replace(/^.*\//, "");
    const id = fileName.replace(/\.json$/, "");
    return {
      id,
      title: resolvedSchema.title ?? makeTitle(id),
      description: resolvedSchema.description ?? "",
      fileName,
      schema: resolvedSchema,
    };
  });

function makeTitle(id: string): string {
  return id
    .replace(/([a-z])([A-Z])/g, "$1 $2")
    .split(/[_-\s]+/)
    .filter(Boolean)
    .map((part) => part.charAt(0).toUpperCase() + part.slice(1))
    .join(" ");
}

function resolveSchemaRefs(schema: JsonSchema): JsonSchema {
  return resolveSchemaNode(schema, getDefinitions(schema));
}

function resolveSchemaNode(
  schema: JsonSchema,
  definitions: Record<string, JsonSchema>,
  seen = new Set<string>(),
): JsonSchema {
  const ref = schema.ref ?? (schema as Record<string, unknown>)["$ref"];
  if (typeof ref === "string") {
    if (seen.has(ref)) {
      return schema;
    }
    return {
      ...resolveSchemaNode(
        getRefTarget(ref, definitions),
        definitions,
        new Set([...seen, ref]),
      ),
      ref,
    } as JsonSchema;
  }

  const resolved: Record<string, unknown> = {
    ...(schema as Record<string, unknown>),
  };
  delete resolved["$ref"];

  for (const [key, value] of Object.entries(resolved)) {
    if (Array.isArray(value)) {
      resolved[key] = value.map((item) =>
        isPlainObject(item)
          ? resolveSchemaNode(item as JsonSchema, definitions, seen)
          : item,
      );
    } else if (isPlainObject(value)) {
      resolved[key] = resolveSchemaNode(value as JsonSchema, definitions, seen);
    }
  }

  return resolved as JsonSchema;
}

function getDefinitions(schema: JsonSchema): Record<string, JsonSchema> {
  return (
    (schema as { components?: { schemas?: Record<string, JsonSchema> } })
      .components?.schemas ?? {}
  );
}

function getRefTarget(
  ref: string,
  definitions: Record<string, JsonSchema>,
): JsonSchema {
  const name = ref.split("/").pop();
  if (!name || !definitions[name]) {
    throw new Error(`Unsupported schema reference: ${ref}`);
  }
  return definitions[name];
}

function isPlainObject(value: unknown): value is Record<string, unknown> {
  return typeof value === "object" && value !== null && !Array.isArray(value);
}
