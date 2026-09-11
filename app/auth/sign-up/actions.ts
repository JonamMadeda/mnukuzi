"use server";

import { redirect } from "next/navigation";
import { auth } from "@/lib/auth/server";

export type AuthState = { error: string | null };

export async function signUpWithEmail(
  _prev: AuthState,
  formData: FormData
): Promise<AuthState> {
  const name = (formData.get("name") as string ?? "").trim();
  const email = (formData.get("email") as string ?? "").trim();
  const password = (formData.get("password") as string ?? "");

  if (!name || !email || !password) {
    return { error: "Name, email, and password are required." };
  }

  const { error } = await auth.signUp.email({ name, email, password });
  if (error) {
    return { error: error.message || "Failed to create account." };
  }
  redirect("/console");
}
