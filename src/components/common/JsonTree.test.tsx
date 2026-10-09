import { MantineProvider } from "@mantine/core";
import { renderToStaticMarkup } from "react-dom/server";
import { describe, expect, it } from "vitest";
import { JsonTree } from "./JsonTree";

function render(value: unknown) {
  return renderToStaticMarkup(
    <MantineProvider>
      <JsonTree value={value} />
    </MantineProvider>,
  );
}

describe("JsonTree", () => {
  it("shows the first level and previews nested content without another root", () => {
    const markup = render({
      inputs: { duration: 1, fail: false, hidden: 42 },
      outputs: ["result", "report", "other"],
    });
    expect(markup.match(/<summary>/g)).toHaveLength(2);
    expect(markup).toContain(
      "{&quot;duration&quot;: 1, &quot;fail&quot;: false, …}",
    );
    expect(markup).toContain("[&quot;result&quot;, &quot;report&quot;, …]");
    expect(markup).not.toContain("open=");
    expect(markup).not.toContain("&quot;hidden&quot;");
  });
  it.each(["object", "array"])(
    "previews only five entries of a large %s",
    (kind) => {
      const values = Array.from(
        { length: 1000 },
        (_, index) => `value-${index}`,
      );
      const value =
        kind === "array"
          ? values
          : Object.fromEntries(
              values.map((item, index) => [`field-${index}`, item]),
            );
      const markup = render(value);
      expect(markup).toContain("value-4");
      expect(markup).not.toContain("value-5");
      expect(markup).not.toContain("value-999");
      expect(markup).toContain(
        `Expand · 1,000 ${kind === "array" ? "items" : "properties"}`,
      );
      expect(markup).toContain('aria-expanded="false"');
    },
  );
  it("renders primitive values and empty containers without a tree", () => {
    for (const value of [null, false, 0, "<script>alert(1)</script>", {}, []]) {
      const markup = render(value);
      expect(markup).not.toContain("<summary>");
      expect(markup).not.toContain("<script>");
    }
  });
});
