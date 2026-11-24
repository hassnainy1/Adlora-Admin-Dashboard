import Link from "next/link";
import Image from "next/image";
import Logo from "@/public/logo.png";
export default function NotFound() {
  return (
    <div className="flex min-h-dvh items-center justify-center p-4">
      <div className="glass w-full max-w-md rounded-2xl p-10 text-center">
        <span className="mx-auto mb-4 flex h-16 w-16 items-center justify-center rounded-2xl bg-(--surface-2) p-2 shadow-sm">
          <Image src={Logo} alt="Adlora logo" width={48} height={48} className="object-contain" />
        </span>
        <p className="text-xl font-bold tracking-wider text-(--text) uppercase">
          Adlora
        </p>
        <p className="mb-4 text-[11px] font-semibold tracking-widest text-(--accent) uppercase">
          Legal Services & Advocacy
        </p>
        <p className="mt-4 text-6xl font-bold tracking-tight text-(--text)">
          404
        </p>
        <h1 className="mt-3 text-lg font-semibold text-(--text)">
          Page not found
        </h1>
        <p className="mt-1 text-sm text-(--text-muted)">
          The page you&apos;re looking for doesn&apos;t exist or has been moved.
        </p>
        <Link
          href="/"
          className="mt-6 inline-flex h-10 items-center justify-center rounded-md bg-(--accent) px-5 text-sm font-medium text-(--accent-foreground) shadow-sm shadow-(--accent)/20 transition-colors hover:bg-(--accent-hover)"
        >
          Back to dashboard
        </Link>
      </div>
    </div>
  );
}
