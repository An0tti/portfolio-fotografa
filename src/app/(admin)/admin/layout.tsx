import type { Metadata } from "next";
import { requireAdminPage } from "@/application/auth/session";

export const metadata: Metadata = { title: "Administração", robots: { index: false, follow: false, noarchive: true } };
export const dynamic = "force-dynamic";
export default async function AdminLayout({ children }: { children: React.ReactNode }) {
  await requireAdminPage();
  return <main className="min-h-screen bg-stone-100 px-5 py-12 text-stone-900"><div className="mx-auto max-w-3xl">{children}</div></main>;
}
