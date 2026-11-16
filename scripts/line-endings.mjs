/** Normalize Windows CRLF and legacy CR to LF for content comparison. */
export function normalizeLineEndings(text) {
  return text.replace(/\r\n?/g, "\n");
}
