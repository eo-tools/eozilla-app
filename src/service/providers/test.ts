import type {
  NoServiceOptions,
  Service,
  ServiceProvider,
  ServiceProviderMeta,
} from "@/service";
import { TestService } from "@/service/services/test";

export class TestServiceProvider implements ServiceProvider {
  readonly id: string = "test";
  readonly meta: ServiceProviderMeta = {
    type: "test",
    title: "Test Server (in-memory)",
  };
  readonly optionsSchema = {};

  signIn(_options: NoServiceOptions): Promise<void> {
    return Promise.resolve();
  }

  signOut(): Promise<void> {
    return Promise.resolve();
  }

  createService(_options: NoServiceOptions): Promise<Service> {
    return Promise.resolve(new TestService());
  }
}
