import { Anchor, Box, Group, Text } from "@mantine/core";
import { openDialog } from "@/store/actions";

const appVersion = import.meta.env.VITE_APP_VERSION;
const buildNumber = import.meta.env.VITE_BUILD_NUMBER;
const buildPrefix = buildNumber === "0" ? "" : `, build ${buildNumber}`;
const appVersionTitle = `Version ${appVersion}${buildPrefix}`;

export default function Footer() {
  return (
    <Box className="app-footer">
      <Group h="100%" justify="center" gap={8} wrap="nowrap">
        <Anchor
          href="https://www.brockmann-consult.de/imprint/"
          target="_blank"
          rel="noreferrer"
          size="xs"
          c="dimmed"
        >
          Imprint
        </Anchor>
        <Anchor
          onClick={(event) => {
            event.preventDefault();
            openDialog("privacy");
          }}
          size="xs"
          c="dimmed"
        >
          Privacy
        </Anchor>
        <Text size="xs" c="dimmed" fs="italic">
          No cookies used.
        </Text>
      </Group>
      <Text className="app-footer-version" size="xs" c="dimmed">
        {appVersionTitle}
      </Text>
    </Box>
  );
}
