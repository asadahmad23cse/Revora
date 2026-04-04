import { z } from "zod";

/** Internal simulation contract for local / QA without 360dialog */
export const simulateWebhookSchema = z.object({
  simulate: z.literal(true),
  business_phone: z.string().min(5),
  customer_phone: z.string().min(5),
  direction: z.enum(["incoming", "outgoing"]),
  text: z.string().nullable().optional(),
  wa_message_id: z.string().nullable().optional(),
  timestamp: z.union([z.string(), z.number()]).optional(),
});

export type SimulateWebhook = z.infer<typeof simulateWebhookSchema>;

const textBody = z.object({
  body: z.string().optional(),
});

const interactiveBody = z
  .object({
    type: z.string().optional(),
    button_reply: z
      .object({
        id: z.string().optional(),
        title: z.string().optional(),
      })
      .optional(),
    list_reply: z
      .object({
        id: z.string().optional(),
        title: z.string().optional(),
      })
      .optional(),
  })
  .optional();

export const waMessageSchema = z
  .object({
    id: z.string().optional(),
    from: z.string().optional(),
    to: z.string().optional(),
    timestamp: z.union([z.string(), z.number()]).optional(),
    type: z.string().optional(),
    text: textBody.optional(),
    interactive: interactiveBody,
    image: z.object({ caption: z.string().optional() }).optional(),
    document: z.object({ caption: z.string().optional(), filename: z.string().optional() }).optional(),
    audio: z.object({ id: z.string().optional() }).optional(),
    voice: z.object({ id: z.string().optional() }).optional(),
    errors: z.array(z.unknown()).optional(),
  })
  .passthrough();

export const waValueSchema = z.object({
  messaging_product: z.string().optional(),
  messages: z.array(waMessageSchema).optional(),
  metadata: z
    .object({
      display_phone_number: z.string().optional(),
      phone_number_id: z.string().optional(),
    })
    .optional(),
  contacts: z
    .array(
      z.object({
        profile: z.object({ name: z.string().optional() }).optional(),
        wa_id: z.string().optional(),
      }),
    )
    .optional(),
});

const changeSchema = z.object({
  value: waValueSchema,
});

export const cloudInboundSchema = z.object({
  object: z.string().optional(),
  entry: z.array(z.object({ id: z.string().optional(), changes: z.array(changeSchema) })).optional(),
});

export type CloudInboundPayload = z.infer<typeof cloudInboundSchema>;
