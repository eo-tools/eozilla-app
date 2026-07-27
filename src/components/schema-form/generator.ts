import { createElement, Fragment, type ReactElement } from "react";

import { useConditionalUiState } from "@/components/dynamic-expressions";
import type { Field } from "@/utils/field";
import type { JsonValue } from "@/utils/json";
import type {
  FieldFactory,
  FieldRenderContext,
  FieldRenderOptions,
  FieldValue,
  SchemaFormGenerator,
} from "./types";

export class FieldFactoryRegistry {
  private readonly factories: FieldFactory[];

  constructor(factories: FieldFactory[] = []) {
    this.factories = [...factories];
  }

  register(factory: FieldFactory): () => void {
    this.factories.push(factory);
    return () => this.unregister(factory);
  }

  unregister(factory: FieldFactory): void {
    const index = this.factories.indexOf(factory);
    if (index >= 0) {
      this.factories.splice(index, 1);
    }
  }

  lookup(field: Field): FieldFactory | undefined {
    let bestScore = 0;
    let bestFactory: FieldFactory | undefined;
    for (const factory of this.factories) {
      const score = Math.max(0, factory.getScore(field));
      if (score > bestScore) {
        bestScore = score;
        bestFactory = factory;
      }
    }
    return bestFactory;
  }
}

export class DefaultSchemaFormGenerator implements SchemaFormGenerator {
  constructor(private readonly registry: FieldFactoryRegistry) {}

  renderField(
    field: Field,
    value: FieldValue,
    onChange: (value: JsonValue) => void,
    options: FieldRenderOptions = {},
  ): ReactElement {
    const factory = this.registry.lookup(field);
    if (!factory) {
      throw new Error(`No field factory found for '${field.name}'.`);
    }

    if (field.hidden === true || field.visible === false) {
      return createElement(Fragment);
    }

    const parentDisabled = options.disabled ?? false;
    const ctx: FieldRenderContext = {
      field,
      value,
      onChange,
      generator: this,
      path: options.path ?? [field.name],
      valuePath: options.valuePath ?? [],
      index: options.index,
      disabled:
        parentDisabled || field.disabled === true || field.enabled === false,
      hideLabel: options.hideLabel,
      hideAdvanced: options.hideAdvanced,
    };
    if (field.dynamicExpressions) {
      return createElement(DynamicFieldRenderer, {
        factory,
        ctx,
        className: options.className,
        container: options.container,
        parentDisabled,
      });
    }
    return wrapField(
      factory.render(ctx),
      ctx.disabled,
      options.className,
      options.container,
    );
  }
}

function DynamicFieldRenderer({
  factory,
  ctx,
  className,
  container,
  parentDisabled,
}: {
  factory: FieldFactory;
  ctx: FieldRenderContext;
  className?: string;
  container?: FieldRenderOptions["container"];
  parentDisabled: boolean;
}) {
  const field = ctx.field;
  const state = useConditionalUiState({
    expressions: field.dynamicExpressions!,
    valuePath: ctx.valuePath,
    index: ctx.index,
    parentDisabled,
    visible: typeof field.visible === "boolean" ? field.visible : true,
    hidden: typeof field.hidden === "boolean" ? field.hidden : false,
    enabled: typeof field.enabled === "boolean" ? field.enabled : true,
    disabled: typeof field.disabled === "boolean" ? field.disabled : false,
  });
  if (!state.visible) {
    return null;
  }
  return wrapField(
    factory.render({ ...ctx, disabled: state.disabled }),
    state.disabled,
    className,
    container,
  );
}

function wrapField(
  element: ReactElement,
  disabled: boolean,
  className?: string,
  container?: FieldRenderOptions["container"],
): ReactElement {
  const wrapped = className
    ? createElement("div", { className }, element)
    : element;
  return container ? container(wrapped, disabled) : wrapped;
}
