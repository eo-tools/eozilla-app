import type { ReactNode } from "react";
import { useComputedColorScheme } from "@mantine/core";
import {
  CodeHighlightAdapterProvider,
  type CodeHighlightAdapter,
} from "@mantine/code-highlight";
import hljs from "highlight.js/lib/common";
import lightTheme from "highlight.js/styles/github.css?url";
import darkTheme from "highlight.js/styles/github-dark.css?url";

const adapter: CodeHighlightAdapter = {
  getHighlighter:
    () =>
    ({ code, language }) =>
      language === "plaintext"
        ? { highlightedCode: code, isHighlighted: false }
        : {
            highlightedCode: (language && hljs.getLanguage(language)
              ? hljs.highlight(code, { language })
              : hljs.highlightAuto(code)
            ).value,
            isHighlighted: true,
            codeElementProps: { className: "hljs" },
          },
};

export function CodeHighlightProvider({ children }: { children: ReactNode }) {
  const scheme = useComputedColorScheme("light");
  return (
    <CodeHighlightAdapterProvider adapter={adapter}>
      <link
        rel="stylesheet"
        href={scheme === "dark" ? darkTheme : lightTheme}
      />
      {children}
    </CodeHighlightAdapterProvider>
  );
}
