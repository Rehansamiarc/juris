"use client";

import Link from "next/link";
import { useActionState, useState } from "react";
import {
  loginAction,
  requestResetAction,
  resetPasswordAction,
  signupAction,
  type AuthState,
} from "@/app/actions/auth";
import { Icon } from "./icons";

function Alert({ state }: { state: AuthState }) {
  if (!state.error && !state.info) return null;
  return (
    <div
      role={state.error ? "alert" : "status"}
      className={`mb-4 rounded-xl border px-3.5 py-3 text-[13px] leading-relaxed ${
        state.error
          ? "border-danger/30 bg-danger/5 text-danger"
          : "border-gold/30 bg-gold-soft/50 text-ink-soft"
      }`}
    >
      {state.error ?? state.info}
      {state.resetUrl ? (
        <div className="mt-2">
          <Link href={state.resetUrl} className="link-gold font-semibold">
            Open your reset link
          </Link>
        </div>
      ) : null}
    </div>
  );
}

function Submit({ label, pending }: { label: string; pending: boolean }) {
  return (
    <button type="submit" className="btn btn-primary w-full" disabled={pending}>
      {pending ? (
        <>
          <span className="h-3.5 w-3.5 animate-spin rounded-full border-2 border-current border-t-transparent" />
          Please wait…
        </>
      ) : (
        <>
          {label} <Icon name="arrow" size={15} />
        </>
      )}
    </button>
  );
}

export function LoginForm({ notice }: { notice?: string }) {
  const [state, action, pending] = useActionState(loginAction, {} as AuthState);
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");

  return (
    <form action={action}>
      <Alert state={state} />
      {notice ? (
        <div className="mb-4 rounded-xl border border-success/30 bg-success/5 px-3.5 py-2.5 text-[13px] text-success">
          {notice}
        </div>
      ) : null}
      <div className="mb-4">
        <label htmlFor="login-email" className="label">
          Email address
        </label>
        <input
          id="login-email"
          name="email"
          type="email"
          autoComplete="email"
          required
          className="input"
          placeholder="you@lawcollege.ac.in"
          value={email}
          onChange={(e) => setEmail(e.target.value)}
        />
      </div>
      <div className="mb-2">
        <div className="flex items-baseline justify-between">
          <label htmlFor="login-password" className="label">
            Password
          </label>
          <Link href="/forgot-password" className="mb-1 text-xs text-muted hover:text-gold">
            Forgot password?
          </Link>
        </div>
        <input
          id="login-password"
          name="password"
          type="password"
          autoComplete="current-password"
          required
          className="input"
          placeholder="Your password"
          value={password}
          onChange={(e) => setPassword(e.target.value)}
        />
      </div>
      <div className="mb-5 mt-4 flex items-center justify-between rounded-xl border border-dashed border-line-strong px-3 py-2.5">
        <div>
          <p className="text-[11px] font-semibold text-ink">Review the product instantly</p>
          <p className="text-[11px] text-muted">Demo account with sample study data</p>
        </div>
        <button
          type="button"
          className="btn btn-secondary h-8 px-2.5 text-[11px]"
          onClick={() => {
            setEmail("demo@vidhi.app");
            setPassword("demo1234");
          }}
        >
          Use demo account
        </button>
      </div>
      <Submit label="Sign in" pending={pending} />
      <p className="mt-5 text-center text-sm text-muted">
        New to Vidhi?{" "}
        <Link href="/signup" className="link-gold font-medium">
          Create an account
        </Link>
      </p>
    </form>
  );
}

export function SignupForm() {
  const [state, action, pending] = useActionState(signupAction, {} as AuthState);

  return (
    <form action={action}>
      <Alert state={state} />
      <div className="mb-4">
        <label htmlFor="signup-name" className="label">
          Full name
        </label>
        <input
          id="signup-name"
          name="name"
          autoComplete="name"
          required
          minLength={2}
          className="input"
          placeholder="Aarav Mehta"
        />
      </div>
      <div className="mb-4">
        <label htmlFor="signup-email" className="label">
          Email address
        </label>
        <input
          id="signup-email"
          name="email"
          type="email"
          autoComplete="email"
          required
          className="input"
          placeholder="you@lawcollege.ac.in"
        />
      </div>
      <div className="mb-4">
        <label htmlFor="signup-password" className="label">
          Password
        </label>
        <input
          id="signup-password"
          name="password"
          type="password"
          autoComplete="new-password"
          required
          minLength={8}
          className="input"
          placeholder="At least 8 characters, one number"
        />
        <p className="mt-1.5 text-[11px] text-muted">
          Use at least 8 characters with one letter and one number.
        </p>
      </div>
      <div className="mb-5">
        <label htmlFor="signup-confirm" className="label">
          Confirm password
        </label>
        <input
          id="signup-confirm"
          name="confirm"
          type="password"
          autoComplete="new-password"
          required
          className="input"
          placeholder="Repeat your password"
        />
      </div>
      <Submit label="Create account" pending={pending} />
      <p className="mt-5 text-center text-sm text-muted">
        Already studying with us?{" "}
        <Link href="/login" className="link-gold font-medium">
          Sign in
        </Link>
      </p>
      <p className="mt-4 text-center text-[11px] leading-relaxed text-muted">
        Vidhi is a study aid, not legal advice. We store your notes and uploads privately on this workspace.
      </p>
    </form>
  );
}

export function ForgotForm() {
  const [state, action, pending] = useActionState(requestResetAction, {} as AuthState);
  return (
    <form action={action}>
      <Alert state={state} />
      <div className="mb-5">
        <label htmlFor="forgot-email" className="label">
          Email address
        </label>
        <input
          id="forgot-email"
          name="email"
          type="email"
          autoComplete="email"
          required
          className="input"
          placeholder="you@lawcollege.ac.in"
        />
      </div>
      <Submit label="Create reset link" pending={pending} />
      <p className="mt-5 text-center text-sm text-muted">
        <Link href="/login" className="link-gold font-medium">
          Back to sign in
        </Link>
      </p>
    </form>
  );
}

export function ResetForm({ token }: { token: string }) {
  const [state, action, pending] = useActionState(resetPasswordAction, {} as AuthState);
  return (
    <form action={action}>
      <Alert state={state} />
      <input type="hidden" name="token" value={token} />
      <div className="mb-4">
        <label htmlFor="reset-password" className="label">
          New password
        </label>
        <input
          id="reset-password"
          name="password"
          type="password"
          autoComplete="new-password"
          required
          minLength={8}
          className="input"
          placeholder="At least 8 characters, one number"
        />
      </div>
      <div className="mb-5">
        <label htmlFor="reset-confirm" className="label">
          Confirm new password
        </label>
        <input
          id="reset-confirm"
          name="confirm"
          type="password"
          autoComplete="new-password"
          required
          className="input"
          placeholder="Repeat the new password"
        />
      </div>
      <Submit label="Set new password" pending={pending} />
    </form>
  );
}
