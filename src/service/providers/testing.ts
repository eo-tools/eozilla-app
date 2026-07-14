import type {
  NoServiceOptions,
  Service,
  ServiceProvider,
  ServiceProviderMeta,
} from "@/service";
import { TestingService } from "@/service/services/testing";

export class TestingServiceProvider implements ServiceProvider {
  readonly id: string = "testing";
  readonly meta: ServiceProviderMeta = {
    type: "testing",
    title: "Testing Server (in-memory)",
  };
  readonly optionsSchema = {};

  signIn(_options: NoServiceOptions): Promise<void> {
    return Promise.resolve();
  }

  signOut(): Promise<void> {
    return Promise.resolve();
  }

  createService(_options: NoServiceOptions): Promise<Service> {
    return Promise.resolve(new TestingService());
  }
}
