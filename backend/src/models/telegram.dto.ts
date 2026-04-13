import { z } from "zod";

const telegramUserSchema = z.object({
  id: z.number().int(),
  is_bot: z.boolean().optional(),
  username: z.string().optional(),
});

const telegramChatSchema = z.object({
  id: z.number().int(),
  type: z.string().optional(),
});

const telegramMessageSchema = z
  .object({
    message_id: z.number().int(),
    date: z.number().int().optional(),
    text: z.string().optional(),
    caption: z.string().optional(),
    from: telegramUserSchema.optional(),
    chat: telegramChatSchema,
  })
  .passthrough();

export const telegramUpdateSchema = z
  .object({
    update_id: z.number().int(),
    message: telegramMessageSchema.optional(),
    edited_message: telegramMessageSchema.optional(),
    channel_post: telegramMessageSchema.optional(),
    edited_channel_post: telegramMessageSchema.optional(),
  })
  .passthrough();

export type TelegramMessage = z.infer<typeof telegramMessageSchema>;
export type TelegramUpdate = z.infer<typeof telegramUpdateSchema>;
