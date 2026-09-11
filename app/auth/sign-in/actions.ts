"use server";

import { redirect } from "next/navigation";
import { auth } from "@/lib/auth/server";

export type AuthState = { error: string | null };

export async function signInWithEmail(
  _prev: AuthState,
  formData: FormData
): Promise<AuthState> {
  const email = (formData.get("email") as string ?? "").trim();
  const password = (formData.get("password") as string ?? "");

  if (!email || !password) {
    return { error: "Email and password are required." };
  }

  const { error } = await auth.signIn.email({ email, password });
  if (error) {
    return { error: error.message || "Failed to sign in." };
  }
  redirect("/console");
}
