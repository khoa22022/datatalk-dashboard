import { NextRequest, NextResponse } from "next/server";

export const dynamic = "force-dynamic";

const BACKEND_URL = (
  process.env.DATATALK_API_URL ||
  process.env.NEXT_PUBLIC_API_URL ||
  "https://datatalk-api-h4a1.onrender.com"
).replace(/\/$/, "");

const ALLOWED_ACTIONS = new Set(["bootstrap", "summary", "event", "seed", "reset", "feedback"]);

async function proxy(request: NextRequest, action: string) {
  if (!ALLOWED_ACTIONS.has(action)) {
    return NextResponse.json({ error: "Unknown trial action" }, { status: 404 });
  }

  const target = `${BACKEND_URL}/api/try/${action}`;
  const headers = new Headers();
  headers.set("Accept", "application/json");
  const contentType = request.headers.get("content-type");
  if (contentType) headers.set("Content-Type", contentType);

  let body: string | undefined;
  if (request.method !== "GET" && request.method !== "HEAD") {
    body = await request.text();
  }

  try {
    const response = await fetch(target, {
      method: request.method,
      headers,
      body,
      cache: "no-store",
    });

    const responseBody = await response.text();
    return new NextResponse(responseBody, {
      status: response.status,
      headers: {
        "Content-Type": response.headers.get("content-type") || "application/json",
        "Cache-Control": "no-store",
      },
    });
  } catch (error) {
    return NextResponse.json(
      {
        error: "Trial backend proxy failed",
        detail: error instanceof Error ? error.message : "Unknown error",
      },
      { status: 502 }
    );
  }
}

export async function GET(request: NextRequest, context: { params: Promise<{ action: string }> }) {
  const { action } = await context.params;
  return proxy(request, action);
}

export async function POST(request: NextRequest, context: { params: Promise<{ action: string }> }) {
  const { action } = await context.params;
  return proxy(request, action);
}
