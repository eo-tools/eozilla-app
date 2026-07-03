import { useState, type CSSProperties } from "react";
import {
  ActionIcon,
  Button,
  Checkbox,
  Divider,
  Group,
  Popover,
  Radio,
  Stack,
  Text,
  TextInput,
} from "@mantine/core";
import {
  IconFilter,
  IconSearch,
  IconSortAscending,
  IconSortDescending,
  IconX,
} from "@tabler/icons-react";

import {
  normalizeListActionText,
  type ListActionFilterCategory,
  type ListActionSortCriterion,
  type ListSortDirection,
} from "@/components/common/listActions";
import styles from "@/components/common/styles";

interface ListActionGroupProps<T> {
  searchTerm: string;
  setSearchTerm: (searchTerm: string) => void;
  filterCategories: ListActionFilterCategory<T>[];
  filterIds: string[];
  setFilterIds: (filterIds: string[]) => void;
  sortCriteria: ListActionSortCriterion<T>[];
  sortId: string;
  setSortId: (sortId: string) => void;
  sortDirection: ListSortDirection;
  setSortDirection: (sortDirection: ListSortDirection) => void;
  defaultSortId: string;
  defaultSortDirection: ListSortDirection;
  style?: CSSProperties;
}

type OpenedAction = "search" | "filter" | "sort";

export function ListActionGroup<T>({
  searchTerm,
  setSearchTerm,
  filterCategories,
  filterIds,
  setFilterIds,
  sortCriteria,
  sortId,
  setSortId,
  sortDirection,
  setSortDirection,
  defaultSortId,
  defaultSortDirection,
  style,
}: ListActionGroupProps<T>) {
  const [openedAction, setOpenedAction] = useState<OpenedAction | null>(null);
  const searchOpened = openedAction === "search";
  const filterOpened = openedAction === "filter";
  const sortOpened = openedAction === "sort";
  const hasSearch = normalizeListActionText(searchTerm).length > 0;
  const hasFilters = filterIds.length > 0;
  const hasCustomSort =
    sortId !== defaultSortId || sortDirection !== defaultSortDirection;
  const visibleStyle = {
    ...style,
    opacity: openedAction ? 1 : style?.opacity,
  };

  const toggleFilter = (filterId: string) => {
    setFilterIds(
      filterIds.includes(filterId)
        ? filterIds.filter((id) => id !== filterId)
        : [...filterIds, filterId],
    );
  };

  const toggleSortDirection = () => {
    setSortDirection(sortDirection === "asc" ? "desc" : "asc");
  };

  return (
    <ActionIcon.Group style={visibleStyle}>
      <Popover
        opened={searchOpened}
        onChange={(opened) => setOpenedAction(opened ? "search" : null)}
        position="bottom-end"
        shadow="md"
        width={260}
        withArrow
      >
        <Popover.Target>
          <ActionIcon
            {...styles.actionIcon.sm}
            aria-label="Search"
            title="Search"
            variant={hasSearch ? "filled" : "default"}
            onClick={() => setOpenedAction(searchOpened ? null : "search")}
          >
            <IconSearch {...styles.icon.sm} />
          </ActionIcon>
        </Popover.Target>
        <Popover.Dropdown>
          <TextInput
            autoFocus
            aria-label="Search list"
            placeholder="Search"
            size="xs"
            value={searchTerm}
            onChange={(event) => setSearchTerm(event.currentTarget.value)}
            rightSection={
              hasSearch ? (
                <ActionIcon
                  {...styles.actionIcon.sm}
                  aria-label="Clear search"
                  title="Clear search"
                  variant="subtle"
                  onMouseDown={(event) => event.preventDefault()}
                  onClick={() => setSearchTerm("")}
                >
                  <IconX {...styles.icon.sm} />
                </ActionIcon>
              ) : null
            }
          />
        </Popover.Dropdown>
      </Popover>

      <Popover
        opened={filterOpened}
        onChange={(opened) => setOpenedAction(opened ? "filter" : null)}
        position="bottom-end"
        shadow="md"
        width={280}
        withArrow
      >
        <Popover.Target>
          <ActionIcon
            {...styles.actionIcon.sm}
            aria-label="Filter"
            title="Filter"
            variant={hasFilters ? "filled" : "default"}
            onClick={() => setOpenedAction(filterOpened ? null : "filter")}
          >
            <IconFilter {...styles.icon.sm} />
          </ActionIcon>
        </Popover.Target>
        <Popover.Dropdown>
          <Stack gap="xs">
            <Group justify="space-between" align="center">
              <Text size="xs" fw={600}>
                Filter
              </Text>
              <Button
                size="xs"
                variant="subtle"
                disabled={!hasFilters}
                onClick={() => setFilterIds([])}
              >
                Clear
              </Button>
            </Group>
            <Divider />
            <Stack gap="sm" style={{ maxHeight: 320, overflowY: "auto" }}>
              {filterCategories.length > 0 ? (
                filterCategories.map((category) => (
                  <Stack key={category.id} gap={4}>
                    <Text size="xs" fw={600} c="dimmed">
                      {category.label}
                    </Text>
                    {category.criteria.map((criterion) => (
                      <Checkbox
                        key={criterion.id}
                        size="xs"
                        label={criterion.label}
                        checked={filterIds.includes(criterion.id)}
                        onChange={() => toggleFilter(criterion.id)}
                      />
                    ))}
                  </Stack>
                ))
              ) : (
                <Text size="xs" c="dimmed">
                  No filter criteria
                </Text>
              )}
            </Stack>
          </Stack>
        </Popover.Dropdown>
      </Popover>

      <Popover
        opened={sortOpened}
        onChange={(opened) => setOpenedAction(opened ? "sort" : null)}
        position="bottom-end"
        shadow="md"
        width={240}
        withArrow
      >
        <Popover.Target>
          <ActionIcon
            {...styles.actionIcon.sm}
            aria-label="Sort"
            title="Sort"
            variant={hasCustomSort ? "filled" : "default"}
            onClick={() => setOpenedAction(sortOpened ? null : "sort")}
          >
            {sortDirection === "asc" ? (
              <IconSortAscending {...styles.icon.sm} />
            ) : (
              <IconSortDescending {...styles.icon.sm} />
            )}
          </ActionIcon>
        </Popover.Target>
        <Popover.Dropdown>
          <Stack gap="xs">
            <Group justify="space-between" align="center">
              <Text size="xs" fw={600}>
                Sort
              </Text>
              <ActionIcon
                {...styles.actionIcon.sm}
                aria-label={
                  sortDirection === "asc" ? "Sort ascending" : "Sort descending"
                }
                title={
                  sortDirection === "asc" ? "Sort ascending" : "Sort descending"
                }
                variant="default"
                onClick={toggleSortDirection}
              >
                {sortDirection === "asc" ? (
                  <IconSortAscending {...styles.icon.sm} />
                ) : (
                  <IconSortDescending {...styles.icon.sm} />
                )}
              </ActionIcon>
            </Group>
            <Divider />
            <Radio.Group value={sortId} onChange={setSortId}>
              <Stack gap={5}>
                {sortCriteria.map((criterion) => (
                  <Radio
                    key={criterion.id}
                    size="xs"
                    value={criterion.id}
                    label={criterion.label}
                  />
                ))}
              </Stack>
            </Radio.Group>
          </Stack>
        </Popover.Dropdown>
      </Popover>
    </ActionIcon.Group>
  );
}
