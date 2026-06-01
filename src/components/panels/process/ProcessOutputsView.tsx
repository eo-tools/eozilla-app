import { Switch, Select, Stack, Table, Text } from "@mantine/core";

import type { Output, ProcessDescription, TransmissionMode } from "@/service";
import type { ProcessOutputs } from "@/state/types";
import styles from "@/components/common/styles";
import OutputLabel from "./OutputLabel";

interface ProcessOutputsViewProps {
  processDescription: ProcessDescription;
  processOutputs: ProcessOutputs;
  setProcessOutput: (name: string, output?: Output) => void;
}

function getDefaultTransmissionMode(
  transmissionModes: TransmissionMode[],
): TransmissionMode | undefined {
  return transmissionModes[0];
}

export default function ProcessOutputsView({
  processDescription,
  processOutputs,
  setProcessOutput,
}: ProcessOutputsViewProps) {
  const outputNames = Object.keys(processDescription.outputs || {});
  const transmissionModes = processDescription.outputTransmission || [];
  const hasTransmissionModeSelection = transmissionModes.length > 1;
  const defaultTransmissionMode = getDefaultTransmissionMode(transmissionModes);

  if (!outputNames.length) {
    return (
      <Text {...styles.text.unavailable} size="sm">
        No outputs defined.
      </Text>
    );
  }

  return (
    <Table variant="vertical" layout="fixed" withTableBorder>
      <Table.Tbody>
        {outputNames.map((outputName) => {
          const outputDescription = processDescription.outputs[outputName]!;
          const output = processOutputs[outputName];
          const isEnabled = Boolean(output);
          const requestedTransmissionMode =
            output?.transmissionMode || defaultTransmissionMode;

          return (
            <Table.Tr key={outputName}>
              <Table.Th w={200}>
                <OutputLabel
                  outputName={outputName}
                  outputDescription={outputDescription}
                />
              </Table.Th>
              <Table.Td>
                <Stack gap="xs">
                  <Switch
                    checked={isEnabled}
                    label="Request output"
                    onChange={(event) => {
                      if (!event.currentTarget.checked) {
                        setProcessOutput(outputName, undefined);
                        return;
                      }
                      setProcessOutput(
                        outputName,
                        defaultTransmissionMode
                          ? { transmissionMode: defaultTransmissionMode }
                          : {},
                      );
                    }}
                  />

                  {isEnabled ? (
                    hasTransmissionModeSelection ? (
                      <Select
                        label="Transmission mode"
                        data={transmissionModes.map((mode) => ({
                          value: mode,
                          label: mode,
                        }))}
                        value={requestedTransmissionMode || null}
                        onChange={(value) => {
                          if (!value) {
                            return;
                          }
                          setProcessOutput(outputName, {
                            ...(output || {}),
                            transmissionMode: value as TransmissionMode,
                          });
                        }}
                        allowDeselect={false}
                      />
                    ) : transmissionModes.length === 1 ? (
                      <Text {...styles.text.unavailable} size="xs">
                        {`Transmission mode: ${transmissionModes[0]}`}
                      </Text>
                    ) : (
                      <Text {...styles.text.unavailable} size="xs">
                        Transmission mode will be chosen by the server.
                      </Text>
                    )
                  ) : (
                    <Text {...styles.text.unavailable} size="xs">
                      Not requested.
                    </Text>
                  )}
                </Stack>
              </Table.Td>
            </Table.Tr>
          );
        })}
      </Table.Tbody>
    </Table>
  );
}
