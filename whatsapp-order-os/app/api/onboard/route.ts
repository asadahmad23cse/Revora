import { NextResponse } from "next/server";

function validateOnboardBody(body: unknown): body is Record<string, unknown> & { name: string; phone: string } {
  if (!body || typeof body !== "object") return false;
  const o = body as Record<string, unknown>;
  const name = typeof o.name === "string" ? o.name.trim() : "";
  const phone = typeof o.phone === "string" ? o.phone.trim() : "";
  if (!name || name.length > 200 || !phone || phone.length < 8 || phone.length > 24) {
    return false;
  }
  return true;
}

export async function POST(req: Request) {
  let raw: unknown;
  try {
    raw = await req.json();
  } catch {
    return NextResponse.json({ error: "Invalid JSON", code: "invalid_json" }, { status: 400 });
  }

  if (!validateOnboardBody(raw)) {
    return NextResponse.json(
      { error: "Invalid request", code: "validation_error" },
      { status: 400 },
    );
  }

  const base = (process.env.REVORA_BACKEND_URL ?? "http://127.0.0.1:8080").replace(/\/$/, "");
  const upstreamUrl = `${base}/api/onboard`;
  const headers: Record<string, string> = { "Content-Type": "application/json" };
  const auth = req.headers.get("authorization");
  if (auth) {
    headers.Authorization = auth;
  }

  let res: Response;
  try {
    res = await fetch(upstreamUrl, {
      method: "POST",
      headers,
      body: JSON.stringify(raw),
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
            `Expected API base: ${base} (set REVORA_BACKEND_URL in whatsapp-order-os/.env.local if different). Start the API: cd backend && npm run dev — it must keep running. Check http://127.0.0.1:8080/health in your browser; if it does not load, the server is not up (fix DATABASE_URL, REDIS_URL, and all required vars in backend/.env — see backend/.env.example). Restart Next after changing .env.local.`,
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
