import { useState } from "react";
import { ActionIcon } from "@mantine/core";
import { IconCopy, IconRun } from "@tabler/icons-react";

import {
  useActiveJobId,
  useActiveJobInfo,
  useActiveJobResults,
} from "@/store/hooks";
import type { JobInfo, JobResults } from "@/service";
import styles from "@/components/common/styles";
import { ResourceView } from "@/components/common/ResourceView";
import {
  copyJsonToClipboard,
  copyTextToClipboard,
  openDialog,
} from "@/store/actions";
import { useHoverReveal } from "@/components/common/useHoverReveal";
import { Panel } from "@/components/common/Panel";
import { SubPanel } from "@/components/common/SubPanel";

import JobInfoView from "./JobInfoView";
import JobResultsView from "./JobResultsView";

export default function JobPanel() {
  const [accordionValues, setAccordionValues] = useState(["results", "info"]);
  const activeJobId = useActiveJobId();
  const activeJobInfoState = useActiveJobInfo();
  const activeJobResultsState = useActiveJobResults();
  const { containerProps, revealStyle } = useHoverReveal();
  return (
    <Panel>
      <Panel.Header
        title="Job"
        id={activeJobId}
        idStyle={"id3"}
        icon={<IconRun {...styles.panel.header.icon} />}
      />
      <Panel.Section grow scroll>
        <SubPanel
          values={accordionValues}
          setValues={setAccordionValues}
          containerProps={containerProps}
        >
          <SubPanel.Item
            value="results"
            title="Results"
            actions={
              <ActionIcon
                {...styles.actionIcon.sm}
                style={revealStyle}
                disabled={!activeJobResultsState.jobResults}
                onClick={() => {
                  copyJsonToClipboard(activeJobResultsState.jobResults);
                }}
              >
                <IconCopy {...styles.icon.sm} />
              </ActionIcon>
            }
          >
            <ResourceView
              {...activeJobResultsState}
              nullText="No successful job selected."
            >
              {(jobResults: JobResults) => (
                <JobResultsView
                  jobResults={jobResults}
                  copyJsonToClipboard={copyJsonToClipboard}
                  openDialog={openDialog}
                />
              )}
            </ResourceView>
          </SubPanel.Item>

          <SubPanel.Item
            value="info"
            title="Info"
            actions={
              <ActionIcon
                {...styles.actionIcon.sm}
                style={revealStyle}
                disabled={!activeJobInfoState.jobInfo}
                onClick={() => {
                  copyJsonToClipboard(activeJobInfoState.jobInfo);
                }}
              >
                <IconCopy {...styles.icon.sm} />
              </ActionIcon>
            }
          >
            <ResourceView {...activeJobInfoState} nullText="No job selected.">
              {(jobInfo: JobInfo) => (
                <JobInfoView
                  jobInfo={jobInfo}
                  copyTraceback={copyTextToClipboard}
                  viewTraceback={(traceback) =>
                    void openDialog("traceback", traceback)
                  }
                />
              )}
            </ResourceView>
          </SubPanel.Item>
        </SubPanel>
      </Panel.Section>
    </Panel>
  );
}
