import { Button, Stack } from "@mantine/core";
import { IconCloud, IconCloudOff, IconFlask2 } from "@tabler/icons-react";

import type { ServiceOptions, ServiceProvider } from "@/service";

export interface ServiceProviderListProps {
  serviceProviders: ServiceProvider<ServiceOptions>[];
  onSelect: (providerId: string) => void;
}

export function ServiceProviderList({
  serviceProviders,
  onSelect,
}: ServiceProviderListProps) {
  return (
    <Stack gap="xs">
      {serviceProviders.map(
        ({ id, meta }) =>
          !meta.hidden && (
            <Button
              key={id}
              leftSection={
                meta.type === "test" ? (
                  <IconFlask2 stroke={1} />
                ) : meta.type === "dev" ? (
                  <IconCloudOff stroke={1} />
                ) : (
                  <IconCloud stroke={1} />
                )
              }
              disabled={meta.disabled}
              onClick={() => onSelect(id)}
              variant="default"
            >
              {meta.title}
            </Button>
          ),
      )}
    </Stack>
  );
}
