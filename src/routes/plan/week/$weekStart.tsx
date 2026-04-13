import { createFileRoute } from "@tanstack/react-router";

import { PlanErrorBoundary } from "@/components/plan/PlanErrorBoundary";
import { WeekView } from "@/components/plan/WeekView";
import { WeekViewSkeleton } from "@/components/plan/WeekViewSkeleton";
import { $getChainsByWeek } from "@/lib/server/chains";

export const Route = createFileRoute("/plan/week/$weekStart")({
  head: ({ params }) => ({
    title: `Preplan – Week of ${params.weekStart}`,
    meta: [
      {
        name: "description",
        content: `Weekly plan starting ${params.weekStart}`,
      },
    ],
  }),
  loader: async ({ params }) => {
    return $getChainsByWeek({ data: { weekStart: params.weekStart } });
  },
  pendingComponent: WeekViewSkeleton,
  errorComponent: ({ error }) => <PlanErrorBoundary error={error as Error} />,
  component: WeekViewPage,
});

function WeekViewPage() {
  const chainsByDay = Route.useLoaderData();
  const { weekStart } = Route.useParams();

  if (!chainsByDay) return null;
  return <WeekView weekStart={weekStart} chainsByDay={chainsByDay} />;
}
