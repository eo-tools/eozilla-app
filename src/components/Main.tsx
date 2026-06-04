import {
  Group as RGroup,
  Panel as RPanel,
  Separator as RSeparator,
} from "react-resizable-panels";

import ProcessesPanel from "@/components/panels/process-list/ProcessListPanel";
import ProcessPanel from "@/components/panels/process/ProcessPanel";
import JobListPanel from "@/components/panels/job-list/JobListPanel";
import { ServiceDialog } from "@/components/dialogs/service/ServiceDialog";
import { TracebackDialog } from "@/components/dialogs/traceback/TracebackDialog";
import { JobResultDialog } from "@/components/dialogs/job-result/JobResultDialog";
import JobPanel from "@/components/panels/job/JobPanel";
import PrivacyDialog from "@/components/dialogs/privacy/PrivacyDialog";

export default function Main() {
  return (
    <RGroup
      orientation="horizontal"
      style={{ width: "100%", height: "100%" }}
      className="horizontal-group"
    >
      <ServiceDialog />
      <TracebackDialog />
      <JobResultDialog />
      <PrivacyDialog />

      <RPanel id="process-list" defaultSize="25%" minSize="10%" collapsible>
        <ProcessesPanel />
      </RPanel>
      <RSeparator />
      <RPanel id="process" minSize="10%" collapsible>
        <ProcessPanel />
      </RPanel>
      <RSeparator />
      <RPanel id="jobs" dir="" defaultSize="25%" minSize="10%" collapsible>
        <RGroup
          orientation="vertical"
          style={{ width: "100%", height: "100%" }}
          className="vertical-group"
        >
          <RPanel id="job-list" defaultSize="30%" minSize="10%" collapsible>
            <JobListPanel />
          </RPanel>
          <RSeparator />
          <RPanel id="job" minSize="10%" collapsible>
            <JobPanel />
          </RPanel>
        </RGroup>
      </RPanel>
    </RGroup>
  );
}
