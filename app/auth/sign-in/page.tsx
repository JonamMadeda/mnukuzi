import { redirect } from "next/navigation";
import AuthForm from "../AuthForm";
import { signInWithEmail } from "./actions";
import { getSessionUser } from "@/lib/auth/server";

export default async function SignInPage() {
  if (await getSessionUser()) redirect("/");
  return <AuthForm mode="sign-in" action={signInWithEmail} />;
}
