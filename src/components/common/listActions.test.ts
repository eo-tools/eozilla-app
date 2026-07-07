import { describe, expect, it } from "vitest";

import {
  applyListActions,
  compareListActionDate,
  compareListActionText,
  createListActionState,
  includesListActionTerm,
  normalizeListActionText,
  type ListActionsConfig,
} from "@/components/common/listActions";

interface Item {
  id: string;
  title: string;
  color: "blue" | "green" | "red";
  shape: "circle" | "square";
}

const items: Item[] = [
  { id: "b", title: "Beta", color: "green", shape: "circle" },
  { id: "a", title: "Alpha", color: "blue", shape: "circle" },
  { id: "c", title: "Gamma", color: "red", shape: "square" },
];

const config: ListActionsConfig<Item> = {
  search: (item, searchTerm) =>
    [item.id, item.title].some((value) =>
      includesListActionTerm(value, searchTerm),
    ),
  filterCategories: [
    {
      id: "color",
      label: "Color",
      criteria: [
        {
          id: "color-blue",
          label: "Blue",
          matches: (item) => item.color === "blue",
        },
        {
          id: "color-green",
          label: "Green",
          matches: (item) => item.color === "green",
        },
      ],
    },
    {
      id: "shape",
      label: "Shape",
      criteria: [
        {
          id: "shape-circle",
          label: "Circle",
          matches: (item) => item.shape === "circle",
        },
      ],
    },
  ],
  sortCriteria: [
    {
      id: "title",
      label: "Title",
      compare: (a, b) => compareListActionText(a.title, b.title),
    },
  ],
};

describe("list action helpers", () => {
  it("creates default state", () => {
    expect(createListActionState("title", "desc")).toEqual({
      searchTerm: "",
      filterIds: [],
      sortId: "title",
      sortDirection: "desc",
    });
  });

  it("normalizes text for matching and comparison", () => {
    expect(normalizeListActionText("  AlPHA  ")).toBe("alpha");
    expect(includesListActionTerm("Alpha Beta", "alpha")).toBe(true);
    expect(compareListActionText("Beta", "alpha")).toBeGreaterThan(0);
  });

  it("compares invalid dates before valid dates", () => {
    expect(
      compareListActionDate(undefined, "2026-01-01T00:00:00Z"),
    ).toBeLessThan(0);
    expect(
      compareListActionDate("2026-01-02T00:00:00Z", "2026-01-01T00:00:00Z"),
    ).toBeGreaterThan(0);
  });

  it("applies search filters and sort without mutating the source list", () => {
    const result = applyListActions(
      items,
      {
        searchTerm: "a",
        filterIds: ["color-blue", "color-green", "shape-circle"],
        sortId: "title",
        sortDirection: "desc",
      },
      config,
    );

    expect(result.map((item) => item.id)).toEqual(["b", "a"]);
    expect(items.map((item) => item.id)).toEqual(["b", "a", "c"]);
  });
});
