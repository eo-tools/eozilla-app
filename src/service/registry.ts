import type { ServiceOptions, ServiceProvider } from "./provider";

const registry = new Map<string, ServiceProvider<ServiceOptions>>();

export function isServiceProviderId(
  providerId: string | null | undefined,
): providerId is string {
  return providerId ? registry.has(providerId) : false;
}

export function getServiceProviders(): ServiceProvider<ServiceOptions>[] {
  return Array.from(registry.values());
}

export function registerServiceProviders(
  providers: ServiceProvider<ServiceOptions>[],
): () => void {
  const unregisters = providers.map(registerServiceProvider);
  return () => {
    unregisters.forEach((unregister) => void unregister());
  };
}

export function registerServiceProvider(
  provider: ServiceProvider<ServiceOptions>,
): () => void {
  const providerId = provider.id;
  function unregisterServiceProvider() {
    registry.delete(providerId);
  }
  registry.set(providerId, provider);
  return unregisterServiceProvider;
}

export function getServiceProvider(
  providerId: string,
): ServiceProvider<ServiceOptions> {
  if (!providerId) {
    throw new Error("File system provider identifier was not provided");
  }
  if (!registry.has(providerId)) {
    throw new Error(`Unknown file system provider '${providerId}'`);
  }
  return registry.get(providerId)!;
}
