import { IconStackPush } from "@tabler/icons-react";

import type { JobList } from "@/service";
import { useActiveJobId, useJobList } from "@/store/hooks";
import { activateJob, dismissJob } from "@/store/actions";
import styles from "@/components/common/styles";
import { ResourceView } from "@/components/common/ResourceView";
import { Panel } from "@/components/common/Panel";
import { useHoverReveal } from "@/components/common/useHoverReveal";
import { ListActionGroup } from "@/components/common/ListActionGroup";
import {
  applyListActions,
  useListActionState,
} from "@/components/common/listActions";
import {
  createJobFilterCategories,
  createJobListActionsConfig,
  defaultJobSortDirection,
  defaultJobSortId,
  jobSortCriteria,
} from "./jobListActions";
import JobListView from "./JobListView";

export default function JobListPanel() {
  const jobsState = useJobList();
  const activeJobId = useActiveJobId();
  const { containerProps, revealStyle } = useHoverReveal(200, 0, 1);
  const listActions = useListActionState(
    defaultJobSortId,
    defaultJobSortDirection,
  );
  const jobs = jobsState.jobList?.jobs ?? [];
  const filterCategories = createJobFilterCategories(
    jobs,
    listActions.state.filterIds,
  );
  const listActionsConfig = createJobListActionsConfig(
    jobs,
    listActions.state.filterIds,
  );

  return (
    <Panel>
      <Panel.Header
        title="Jobs"
        icon={<IconStackPush {...styles.panel.header.icon} />}
        containerProps={containerProps}
      >
        <ListActionGroup
          searchTerm={listActions.state.searchTerm}
          setSearchTerm={listActions.setSearchTerm}
          filterCategories={filterCategories}
          filterIds={listActions.state.filterIds}
          setFilterIds={listActions.setFilterIds}
          sortCriteria={jobSortCriteria}
          sortId={listActions.state.sortId}
          setSortId={listActions.setSortId}
          sortDirection={listActions.state.sortDirection}
          setSortDirection={listActions.setSortDirection}
          defaultSortId={defaultJobSortId}
          defaultSortDirection={defaultJobSortDirection}
          style={revealStyle}
        />
      </Panel.Header>
      <Panel.Section grow scroll>
        <ResourceView {...jobsState} nullText="No service selected.">
          {(jobList: JobList) => (
            <JobListView
              jobs={applyListActions(
                jobList.jobs,
                listActions.state,
                listActionsConfig,
              )}
              activeJobId={activeJobId}
              activateJob={activateJob}
              dismissJob={dismissJob}
            />
          )}
        </ResourceView>
      </Panel.Section>
    </Panel>
  );
}
