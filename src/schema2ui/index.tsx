import { StrictMode, useEffect, useMemo, useState } from "react";
import { createRoot } from "react-dom/client";
import "@mantine/core/styles.css";
import "@mantine/dates/styles.css";
import "@mantine/notifications/styles.css";
import {
  ActionIcon,
  AppShell,
  Button,
  Divider,
  Group,
  MantineProvider,
  Select,
  SimpleGrid,
  Stack,
  Switch,
  Text,
} from "@mantine/core";
import { IconRefresh } from "@tabler/icons-react";

import { JsonCode } from "@/components/common/JsonCode";
import styles from "@/components/common/styles";
import { SchemaForm } from "@/components/schema-form";
import { getFieldFromSchema } from "@/utils/field";
import {
  createJsonValueForSchema,
  type JsonValue,
} from "@/utils/json";

import { schemaFixtures } from "./schemaFixtures";

const schemaOptions = schemaFixtures.map((fixture) => ({
  value: fixture.id,
  label: fixture.title,
}));

type SchemaFixtureId = (typeof schemaFixtures)[number]["id"];

function Schema2UiPlayground() {
  const [selectedFixtureId, setSelectedFixtureId] = useState<SchemaFixtureId>(
    schemaFixtures[0]!.id,
  );
  const [hideAdvanced, setHideAdvanced] = useState(true);
  const selectedFixture = useMemo(
    () =>
      schemaFixtures.find((fixture) => fixture.id === selectedFixtureId) ??
      schemaFixtures[0]!,
    [selectedFixtureId],
  );
  const field = useMemo(
    () => getFieldFromSchema("root", selectedFixture.schema),
    [selectedFixture],
  );
  const [value, setValue] = useState<JsonValue>(() =>
    createJsonValueForSchema(selectedFixture.schema),
  );

  useEffect(() => {
    setValue(createJsonValueForSchema(selectedFixture.schema));
  }, [selectedFixture]);

  return (
    <AppShell
      withBorder={false}
      padding={styles.shell.py}
      header={{ height: 56 }}
    >
      <AppShell.Header px={styles.shell.px} pb={0}>
        <Group justify="space-between" align="center" h="100%">
          <Text fw={700}>schema2ui</Text>
          <Group gap="xs" wrap="nowrap">
            <Select
              size="xs"
              value={selectedFixtureId}
              data={schemaOptions}
              onChange={(nextValue) => {
                if (nextValue) {
                  setSelectedFixtureId(nextValue);
                }
              }}
              w={220}
            />
            <Switch
              size="xs"
              label="Hide advanced"
              checked={hideAdvanced}
              onChange={(event) => setHideAdvanced(event.currentTarget.checked)}
            />
            <ActionIcon
              size="sm"
              variant="default"
              aria-label="Reset current value"
              onClick={() =>
                setValue(createJsonValueForSchema(selectedFixture.schema))
              }
            >
              <IconRefresh size={14} />
            </ActionIcon>
          </Group>
        </Group>
      </AppShell.Header>

      <AppShell.Main>
        <SimpleGrid cols={{ base: 1, lg: 2 }} spacing="lg">
          <Stack gap="sm">
            <Text fw={600}>{selectedFixture.title}</Text>
            <Text size="sm" c="dimmed">
              {selectedFixture.description}
            </Text>
            <JsonCode value={selectedFixture.schema} maxHeight={360} />
            <Divider />
            <Group justify="space-between" align="center">
              <Text fw={600}>Current value</Text>
              <Button
                size="xs"
                variant="light"
                onClick={() =>
                  setValue(createJsonValueForSchema(selectedFixture.schema))
                }
              >
                Reset
              </Button>
            </Group>
            <JsonCode value={value} maxHeight={260} />
          </Stack>

          <Stack gap="sm">
            <Group justify="space-between" align="center">
              <Text fw={600}>Generated UI</Text>
              <Text size="sm" c="dimmed">
                live controlled form
              </Text>
            </Group>
            <SchemaForm
              field={field}
              value={value}
              onChange={setValue}
              hideAdvanced={hideAdvanced}
            />
          </Stack>
        </SimpleGrid>
      </AppShell.Main>
    </AppShell>
  );
}

createRoot(document.getElementById("root")!).render(
  <StrictMode>
    <MantineProvider>
      <Schema2UiPlayground />
    </MantineProvider>
  </StrictMode>,
);
