import Link from "next/link";
import { logoutAction } from "@/lib/actions/auth";
import { requireUser } from "@/lib/auth";
import { APP_NAME } from "@/lib/config";

export default async function AppShell({ children, wide = false }: { children: React.ReactNode; wide?: boolean }) {
  const user = await requireUser();
  return (
    <div className="flex min-h-screen flex-col">
      <header className="bg-brand text-white">
        <div className="mx-auto flex h-14 max-w-7xl items-center justify-between px-4">
          <Link href="/dashboard" className="flex items-center gap-2 text-lg font-semibold">
            <span className="flex h-7 w-7 items-center justify-center rounded bg-white/20 text-sm">S</span>
            {APP_NAME}
          </Link>
          <nav className="flex items-center gap-5 text-sm">
            <Link href="/dashboard" className="hover:underline">Dashboard</Link>
            <Link href="/signatures/new" className="hover:underline">Create signature</Link>
            <Link href="/bulk" className="hover:underline">Bulk upload</Link>
            <Link href="/settings" className="hover:underline">Settings</Link>
            <span className="hidden text-white/70 sm:inline">{user.name}</span>
            <form action={logoutAction}>
              <button className="rounded bg-white/15 px-3 py-1 hover:bg-white/25">Log out</button>
            </form>
          </nav>
        </div>
      </header>
      <main className={wide ? "flex-1" : "mx-auto w-full max-w-7xl flex-1 px-4 py-8"}>{children}</main>
    </div>
  );
}
