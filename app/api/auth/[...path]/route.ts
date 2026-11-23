import { getAuth } from "@/lib/auth/server";

type Context = { params: Promise<{ path: string[] }> };
type Method = "GET" | "POST" | "PUT" | "DELETE" | "PATCH";

function forward(method: Method) {
  return async (request: Request, context: Context) => {
    const auth = getAuth();
    if (!auth) return Response.json({ error: "Staff login is not configured" }, { status: 503 });
    return auth.handler()[method](request, context);
  };
}

export const GET = forward("GET");
export const POST = forward("POST");
export const PUT = forward("PUT");
export const DELETE = forward("DELETE");
export const PATCH = forward("PATCH");
