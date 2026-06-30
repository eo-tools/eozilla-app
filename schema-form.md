# Schema Form Generator

This document describes the TypeScript/React schema-form generator in
`eozilla-app`. It is intentionally written for future AI agents and maintainers
who need to continue the work without rediscovering the design.

## Goal

The schema-form generator turns OpenAPI/JSON schema-derived input field metadata
into a controlled React form that uses Mantine components. It is inspired by the
Python implementation in `gavicore/src/gavicore/ui`, but it is not a 1:1 port.

The React version keeps the best reusable ideas from the Python design:

- normalized field metadata
- a scored field factory registry
- a render context that can recursively render child fields
- a universal JSON fallback for unsupported schemas

It deliberately does not port the Python `ViewModel` tree. React state is
modeled with controlled `value` / `onChange` props.

## User-Facing Integration

The process inputs panel supports two editor modes:

- `Form`: generated Mantine input controls
- `JSON`: the existing raw JSON input table

The mode is app-global, not process-local:

- state type: `ProcessInputEditorMode`
- app state property: `processInputEditorMode`
- default: `"form"`
- action: `setProcessInputEditorMode()`
- hook: `useProcessInputEditorMode()`

Relevant files:

- `src/state/types.ts`
- `src/store/actions.ts`
- `src/store/hooks.ts`
- `src/components/panels/process/ProcessInputsSubPanel.tsx`
- `src/components/panels/process/GeneratedProcessInputsView.tsx`
- `src/components/panels/process/ProcessInputsView.tsx`

Important: `ProcessInputsView.tsx` is the legacy/raw JSON editor and should stay
as a valid alternative display. Do not remove it while developing the generated
form.

## Main Package Layout

The reusable generator lives in:

```text
src/components/schema-form/
  SchemaForm.tsx
  FieldShell.tsx
  JsonFallbackField.tsx
  fieldUtils.ts
  generator.ts
  types.ts
  index.ts
  factories/
    defaultRegistry.ts
    jsonFallback.tsx
    nullable.tsx
    object.tsx
    primitive.tsx
```

Supporting schema/field metadata helpers live in:

```text
src/utils/field.ts
src/utils/json/
```

## Core Architecture

The public component is `SchemaForm`:

```tsx
<SchemaForm
  field={inputsField}
  value={processInputs}
  onChange={handleChange}
  hideLabel={hideLabel}
  hideAdvanced={hideAdvanced}
/>
```

The generator uses a registry of `FieldFactory` objects:

```ts
export interface FieldFactory {
  getScore: (field: Field) => number;
  render: (ctx: FieldRenderContext) => ReactElement;
}
```

The registry chooses the factory with the highest positive score. This mirrors
the Python `FieldFactoryRegistry.lookup()` design.

The render context contains:

```ts
export interface FieldRenderContext {
  field: Field;
  path: string[];
  value: JsonValue | undefined;
  onChange: (value: JsonValue) => void;
  generator: SchemaFormGenerator;
  hideLabel?: boolean;
  hideAdvanced?: boolean;
}
```

Factories render controlled React elements. A child field is rendered by calling
`ctx.generator.renderField(...)`.

## Current Factory Behavior

The default registry is defined in `factories/defaultRegistry.ts`, in this
priority order:

1. nullable
2. map
3. object
4. primitive
5. JSON fallback

### Primitive Factory

File: `src/components/schema-form/factories/primitive.tsx`

Supported mappings:

- `type: boolean`
  - default: Mantine `Checkbox`
  - `x-ui:widget: switch`: Mantine `Switch`
- `type: integer` / `type: number`
  - default: Mantine `NumberInput`
  - `x-ui:widget: slider` with finite min/max: Mantine `Slider`
  - `enum`: Mantine `Select`
  - `enum` with `x-ui:widget: radio`: Mantine `Radio.Group`
  - `enum` with `x-ui:widget: button`: Mantine `SegmentedControl`
- `type: string`
  - default: Mantine `TextInput`
  - `x-ui:widget: textarea`: Mantine `Textarea`
  - `format: password` or `x-ui:password`: Mantine `PasswordInput`
  - `enum`: Mantine `Select`
  - `enum` with `x-ui:widget: radio`: Mantine `Radio.Group`
  - `enum` with `x-ui:widget: button`: Mantine `SegmentedControl`
  - `format: date`: Mantine Dates `DatePickerInput`
  - `format: time`: Mantine Dates `TimeInput`
  - `format: date-time`: Mantine Dates `DateTimePicker`

Date/time value behavior:

- date emits `YYYY-MM-DD`
- time emits `HH:mm:ss`
- date-time emits `YYYY-MM-DDTHH:mm:ss`

The app imports `@mantine/dates/styles.css` in `src/main.tsx`.

### Object Factory

File: `src/components/schema-form/factories/object.tsx`

Objects render nested generated forms for visible properties.

It respects:

- `hidden`
- `advanced`
- `hideAdvanced`
- `order`
- `layout`

Unstructured object schemas, or objects with `x-ui:widget: editor`, are left to
the JSON fallback.

