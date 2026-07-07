import { useState } from "react";

export type ListSortDirection = "asc" | "desc";

export interface ListActionFilterCriterion<T> {
  id: string;
  label: string;
  matches: (item: T) => boolean;
}

export interface ListActionFilterCategory<T> {
  id: string;
  label: string;
  criteria: ListActionFilterCriterion<T>[];
}

export interface ListActionSortCriterion<T> {
  id: string;
  label: string;
  compare: (a: T, b: T) => number;
}

export interface ListActionState {
  searchTerm: string;
  filterIds: string[];
  sortId: string;
  sortDirection: ListSortDirection;
}

export interface ListActionsConfig<T> {
  search: (item: T, searchTerm: string) => boolean;
  filterCategories: ListActionFilterCategory<T>[];
  sortCriteria: ListActionSortCriterion<T>[];
}

export function createListActionState(
  sortId: string,
  sortDirection: ListSortDirection = "asc",
): ListActionState {
  return {
    searchTerm: "",
    filterIds: [],
    sortId,
    sortDirection,
  };
}

export function useListActionState(
  sortId: string,
  sortDirection: ListSortDirection = "asc",
) {
  const [state, setState] = useState<ListActionState>(() =>
    createListActionState(sortId, sortDirection),
  );

  return {
    state,
    setSearchTerm: (searchTerm: string) =>
      setState((current) => ({ ...current, searchTerm })),
    setFilterIds: (filterIds: string[]) =>
      setState((current) => ({ ...current, filterIds })),
    setSortId: (nextSortId: string) =>
      setState((current) => ({ ...current, sortId: nextSortId })),
    setSortDirection: (nextSortDirection: ListSortDirection) =>
      setState((current) => ({
        ...current,
        sortDirection: nextSortDirection,
      })),
  };
}

export function normalizeListActionText(value: unknown): string {
  return String(value ?? "")
    .trim()
    .toLocaleLowerCase();
}

export function includesListActionTerm(
  value: unknown,
  searchTerm: string,
): boolean {
  return normalizeListActionText(value).includes(searchTerm);
}

export function compareListActionText(a: unknown, b: unknown): number {
  return normalizeListActionText(a).localeCompare(normalizeListActionText(b));
}

export function compareListActionDate(a: unknown, b: unknown): number {
  return dateValue(a) - dateValue(b);
}

export function applyListActions<T>(
  items: T[],
  state: ListActionState,
  config: ListActionsConfig<T>,
): T[] {
  const searchTerm = normalizeListActionText(state.searchTerm);
  let result = searchTerm
    ? items.filter((item) => config.search(item, searchTerm))
    : items;

  const filterIdSet = new Set(state.filterIds);
  const activeFilterCategories = config.filterCategories
    .map((category) => ({
      ...category,
      criteria: category.criteria.filter((criterion) =>
        filterIdSet.has(criterion.id),
      ),
    }))
    .filter((category) => category.criteria.length > 0);

  if (activeFilterCategories.length > 0) {
    result = result.filter((item) =>
      activeFilterCategories.every((category) =>
        category.criteria.some((criterion) => criterion.matches(item)),
      ),
    );
  }

  const sortCriterion = config.sortCriteria.find(
    (criterion) => criterion.id === state.sortId,
  );
  if (!sortCriterion) {
    return result;
  }

  const direction = state.sortDirection === "asc" ? 1 : -1;
  return [...result].sort((a, b) => direction * sortCriterion.compare(a, b));
}

function dateValue(value: unknown): number {
  const time = Date.parse(String(value ?? ""));
  return Number.isNaN(time) ? Number.NEGATIVE_INFINITY : time;
}
