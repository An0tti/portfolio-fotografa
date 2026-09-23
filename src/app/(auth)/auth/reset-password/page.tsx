import { requireAdminPage } from "@/application/auth/session";
import { updatePasswordAction } from "@/application/auth/actions";
import { AuthForm } from "@/features/auth/components/auth-form";

export const dynamic = "force-dynamic";
export default async function ResetPasswordPage() {
  await requireAdminPage();
  return <><h1 className="mb-3 text-3xl font-semibold">Definir nova senha</h1>
    <p className="mb-7 text-sm text-stone-600">Depois de salvar, entre novamente com sua nova senha.</p>
    <AuthForm mode="password" action={updatePasswordAction} />
  </>;
}
