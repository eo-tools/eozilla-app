import type { CSSProperties } from "react";
import type {
  ActionIconProps,
  MantineSpacing,
  StyleProp,
  TextProps,
} from "@mantine/core";
import type { IconProps } from "@tabler/icons-react";

interface ShellStyles {
  readonly px: StyleProp<MantineSpacing>;
  readonly py: StyleProp<MantineSpacing>;
}

interface PanelHeaderStyles {
  readonly px: StyleProp<MantineSpacing>;
  readonly py: StyleProp<MantineSpacing>;
  readonly style: CSSProperties;
  readonly icon: IconProps;
}

interface PanelSectionStyles {
  readonly px: StyleProp<MantineSpacing>;
  readonly py: StyleProp<MantineSpacing>;
}

interface PanelStyles {
  readonly px: StyleProp<MantineSpacing>;
  readonly py: StyleProp<MantineSpacing>;
  readonly gap: StyleProp<MantineSpacing>;
  readonly header: PanelHeaderStyles;
  readonly section: PanelSectionStyles;
  readonly style: CSSProperties;
}

interface ListItemStyles {
  readonly px: StyleProp<MantineSpacing>;
  readonly py: StyleProp<MantineSpacing>;
}

interface ListStyles {
  readonly px: StyleProp<MantineSpacing>;
  readonly py: StyleProp<MantineSpacing>;
  readonly gap: StyleProp<MantineSpacing>;
  readonly item: ListItemStyles;
}

interface TextStyles {
  id1: TextProps;
  id2: TextProps;
  id3: TextProps;
  unavailable: TextProps;
  error: TextProps;
  title1: TextProps;
  title2: TextProps;
}

interface ActionIconStyles {
  readonly sm: ActionIconProps;
  readonly md: ActionIconProps;
  readonly lg: ActionIconProps;
}

interface IconStyles {
  readonly sm: IconProps;
  readonly md: IconProps;
  readonly lg: IconProps;
}

export interface Styles {
  readonly shell: ShellStyles;
  readonly panel: PanelStyles;
  readonly list: ListStyles;
  readonly text: TextStyles;
  readonly icon: IconStyles;
  readonly actionIcon: ActionIconStyles;
}

const actionIconStyle: ActionIconProps = {
  variant: "default",
};

const iconStyle: IconProps = {
  stroke: 1,
};

const idTextStyle: TextProps = {
  ff: "monospace",
};

const titleTextStyle: TextProps = {
  tt: "uppercase",
};

const styles: Styles = {
  shell: {
    px: 6,
    py: 6,
  },
  panel: {
    px: "xs",
    py: "xs",
    gap: "xs",
    style: {
      backgroundColor: "var(--panel-surface)",
      border: "1px solid var(--panel-border)",
      borderRadius: "var(--mantine-radius-md)",
      overflow: "hidden",
    },
    header: {
      px: 5,
      py: 5,
      style: {
        marginInline: "calc(var(--mantine-spacing-xs) * -1)",
        marginTop: "calc(var(--mantine-spacing-xs) * -1)",
        borderBottom: "1px solid var(--panel-divider)",
        backgroundColor: "var(--panel-header)",
      },
      icon: { ...iconStyle, size: 24 },
    },
    section: {
      px: 0,
      py: 0,
    },
  },
  list: {
    px: 2,
    py: 0,
    gap: 0,
    item: {
      px: 8,
      py: 6,
    },
  },
  text: {
    id1: { ...idTextStyle, c: "green" },
    id2: { ...idTextStyle, c: "blue" },
    id3: { ...idTextStyle, c: "yellow" },
    unavailable: { fs: "italic", c: "dimmed", size: "sm" },
    error: {},
    title1: { ...titleTextStyle, fw: 600, size: "md" },
    title2: { ...titleTextStyle, fw: 500, size: "sm" },
  },
  icon: {
    sm: { ...iconStyle, size: 16 },
    md: { ...iconStyle, size: 20 },
    lg: { ...iconStyle, size: 24 },
  },
  actionIcon: {
    sm: { ...actionIconStyle, size: "sm" },
    md: { ...actionIconStyle, size: "md" },
    lg: { ...actionIconStyle, size: "lg" },
  },
};

export default styles;
