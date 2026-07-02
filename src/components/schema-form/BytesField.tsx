import { useState } from "react";
import { ActionIcon, Box, Group, Text } from "@mantine/core";
import { IconX } from "@tabler/icons-react";

import { FieldShell } from "./FieldShell";
import type { FieldRenderContext } from "./types";

interface BytesFieldProps {
  ctx: FieldRenderContext;
  value: string;
}

export function BytesField({ ctx, value }: BytesFieldProps) {
  const hasFile = value.length > 0;
  const [fileName, setFileName] = useState("");

  const handleFile = (file: File | null) => {
    setFileName(file?.name ?? "");
    void readFileAsBase64(file).then(ctx.onChange);
  };

  return (
    <FieldShell field={ctx.field} hideLabel={ctx.hideLabel}>
      <Group align="center" wrap="nowrap">
        <Box
          component="label"
          onDragOver={(event) => event.preventDefault()}
          onDrop={(event) => {
            event.preventDefault();
            handleFile(event.dataTransfer.files[0] ?? null);
          }}
          style={{
            borderColor: "var(--mantine-color-default-border)",
            borderRadius: "var(--mantine-radius-sm)",
            borderStyle: "dashed",
            borderWidth: 1,
            cursor: "pointer",
            padding: "var(--mantine-spacing-sm)",
            width: "100%",
          }}
        >
          <input
            type="file"
            hidden
            onChange={(event) => {
              handleFile(event.currentTarget.files?.[0] ?? null);
              event.currentTarget.value = "";
            }}
          />
          <Text size="sm">
            {hasFile
              ? fileName || "Selected file"
              : "Drag a file here or click to select"}
          </Text>
        </Box>
        {hasFile ? (
          <ActionIcon
            aria-label="Clear file"
            color="gray"
            size="sm"
            variant="subtle"
            onClick={(event) => {
              event.preventDefault();
              event.stopPropagation();
              setFileName("");
              ctx.onChange("");
            }}
          >
            <IconX size={14} />
          </ActionIcon>
        ) : null}
      </Group>
    </FieldShell>
  );
}

async function readFileAsBase64(file: File | null): Promise<string> {
  if (!file) {
    return "";
  }

  const bytes = new Uint8Array(await file.arrayBuffer());
  let binary = "";
  bytes.forEach((byte) => {
    binary += String.fromCharCode(byte);
  });
  return btoa(binary);
}
