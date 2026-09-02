import type { ServiceOptions, ServiceOptionsInput } from "@/service";

class JsonProperty<T> {
  readonly name: string;
  private readonly store: Storage;
  constructor(store: Storage, name: string) {
    this.store = store;
    this.name = name;
  }

  get() {
    const value = this.store.getItem(this.name);
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
    this.store.setItem(this.name, JSON.stringify(value));
  }

  delete() {
    this.store.removeItem(this.name);
  }
}

export interface ServiceProviderSelection {
  id: string;
  options: ServiceOptionsInput<ServiceOptions>;
  hasSecrets?: boolean;
}

interface ServiceProviderSecrets {
  id: string;
  options: ServiceOptionsInput<ServiceOptions>;
}

const secretOptionNames = new Set([
  "password",
  "clientSecret",
  "refreshToken",
  "token",
  "accessToken",
  "apiKey",
]);

const serviceProviderSelection = new JsonProperty<ServiceProviderSelection>(
  localStorage,
  "eozilla.serviceProviderSelection",
);
const serviceProviderSecrets = new JsonProperty<ServiceProviderSecrets>(
  sessionStorage,
  "eozilla.serviceProviderSecrets",
);
const transientServiceProviderSelection =
  new JsonProperty<ServiceProviderSelection>(
    sessionStorage,
    "eozilla.transientServiceProviderSelection",
  );

export const storage = {
  serviceProviderSelection,
  getActiveServiceProviderSelection(): ServiceProviderSelection | null {
    return (
      transientServiceProviderSelection.get() ?? serviceProviderSelection.get()
    );
  },
  saveTransientServiceProviderSelection(selection: ServiceProviderSelection) {
    transientServiceProviderSelection.set(selection);
  },
  saveServiceProviderSelection(selection: ServiceProviderSelection) {
    const [options, secrets] = splitSecretOptions(selection.options);
    serviceProviderSelection.set({
      id: selection.id,
      options,
      hasSecrets: Object.keys(secrets).length > 0,
    });
    if (Object.keys(secrets).length > 0) {
      serviceProviderSecrets.set({ id: selection.id, options: secrets });
    } else {
      serviceProviderSecrets.delete();
    }
  },
  getServiceProviderOptions(id: string): ServiceOptionsInput<ServiceOptions> {
    const transientSelection = transientServiceProviderSelection.get();
    if (transientSelection?.id === id) {
      return transientSelection.options;
    }
    const selection = serviceProviderSelection.get();
    if (!selection || selection.id !== id) {
      return {};
    }
    const secrets = serviceProviderSecrets.get();
    return {
      ...selection.options,
      ...(secrets?.id === id ? secrets.options : {}),
    };
  },
  hasServiceProviderSelection(): boolean {
    const transientSelection = transientServiceProviderSelection.get();
    if (transientSelection) {
      return true;
    }
    const selection = serviceProviderSelection.get();
    if (!selection) {
      return false;
    }
    return (
      !selection.hasSecrets || serviceProviderSecrets.get()?.id === selection.id
    );
  },
  deleteServiceProviderSelection() {
    serviceProviderSelection.delete();
    serviceProviderSecrets.delete();
  },
};

function splitSecretOptions(
  options: ServiceOptionsInput<ServiceOptions>,
): [ServiceOptionsInput<ServiceOptions>, ServiceOptionsInput<ServiceOptions>] {
  const publicOptions: ServiceOptionsInput<ServiceOptions> = {};
  const secrets: ServiceOptionsInput<ServiceOptions> = {};
  Object.entries(options).forEach(([name, value]) => {
    (secretOptionNames.has(name) ? secrets : publicOptions)[name] = value;
  });
  return [publicOptions, secrets];
}
