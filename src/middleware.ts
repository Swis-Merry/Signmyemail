import { NextResponse, type NextRequest } from "next/server";
import { jwtVerify } from "jose";

const PUBLIC_PREFIXES = ["/login", "/g/", "/s/", "/api/icon/", "/api/avatar", "/api/assets/", "/api/public/"];

export async function middleware(req: NextRequest) {
  const { pathname } = req.nextUrl;
  if (PUBLIC_PREFIXES.some((p) => pathname.startsWith(p))) return NextResponse.next();

  const token = req.cookies.get("session")?.value;
  const secret = new TextEncoder().encode(process.env.AUTH_SECRET || "local-dev-secret-not-for-production");
  if (token) {
    try {
      await jwtVerify(token, secret);
      return NextResponse.next();
    } catch {}
  }
  if (pathname.startsWith("/api/")) return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  const url = req.nextUrl.clone();
  url.pathname = "/login";
  url.search = "";
  return NextResponse.redirect(url);
}

export const config = {
  matcher: ["/((?!_next/static|_next/image|favicon.ico|sample-avatar.svg).*)"],
};
