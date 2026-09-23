import Link from "next/link";
import { requireAdminPage } from "@/application/auth/session";
import { logoutAction } from "@/application/auth/actions";
import { AuthForm } from "@/features/auth/components/auth-form";

export default async function AdminPage() {
  await requireAdminPage();
  return <section className="rounded-2xl border border-stone-200 bg-white p-7 sm:p-10">
    <p className="mb-3 text-xs tracking-widest text-stone-500 uppercase">Área privada</p>
    <h1 className="text-3xl font-semibold">Bem-vinda ao seu painel</h1>
    <p className="mt-5 text-stone-600">Seu acesso administrativo foi confirmado. As ferramentas de gestão serão disponibilizadas nas próximas etapas.</p>
    <div className="mt-8 max-w-xs"><AuthForm mode="logout" action={logoutAction} /></div>
    <Link href="/auth/reset-password" className="mt-6 inline-block text-sm underline underline-offset-4">Alterar senha</Link>
  </section>;
}
