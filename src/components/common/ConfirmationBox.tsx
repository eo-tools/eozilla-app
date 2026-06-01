import { Button, Modal, Group, Text } from "@mantine/core";

import type { ConfirmationData } from "@/state/types";

export interface ConfirmationProps {
  data?: ConfirmationData;
  onClose: () => void;
}

export function ConfirmationBox({ data, onClose }: ConfirmationProps) {
  if (!data) {
    return null;
  }
  const { title, text, options } = data;
  return (
    <Modal opened centered onClose={onClose} title={title} size={"sm"}>
      <Text mb="md">{text}</Text>
      <Group justify="flex-end">
        {options &&
          options.map((o) => (
            <Button
              key={o.id}
              onClick={() => {
                onClose();
                if (o.onClick) {
                  o.onClick();
                }
              }}
              color={o.danger ? "red" : undefined}
              variant={o.danger ? "filled" : "default"}
            >
              {o.label}
            </Button>
          ))}
      </Group>
    </Modal>
  );
}
