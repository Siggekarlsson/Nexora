import { NextResponse, type NextRequest } from "next/server";

/** Until onboarding is done (cookie set by the client when it finishes), every page goes to /onboarding. */
export function middleware(req: NextRequest) {
  if (req.cookies.get("nx_onboarded")?.value === "1") return NextResponse.next();
  const url = req.nextUrl.clone();
  url.pathname = "/onboarding";
  url.search = "";
  return NextResponse.redirect(url);
}

export const config = {
  // Pages only: not /onboarding itself, API routes, Next internals or static files.
  matcher: ["/((?!onboarding|api|_next|.*\\..*).*)"],
};
