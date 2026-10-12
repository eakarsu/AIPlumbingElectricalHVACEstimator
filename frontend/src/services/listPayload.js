// The list routes use arrays, named collections, and paginated { data } responses.
// Only an actual collection can be rendered as records.
export function listPayload(payload, key) {
  if (Array.isArray(payload)) return payload;
  if (key && Array.isArray(payload?.[key])) return payload[key];
  if (Array.isArray(payload?.data)) return payload.data;
  return [];
}
