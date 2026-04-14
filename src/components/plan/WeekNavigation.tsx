import { useNavigate } from "@tanstack/react-router";

import { Copy } from "lucide-react";

import { Button } from "@/components/ui/button";
import { getLocalThisMonday } from "@/lib/time";

type WeekNavigationProps = {
  weekStart: string; // Monday ISO date
  onCopyWeek: () => void;
};

function formatWeekRange(weekStart: string): string {
  const start = new Date(`${weekStart}T12:00:00Z`);
  const end = new Date(`${weekStart}T12:00:00Z`);
  end.setUTCDate(end.getUTCDate() + 6);

  const startMonth = start.toLocaleDateString("en-US", {
    month: "short",
    timeZone: "UTC",
  });
  const startDay = start.getUTCDate();
  const endMonth = end.toLocaleDateString("en-US", {
    month: "short",
    timeZone: "UTC",
  });
  const endDay = end.getUTCDate();
  const year = end.getUTCFullYear();

  if (startMonth === endMonth) {
    return `${startMonth} ${startDay} \u2013 ${endDay}, ${year}`;
  }
  return `${startMonth} ${startDay} \u2013 ${endMonth} ${endDay}, ${year}`;
}

function addWeeks(isoDate: string, weeks: number): string {
  const d = new Date(`${isoDate}T12:00:00Z`);
  d.setUTCDate(d.getUTCDate() + weeks * 7);
  const yyyy = d.getUTCFullYear();
  const mm = String(d.getUTCMonth() + 1).padStart(2, "0");
  const dd = String(d.getUTCDate()).padStart(2, "0");
  return `${yyyy}-${mm}-${dd}`;
}


export function WeekNavigation({ weekStart, onCopyWeek }: WeekNavigationProps) {
  const navigate = useNavigate();
  const thisMonday = getLocalThisMonday();
  const isCurrentWeek = weekStart === thisMonday;

  function goToWeek(monday: string) {
    navigate({ to: "/plan/week/$weekStart", params: { weekStart: monday } });
  }

  return (
    <div className="flex items-center gap-3 border-b border-[var(--rule)] bg-[var(--header-bg)] px-4 py-3 backdrop-blur-sm">
      <button
        className="cursor-pointer bg-transparent font-mono text-lg text-[var(--ink-soft)] hover:text-[var(--ink)]"
        onClick={() => goToWeek(addWeeks(weekStart, -1))}
        aria-label="Previous week"
      >
        {"\u2190"}
      </button>

      <div className="flex-1 text-center">
        <span className="text-base font-semibold text-[var(--ink)]">
          {formatWeekRange(weekStart)}
        </span>
      </div>

      <button
        className="cursor-pointer bg-transparent font-mono text-lg text-[var(--ink-soft)] hover:text-[var(--ink)]"
        onClick={() => goToWeek(addWeeks(weekStart, 1))}
        aria-label="Next week"
      >
        {"\u2192"}
      </button>

      {!isCurrentWeek && (
        <button
          className="cursor-pointer rounded-lg border border-[var(--rule)] bg-[var(--white)] px-3 py-1.5 text-sm font-medium text-[var(--ink)] hover:border-[var(--terracotta)] hover:text-[var(--terracotta)]"
          onClick={() => goToWeek(thisMonday)}
        >
          This week
        </button>
      )}

      <Button
        variant="outline"
        size="sm"
        onClick={onCopyWeek}
        className="ml-1 gap-1.5 text-sm"
      >
        <Copy className="size-3" />
        Copy week
      </Button>
    </div>
  );
}
