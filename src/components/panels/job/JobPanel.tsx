import { useState } from "react";
import { ActionIcon, Group, Tabs, Tooltip } from "@mantine/core";
import { IconCopy, IconRun } from "@tabler/icons-react";

import {
  useActiveJobId,
  useActiveJobInfo,
  useActiveJobResults,
  useJobRequests,
} from "@/store/hooks";
import type { JobInfo, JobResults } from "@/service";
import styles from "@/components/common/styles";
import { ResourceView } from "@/components/common/ResourceView";
import {
  copyJsonToClipboard,
  copyTextToClipboard,
  openDialog,
} from "@/store/actions";
import { Panel } from "@/components/common/Panel";
import { JsonCode } from "@/components/common/JsonCode";
import { UnavailableHint } from "@/components/common/UnavailableHint";

import JobInfoView from "./JobInfoView";
import JobResultsView from "./JobResultsView";

export default function JobPanel() {
  const [activeTab, setActiveTab] = useState<string | null>("results");
  const activeJobId = useActiveJobId();
  const activeJobInfoState = useActiveJobInfo();
  const activeJobResultsState = useActiveJobResults();
  const jobRequests = useJobRequests();
  const storedRequest = activeJobId ? jobRequests[activeJobId] : undefined;
  const copyData =
    activeTab === "results"
      ? activeJobResultsState.jobResults
      : activeJobInfoState.jobInfo;
  const copyLabel =
    activeTab === "results" ? "Copy all results" : "Copy job info";
  return (
    <Panel>
      <Panel.Header
        title="Job"
        id={activeJobId}
        idStyle={"id3"}
        icon={<IconRun {...styles.panel.header.icon} />}
      />
      <Tabs
        value={activeTab}
        onChange={setActiveTab}
        keepMounted={false}
        style={{
          display: "flex",
          flexDirection: "column",
          flex: 1,
          minHeight: 0,
        }}
      >
        <Group gap="xs" wrap="nowrap">
          <Tabs.List style={{ flex: 1 }}>
            <Tabs.Tab value="results" px="xs">
              Results
              {activeJobResultsState.jobResults
                ? ` (${Object.keys(activeJobResultsState.jobResults).length})`
                : ""}
            </Tabs.Tab>
            <Tabs.Tab value="request" px="xs">
              Request
            </Tabs.Tab>
            <Tabs.Tab value="info" px="xs">
              Info
            </Tabs.Tab>
          </Tabs.List>
          {activeTab !== "request" && (
            <Tooltip label={copyLabel} withArrow>
              <ActionIcon
                {...styles.actionIcon.sm}
                aria-label={copyLabel}
                disabled={!copyData}
                onClick={() => copyJsonToClipboard(copyData)}
              >
                <IconCopy {...styles.icon.sm} />
              </ActionIcon>
            </Tooltip>
          )}
        </Group>
        <Panel.Section grow scroll>
          <Tabs.Panel value="results" pt="sm">
            <ResourceView
              {...activeJobResultsState}
              nullText="No successful job selected."
            >
              {(jobResults: JobResults) => (
                <JobResultsView
                  key={activeJobId}
                  jobResults={jobResults}
                  openDialog={openDialog}
                />
              )}
            </ResourceView>
          </Tabs.Panel>

          <Tabs.Panel value="request" pt="sm">
            {storedRequest ? (
              <JsonCode key={activeJobId} value={storedRequest.request} />
            ) : (
              <UnavailableHint
                message={
                  activeJobId
                    ? "No associated process request found. " +
                      "They are available only for your jobs and only in this browser."
                    : "No job selected."
                }
              />
            )}
          </Tabs.Panel>

          <Tabs.Panel value="info" pt="sm">
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
          </Tabs.Panel>
        </Panel.Section>
      </Tabs>
    </Panel>
  );
}
