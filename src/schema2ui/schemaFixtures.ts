import type { JsonSchema } from "@/utils/json";

export interface SchemaFixture {
  id: string;
  title: string;
  description: string;
  schema: JsonSchema;
}

const schemaModules = import.meta.glob("./schemas/*.json", {
  eager: true,
  import: "default",
}) as Record<string, JsonSchema>;

export const schemaFixtures = Object.entries(schemaModules)
  .map(([path, schema]) => {
    const id = path.replace(/^.*\//, "").replace(/\.json$/, "");
    return {
      id,
      title: schema.title ?? makeTitle(id),
      description: schema.description ?? "",
      schema,
    };
  })
  .sort((a, b) => a.id.localeCompare(b.id));

function makeTitle(id: string): string {
  return id
    .replace(/([a-z])([A-Z])/g, "$1 $2")
    .split(/[_-\s]+/)
    .filter(Boolean)
    .map((part) => part.charAt(0).toUpperCase() + part.slice(1))
    .join(" ");
}
