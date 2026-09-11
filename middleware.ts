import { auth } from "@/lib/auth/server";

// Next 14 uses middleware.ts. The console and folder pages require
// sign-in — unauthenticated visitors get the public landing page at /
// and are sent to the dedicated /auth/sign-in page when they try to go
// deeper. Server Actions and /api/folders routes enforce auth themselves
// and return 401 JSON.
export default auth.middleware({
  loginUrl: "/auth/sign-in",
});

export const config = {
  matcher: ["/console/:path*", "/folder/:path*"],
};
