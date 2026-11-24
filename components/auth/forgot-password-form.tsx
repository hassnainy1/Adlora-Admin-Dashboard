"use client";

import { useState } from "react";
import Link from "next/link";
import Image from "next/image";
import Logo from "@/public/logo.png";
import { Button } from "@/components/ui/button";
import { ArrowLeftIcon } from "@/components/icons";

const inputClass =
  "h-10 w-full rounded-md border border-(--border) bg-(--surface) px-3 text-sm text-(--text) placeholder:text-(--text-subtle) outline-none transition-colors focus:border-(--accent)";

export function ForgotPasswordForm() {
  const [sent, setSent] = useState(false);

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
          Reset password
        </h1>
        <p className="mt-1 text-sm text-(--text-muted)">
          {sent
            ? "Check your inbox for a reset link."
            : "Enter your email and we'll send a reset link."}
        </p>
      </div>

      {!sent ? (
        <form
          onSubmit={(e) => {
            e.preventDefault();
            setSent(true);
          }}
          className="space-y-4"
        >
          <input type="email" required placeholder="you@adlora.com" className={inputClass} />
          <Button type="submit" className="w-full">
            Send reset link
          </Button>
        </form>
      ) : (
        <div className="rounded-md bg-(--success-soft) px-4 py-3 text-sm text-(--success)">
          Reset link sent ✓
        </div>
      )}

      <Link
        href="/login"
        className="mt-6 flex items-center justify-center gap-1.5 text-sm font-medium text-(--accent) hover:underline"
      >
        <ArrowLeftIcon width={16} height={16} /> Back to sign in
      </Link>
    </div>
  );
}
