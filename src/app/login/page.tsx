import { redirect } from "next/navigation";
import { getSession } from "@/lib/auth";
import { APP_NAME } from "@/lib/config";
import LoginForm from "./LoginForm";

export default async function LoginPage() {
  if (await getSession()) redirect("/dashboard");
  return (
    <main className="flex min-h-screen items-center justify-center bg-stone-100 px-4">
      <div className="w-full max-w-sm rounded-xl border border-stone-200 bg-white p-8 shadow-sm">
        <div className="mb-6 text-center">
          <div className="text-2xl font-semibold text-stone-800">{APP_NAME}</div>
          <p className="mt-1 text-sm text-stone-500">Sign in to manage email signatures</p>
        </div>
        <LoginForm />
      </div>
    </main>
  );
}
