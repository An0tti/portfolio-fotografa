import type { Metadata } from "next";

export const metadata: Metadata = { title: "Acesso administrativo", robots: { index: false, follow: false, noarchive: true } };
export default function AuthLayout({ children }: { children: React.ReactNode }) {
  return <main className="flex min-h-screen items-center justify-center bg-stone-100 px-5 py-12 text-stone-900">
    <div className="w-full max-w-md rounded-2xl border border-stone-200 bg-white p-7 shadow-sm sm:p-10">{children}</div>
  </main>;
}
