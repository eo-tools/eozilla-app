import type { ReactNode, Ref } from "react";
import { Accordion } from "@mantine/core";

import { type SubPanelItemProps, SubPanelItem } from "./SubPanelItem";

export { type SubPanelItemProps, SubPanelItem };

export interface SubPanelProps {
  children?: ReactNode;
  values: string[];
  setValues: (values: string[]) => void;
  containerProps?: { ref: Ref<HTMLDivElement> | undefined };
}

export const SubPanel = ({
  children,
  values,
  setValues,
  containerProps,
}: SubPanelProps) => {
  return (
    <Accordion
      multiple
      chevronPosition="left"
      order={4}
      styles={{
        label: { padding: "4px 0 4px 0" },
        content: { padding: "4px 0 8px 0" },
        chevron: { margin: "0 8px 0 0" },
        item: { border: "none", margin: "0 0 8px 0" },
      }}
      value={values}
      onChange={(v) => void setValues(v)}
      {...containerProps}
    >
      {children}
    </Accordion>
  );
};

SubPanel.Item = SubPanelItem;
