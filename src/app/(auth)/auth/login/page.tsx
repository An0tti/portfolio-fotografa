import Link from "next/link";
import { AuthForm } from "@/features/auth/components/auth-form";
import { loginAction } from "@/application/auth/actions";
import { safeAdminRedirect } from "@/features/auth/schemas";

const messages: Record<string, string> = {
  "session-expired": "Sua sessão expirou ou o acesso não está autorizado. Entre novamente.",
  "invalid-link": "O link é inválido ou expirou. Solicite outro e abra-o no mesmo navegador.",
  "logged-out": "Você saiu com segurança deste navegador.",
  "password-updated": "Senha alterada. Entre com a nova senha.",
};
export default async function LoginPage({ searchParams }: { searchParams: Promise<{ status?: string; next?: string }> }) {
  const params = await searchParams;
  return <>
    <p className="mb-3 text-xs tracking-widest text-stone-500 uppercase">Área da fotógrafa</p>
    <h1 className="mb-3 text-3xl font-semibold">Acesso administrativo</h1>
    <p className="mb-7 text-sm text-stone-600">Entre para acessar seu painel privado.</p>
    {params.status && messages[params.status] && <p role="status" className="mb-5 rounded-lg bg-stone-100 p-3 text-sm">{messages[params.status]}</p>}
    <AuthForm mode="login" action={loginAction} next={safeAdminRedirect(params.next)} />
    <Link href="/auth/forgot-password" className="mt-6 inline-block text-sm underline underline-offset-4">Esqueci minha senha</Link>
  </>;
}
