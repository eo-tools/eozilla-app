import { useId, useState, type CSSProperties } from "react";
import { Box, UnstyledButton } from "@mantine/core";

import classes from "./JsonTree.module.css";

interface JsonTreeProps {
  value: unknown;
  maxHeight?: CSSProperties["maxHeight"];
}

export function JsonTree({ value, maxHeight }: JsonTreeProps) {
  const [expanded, setExpanded] = useState(false);
  const contentId = useId();
  const entries =
    value !== null && typeof value === "object" ? Object.entries(value) : [];
  const large = entries.length > 5;
  const visibleEntries = large && !expanded ? entries.slice(0, 5) : entries;
  return (
    <Box className={classes.tree}>
      <Box
        id={contentId}
        className={classes.content}
        style={{ maxHeight: maxHeight ?? "16rem" }}
      >
        {entries.length ? (
          visibleEntries.map(([key, child]) => (
            <JsonNode key={key} name={key} value={child} />
          ))
        ) : (
          <JsonNode value={value} />
        )}
      </Box>
      {large && (
        <UnstyledButton
          className={classes.toggle}
          aria-expanded={expanded}
          aria-controls={contentId}
          onClick={() => setExpanded(!expanded)}
        >
          {expanded ? "Collapse" : "Expand"} ·{" "}
          {entries.length.toLocaleString("en-US")}{" "}
          {Array.isArray(value) ? "items" : "properties"}
        </UnstyledButton>
      )}
    </Box>
  );
}

function JsonNode({ value, name }: { value: unknown; name?: string }) {
  const [expanded, setExpanded] = useState(false);
  const label =
    name === undefined ? null : (
      <span className={classes.key}>{JSON.stringify(name)}: </span>
    );
  if (value !== null && typeof value === "object") {
    const count = Object.keys(value).length;
    const array = Array.isArray(value);
    if (!count)
      return (
        <div>
          {label}
          {array ? "[]" : "{}"}
        </div>
      );
    return (
      <details
        open={expanded}
        onToggle={(event) => setExpanded(event.currentTarget.open)}
      >
        <summary>
          {label}
          <span className={classes.count}>
            {expanded ? (array ? "[]" : "{}") : preview(value)}
          </span>
        </summary>
        {expanded && (
          <div className={classes.children}>
            {Object.entries(value).map(([key, child]) => (
              <JsonNode key={key} name={key} value={child} />
            ))}
          </div>
        )}
      </details>
    );
  }
  const type = value === null ? "null" : typeof value;
  return (
    <div>
      {label}
      <span className={classes[type]}>
        {JSON.stringify(value) ?? String(value)}
      </span>
    </div>
  );
}

function preview(value: unknown, nested = false): string {
  if (value === null || typeof value !== "object") {
    return (
      JSON.stringify(
        typeof value === "string" && value.length > 60
          ? `${value.slice(0, 60)}…`
          : value,
      ) ?? String(value)
    );
  }
  const array = Array.isArray(value);
  const entries = Object.entries(value);
  if (nested && entries.length) return array ? "[…]" : "{…}";
  const content = entries
    .slice(0, 2)
    .map(
      ([key, child]) =>
        `${array ? "" : `${JSON.stringify(key)}: `}${preview(child, true)}`,
    )
    .join(", ");
  return `${array ? "[" : "{"}${content}${entries.length > 2 ? ", …" : ""}${array ? "]" : "}"}`;
}
