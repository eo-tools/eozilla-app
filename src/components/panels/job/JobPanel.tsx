import { useState } from "react";
import { Accordion, ActionIcon, Flex, Text } from "@mantine/core";
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
        icon={<IconStackPush {...styles.panel.header.icon} />}
      />
      <Panel.Section grow scroll>
        <Accordion
          multiple
          chevronPosition="left"
          order={4}
          styles={{
            label: { paddingTop: 4, paddingBottom: 4 },
            content: { padding: "4px 0 8px 0" },
          }}
          value={accordionValues}
          onChange={setAccordionValues}
          {...containerProps}
        >
          <Accordion.Item value="results">
            <Accordion.Control>
              <Flex justify={"space-between"} align={"flex-start"}>
                <Text tt="capitalize">Results</Text>
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
              </Flex>
            </Accordion.Control>
            <Accordion.Panel keepMounted={false}>
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
            </Accordion.Panel>
          </Accordion.Item>
          <Accordion.Item value="info">
            <Accordion.Control>
              <Flex justify={"space-between"} align={"flex-start"}>
                <Text tt="capitalize">Info</Text>
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
              </Flex>
            </Accordion.Control>
            <Accordion.Panel keepMounted={false}>
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
            </Accordion.Panel>
          </Accordion.Item>
        </Accordion>
      </Panel.Section>
    </Panel>
  );
}
