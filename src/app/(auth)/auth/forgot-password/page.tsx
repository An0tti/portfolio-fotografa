import Link from "next/link";
import { AuthForm } from "@/features/auth/components/auth-form";
import { recoverAction } from "@/application/auth/actions";

export default function ForgotPasswordPage() {
  return <>
    <h1 className="mb-3 text-3xl font-semibold">Recuperar acesso</h1>
    <p className="mb-7 text-sm text-stone-600">Informe o e-mail administrativo para receber um link de recuperação.</p>
    <AuthForm mode="recover" action={recoverAction} />
    <Link href="/auth/login" className="mt-6 inline-block text-sm underline underline-offset-4">Voltar ao login</Link>
  </>;
}
