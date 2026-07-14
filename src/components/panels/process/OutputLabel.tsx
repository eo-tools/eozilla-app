import { Flex, Input } from "@mantine/core";

import HoverHelpIcon from "@/components/common/HoverHelpIcon";
import { useHoverReveal } from "@/components/common/useHoverReveal";
import type { OutputDescription } from "@/service";
import IdLabel from "./IdLabel";

export interface OutputLabelProps {
  outputName: string;
  outputDescription: OutputDescription;
  formMode?: boolean;
}

export default function OutputLabel({
  outputName,
  outputDescription,
  formMode = false,
}: OutputLabelProps) {
  const { containerProps, revealStyle } = useHoverReveal();

  if (formMode) {
    return (
      <Flex justify="space-between" align="center" {...containerProps}>
        <Input.Label>{outputDescription.title || outputName}</Input.Label>
        <HoverHelpIcon
          markdownText={outputDescription.description}
          revealStyle={revealStyle}
        />
      </Flex>
    );
  }

  return (
    <IdLabel
      id={outputName}
      title={outputDescription.title}
      description={outputDescription.description}
    />
  );
}
