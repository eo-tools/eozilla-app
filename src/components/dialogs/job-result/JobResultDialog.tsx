import {
  Badge,
  Box,
  Code,
  Group,
  Image,
  Modal,
  Tabs,
  Stack,
  Text,
  ScrollArea,
} from "@mantine/core";
import { IconFileDescription } from "@tabler/icons-react";
import ReactMarkdown from "react-markdown";

import styles from "@/components/common/styles";
import { closeDialog } from "@/store/actions";
import { useAppState, useDialogOpened } from "@/store/hooks";
import { isObject, isString } from "@/utils/common";
import { isLink, isQualifiedValue, type JobResult } from "@/service";

import { JobResultDetails } from "@/components/panels/job/JobResultDetails";
import {
  createPreviewSource,
  getJobResultMimeType,
  isAudioMimeType,
  isIframeMimeType,
  isImageMimeType,
  isJsonMimeType,
  isMarkdownMimeType,
  isTextMimeType,
  isVideoMimeType,
} from "@/components/panels/job/jobResultUtils";

interface JobResultDialogData {
  outputName: string;
  jobResult: JobResult;
}

function isJobResultDialogData(data: unknown): data is JobResultDialogData {
  return (
    isObject(data) &&
    "outputName" in data &&
    isString(data.outputName) &&
    "jobResult" in data
  );
}

export function JobResultDialog() {
  const dialogOpened = useDialogOpened("job-result");
  const dialogData = useAppState((state) => state.dialogData);

  if (!isJobResultDialogData(dialogData)) {
    return null;
  }

  const { outputName, jobResult } = dialogData;
  const mimeType = getJobResultMimeType(jobResult);

  return (
    <Modal.Root opened={dialogOpened} onClose={closeDialog} size="lg" centered>
      <Modal.Overlay />
      <Modal.Content>
        <Modal.Header>
          <Modal.Title>
            <Group gap="xs">
              <IconFileDescription size={20} stroke={1} />
              <Text fw={600}>Result</Text>
              <Text component="span" {...styles.text.id2}>
                {outputName}
              </Text>
            </Group>
          </Modal.Title>
          <Modal.CloseButton />
        </Modal.Header>
        <Modal.Body>
          <Tabs defaultValue="preview" keepMounted={false}>
            <Tabs.List>
              <Tabs.Tab value="preview">Preview</Tabs.Tab>
              <Tabs.Tab value="raw">Raw</Tabs.Tab>
            </Tabs.List>

            <Tabs.Panel value="preview">
              <Stack gap="sm" py="sm">
                <Group justify="space-between" align="flex-start">
                  <Text size="sm" fw={600}>
                    MIME Preview
                  </Text>
                  {mimeType && <Badge variant="light">{mimeType}</Badge>}
                  {!mimeType && (
                    <Text {...styles.text.unavailable} size="xs">
                      {"No MIME type available"}
                    </Text>
                  )}
                </Group>
                <ScrollArea h={"50vh"}>
                  {renderPreview(jobResult, mimeType)}
                </ScrollArea>
              </Stack>
            </Tabs.Panel>

            <Tabs.Panel value="raw">
              <Stack gap="sm" py="sm">
                <Text size="sm" fw={600}>
                  Raw Value
                </Text>
                <ScrollArea h={"50vh"}>
                  <JobResultDetails jobResult={jobResult} />
                </ScrollArea>
              </Stack>
            </Tabs.Panel>
          </Tabs>
        </Modal.Body>
      </Modal.Content>
    </Modal.Root>
  );
}

function renderPreview(jobResult: JobResult, mimeType?: string) {
  if (isLink(jobResult)) {
    const source = jobResult.href;

    if (isImageMimeType(mimeType)) {
      return (
        <Image
          src={source}
          alt={jobResult.title || jobResult.href}
          fit="contain"
        />
      );
    }

    if (isAudioMimeType(mimeType)) {
      return <audio controls src={source} style={{ width: "100%" }} />;
    }

    if (isVideoMimeType(mimeType)) {
      return (
        <video
          controls
          src={source}
          style={{ width: "100%", maxHeight: 360 }}
        />
      );
    }

    if (isTextMimeType(mimeType) || isIframeMimeType(mimeType)) {
      return (
        <Box h={420}>
          <iframe
            title={jobResult.title || jobResult.href}
            src={source}
            sandbox=""
            style={{ width: "100%", height: "100%", border: "0" }}
          />
        </Box>
      );
    }

    return (
      <Text {...styles.text.unavailable} size="md">
        No dedicated preview is available for this linked result.
      </Text>
    );
  }

  if (isQualifiedValue(jobResult)) {
    const source = createPreviewSource(
      mimeType,
      jobResult.value,
      jobResult.encoding,
    );

    if (isImageMimeType(mimeType) && source) {
      return (
        <Image
          src={source}
          alt={jobResult.mediaType || "Job result"}
          fit="contain"
        />
      );
    }

    if (isAudioMimeType(mimeType) && source) {
      return <audio controls src={source} style={{ width: "100%" }} />;
    }

    if (isVideoMimeType(mimeType) && source) {
      return (
        <video
          controls
          src={source}
          style={{ width: "100%", maxHeight: 360 }}
        />
      );
    }

    if (mimeType === "text/html" && source) {
      return (
        <iframe
          title={jobResult.mediaType || "Job result"}
          src={source}
          sandbox=""
          style={{ width: "100%", height: "100%", border: "0" }}
        />
      );
    }

    if (mimeType === "text/html" && isString(jobResult.value)) {
      return (
        <iframe
          title={jobResult.mediaType || "Job result"}
          srcDoc={jobResult.value}
          sandbox=""
          style={{ width: "100%", height: "100%", border: "0" }}
        />
      );
    }

    if (isMarkdownMimeType(mimeType) && isString(jobResult.value)) {
      return <ReactMarkdown>{jobResult.value}</ReactMarkdown>;
    }

    if (isJsonMimeType(mimeType)) {
      return renderJsonPreview(jobResult.value);
    }

    if (isTextMimeType(mimeType) && isString(jobResult.value)) {
      return renderTextCodeBlock(jobResult.value);
    }

    return renderJsonPreview(jobResult.value);
  }

  return renderJsonPreview(jobResult);
}

function renderJsonPreview(value: unknown) {
  return <Code block>{formatPrettyJson(value)}</Code>;
}

function renderTextCodeBlock(text: string) {
  return <Code block>{text}</Code>;
}

function formatPrettyJson(value: unknown) {
  if (isString(value)) {
    try {
      const parsed = JSON.parse(value) as unknown;
      return JSON.stringify(parsed, null, 2);
    } catch {
      return value;
    }
  }

  return JSON.stringify(value, null, 2);
}
