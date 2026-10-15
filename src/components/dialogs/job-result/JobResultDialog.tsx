import {
  Alert,
  Badge,
  Button,
  Box,
  Group,
  Image,
  Modal,
  Tabs,
  Stack,
  Text,
  ScrollArea,
} from "@mantine/core";
import { useEffect, useState } from "react";
import { notifications } from "@mantine/notifications";
import {
  IconCopy,
  IconDownload,
  IconFileDescription,
} from "@tabler/icons-react";
import ReactMarkdown from "react-markdown";

import { JsonCode } from "@/components/common/JsonCode";
import styles from "@/components/common/styles";
import { closeDialog, copyTextToClipboard } from "@/store/actions";
import { useAppState, useDialogOpened } from "@/store/hooks";
import { isObject, isString } from "@/utils/common";
import { isLink, isQualifiedValue, type JobResult } from "@/service";

import { JobResultDetails } from "@/components/panels/job/JobResultDetails";
import {
  createPreviewSource,
  getJobResultMimeType,
  getOutputUrlError,
  hasRenderedPreview,
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
  return isObject(data) && isString(data.outputName) && "jobResult" in data;
}

export function JobResultDialog() {
  const dialogOpened = useDialogOpened("job-result");
  const dialogData = useAppState((state) => state.dialogData);

  if (!isJobResultDialogData(dialogData)) {
    return null;
  }

  const { outputName, jobResult } = dialogData;

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
          {dialogOpened && <JobResultContent jobResult={jobResult} />}
        </Modal.Body>
      </Modal.Content>
    </Modal.Root>
  );
}

export function JobResultContent({ jobResult }: { jobResult: JobResult }) {
  const mimeType = getJobResultMimeType(jobResult);
  const rendered = hasRenderedPreview(jobResult);
  const linked = isLink(jobResult);
  const value = isQualifiedValue(jobResult) ? jobResult.value : jobResult;
  const error = linked ? getOutputUrlError(jobResult.href) : undefined;
  return (
    <Stack gap="sm">
      <Group justify="space-between">
        <Group>{mimeType && <Badge variant="light">{mimeType}</Badge>}</Group>
        <Group gap="xs">
          {linked && (
            <Button
              variant="subtle"
              size="xs"
              leftSection={<IconCopy size={14} />}
              onClick={() => copyTextToClipboard(jobResult.href)}
            >
              Copy URL
            </Button>
          )}
          {linked && (
            <Button
              component="a"
              href={error ? "#" : jobResult.href}
              download
              target="_blank"
              rel="noreferrer"
              variant="light"
              size="xs"
              leftSection={<IconDownload size={14} />}
              onClick={(event) => {
                if (error) {
                  event.preventDefault();
                  notifications.show({ message: error, color: "red" });
                }
              }}
            >
              Download output
            </Button>
          )}
        </Group>
      </Group>
      {rendered ? (
        <Tabs defaultValue="preview" keepMounted={false}>
          <Tabs.List>
            <Tabs.Tab value="preview">Preview</Tabs.Tab>
            <Tabs.Tab value="raw">Raw</Tabs.Tab>
          </Tabs.List>
          <Tabs.Panel value="preview" pt="sm">
            <ScrollArea.Autosize mah="50vh">
              <JobResultPreview jobResult={jobResult} mimeType={mimeType} />
            </ScrollArea.Autosize>
          </Tabs.Panel>
          <Tabs.Panel value="raw" pt="sm">
            <ScrollArea.Autosize mah="50vh">
              <JobResultDetails jobResult={jobResult} />
            </ScrollArea.Autosize>
          </Tabs.Panel>
        </Tabs>
      ) : (
        <ScrollArea.Autosize mah="60vh">
          {!linked ? (
            <JsonCode
              value={value}
              plainText={
                isString(value) && !!mimeType && !isJsonMimeType(mimeType)
              }
              mediaType={mimeType}
              encoding={
                isQualifiedValue(jobResult) ? jobResult.encoding : undefined
              }
              maxHeight="50vh"
              withExpandButton={false}
            />
          ) : !isTextMimeType(mimeType) ? (
            <Stack gap="sm">
              {error && (
                <Alert color="red" title="Cannot view output" role="alert">
                  {error}
                </Alert>
              )}
              <JobResultDetails jobResult={jobResult} />
            </Stack>
          ) : (
            <JobResultPreview jobResult={jobResult} mimeType={mimeType} />
          )}
        </ScrollArea.Autosize>
      )}
    </Stack>
  );
}

