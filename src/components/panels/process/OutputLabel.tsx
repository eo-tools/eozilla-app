import type { OutputDescription } from "@/service";
import IdLabel from "./IdLabel";

export interface OutputLabelProps {
  outputName: string;
  outputDescription: OutputDescription;
}

export default function OutputLabel({
  outputName,
  outputDescription,
}: OutputLabelProps) {
  return (
    <IdLabel
      id={outputName}
      title={outputDescription.title}
      description={outputDescription.description}
    />
  );
}
