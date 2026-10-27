import { lazy, Suspense } from "react";
import { Shell } from "./Shell";
import { useRoute } from "./router";
import Landing from "./pages/Landing";

const Checker = lazy(() => import("./pages/Checker"));

function CheckerSkeleton() {
  return (
    <div className="shell" style={{ paddingTop: 32 }}>
      <div className="panel checking" role="status" aria-live="polite">
        <div className="dots" aria-hidden="true">
          {[0, 1, 2, 3, 4, 5, 6].map((i) => (
            <i key={i} style={{ ["--i" as string]: i }} />
          ))}
        </div>
        <p>Loading claim checker…</p>
      </div>
    </div>
  );
}

export default function App() {
  const route = useRoute();

  if (route.name === "checker" || route.name === "review") {
    return (
      <Shell currentRoute={route} hideFooter={true}>
        <Suspense fallback={<CheckerSkeleton />}>
          <Checker exampleId={route.exampleId} reviewId={route.reviewId} />
        </Suspense>
      </Shell>
    );
  }

  return (
    <Shell currentRoute={route}>
      <Landing notFound={route.notFound} />
    </Shell>
  );
}
