import { Fragment, type ReactElement } from "react";
import { Group, Stack } from "@mantine/core";

import {
  getVisibleInputFields,
  type FieldGroup,
  type ObjectField,
} from "@/utils/field";
import type { JsonObject } from "@/utils/json";
import { FieldShell } from "../FieldShell";
import {
  asObjectValue,
  isObjectField,
  replaceObjectProperty,
} from "../fieldUtils";
import type { FieldFactory, FieldRenderContext } from "../types";

export const objectFieldFactory: FieldFactory = {
  getScore(field) {
    return isObjectField(field) &&
      !field.schema.nullable &&
      shouldRenderObjectForm(field)
      ? 10
      : 0;
  },
  render(ctx) {
    const objectField = ctx.field as ObjectField;
    const objectValue = asObjectValue(objectField, ctx.value);
    const childrenByName = createPropertyElements(
      ctx,
      objectField,
      objectValue,
    );
    const children = layoutObjectChildren(objectField, childrenByName);

    return (
      <FieldShell field={objectField} hideLabel={ctx.hideLabel}>
        {children}
      </FieldShell>
    );
  },
};

function shouldRenderObjectForm(field: ObjectField): boolean {
  if (field.widget === "editor") {
    return false;
  }
  const hasProperties = Object.keys(field.properties).length > 0;
  return hasProperties || field.schema.additionalProperties === false;
}

function createPropertyElements(
  ctx: FieldRenderContext,
  field: ObjectField,
  objectValue: JsonObject,
): Map<string, ReactElement> {
  const visibleFields = getVisibleInputFields(field, {
    hideAdvanced: ctx.hideAdvanced,
  });
  const elements = new Map<string, ReactElement>();

  for (const propertyField of visibleFields) {
    elements.set(
      propertyField.name,
      <Fragment key={propertyField.name}>
        {ctx.generator.renderField(
          propertyField,
          objectValue[propertyField.name],
          (propertyValue) => {
            ctx.onChange(
              replaceObjectProperty(
                objectValue,
                propertyField.name,
                propertyValue,
              ),
            );
          },
          {
            hideAdvanced: ctx.hideAdvanced,
            path: [...ctx.path, propertyField.name],
          },
        )}
      </Fragment>,
    );
  }

  return elements;
}

function layoutObjectChildren(
  field: ObjectField,
  childrenByName: Map<string, ReactElement>,
) {
  const layout = field.layout ?? "column";
  if (typeof layout === "string") {
    return layoutElements(layout, [...childrenByName.values()]);
  }

  const remainingChildren = new Map(childrenByName);
  const laidOut = layoutGroup(layout, remainingChildren);
  const remaining = [...remainingChildren.values()];
  return layoutElements(layout.type, [...laidOut, ...remaining]);
}

function layoutGroup(
  group: FieldGroup,
  childrenByName: Map<string, ReactElement>,
): ReactElement[] {
  const items = group.items ?? [...childrenByName.keys()];
  const children: ReactElement[] = [];

  for (const item of items) {
    if (typeof item === "string") {
      const child = childrenByName.get(item);
      if (child) {
        children.push(child);
        childrenByName.delete(item);
      }
    } else {
      children.push(
          layoutElements(item.type, layoutGroup(item, childrenByName)),
      );
    }
  }

  return children;
}

function layoutElements(direction: "row" | "column", children: ReactElement[]) {
  if (direction === "row") {
    return (
      <Group align="flex-start" gap="md" grow>
        {children}
      </Group>
    );
  }
  return <Stack gap="md">{children}</Stack>;
}
