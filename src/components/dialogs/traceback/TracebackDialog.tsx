import { Code, Group, Modal, ScrollArea, Text } from "@mantine/core";
import { IconBug } from "@tabler/icons-react";

import { closeDialog } from "@/store/actions";
import { useAppState, useDialogOpened } from "@/store/hooks";
import { isString } from "@/utils/common";

export function TracebackDialog() {
  const dialogOpened = useDialogOpened("traceback");
  const traceback = useAppState((state) => state.dialogData);

  if (!isString(traceback)) {
    return null;
  }

  const title = "Error Traceback";

  return (
    <Modal
      opened={dialogOpened}
      onClose={closeDialog}
      size="auto"
      centered
      title={
        <Group>
          <IconBug size={20} stroke={1} />
          <Text fw={600}>{title}</Text>
        </Group>
      }
    >
      <ScrollArea w="80vw" h={300}>
        <Code block h={300}>
          {traceback}
        </Code>
      </ScrollArea>
    </Modal>
  );
}
