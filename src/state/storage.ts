import type { ServiceOptions, ServiceOptionsInput } from "@/service";

const s = localStorage;

class JsonProperty<T> {
  readonly name: string;
  constructor(name: string) {
    this.name = name;
  }

  get() {
    const value = s.getItem(this.name);
    if (value === null) {
      return null;
    }
    try {
      return JSON.parse(value) as T;
    } catch (_error) {
      return null;
    }
  }

  set(value: T) {
    s.setItem(this.name, JSON.stringify(value));
  }

  delete() {
    s.removeItem(this.name);
  }
}

export interface ServiceProviderSelection {
  id: string;
  options: ServiceOptionsInput<ServiceOptions>;
}

export const storage = {
  serviceProviderSelection: new JsonProperty<ServiceProviderSelection>(
    "eozilla.serviceProviderSelection",
  ),
};
