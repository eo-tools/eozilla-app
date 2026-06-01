import { IconStackPop } from "@tabler/icons-react";

import { useActiveProcessId, useProcessList } from "@/store/hooks";
import { activateProcess } from "@/store/actions";
import type { ProcessList } from "@/service";
import { ResourceView } from "@/components/common/ResourceView";
import { ProcessListView } from "./ProcessListView";
import { Panel } from "@/components/common/Panel";
import styles from "@/components/common/styles";

export default function ProcessListPanel() {
  const processesState = useProcessList();
  const activeProcessId = useActiveProcessId();

  return (
    <Panel>
      <Panel.Header
        title="Processes"
        icon={<IconStackPop {...styles.panel.header.icon} />}
      />
      <Panel.Section grow scroll>
        <ResourceView {...processesState} nullText="No service selected.">
          {(processList: ProcessList) => (
            <ProcessListView
              processes={processList.processes}
              activeProcessId={activeProcessId}
              activateProcess={activateProcess}
            />
          )}
        </ResourceView>
      </Panel.Section>
    </Panel>
  );
}
