"use client";

import { useState } from "react";
import Image from "next/image";
import { useRouter } from "next/navigation";
import { Button } from "@/components/ui/button";
import { EyeIcon, EyeOffIcon } from "@/components/icons";
import { login } from "@/lib/auth";
import { ApiError } from "@/lib/api";
import Logo from "@/public/logo.png";
const inputClass =
  "h-10 w-full rounded-md border border-(--border) bg-(--surface) px-3 text-sm text-(--text) placeholder:text-(--text-subtle) outline-none transition-colors focus:border-(--accent)";

export function LoginForm() {
  const router = useRouter();
  const [show, setShow] = useState(false);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [remember, setRemember] = useState(false);

  async function onSubmit(e: React.FormEvent) {
    e.preventDefault();
    setError(null);
    setLoading(true);
    try {
      await login(email, password, remember);
      router.push("/");
    } catch (err) {
      setError(
        err instanceof ApiError
          ? err.message
          : "Something went wrong. Please try again.",
      );
      setLoading(false);
    }
  }

  return (
    <div className="glass w-full max-w-md rounded-2xl p-8">
      <div className="mb-6 flex flex-col items-center text-center">
        <span className="mb-3 flex h-16 w-16 items-center justify-center rounded-2xl bg-(--surface-2) p-2 shadow-sm">
          <Image src={Logo} alt="Adlora logo" width={48} height={48} className="object-contain" priority />
        </span>
        <p className="text-xl font-bold tracking-wider text-(--text) uppercase">
          Adlora
        </p>
        <p className="mb-3 text-[11px] font-semibold tracking-widest text-(--accent) uppercase">
          Legal Services & Advocacy
        </p>
        <h1 className="text-xl font-semibold tracking-tight text-(--text)">
          Welcome back
        </h1>
      </div>

      <form onSubmit={onSubmit} className="space-y-4">
        <div>
          <label className="mb-1.5 block text-sm font-medium text-(--text-secondary)">
            Email
          </label>
          <input
            type="email"
            required
            placeholder="you@adlora.com"
            value={email}
            onChange={(e) => setEmail(e.target.value)}
            autoComplete="email"
            className={inputClass}
          />
        </div>

        <div>
          <div className="mb-1.5 flex items-center justify-between">
            <label className="text-sm font-medium text-(--text-secondary)">
              Password
            </label>
          </div>
          <div className="relative">
            <input
              type={show ? "text" : "password"}
              required
              placeholder="••••••••"
              value={password}
              onChange={(e) => setPassword(e.target.value)}
              autoComplete="current-password"
              className={`${inputClass} pr-10`}
            />
            <button
              type="button"
              onClick={() => setShow((s) => !s)}
              aria-label={show ? "Hide password" : "Show password"}
              className="absolute top-1/2 right-2 -translate-y-1/2 flex h-7 w-7 items-center justify-center rounded text-(--text-subtle) hover:text-(--text-secondary) cursor-pointer"
            >
              {show ? (
                <EyeOffIcon width={16} height={16} />
              ) : (
                <EyeIcon width={16} height={16} />
              )}
            </button>
          </div>
        </div>

        <label className="flex items-center gap-2 text-sm text-(--text-secondary)">
          <input
            type="checkbox"
            checked={remember}
            onChange={(e) => setRemember(e.target.checked)}
            className="h-4 w-4 rounded border-(--border) accent-(--accent) cursor-pointer"
          />
          Remember me for 30 days
        </label>

        {error && (
          <p
            role="alert"
            className="rounded-md border border-(--danger) bg-(--danger-soft) px-3 py-2 text-sm text-(--danger)"
          >
            {error}
          </p>
        )}

        <Button
          type="submit"
          disabled={loading}
          className="w-full cursor-pointer"
        >
          {loading ? "Signing in…" : "Sign in"}
        </Button>
      </form>
    </div>
  );
}
