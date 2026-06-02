import { useState } from "react";
import { ActionIcon } from "@mantine/core";
import { IconCopy, IconStackPush } from "@tabler/icons-react";

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

import JobInfoView from "./JobInfoView";
import JobResultsView from "./JobResultsView";
import { SubPanel } from "@/components/common/SubPanel";

export default function JobPanel() {
  const [resultsOpened, setResultsOpened] = useState(true);
  const [infoOpened, setInfoOpened] = useState(true);
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
        icon={<IconStackPush {...styles.panel.header.icon} />}
      />
      <Panel.Section grow scroll>
        <SubPanel
          title={"Results"}
          opened={resultsOpened}
          onChange={setResultsOpened}
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
          containerProps={containerProps}
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
        </SubPanel>

        <SubPanel
          title={"Info"}
          opened={infoOpened}
          onChange={setInfoOpened}
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
          containerProps={containerProps}
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
        </SubPanel>
      </Panel.Section>
    </Panel>
  );
}
