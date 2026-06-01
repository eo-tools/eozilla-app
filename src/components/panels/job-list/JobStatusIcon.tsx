import type { JobStatus } from "@/service";
import { IconCancel, IconCheck, IconClock, IconX } from "@tabler/icons-react";
import { Loader, ThemeIcon } from "@mantine/core";

const iconStyle = { size: 16, stroke: 1 };
const themeIconStyle = { size: 20, radius: "xl" };
const loaderStyle = { size: 20 };

export interface JobStatusIconProps {
  status: JobStatus;
}

export function JobStatusIcon({ status }: JobStatusIconProps) {
  if (status === "accepted") {
    return (
      <ThemeIcon {...themeIconStyle} color="violet">
        <IconClock {...iconStyle} />
      </ThemeIcon>
    );
  } else if (status === "running") {
    return <Loader {...loaderStyle} color="violet" />;
  } else if (status === "successful") {
    return (
      <ThemeIcon {...themeIconStyle} color="teal">
        <IconCheck {...iconStyle} />
      </ThemeIcon>
    );
  } else if (status === "dismissed") {
    return (
      <ThemeIcon {...themeIconStyle} color="orange">
        <IconCancel {...iconStyle} />
      </ThemeIcon>
    );
  } else if (status === "failed") {
    return (
      <ThemeIcon {...themeIconStyle} color="red">
        <IconX {...iconStyle} />
      </ThemeIcon>
    );
  }
  return null;
}
