import { getErrorMessage } from "@/utils/common";
import { getHttpStatus, getResponseBodyReason } from "@/utils/http";

const INVALID_CUIMAN_LAUNCH_STATUS = 410;

export async function exchangeCuimanLaunch(launchCode: string): Promise<void> {
  let response: Response;
  try {
    response = await fetch("./_cuiman/launch", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ launch: launchCode }),
    });
  } catch (error) {
    throw new Error(`Failed to validate app launch: ${getErrorMessage(error)}`);
  }

  if (response.ok) {
    return;
  }

  const reason = await getResponseBodyReason(response);
  if (response.status === INVALID_CUIMAN_LAUNCH_STATUS && reason) {
    // This status and message are the server's authoritative answer about a
    // one-shot code. Other failures must not be presented as an expiry.
    throw new Error(reason);
  }

  throw new Error(
    `Failed to validate app launch (${getHttpStatus(response)})${reason ? `: ${reason}` : ""}.`,
  );
}
