import type { CSSProperties } from "react";
import ReactMarkdown from "react-markdown";
import { ActionIcon, HoverCard, Typography } from "@mantine/core";
import { IconHelp } from "@tabler/icons-react";
import styles from "@/components/common/styles";

interface HoverHelpIconProps {
  markdownText?: string | null;
  revealStyle?: CSSProperties;
}

export default function HoverHelpIcon({
  markdownText,
  revealStyle,
}: HoverHelpIconProps) {
  if (!markdownText) {
    return null;
  }
  return (
    <HoverCard width={280} shadow="md">
      <HoverCard.Target>
        <ActionIcon {...styles.actionIcon.sm} style={revealStyle}>
          <IconHelp {...styles.icon.sm} />
        </ActionIcon>
      </HoverCard.Target>
      <HoverCard.Dropdown>
        <Typography style={{ fontSize: "var(--mantine-font-size-sm)" }}>
          <ReactMarkdown>{markdownText}</ReactMarkdown>
        </Typography>
      </HoverCard.Dropdown>
    </HoverCard>
  );
}
