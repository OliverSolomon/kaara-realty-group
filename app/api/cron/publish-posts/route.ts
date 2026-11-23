import { timingSafeEqual } from "node:crypto";
import { createRemoteJWKSet, jwtVerify } from "jose";
import { publishDue } from "@/lib/social/publish";

export const dynamic = "force-dynamic";
export const maxDuration = 60;

const GITHUB_ISSUER = "https://token.actions.githubusercontent.com";
const githubKeys = createRemoteJWKSet(new URL(`${GITHUB_ISSUER}/.well-known/jwks`));

async function authorised(request: Request) {
  const header = request.headers.get("authorization") ?? "";
  const secret = process.env.CRON_SECRET;
  if (secret) {
    const expected = Buffer.from(`Bearer ${secret}`);
    const given = Buffer.from(header);
    if (given.length === expected.length && timingSafeEqual(given, expected)) return true;
  }
  if (!header.startsWith("Bearer ")) return false;
  // The scheduled GitHub workflow proves itself with a short-lived identity token, so no secret is stored there.
  try {
    const { payload } = await jwtVerify(header.slice(7), githubKeys, {
      issuer: GITHUB_ISSUER,
      audience: "kaara-publish-posts",
    });
    return (
      payload.repository === "OliverSolomon/kaara-realty-group" &&
      payload.ref === "refs/heads/main" &&
      String(payload.workflow_ref ?? "").startsWith(
        "OliverSolomon/kaara-realty-group/.github/workflows/publish-posts.yml@"
      )
    );
  } catch {
    return false;
  }
}

async function run(request: Request) {
  if (!(await authorised(request))) return Response.json({ error: "Unauthorized" }, { status: 401 });
  try {
    return Response.json({ ok: true, ...(await publishDue()) });
  } catch (error) {
    console.error("Scheduled publishing failed:", error);
    return Response.json({ ok: false }, { status: 500 });
  }
}

export const GET = run;
export const POST = run;
