/**
 * Browser file download utilities.
 */

/**
 * Triggers a browser download for the given Blob.
 */
export function downloadBlob(blob: Blob, filename: string): void {
  if (typeof window === "undefined") return;

  const url = URL.createObjectURL(blob);
  const anchor = document.createElement("a");
  anchor.href = url;
  anchor.download = filename;
  anchor.style.display = "none";

  document.body.appendChild(anchor);
  anchor.click();
  document.body.removeChild(anchor);

  // Revoke on next tick to ensure the download has started in all browsers.
  setTimeout(() => URL.revokeObjectURL(url), 0);
}

/**
 * Downloads plain text content as a file.
 */
export function downloadText(
  content: string,
  filename: string,
  mimeType = "text/plain;charset=utf-8"
): void {
  const blob = new Blob([content], { type: mimeType });
  downloadBlob(blob, filename);
}

/**
 * Downloads a JavaScript value as a pretty-printed JSON file.
 */
export function downloadJSON(
  data: unknown,
  filename: string,
  indent = 2
): void {
  const content = JSON.stringify(data, null, indent);
  downloadText(content, filename.endsWith(".json") ? filename : `${filename}.json`, "application/json;charset=utf-8");
}

/**
 * Downloads an array of objects (or rows) as a CSV file.
 */
export function downloadCSV(
  rows: Array<Record<string, unknown>>,
  filename: string,
  options: { delimiter?: string; includeHeader?: boolean } = {}
): void {
  const { delimiter = ",", includeHeader = true } = options;

  if (rows.length === 0) {
    downloadText("", filename.endsWith(".csv") ? filename : `${filename}.csv`, "text/csv;charset=utf-8");
    return;
  }

  const escapeCell = (value: unknown): string => {
    if (value === null || value === undefined) return "";
    const str = String(value);
    if (str.includes(delimiter) || str.includes('"') || str.includes("\n") || str.includes("\r")) {
      return `"${str.replace(/"/g, '""')}"`;
    }
    return str;
  };

  const headers = Object.keys(rows[0]);
  const lines: string[] = [];

  if (includeHeader) {
    lines.push(headers.map(escapeCell).join(delimiter));
  }

  for (const row of rows) {
    lines.push(headers.map((key) => escapeCell(row[key])).join(delimiter));
  }

  // BOM helps Excel correctly detect UTF-8 encoding.
  const content = "\uFEFF" + lines.join("\r\n");
  downloadText(content, filename.endsWith(".csv") ? filename : `${filename}.csv`, "text/csv;charset=utf-8");
}

/**
 * Fetches a remote URL and triggers a download of its contents.
 * Useful when you need the browser to save a same-origin or CORS-enabled
 * resource under a specific filename rather than navigating to it.
 */
export async function downloadFromUrl(url: string, filename: string): Promise<void> {
  const response = await fetch(url);
  if (!response.ok) {
    throw new Error(`Failed to fetch ${url}: ${response.status} ${response.statusText}`);
  }
  const blob = await response.blob();
  downloadBlob(blob, filename);
}

/**
 * Converts a base64 data string (with or without a data URL prefix) into a Blob.
 */
export function base64ToBlob(base64: string, mimeType = "application/octet-stream"): Blob {
  const cleaned = base64.includes(",") ? base64.split(",")[1] : base64;
  const byteChars = atob(cleaned);
  const byteNumbers = new Array(byteChars.length);
  for (let i = 0; i < byteChars.length; i++) {
    byteNumbers[i] = byteChars.charCodeAt(i);
  }
  const byteArray = new Uint8Array(byteNumbers);
  return new Blob([byteArray], { type: mimeType });
}

/**
 * Downloads a base64-encoded payload as a file.
 */
export function downloadBase64(base64: string, filename: string, mimeType = "application/octet-stream"): void {
  const blob = base64ToBlob(base64, mimeType);
  downloadBlob(blob, filename);
}
