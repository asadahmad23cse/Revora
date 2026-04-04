import { NextResponse } from "next/server";

function parseBody(body: unknown): { name: string; phone: string } | null {
  if (!body || typeof body !== "object") return null;
  const o = body as Record<string, unknown>;
  const name = typeof o.name === "string" ? o.name.trim() : "";
  const phone = typeof o.phone === "string" ? o.phone.trim() : "";
  if (!name || name.length > 200 || !phone || phone.length < 8 || phone.length > 24) {
    return null;
  }
  return { name, phone };
}

export async function POST(req: Request) {
  let raw: unknown;
  try {
    raw = await req.json();
  } catch {
    return NextResponse.json({ error: "Invalid JSON", code: "invalid_json" }, { status: 400 });
  }

  const parsed = parseBody(raw);
  if (!parsed) {
    return NextResponse.json(
      { error: "Invalid request", code: "validation_error" },
      { status: 400 },
    );
  }

  const base = (process.env.REVORA_BACKEND_URL ?? "http://127.0.0.1:8080").replace(/\/$/, "");
  const upstreamUrl = `${base}/api/onboard`;
  let res: Response;
  try {
    res = await fetch(upstreamUrl, {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify(parsed),
      cache: "no-store",
    });
  } catch (err) {
    const isDev = process.env.NODE_ENV === "development";
    if (isDev) {
      console.error("[api/onboard] Failed to reach Revora API at", upstreamUrl, err);
    }
    return NextResponse.json(
      {
        error: "Could not reach the Revora API. Is it running?",
        code: "upstream_unreachable",
        ...(isDev && {
          hint:
            `Expected API base: ${base} (set REVORA_BACKEND_URL in whatsapp-order-os/.env.local if different). From repo root run: cd backend && npm run dev — needs DATABASE_URL and REDIS_URL in backend/.env.`,
        }),
      },
      { status: 502 },
    );
  }

  const text = await res.text();
  let data: unknown;
  try {
    data = JSON.parse(text) as unknown;
  } catch {
    data = { error: text || "Unknown error" };
  }

  return NextResponse.json(data, { status: res.status });
}
