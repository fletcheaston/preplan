import { useNavigate } from "@tanstack/react-router";

import { ChevronDown, Copy } from "lucide-react";
import { DropdownMenu as DropdownMenuPrimitive } from "radix-ui";

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

      <div className="flex flex-1 justify-center">
        <DropdownMenuPrimitive.Root>
          <DropdownMenuPrimitive.Trigger asChild>
            <button
              type="button"
              className="flex cursor-pointer items-center gap-1.5 rounded-md bg-transparent px-2 py-1 text-base font-semibold text-[var(--ink)] transition-colors hover:text-[var(--terracotta)]"
              aria-label="Week actions"
            >
              {formatWeekRange(weekStart)}
              <ChevronDown className="size-4 opacity-60" />
            </button>
          </DropdownMenuPrimitive.Trigger>

          <DropdownMenuPrimitive.Portal>
            <DropdownMenuPrimitive.Content
              align="center"
              sideOffset={6}
              className="data-[state=open]:animate-in data-[state=closed]:animate-out data-[state=closed]:fade-out-0 data-[state=open]:fade-in-0 data-[state=closed]:zoom-out-95 data-[state=open]:zoom-in-95 z-50 min-w-[11rem] overflow-hidden rounded-lg border border-[var(--rule)] bg-[var(--white)] p-1 shadow-lg"
            >
              <DropdownMenuPrimitive.Item
                onSelect={onCopyWeek}
                className="flex cursor-pointer items-center gap-2 rounded-md px-3 py-2 text-sm text-[var(--ink)] outline-none transition-colors focus:bg-[var(--paper)] focus:text-[var(--terracotta)]"
              >
                <Copy className="size-3.5" />
                Copy week
              </DropdownMenuPrimitive.Item>
            </DropdownMenuPrimitive.Content>
          </DropdownMenuPrimitive.Portal>
        </DropdownMenuPrimitive.Root>
      </div>

      <button
        className="cursor-pointer bg-transparent font-mono text-lg text-[var(--ink-soft)] hover:text-[var(--ink)]"
        onClick={() => goToWeek(addWeeks(weekStart, 1))}
        aria-label="Next week"
      >
        {"\u2192"}
      </button>
    </div>
  );
}
