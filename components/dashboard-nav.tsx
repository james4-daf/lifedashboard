"use client";

import { useAuthActions } from "@convex-dev/auth/react";
import { CalendarDays, FolderKanban, LogOut } from "lucide-react";
import Link from "next/link";
import { usePathname, useRouter } from "next/navigation";

const links = [
  { href: "/projects/all", label: "Projects", icon: FolderKanban },
  { href: "/calendar", label: "Calendar", icon: CalendarDays },
];

export default function DashboardNav() {
  const pathname = usePathname();
  const router = useRouter();
  const { signOut } = useAuthActions();

  async function handleSignOut() {
    await signOut();
    router.push("/login");
    router.refresh();
  }

  return (
    <>
      <header className="sticky top-0 z-20 border-b border-[var(--border)] bg-[var(--surface)]/90 backdrop-blur-md">
        <div className="mx-auto flex max-w-5xl items-center justify-between px-4 py-4 sm:px-6">
          <div>
            <p className="text-xs font-medium uppercase tracking-[0.18em] text-[var(--muted)]">
              Life Dashboard
            </p>
            <p className="font-display text-lg text-[var(--foreground)]">Your projects</p>
          </div>
          <div className="hidden items-center gap-1 sm:flex">
            {links.map(({ href, label, icon: Icon }) => {
              const active =
                pathname === href ||
                (href === "/projects/all" && pathname.startsWith("/projects")) ||
                (href !== "/projects/all" && pathname.startsWith(href));
              return (
                <Link
                  key={href}
                  href={href}
                  className={`nav-link ${active ? "nav-link-active" : ""}`}
                >
                  <Icon className="h-4 w-4" />
                  {label}
                </Link>
              );
            })}
            <button onClick={handleSignOut} className="nav-link ml-2" aria-label="Sign out">
              <LogOut className="h-4 w-4" />
            </button>
          </div>
        </div>
      </header>

      <nav className="fixed inset-x-0 bottom-0 z-20 border-t border-[var(--border)] bg-[var(--surface)]/95 backdrop-blur-md sm:hidden">
        <div className="mx-auto grid max-w-lg grid-cols-3 px-2 py-2">
          {links.map(({ href, label, icon: Icon }) => {
            const active =
              pathname === href ||
              (href === "/projects/all" && pathname.startsWith("/projects")) ||
              (href !== "/projects/all" && pathname.startsWith(href));
            return (
              <Link
                key={href}
                href={href}
                className={`mobile-nav-link ${active ? "mobile-nav-link-active" : ""}`}
              >
                <Icon className="h-5 w-5" />
                <span>{label}</span>
              </Link>
            );
          })}
          <button onClick={handleSignOut} className="mobile-nav-link" aria-label="Sign out">
            <LogOut className="h-5 w-5" />
            <span>Sign out</span>
          </button>
        </div>
      </nav>
    </>
  );
}
