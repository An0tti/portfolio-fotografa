"use client";

export function AuthError({ reset }: { reset: () => void }) {
  return <section className="p-8 text-stone-900" role="alert">
    <h2 className="text-xl font-semibold">Não foi possível carregar seu acesso</h2>
    <p className="my-4">Tente novamente. Se sua sessão expirou, entre novamente.</p>
    <button onClick={reset} className="rounded bg-stone-900 px-4 py-3 text-white">Tentar novamente</button>
    <a href="/auth/login" className="ml-5 underline">Ir para o login</a>
  </section>;
}
