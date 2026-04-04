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
  let res: Response;
  try {
    res = await fetch(`${base}/api/onboard`, {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify(parsed),
      cache: "no-store",
    });
  } catch {
    return NextResponse.json(
      { error: "Could not reach the server. Please try again later.", code: "upstream_unreachable" },
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
