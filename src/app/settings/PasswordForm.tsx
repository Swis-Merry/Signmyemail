"use client";

import { useFormState } from "react-dom";
import { changePasswordAction } from "@/lib/actions/auth";

export default function PasswordForm() {
  const [state, action] = useFormState(changePasswordAction, undefined);
  return (
    <form action={action} className="space-y-3">
      <div>
        <label className="label" htmlFor="current">Current password</label>
        <input id="current" name="current" type="password" required className="input" autoComplete="current-password" />
      </div>
      <div>
        <label className="label" htmlFor="next">New password</label>
        <input id="next" name="next" type="password" required minLength={8} className="input" autoComplete="new-password" />
      </div>
      {state?.error && <p className="text-sm text-red-600">{state.error}</p>}
      {state?.ok && <p className="text-sm text-green-700">Password updated.</p>}
      <button className="btn-secondary">Change password</button>
    </form>
  );
}