export function JobResultPreview({
  jobResult,
  mimeType,
}: {
  jobResult: JobResult;
  mimeType?: string;
}) {
  const [failed, setFailed] = useState(false);
  const source = isLink(jobResult)
    ? jobResult.href
    : isQualifiedValue(jobResult)
      ? createPreviewSource(mimeType, jobResult.value, jobResult.encoding)
      : undefined;
  const error =
    isLink(jobResult) || source !== undefined
      ? getOutputUrlError(source)
      : undefined;
  if (error || failed) {
    return (
      <Alert color="red" title="Cannot preview output" role="alert">
        {error ??
          "The output could not be loaded. The URL may be unavailable, or the browser may have blocked access."}
      </Alert>
    );
  }
  return renderPreview(jobResult, mimeType, () => setFailed(true));
}

function renderMediaPreview(
  source: string,
  mimeType: string | undefined,
  title: string,
  onError: () => void,
) {
  if (isImageMimeType(mimeType)) {
    return <Image src={source} alt={title} fit="contain" onError={onError} />;
  }

  if (isAudioMimeType(mimeType)) {
    return (
      <audio
        controls
        src={source}
        onError={onError}
        style={{ width: "100%" }}
      />
    );
  }

  if (isVideoMimeType(mimeType)) {
    return (
      <video
        controls
        onError={onError}
        src={source}
        style={{ width: "100%", maxHeight: 360 }}
      />
    );
  }

  return undefined;
}

function renderPreview(
  jobResult: JobResult,
  mimeType: string | undefined,
  onError: () => void,
) {
  if (isLink(jobResult)) {
    const source = jobResult.href;

    if (isJsonMimeType(mimeType)) {
      return <LinkedJsonPreview key={source} source={source} />;
    }

    const mediaPreview = renderMediaPreview(
      source,
      mimeType,
      jobResult.title || jobResult.href,
      onError,
    );
    if (mediaPreview) return mediaPreview;

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

    if (source) {
      const mediaPreview = renderMediaPreview(
        source,
        mimeType,
        jobResult.mediaType || "Job result",
        onError,
      );
      if (mediaPreview) return mediaPreview;
    }

    if (isIframeMimeType(mimeType) && source) {
      return (
        <iframe
          title={jobResult.mediaType || "Job result"}
          src={source}
          sandbox=""
          style={{ width: "100%", height: 420, border: "0" }}
        />
      );
    }

    if (mimeType === "text/html" && isString(jobResult.value)) {
      return (
        <iframe
          title={jobResult.mediaType || "Job result"}
          srcDoc={jobResult.value}
          sandbox=""
          style={{ width: "100%", height: 420, border: "0" }}
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
      return (
        <JsonCode
          value={jobResult.value}
          plainText
          mediaType={mimeType}
          encoding={jobResult.encoding}
          maxHeight="50vh"
          withExpandButton={false}
        />
      );
    }

    return renderJsonPreview(jobResult.value);
  }

  return renderJsonPreview(jobResult);
}

function renderJsonPreview(value: unknown) {
  return <JsonCode value={value} maxHeight="50vh" withExpandButton={false} />;
}

function LinkedJsonPreview({ source }: { source: string }) {
  const [result, setResult] = useState<
    { value: unknown } | { error: true } | undefined
  >();
  useEffect(() => {
    const controller = new AbortController();
    fetch(source, { credentials: "include", signal: controller.signal })
      .then((response) => {
        if (!response.ok) {
          throw new Error(`HTTP ${response.status}`);
        }
        return response.json();
      })
      .then((value: unknown) => {
        if (!controller.signal.aborted) setResult({ value });
      })
      .catch(() => {
        if (!controller.signal.aborted) setResult({ error: true });
      });
    return () => controller.abort();
  }, [source]);

  if (!result) return <Text role="status">Loading JSON…</Text>;
  if ("error" in result) {
    return (
      <Alert color="red" title="Cannot preview output" role="alert">
        The JSON output could not be loaded. The file may be unavailable,
        invalid, or blocked by the browser.
      </Alert>
    );
  }
  return renderJsonPreview(result.value);
}
