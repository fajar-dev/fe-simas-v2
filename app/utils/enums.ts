// Central definition of fixed-value enums shared across the app.
// Define the allowed values ONCE here; derive both the value arrays
// (for select options / Zod schemas) and the union types from them.
// Mirrors the backend `src/core/enums.ts`.

/** Asset handover transaction type. */
export const HANDOVER_TRANSACTION_TYPES = ['assign', 'return'] as const
export type TransactionType = typeof HANDOVER_TRANSACTION_TYPES[number]

/** Asset handover approval status. */
export const HANDOVER_STATUSES = ['pending', 'approve', 'reject', 'cancel'] as const
export type HandoverStatus = typeof HANDOVER_STATUSES[number]
