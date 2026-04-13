import { useNavigate } from "@tanstack/react-router";

import { ChevronLeft, ChevronRight, Copy } from "lucide-react";

import { Button } from "@/components/ui/button";

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
    return `${startMonth} ${startDay} – ${endDay}, ${year}`;
  }
  return `${startMonth} ${startDay} – ${endMonth} ${endDay}, ${year}`;
}

function addWeeks(isoDate: string, weeks: number): string {
  const d = new Date(`${isoDate}T12:00:00Z`);
  d.setUTCDate(d.getUTCDate() + weeks * 7);
  const yyyy = d.getUTCFullYear();
  const mm = String(d.getUTCMonth() + 1).padStart(2, "0");
  const dd = String(d.getUTCDate()).padStart(2, "0");
  return `${yyyy}-${mm}-${dd}`;
}

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

export function WeekNavigation({ weekStart, onCopyWeek }: WeekNavigationProps) {
  const navigate = useNavigate();
  const thisMonday = getThisMonday();
  const isCurrentWeek = weekStart === thisMonday;

  function goToWeek(monday: string) {
    navigate({ to: "/plan/week/$weekStart", params: { weekStart: monday } });
  }

  return (
    <div className="flex items-center gap-2 border-b border-[var(--line)] bg-[var(--header-bg)] px-4 py-3 backdrop-blur-md">
      <Button
        variant="ghost"
        size="icon-sm"
        onClick={() => goToWeek(addWeeks(weekStart, -1))}
        aria-label="Previous week"
      >
        <ChevronLeft className="size-4" />
      </Button>

      <div className="flex-1 text-center">
        <span className="text-sm font-semibold text-[var(--sea-ink)]">
          {formatWeekRange(weekStart)}
        </span>
      </div>

      <Button
        variant="ghost"
        size="icon-sm"
        onClick={() => goToWeek(addWeeks(weekStart, 1))}
        aria-label="Next week"
      >
        <ChevronRight className="size-4" />
      </Button>

      {!isCurrentWeek && (
        <Button
          variant="outline"
          size="sm"
          onClick={() => goToWeek(thisMonday)}
          className="ml-1 text-xs"
        >
          This week
        </Button>
      )}

      <Button
        variant="outline"
        size="sm"
        onClick={onCopyWeek}
        className="ml-1 gap-1.5 text-xs"
      >
        <Copy className="size-3" />
        Copy week
      </Button>
    </div>
  );
}
