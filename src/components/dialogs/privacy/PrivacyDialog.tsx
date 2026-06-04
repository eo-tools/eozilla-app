import { Modal, Text, Typography } from "@mantine/core";
import ReactMarkdown from "react-markdown";

import { closeDialog } from "@/store/actions";
import { useDialogOpened } from "@/store/hooks";
import { usePrivacyMarkdown } from "@/components/dialogs/privacy/usePrivacyMarkdown";

export default function PrivacyDialog() {
  const { data: markdown, isLoading, error } = usePrivacyMarkdown();
  const opened = useDialogOpened("privacy");

  return (
    <Modal
      opened={opened}
      onClose={closeDialog}
      withCloseButton={false}
      size="50%"
      centered
    >
      {isLoading && <Text c="dimmed">Loading privacy notice...</Text>}
      {!!error && (
        <Text c="red" size="sm">
          {error}
        </Text>
      )}
      {!!markdown && (
        <Typography style={{ fontSize: "var(--mantine-font-size-sm)" }}>
          <ReactMarkdown>{markdown}</ReactMarkdown>
        </Typography>
      )}
    </Modal>
  );
}
