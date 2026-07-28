import type { Service } from "./service";

export interface ServiceProviderMeta {
  type: "testing" | "dev" | "custom" | "system";
  title: string;
  description?: string;
  disabled?: boolean;
  hidden?: boolean;
}

export type ServiceOption = boolean | number | string | undefined;
export type ServiceOptions = Record<string, ServiceOption>;
export type ServiceOptionsInput<T extends ServiceOptions> = Partial<T>;
export type NoServiceOptions = Record<string, never>;

export interface ServiceOptionSchemaBase {
  title: string;
  description?: string;
  nullable?: boolean;
  [key: `x-ui-${string}`]: boolean | string | undefined;
}

export interface BooleanServiceOptionSchema extends ServiceOptionSchemaBase {
  type: "boolean";
  enum?: boolean[];
  default?: boolean;
}

export interface NumericServiceOptionSchema extends ServiceOptionSchemaBase {
  type: "integer" | "number";
  enum?: number[];
  default?: number;
}

export interface NumberServiceOptionSchema extends NumericServiceOptionSchema {
  type: "number";
}

export interface IntegerServiceOptionSchema extends NumericServiceOptionSchema {
  type: "integer";
}

export interface StringServiceOptionSchema extends ServiceOptionSchemaBase {
  type: "string";
  enum?: string[];
  default?: string;
  format?: string;
}

export type ServiceOptionSchema =
  | BooleanServiceOptionSchema
  | IntegerServiceOptionSchema
  | NumberServiceOptionSchema
  | StringServiceOptionSchema;

export type ServiceOptionsSchema<T extends ServiceOptions> = Record<
  keyof T,
  ServiceOptionSchema
>;

/**
 * The provider of the OGC API - Processes service.
 */
export interface ServiceProvider<T extends ServiceOptions = NoServiceOptions> {
  /**
   * Unique ID.
   */
  id: string;
  /**
   * Metadata.
   */
  meta: ServiceProviderMeta;
  /**
   * Schema for the Service options.
   */
  optionsSchema?: ServiceOptionsSchema<T>;
  /**
   * Invoked by user-triggered action to allow for
   * sign-in popups and redirects.
   */
  signIn(options: ServiceOptionsInput<T>): Promise<void>;
  /**
   * Invoked by user-triggered action to allow for
   * sign-in popups and redirects.
   */
  signOut(): Promise<void>;
  /**
   * Invoked after signing in (and potential redirects)
   * to create the file system with its user.
   */
  createService(options: ServiceOptionsInput<T>): Promise<Service>;
}
