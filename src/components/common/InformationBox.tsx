import { Button, Modal, Group, Text } from "@mantine/core";

import type { InformationData } from "@/state/types";
import { getErrorMessage } from "@/utils/common";

export interface InformationBoxProps {
  data?: InformationData;
  onClose: () => void;
}

export function InformationBox({ data, onClose }: InformationBoxProps) {
  if (!data) {
    return null;
  }
  const { title, text, error } = data;
  return (
    <Modal opened centered onClose={onClose} title={title} size={"sm"}>
      <Text mb="md">{text}</Text>
      {!!error && (
        <Text mb="md" c={"red"}>
          {getErrorMessage(error)}
        </Text>
      )}
      <Group justify="flex-end">
        <Button
          onClick={() => {
            onClose();
          }}
          variant={"default"}
        >
          {"OK"}
        </Button>
      </Group>
    </Modal>
  );
}
