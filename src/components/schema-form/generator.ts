import type { ReactElement } from "react";

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
    options: FieldRenderOptions & { path?: string[] } = {},
  ): ReactElement {
    const factory = this.registry.lookup(field);
    if (!factory) {
      throw new Error(`No field factory found for '${field.name}'.`);
    }

    const ctx: FieldRenderContext = {
      field,
      value,
      onChange,
      generator: this,
      path: options.path ?? [field.name],
      labelHidden: options.labelHidden,
      hideAdvanced: options.hideAdvanced,
    };
    return factory.render(ctx);
  }
}
