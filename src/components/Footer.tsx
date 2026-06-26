import { Anchor, Box, Group, Text } from "@mantine/core";
import { openDialog } from "@/store/actions";

const appBuildVersion = `v${import.meta.env.VITE_APP_VERSION}+${import.meta.env.VITE_BUILD_APPENDIX}`;

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
        {appBuildVersion}
      </Text>
    </Box>
  );
}
