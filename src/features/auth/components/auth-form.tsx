"use client";

import { useActionState, useEffect, useRef } from "react";
import type { AuthFormState } from "../schemas";

type Mode = "login" | "recover" | "password" | "logout";
interface Props {
  mode: Mode;
  action: (state: AuthFormState, form: FormData) => Promise<AuthFormState>;
  next?: string;
}
const labels: Record<Mode, string> = {
  login: "Entrar", recover: "Enviar link de recuperação", password: "Salvar nova senha", logout: "Sair",
};
const inputClass = "mt-2 w-full rounded-lg border border-stone-400 bg-white px-3 py-3 text-stone-950 focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-stone-800";

export function AuthForm({ mode, action, next }: Props) {
  const [state, formAction, pending] = useActionState(action, { message: "" });
  const feedbackRef = useRef<HTMLParagraphElement>(null);
  useEffect(() => {
    if (mode === "recover" && state.message && !pending) feedbackRef.current?.focus();
  }, [mode, state, pending]);
  return (
    <form action={formAction} className="space-y-5" aria-busy={pending}>
      {next && <input type="hidden" name="next" value={next} />}
      {(mode === "login" || mode === "recover") && (
        <label className="block text-sm font-medium">E-mail
          <input className={inputClass} name="email" type="email" autoComplete="email" required maxLength={254} />
        </label>
      )}
      {(mode === "login" || mode === "password") && (
        <label className="block text-sm font-medium">{mode === "password" ? "Nova senha" : "Senha"}
          <input className={inputClass} name="password" type="password" autoComplete={mode === "login" ? "current-password" : "new-password"}
            required minLength={mode === "password" ? 12 : 1} maxLength={128} aria-describedby={mode === "password" ? "password-help" : undefined} />
        </label>
      )}
      {mode === "password" && <>
        <p id="password-help" className="text-sm text-stone-600">Use de 12 a 128 caracteres, com uma senha exclusiva para este acesso.</p>
        <label className="block text-sm font-medium">Confirmar nova senha
          <input className={inputClass} name="confirmation" type="password" autoComplete="new-password" required minLength={12} maxLength={128} />
        </label>
      </>}
      <p ref={feedbackRef} role="status" aria-live="polite" aria-atomic="true" tabIndex={-1}
        className={mode === "recover" && state.message
          ? "rounded-lg border border-stone-400 bg-stone-100 p-4 text-sm font-medium text-stone-950 focus:outline-2 focus:outline-offset-2 focus:outline-stone-800"
          : "text-sm text-stone-700"}>
        {mode === "recover" && state.success && <strong className="mb-1 block">Solicitação recebida</strong>}
        {state.message}
      </p>
      <button disabled={pending} type="submit" className="w-full rounded-lg bg-stone-900 px-5 py-3 font-medium text-white hover:bg-stone-700 focus-visible:outline-2 focus-visible:outline-offset-4 focus-visible:outline-stone-900 disabled:cursor-wait disabled:opacity-60">
        {pending ? "Aguarde…" : labels[mode]}
      </button>
    </form>
  );
}
