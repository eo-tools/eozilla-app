import type { InputDescription } from "@/service";
import IdLabel from "./IdLabel";

export interface InputLabelProps {
  inputName: string;
  inputDescription: InputDescription;
}

export default function InputLabel({
  inputName,
  inputDescription,
}: InputLabelProps) {
  return (
    <IdLabel
      id={inputName}
      title={inputDescription.title}
      description={inputDescription.description}
    />
  );
}
