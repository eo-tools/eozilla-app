import { IconStackPush } from "@tabler/icons-react";

import type { JobList } from "@/service";
import { useActiveJobId, useJobList } from "@/store/hooks";
import { activateJob, dismissJob } from "@/store/actions";
import styles from "@/components/common/styles";
import { ResourceView } from "@/components/common/ResourceView";
import { Panel } from "@/components/common/Panel";
import JobListView from "./JobListView";

export default function JobListPanel() {
  const jobsState = useJobList();
  const activeJobId = useActiveJobId();
  return (
    <Panel>
      <Panel.Header
        title="Jobs"
        icon={<IconStackPush {...styles.panel.header.icon} />}
      />
      <Panel.Section grow scroll>
        <ResourceView {...jobsState} nullText="No service selected.">
          {(jobList: JobList) => (
            <JobListView
              jobList={jobList}
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
