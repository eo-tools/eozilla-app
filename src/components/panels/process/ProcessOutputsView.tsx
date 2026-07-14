import { Switch, Select, Stack, Table, Text } from "@mantine/core";

import type {
  Output,
  ProcessDescription,
  TransmissionMode,
  ProcessOutputs,
} from "@/service";
import styles from "@/components/common/styles";
import OutputLabel from "./OutputLabel";
import { UnavailableHint } from "@/components/common/UnavailableHint";

export interface ProcessOutputsViewProps {
  processDescription: ProcessDescription;
  processOutputs: ProcessOutputs;
  setProcessOutput: (name: string, output?: Output) => void;
  formMode?: boolean;
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
  formMode = false,
}: ProcessOutputsViewProps) {
  const outputNames = Object.keys(processDescription.outputs || {});
  const transmissionModes = processDescription.outputTransmission || [];
  const hasTransmissionModeSelection = transmissionModes.length > 1;
  const defaultTransmissionMode = getDefaultTransmissionMode(transmissionModes);

  if (outputNames.length === 0) {
    return <UnavailableHint message="No outputs available." />;
  }

  const renderOutputControls = (outputName: string) => {
    const output = processOutputs[outputName];
    const isRequested = Boolean(output);
    const requestedTransmissionMode =
      output?.transmissionMode || defaultTransmissionMode;

    return (
      <Stack gap="xs">
        <Switch
          checked={isRequested}
          label="Requested"
          onChange={(event) => {
            const outputWanted = event.currentTarget.checked;
            setProcessOutput(
              outputName,
              outputWanted
                ? defaultTransmissionMode
                  ? { transmissionMode: defaultTransmissionMode }
                  : {}
                : undefined,
            );
          }}
        />

        {isRequested ? (
          hasTransmissionModeSelection ? (
            <Select
              label="Transmission mode"
              data={transmissionModes.map((mode) => ({
                value: mode,
                label: mode,
              }))}
              value={requestedTransmissionMode || null}
              onChange={(value) => {
                if (value) {
                  setProcessOutput(outputName, {
                    ...(output || {}),
                    transmissionMode: value as TransmissionMode,
                  });
                }
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
    );
  };

  if (formMode) {
    return (
      <Stack gap="md">
        {outputNames.map((outputName) => {
          const outputDescription = processDescription.outputs[outputName]!;
          return (
            <Stack key={outputName} gap="xs">
              <OutputLabel
                outputName={outputName}
                outputDescription={outputDescription}
                formMode
              />
              {renderOutputControls(outputName)}
            </Stack>
          );
        })}
      </Stack>
    );
  }

  return (
    <Table variant="vertical" layout="fixed" withTableBorder>
      <Table.Tbody>
        {outputNames.map((outputName) => {
          const outputDescription = processDescription.outputs[outputName]!;

          return (
            <Table.Tr key={outputName}>
              <Table.Th w={200}>
                <OutputLabel
                  outputName={outputName}
                  outputDescription={outputDescription}
                />
              </Table.Th>
              <Table.Td>{renderOutputControls(outputName)}</Table.Td>
            </Table.Tr>
          );
        })}
      </Table.Tbody>
    </Table>
  );
}
