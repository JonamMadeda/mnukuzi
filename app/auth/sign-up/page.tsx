import { redirect } from "next/navigation";
import AuthForm from "../AuthForm";
import { signUpWithEmail } from "./actions";
import { getSessionUser } from "@/lib/auth/server";

export default async function SignUpPage() {
  if (await getSessionUser()) redirect("/");
  return <AuthForm mode="sign-up" action={signUpWithEmail} />;
}
