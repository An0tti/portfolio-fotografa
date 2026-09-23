export default function HomePage() {
  return (
    <main className="flex min-h-svh items-center justify-center px-6 py-16">
      <section
        aria-labelledby="foundation-title"
        className="w-full max-w-xl rounded-2xl border border-stone-200 bg-white p-8 sm:p-12"
      >
        <p className="text-sm font-medium uppercase tracking-widest text-stone-500">
          Fase 1 · Fundação técnica
        </p>
        <h1
          id="foundation-title"
          className="mt-4 text-3xl font-semibold tracking-tight sm:text-4xl"
        >
          Aplicação funcionando.
        </h1>
        <p className="mt-5 leading-relaxed text-stone-600">
          A base do projeto está pronta para o desenvolvimento incremental.
        </p>
        <p className="mt-8 border-t border-stone-200 pt-6 text-sm text-stone-600">
          Next.js · App Router · React · TypeScript · Tailwind CSS
        </p>
      </section>
    </main>
  );
}
