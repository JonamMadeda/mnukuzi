import { createNeonAuth } from "@neondatabase/auth/next/server";

export const auth = createNeonAuth({
  baseUrl: process.env.NEON_AUTH_BASE_URL!,
  cookies: {
    secret: process.env.NEON_AUTH_COOKIE_SECRET!,
  },
});

export type AuthUser = {
  id: string;
  email: string;
  name?: string | null;
};

/** Returns the signed-in user, or null. Use in server components, actions, routes. */
export async function getSessionUser(): Promise<AuthUser | null> {
  const { data: session } = await auth.getSession();
  const u = session?.user as AuthUser | undefined;
  if (!u?.id) return null;
  return { id: u.id, email: u.email, name: u.name ?? null };
}
