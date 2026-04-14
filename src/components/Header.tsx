import { Link, useNavigate } from "@tanstack/react-router";

import { $logout } from "@/lib/server/auth";

function getThisMonday(): string {
  const today = new Date().toISOString().split("T")[0];
  const d = new Date(`${today}T12:00:00Z`);
  const day = d.getUTCDay();
  const diff = day === 0 ? -6 : 1 - day;
  d.setUTCDate(d.getUTCDate() + diff);
  const yyyy = d.getUTCFullYear();
  const mm = String(d.getUTCMonth() + 1).padStart(2, "0");
  const dd = String(d.getUTCDate()).padStart(2, "0");
  return `${yyyy}-${mm}-${dd}`;
}

function getToday(): string {
  return new Date().toISOString().split("T")[0];
}

export default function Header() {
  const navigate = useNavigate();
  const thisMonday = getThisMonday();
  const today = getToday();

  async function handleLogout() {
    await $logout();
    navigate({ to: "/" });
  }

  return (
    <header className="sticky top-0 z-50 border-b border-[var(--rule)] bg-[var(--header-bg)] px-4 pt-[env(safe-area-inset-top)] backdrop-blur-sm">
      <nav className="page-wrap flex flex-wrap items-center gap-x-4 gap-y-2 py-3 sm:py-4">
        <h2 className="m-0 flex-shrink-0 text-base font-semibold tracking-tight">
          <Link to="/" className="text-[var(--ink)] no-underline">
            Preplan
          </Link>
        </h2>

        <div className="order-3 flex w-full flex-wrap items-center gap-x-4 gap-y-1 pb-1 text-base font-medium sm:order-2 sm:ml-auto sm:w-auto sm:flex-nowrap sm:pb-0">
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
          <button
            onClick={handleLogout}
            className="cursor-pointer bg-transparent text-[var(--ink-soft)] hover:text-[var(--ink)] hover:underline hover:decoration-[var(--terracotta)] hover:decoration-1 hover:underline-offset-4"
          >
            Sign out
          </button>
        </div>
      </nav>
    </header>
  );
}
