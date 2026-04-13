import { createFileRoute } from "@tanstack/react-router";

import { DayView } from "@/components/plan/DayView";
import { DayViewSkeleton } from "@/components/plan/DayViewSkeleton";
import { PlanErrorBoundary } from "@/components/plan/PlanErrorBoundary";
import { $getChainsByDay } from "@/lib/server/chains";

export const Route = createFileRoute("/plan/$date")({
  head: ({ params }) => ({
    title: `Preplan – ${params.date}`,
    meta: [{ name: "description", content: `Plan for ${params.date}` }],
  }),
  loader: async ({ params }) => {
    return $getChainsByDay({ data: { day: params.date } });
  },
  pendingComponent: DayViewSkeleton,
  errorComponent: ({ error }) => <PlanErrorBoundary error={error as Error} />,
  component: DayViewPage,
});

function DayViewPage() {
  const chains = Route.useLoaderData();
  const { date } = Route.useParams();

  if (!chains) return null;
  return <DayView date={date} chains={chains} />;
}
