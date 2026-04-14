import { Link, useNavigate } from "@tanstack/react-router";

import { $logout } from "@/lib/server/auth";
import { getLocalThisMonday, getLocalToday } from "@/lib/time";

export default function Header() {
  const navigate = useNavigate();
  const thisMonday = getLocalThisMonday();
  const today = getLocalToday();

  async function handleLogout() {
    await $logout();
    navigate({ to: "/" });
  }

  return (
    <header className="sticky top-0 z-50 border-b border-[var(--rule)] bg-[var(--header-bg)] px-4 pt-[env(safe-area-inset-top)] backdrop-blur-sm">
      <nav className="page-wrap flex items-center gap-3 py-3 sm:py-4">
        {/* Brand */}
        <h2 className="m-0 flex-1 text-base font-semibold tracking-tight">
          <Link to="/" className="text-[var(--ink)] no-underline">
            Preplan
          </Link>
        </h2>

        {/* Centered nav links */}
        <div className="flex items-center gap-x-4 text-base font-medium sm:gap-x-6">
          <Link
            to="/"
            className="nav-link"
            activeProps={{ className: "nav-link is-active" }}
          >
            Home
          </Link>
          <Link
            to="/plan/week/$weekStart"
            params={{ weekStart: thisMonday }}
            className="nav-link"
            activeProps={{ className: "nav-link is-active" }}
          >
            Week
          </Link>
          <Link
            to="/plan/$date"
            params={{ date: today }}
            className="nav-link"
            activeProps={{ className: "nav-link is-active" }}
          >
            Today
          </Link>
        </div>

        {/* Sign out */}
        <div className="flex flex-1 justify-end">
          <button
            onClick={handleLogout}
            className="cursor-pointer bg-transparent text-base font-medium text-[var(--ink-soft)] hover:text-[var(--ink)] hover:underline hover:decoration-[var(--terracotta)] hover:decoration-1 hover:underline-offset-4"
          >
            Sign out
          </button>
        </div>
      </nav>
    </header>
  );
}
