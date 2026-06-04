import { Anchor, Group, Text } from "@mantine/core";
import { openDialog } from "@/store/actions";

export default function Footer() {
  return (
    <>
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
    </>
  );
}