Layout can be:

- `"column"`
- `"row"`
- a group object with `{ type, items }`

The object factory is the first place to inspect if root-level process input
layout is not behaving as expected.

### Nullable Factory

File: `src/components/schema-form/factories/nullable.tsx`

Nullable fields render a Mantine `Switch`. When enabled, the factory renders a
non-nullable copy of the same field below the switch. When disabled, the value is
`null`.

### JSON Fallback Factory

File: `src/components/schema-form/factories/jsonFallback.tsx`

This factory always returns score `1`, so it catches anything that no more
specific factory handles. It uses `JsonFallbackField`, which wraps Mantine
`JsonInput` and validates values with `validateJsonValue()`.

This fallback is essential. Keep it available while adding new specialized
fields.

## Field Metadata

The generator uses `Field` metadata from `src/utils/field.ts`.

The current metadata extraction supports:

- grouped `x-ui`
- `x-ui-*`
- `x-ui:*`
- `ui-*`
- `ui:*`
- generic `x-*` fallback

Examples:

```json
{
  "type": "number",
  "x-ui:widget": "slider",
  "x-ui:minimum": 0,
  "x-ui:maximum": 100,
  "x-ui:step": 5
}
```

```json
{
  "type": "string",
  "x-ui": {
    "widget": "textarea",
    "placeholder": "Describe the request"
  }
}
```

The current `Field` type is not a full clone of Python `FieldMeta`, but it is
where UI metadata should be added when the generator needs more schema hints.

## Process Input Integration

`GeneratedProcessInputsView.tsx` renders one generated root object form for all
process inputs:

```tsx
<SchemaForm
  field={inputsField}
  value={processInputs}
  onChange={handleChange}
  hideLabel
  hideAdvanced={hideAdvanced}
/>
```

When the generated root object changes, it compares changed top-level input
values and calls:

```ts
setProcessInput(name, nextValue);
```

This keeps the generated form compatible with the existing process request
storage/update path.

## schema2ui Playground

The developer-facing playground lives in `src/schema2ui/` and is started with:

```bash
npm run schema2ui
```

It is intentionally separate from the main app and is meant for manual work on
schema-driven components.

The current workflow is modeled after the old Python `schema2ui` tool:

- fixtures live in `src/schema2ui/schemas/`
- each file represents one structure or schema case
- the playground shows a sidebar of fixtures
- selecting a fixture resets and renders one generated UI at a time
- the live JSON value is shown alongside the generated UI

Fixture files are JSON-only in this repo. Where possible, their names mirror the
older `gavicore/tests/ui/schemas` corpus (for example `string`, `number`,
`object-layout`, `nullable-required`). React-specific experiments can live beside
them as additional fixtures, such as `map-wkt`.

## How To Add A New Specialized Field

Add a new factory under `src/components/schema-form/factories/`.

Example shape:

```tsx
import type { FieldFactory } from "../types";

export const bboxFieldFactory: FieldFactory = {
  getScore(field) {
    return isBBoxField(field) ? 100 : 0;
  },
  render(ctx) {
    return <BBoxEditor value={ctx.value} onChange={ctx.onChange} />;
  },
};
```

Then register it before broader factories in `defaultRegistry.ts`:

```ts
return new FieldFactoryRegistry([
  nullableFieldFactory,
  mapFieldFactory,
  objectFieldFactory,
  primitiveFieldFactory,
  jsonFallbackFieldFactory,
]);
```

Use a score higher than the default primitive/object score (`10`) if the factory
is a more specific handler for an otherwise supported schema. Use `100` for
strong semantic matches such as a future `BBoxEditor`.

The same approach now applies to the map field: a specialized factory can
match a widget hint such as `x-ui-widget: map` for a supported schema type,
then render a controlled React map component while still using the schema
field's existing title and description. The current implementation uses that
general bucket for string-backed map fields and handles polygon WKT values first.

## Likely Next Extensions

Good next tasks:

- Add an array editor factory.
- Add specialized date/date-time range array handling.
- Add a BBox editor factory for numeric 4-tuples with `format: bbox` or
  `x-ui:widget: map`.
- Extend the current WKT map field beyond single `POLYGON` support if needed.
- Add `oneOf` / `anyOf` support with Mantine `Tabs` or `SegmentedControl`.
- Add `allOf` merging support, likely in field metadata utilities.
- Improve enum rendering with radio groups or segmented controls based on
  `x-ui:widget`.
- Add browser/component tests for generated form interactions.

## Notes And Caveats

- The generator is controlled. Do not introduce hidden local state for committed
  field values unless it is only a draft state like `JsonFallbackField`.
- Keep `JsonFallbackField` as the safe default while expanding support.
- Avoid making unsupported schemas fail visibly; prefer fallback JSON editing.
- Keep `ProcessInputsView.tsx` as the raw JSON alternative.
- `processInputEditorMode` is app-global by design.
- Date/time inputs currently preserve empty string defaults unless the schema has
  an explicit default. This avoids silently changing initial process request
  payloads.
