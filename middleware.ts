import { auth } from "@/lib/auth/server";

// Next 14 uses middleware.ts. Protects folder pages; the landing page
// stays public (shows sign-in CTA when logged out). Server Actions and
// /api/folders routes enforce auth themselves and return 401 JSON.
export default auth.middleware({
  loginUrl: "/auth/sign-in",
});

export const config = {
  matcher: ["/folder/:path*"],
};
