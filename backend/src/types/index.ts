export type MessageDirection = "incoming" | "outgoing";

export type NormalizedWebhookMessage = {
  waMessageId: string | null;
  businessPhone: string;
  counterpartyPhone: string;
  direction: MessageDirection;
  messageText: string | null;
  timestampMs: number;
};

export type RiskType = "no_response_within_threshold" | "no_response_observed";
