import { IconStackPush } from "@tabler/icons-react";

import { notifications } from "@mantine/notifications";
import type { JobInfo, JobList } from "@/service";
import {
  useActiveJobId,
  useJobList,
  useJobRequests,
  useSetProcessRequest,
} from "@/store/hooks";
import { activateJob, activateProcess, dismissJob } from "@/store/actions";
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
import { cloneProcessRequest } from "@/state/jobRequests";

export default function JobListPanel() {
  const jobsState = useJobList();
  const activeJobId = useActiveJobId();
  const jobRequests = useJobRequests();
  const setProcessRequest = useSetProcessRequest();
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
  const handleUseRequest = (jobInfo: JobInfo) => {
    const storedRequest = jobRequests[jobInfo.jobID];
    if (!storedRequest) {
      return;
    }
    activateProcess(storedRequest.processId);
    setProcessRequest(
      storedRequest.processId,
      cloneProcessRequest(storedRequest.request),
    );
    notifications.show({
      message: "The job request was copied to the process editor.",
    });
  };

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
              jobRequests={jobRequests}
              onUseRequest={handleUseRequest}
            />
          )}
        </ResourceView>
      </Panel.Section>
    </Panel>
  );
}
