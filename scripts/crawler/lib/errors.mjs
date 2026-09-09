// Ported from mcn-singapore's src/lib/errors.ts (same reasoning: Supabase's
// PostgrestError/StorageError shapes carry a `message` string but aren't
// `Error` instances, so `error instanceof Error` alone would silently
// swallow their actual message).

/** @param {unknown} error @returns {string} */
export function getErrorMessage(error) {
  if (error instanceof Error) return error.message;
  if (
    typeof error === "object" &&
    error !== null &&
    "message" in error &&
    typeof error.message === "string"
  ) {
    return error.message;
  }
  return "Unexpected error";
}
