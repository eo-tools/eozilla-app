import { Table, Text, type TableProps } from "@mantine/core";

import { JsonCode } from "@/components/common/JsonCode";
import {
  isInlineValue,
  isLink,
  isQualifiedValue,
  type JobResult,
} from "@/service";

const dataTableProps: TableProps = {
  variant: "vertical",
  layout: "fixed",
  verticalSpacing: 2,
  withRowBorders: false,
  withColumnBorders: false,
  fw: 200,
  fz: "xs",
};

export interface JobResultDetailsProps {
  jobResult: JobResult;
}

export function JobResultDetails({ jobResult }: JobResultDetailsProps) {
  if (isLink(jobResult)) {
    return (
      <Table {...dataTableProps} withTableBorder withRowBorders>
        <Table.Tbody>
          <Table.Tr>
            <Table.Th w={80}>Href</Table.Th>
            <Table.Td>
              <a href={jobResult.href} title={jobResult.title}>
                {jobResult.href}
              </a>
            </Table.Td>
          </Table.Tr>

          {jobResult.title && (
            <Table.Tr>
              <Table.Th>Title</Table.Th>
              <Table.Td>{jobResult.title}</Table.Td>
            </Table.Tr>
          )}

          {jobResult.type && (
            <Table.Tr>
              <Table.Th>Type</Table.Th>
              <Table.Td>{jobResult.type}</Table.Td>
            </Table.Tr>
          )}

          {jobResult.hreflang && (
            <Table.Tr>
              <Table.Th>Language</Table.Th>
              <Table.Td>{jobResult.hreflang}</Table.Td>
            </Table.Tr>
          )}

          {jobResult.rel && (
            <Table.Tr>
              <Table.Th>Rel</Table.Th>
              <Table.Td>{jobResult.rel}</Table.Td>
            </Table.Tr>
          )}
        </Table.Tbody>
      </Table>
    );
  }

  if (isQualifiedValue(jobResult)) {
    return (
      <Table {...dataTableProps}>
        <Table.Tbody>
          <Table.Tr>
            <Table.Th w={80}>Value</Table.Th>
            <Table.Td>
              <JsonCode value={jobResult.value} maxHeight="8rem" />
            </Table.Td>
          </Table.Tr>

          <Table.Tr>
            <Table.Th>Media Type</Table.Th>
            <Table.Td>{jobResult.mediaType || "-"}</Table.Td>
          </Table.Tr>

          <Table.Tr>
            <Table.Th>Encoding</Table.Th>
            <Table.Td>{jobResult.encoding || "-"}</Table.Td>
          </Table.Tr>

          <Table.Tr>
            <Table.Th>Schema</Table.Th>
            <Table.Td>
              {jobResult.schema ? (
                <JsonCode value={jobResult.schema} maxHeight="8rem" />
              ) : (
                "-"
              )}
            </Table.Td>
          </Table.Tr>
        </Table.Tbody>
      </Table>
    );
  }

  if (isInlineValue(jobResult)) {
    return <JsonCode value={jobResult} />;
  }

  return (
    <Text fw={200} size={"sm"}>
      {`Unknown result of type '${typeof jobResult}'`}
    </Text>
  );
}
