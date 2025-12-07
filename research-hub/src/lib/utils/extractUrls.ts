/**
 * Extracts all valid URLs from a text string
 * Supports http, https protocols
 * Returns array of unique URLs
 */
export function extractUrls(text: string): string[] {
  // Regex pattern for URLs (matches http/https)
  const urlPattern = /https?:\/\/(?:www\.)?[-a-zA-Z0-9@:%._\+~#=]{1,256}\.[a-zA-Z0-9()]{1,6}\b(?:[-a-zA-Z0-9()@:%_\+.~#?&\/=]*)/gi

  const matches = text.match(urlPattern)

  if (!matches) return []

  // Remove duplicates and return
  return [...new Set(matches)]
}

/**
 * Validates if a string contains at least one URL
 */
export function containsUrl(text: string): boolean {
  return extractUrls(text).length > 0
}

/**
 * Example usage:
 *
 * const text = "Check Stanford https://stanford.edu and MIT https://mit.edu for CS programs"
 * const urls = extractUrls(text)
 * // Returns: ["https://stanford.edu", "https://mit.edu"]
 */
