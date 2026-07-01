import { StrictMode, useEffect, useMemo, useState } from "react";
import { createRoot } from "react-dom/client";
import "@mantine/core/styles.css";
import "@mantine/dates/styles.css";
import "@mantine/notifications/styles.css";
import {
  ActionIcon,
  AppShell,
  Divider,
  Group,
  MantineProvider,
  NavLink,
  Paper,
  ScrollArea,
  SimpleGrid,
  Stack,
  Switch,
  Text,
} from "@mantine/core";
import { IconRefresh } from "@tabler/icons-react";

import { JsonCode } from "@/components/common/JsonCode";
import { SchemaForm } from "@/components/schema-form";
import { getFieldFromSchema } from "@/utils/field";
import { createJsonValueForSchema, type JsonValue } from "@/utils/json";

import { schemaFixtures } from "./schemaFixtures";

type SchemaFixtureId = (typeof schemaFixtures)[number]["id"];

const defaultFixture = schemaFixtures[0]!;
const selectedFixtureStorageKey = "schema2ui:selected-fixture";

function Schema2UiPlayground() {
  const initialFixtureId = loadSelectedFixtureId() ?? defaultFixture.id;
  const initialFixture =
    schemaFixtures.find((fixture) => fixture.id === initialFixtureId) ??
    defaultFixture;
  const [selectedFixtureId, setSelectedFixtureId] =
    useState<SchemaFixtureId>(initialFixture.id);
  const [hideAdvanced, setHideAdvanced] = useState(true);
  const selectedFixture = useMemo(
    () =>
      schemaFixtures.find((fixture) => fixture.id === selectedFixtureId) ??
      defaultFixture,
    [selectedFixtureId],
  );
  const field = useMemo(
    () => getFieldFromSchema("root", selectedFixture.schema),
    [selectedFixture],
  );
  const [value, setValue] = useState<JsonValue>(() =>
    createJsonValueForSchema(initialFixture.schema),
  );

  const resetValue = () => {
    setValue(createJsonValueForSchema(selectedFixture.schema));
  };

  useEffect(() => {
    window.localStorage.setItem(selectedFixtureStorageKey, selectedFixture.id);
  }, [selectedFixture.id]);

  const handleFixtureChange = (nextFixtureId: SchemaFixtureId) => {
    const nextFixture =
      schemaFixtures.find((fixture) => fixture.id === nextFixtureId) ??
      defaultFixture;
    setSelectedFixtureId(nextFixture.id);
    setValue(createJsonValueForSchema(nextFixture.schema));
  };

  return (
    <AppShell
      padding="md"
      header={{ height: 56 }}
      navbar={{ width: 280, breakpoint: 0 }}
    >
      <AppShell.Header px="md">
        <Group justify="space-between" align="center" h="100%">
          <Stack gap={0}>
            <Text fw={700}>schema2ui</Text>
            <Text size="xs" c="dimmed">
              One structure per fixture
            </Text>
          </Stack>
          <Group gap="xs" wrap="nowrap">
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
              onClick={resetValue}
            >
              <IconRefresh size={14} />
            </ActionIcon>
          </Group>
        </Group>
      </AppShell.Header>

      <AppShell.Navbar p="xs">
        <ScrollArea type="auto" h="100%">
          <Stack gap={4}>
            {schemaFixtures.map((fixture) => {
              const isActive = fixture.id === selectedFixture.id;
              return (
                <NavLink
                  key={fixture.id}
                  active={isActive}
                  variant={isActive ? "filled" : "default"}
                  onClick={() => handleFixtureChange(fixture.id)}
                  label={
                    <Stack gap={2}>
                      <Text size="sm" fw={500}>
                        {fixture.title}
                      </Text>
                      <Text size="xs" c="dimmed">
                        {fixture.fileName}
                      </Text>
                    </Stack>
                  }
                />
              );
            })}
          </Stack>
        </ScrollArea>
      </AppShell.Navbar>

      <AppShell.Main>
        <SimpleGrid cols={{ base: 1, xl: 2 }} spacing="lg">
          <Paper withBorder p="md" radius="sm">
            <Stack gap="sm">
              <Stack gap={2}>
                <Text fw={600}>{selectedFixture.title}</Text>
                <Text size="xs" c="dimmed">
                  {selectedFixture.fileName}
                </Text>
              </Stack>
              {selectedFixture.description ? (
                <Text size="sm" c="dimmed">
                  {selectedFixture.description}
                </Text>
              ) : null}
              <Group justify="space-between" align="center">
                <Text fw={600}>Current value</Text>
                <ActionIcon
                  size="sm"
                  variant="default"
                  aria-label="Reset current value"
                  onClick={resetValue}
                >
                  <IconRefresh size={14} />
                </ActionIcon>
              </Group>
              <JsonCode value={value} maxHeight={520} />
              <Divider />
              <Stack gap="xs">
                <Text fw={600}>Schema</Text>
                <JsonCode value={selectedFixture.schema} maxHeight={280} />
              </Stack>
            </Stack>
          </Paper>

          <Paper withBorder p="md" radius="sm">
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
          </Paper>
        </SimpleGrid>
      </AppShell.Main>
    </AppShell>
  );
}

export default Schema2UiPlayground;

createRoot(document.getElementById("root")!).render(
  <StrictMode>
    <MantineProvider>
      <Schema2UiPlayground />
    </MantineProvider>
  </StrictMode>,
);

function loadSelectedFixtureId(): SchemaFixtureId | null {
  const storedValue = window.localStorage.getItem(selectedFixtureStorageKey);
  if (!storedValue) {
    return null;
  }
  return schemaFixtures.some((fixture) => fixture.id === storedValue)
    ? (storedValue as SchemaFixtureId)
    : null;
}
