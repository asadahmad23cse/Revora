import { Router, type Request, type Response } from "express";
import Groq from "groq-sdk";
import { z } from "zod";
import { config } from "../config";
import { logger } from "../utils/logger";
import { requireAuth } from "../middlewares/requireAuth";

const aiRouter = Router();
aiRouter.use(requireAuth);

const generateBody = z.object({
  name: z.string().min(1),
  business_type: z.string().min(1),
  status: z.string().min(1),
});

/** Fallback Hinglish line when Groq is unavailable or errors. */
function fallbackMessage(name: string): string {
  return `Hi ${name}, bas check kar raha tha — kya aap abhi orders le rahe hain?`;
}

/** Uses Groq (llama3-8b-8192) to draft a short Hinglish follow-up, never surfacing hard errors to the client. */
aiRouter.post("/generate-message", async (req: Request, res: Response) => {
  const parsed = generateBody.safeParse(req.body);
  if (!parsed.success) {
    const name =
      typeof req.body === "object" && req.body !== null && "name" in req.body && typeof (req.body as { name: unknown }).name === "string"
        ? (req.body as { name: string }).name
        : "there";
    res.status(200).json({ message: fallbackMessage(name) });
    return;
  }

  const { name, business_type, status } = parsed.data;

  if (!config.groqApiKey) {
    res.status(200).json({ message: fallbackMessage(name) });
    return;
  }

  const prompt = `Generate a short, warm, human follow-up WhatsApp message in Hinglish (mix of Hindi and English) for a food business lead.
Lead name: ${name}
Business type: ${business_type}
Current status: ${status}
Rules: max 2 sentences, friendly tone, no emojis, end with a question.`;

  try {
    const groq = new Groq({ apiKey: config.groqApiKey });
    const completion = await groq.chat.completions.create({
      model: "llama3-8b-8192",
      messages: [{ role: "user", content: prompt }],
      max_tokens: 256,
    });
    const text = completion.choices[0]?.message?.content?.trim();
    if (!text) {
      res.status(200).json({ message: fallbackMessage(name) });
      return;
    }
    res.status(200).json({ message: text });
  } catch (err) {
    logger.error({ err }, "Groq generate-message failed; using fallback");
    res.status(200).json({ message: fallbackMessage(name) });
  }
});

export { aiRouter };
