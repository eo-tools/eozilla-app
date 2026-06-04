import useSWR from "swr";

const privacyUrl = `${import.meta.env.BASE_URL}privacy.md`;

export function usePrivacyMarkdown() {
  return useSWR(privacyUrl, async () => {
    const response = await fetch(privacyUrl);
    if (!response.ok) {
      throw new Error(`Failed to load privacy notice (${response.status})`);
    }
    return await response.text();
  });
}
