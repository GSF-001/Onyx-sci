/**
 * Clipboard utilities with graceful fallback for browsers/contexts
 * where the async Clipboard API is unavailable (e.g. non-HTTPS, older browsers).
 */

/**
 * Copies text to the clipboard.
 * Tries the modern Clipboard API first, falls back to a hidden textarea + execCommand.
 */
export async function copyToClipboard(text: string): Promise<boolean> {
  if (typeof window === "undefined") return false;

  // Modern API (requires secure context)
  if (navigator.clipboard && window.isSecureContext) {
    try {
      await navigator.clipboard.writeText(text);
      return true;
    } catch {
      // fall through to legacy method
    }
  }

  // Legacy fallback
  try {
    const textarea = document.createElement("textarea");
    textarea.value = text;
    textarea.style.position = "fixed";
    textarea.style.top = "-9999px";
    textarea.style.left = "-9999px";
    textarea.setAttribute("readonly", "");
    document.body.appendChild(textarea);

    const selection = document.getSelection();
    const originalRange =
      selection && selection.rangeCount > 0 ? selection.getRangeAt(0) : null;

    textarea.select();
    textarea.setSelectionRange(0, textarea.value.length);

    const success = document.execCommand("copy");

    document.body.removeChild(textarea);

    if (selection && originalRange) {
      selection.removeAllRanges();
      selection.addRange(originalRange);
    }

    return success;
  } catch {
    return false;
  }
}

/**
 * Reads text from the clipboard. Requires the async Clipboard API and
 * appropriate permissions; returns null if unavailable or denied.
 */
export async function readFromClipboard(): Promise<string | null> {
  if (typeof window === "undefined") return null;
  if (!navigator.clipboard || !window.isSecureContext) return null;

  try {
    return await navigator.clipboard.readText();
  } catch {
    return null;
  }
}

/**
 * Copies an image (as a Blob) to the clipboard using the Clipboard API.
 * Returns false if unsupported or the operation fails.
 */
export async function copyImageToClipboard(blob: Blob): Promise<boolean> {
  if (typeof window === "undefined") return false;
  if (!navigator.clipboard || !window.isSecureContext) return false;
  if (typeof ClipboardItem === "undefined") return false;

  try {
    await navigator.clipboard.write([
      new ClipboardItem({ [blob.type]: blob }),
    ]);
    return true;
  } catch {
    return false;
  }
}

/**
 * Returns whether clipboard write is supported in the current environment.
 */
export function isClipboardSupported(): boolean {
  if (typeof window === "undefined") return false;
  return Boolean(navigator.clipboard) && window.isSecureContext;
}
