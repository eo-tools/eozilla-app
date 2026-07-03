import { IconStackPop } from "@tabler/icons-react";

import { useActiveProcessId, useProcessList } from "@/store/hooks";
import { activateProcess } from "@/store/actions";
import type { ProcessList } from "@/service";
import { ResourceView } from "@/components/common/ResourceView";
import { ProcessListView } from "./ProcessListView";
import { Panel } from "@/components/common/Panel";
import styles from "@/components/common/styles";
import { useHoverReveal } from "@/components/common/useHoverReveal";
import { ListActionGroup } from "@/components/common/ListActionGroup";
import {
  applyListActions,
  useListActionState,
} from "@/components/common/listActions";
import {
  defaultProcessSortDirection,
  defaultProcessSortId,
  processFilterCategories,
  processListActionsConfig,
  processSortCriteria,
} from "./processListActions";

export default function ProcessListPanel() {
  const processesState = useProcessList();
  const activeProcessId = useActiveProcessId();
  const { containerProps, revealStyle } = useHoverReveal(200, 0, 1);
  const listActions = useListActionState(
    defaultProcessSortId,
    defaultProcessSortDirection,
  );

  return (
    <Panel>
      <Panel.Header
        title="Processes"
        icon={<IconStackPop {...styles.panel.header.icon} />}
        containerProps={containerProps}
      >
        <ListActionGroup
          searchTerm={listActions.state.searchTerm}
          setSearchTerm={listActions.setSearchTerm}
          filterCategories={processFilterCategories}
          filterIds={listActions.state.filterIds}
          setFilterIds={listActions.setFilterIds}
          sortCriteria={processSortCriteria}
          sortId={listActions.state.sortId}
          setSortId={listActions.setSortId}
          sortDirection={listActions.state.sortDirection}
          setSortDirection={listActions.setSortDirection}
          defaultSortId={defaultProcessSortId}
          defaultSortDirection={defaultProcessSortDirection}
          style={revealStyle}
        />
      </Panel.Header>
      <Panel.Section grow scroll>
        <ResourceView {...processesState} nullText="No service selected.">
          {(processList: ProcessList) => (
            <ProcessListView
              processes={applyListActions(
                processList.processes,
                listActions.state,
                processListActionsConfig,
              )}
              activeProcessId={activeProcessId}
              activateProcess={activateProcess}
            />
          )}
        </ResourceView>
      </Panel.Section>
    </Panel>
  );
}
