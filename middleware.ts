import { auth } from "@/auth"
import { NextResponse } from "next/server"

export default auth((req) => {
  const isLoggedIn = !!req.auth
  const isAuthPage = req.nextUrl.pathname.startsWith("/auth")
  const isApiAuth = req.nextUrl.pathname.startsWith("/api/auth")
  const isApiDocs = req.nextUrl.pathname.startsWith("/api/docs")
  const isSlackWebhook = req.nextUrl.pathname.startsWith("/api/slack")
  const isApiRoute = req.nextUrl.pathname.startsWith("/api")

  // Allow auth-related routes, API docs, and Slack webhooks (they have their own verification)
  if (isApiAuth || isAuthPage || isApiDocs || isSlackWebhook) {
    return NextResponse.next()
  }

  // Check for internal API key for server-to-server calls
  const internalApiKey = req.headers.get("x-internal-api-key")
  const expectedApiKey = process.env.INTERNAL_API_KEY

  if (isApiRoute && internalApiKey && expectedApiKey && internalApiKey === expectedApiKey) {
    return NextResponse.next()
  }

  // Require authentication for API routes and pages
  if (!isLoggedIn) {
    if (isApiRoute) {
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 })
    }
    const signInUrl = new URL("/auth/signin", req.url)
    signInUrl.searchParams.set("callbackUrl", req.nextUrl.pathname)
    return NextResponse.redirect(signInUrl)
  }

  return NextResponse.next()
})

export const config = {
  matcher: ["/((?!_next/static|_next/image|favicon.ico).*)"],
}
