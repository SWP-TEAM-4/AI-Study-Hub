import { Suspense, lazy } from "react";
import { Grid } from "@mui/material";
import { motion } from "framer-motion";

const NewDashboardHero = lazy(() =>
  import("../components/DashBoard/NewDashboardHero").then((m) => ({ default: m.NewDashboardHero }))
);
const NewDashboardUpcomingMissions = lazy(() =>
  import("../components/DashBoard/NewDashboardUpcomingMissions").then((m) => ({ default: m.NewDashboardUpcomingMissions }))
);
const NewDashboardStudyChart = lazy(() =>
  import("../components/DashBoard/NewDashboardStudyChart").then((m) => ({ default: m.NewDashboardStudyChart }))
);
const NewDashboardLeaderboard = lazy(() =>
  import("../components/DashBoard/NewDashboardLeaderboard").then((m) => ({ default: m.NewDashboardLeaderboard }))
);
const NewDashboardRecentNotebooks = lazy(() =>
  import("../components/DashBoard/NewDashboardRecentNotebooks").then((m) => ({ default: m.NewDashboardRecentNotebooks }))
);
const NewDashboardActivity = lazy(() =>
  import("../components/DashBoard/NewDashboardActivity").then((m) => ({ default: m.NewDashboardActivity }))
);

import { OnboardingTour } from "../components/DashBoard/OnboardingTour";
import { SkeletonCard } from "../components/ui/SkeletonCard";

export default function DashboardPage() {
  const getSpringTransition = (delaySec: number): any => ({
    type: "spring",
    stiffness: 70,
    damping: 16,
    delay: delaySec,
  });

  return (
    <div className="relative -mx-4 -mt-16 min-h-[calc(100vh-4rem)] bg-transparent px-4 pb-24 pt-16 text-[#0d1c2e] antialiased md:-mx-6 md:-mt-12 md:px-6 md:pt-8 lg:-mx-8 lg:-mt-16 lg:pt-4 overflow-hidden">
      <style dangerouslySetInnerHTML={{ __html: `
        div, button, span, p, a, input, select, textarea, .font-sans, .font-serif, h1, h2, h3, h4, h5, h6 {
          font-family: 'Nunito', 'Quicksand', 'Plus Jakarta Sans', sans-serif !important;
        }
      `}} />
      
      <div className="relative mx-auto flex max-w-[1200px] flex-col gap-8 select-none z-10">
        <OnboardingTour />
        
        {/* Row 1: Hero Banner, Welcome Card & Level Progress Card */}
        <motion.div
          initial={{ opacity: 0, y: 35 }}
          animate={{ opacity: 1, y: 0 }}
          transition={getSpringTransition(0.15)}
          style={{ willChange: "transform, opacity" }}
        >
          <Suspense fallback={<SkeletonCard />}>
            <NewDashboardHero />
          </Suspense>
        </motion.div>

        {/* Rows 2 & 3: Main Dashboard Content Grid */}
        <Grid container spacing={4} className="mt-2">
          {/* Left Column (lg:col-span-8) */}
          <Grid size={{ xs: 12, lg: 8 }} className="flex flex-col gap-6">
            {/* Planner & Library Sub-row */}
            <Grid container spacing={4}>
              <Grid size={{ xs: 12, md: 6 }}>
                <motion.div
                  initial={{ opacity: 0, y: 35 }}
                  animate={{ opacity: 1, y: 0 }}
                  transition={getSpringTransition(0.35)}
                  style={{ willChange: "transform, opacity" }}
                  className="h-full"
                >
                  <Suspense fallback={<SkeletonCard />}>
                    <NewDashboardUpcomingMissions />
                  </Suspense>
                </motion.div>
              </Grid>
              <Grid size={{ xs: 12, md: 6 }}>
                <motion.div
                  initial={{ opacity: 0, y: 35 }}
                  animate={{ opacity: 1, y: 0 }}
                  transition={getSpringTransition(0.45)}
                  style={{ willChange: "transform, opacity" }}
                  className="h-full"
                >
                  <Suspense fallback={<SkeletonCard />}>
                    <NewDashboardRecentNotebooks />
                  </Suspense>
                </motion.div>
              </Grid>
            </Grid>

            {/* Study Time Semester Growth Chart */}
            <motion.div
              initial={{ opacity: 0, y: 35 }}
              animate={{ opacity: 1, y: 0 }}
              transition={getSpringTransition(0.55)}
              style={{ willChange: "transform, opacity" }}
            >
              <Suspense fallback={<SkeletonCard />}>
                <NewDashboardStudyChart />
              </Suspense>
            </motion.div>

            {/* Recent Study Activities */}
            <motion.div
              initial={{ opacity: 0, y: 35 }}
              animate={{ opacity: 1, y: 0 }}
              transition={getSpringTransition(0.75)}
              style={{ willChange: "transform, opacity" }}
            >
              <Suspense fallback={<SkeletonCard />}>
                <NewDashboardActivity />
              </Suspense>
            </motion.div>
          </Grid>

          {/* Right Column (lg:col-span-4) - Campus Ranking & Badges */}
          <Grid size={{ xs: 12, lg: 4 }}>
            <motion.div
              initial={{ opacity: 0, y: 35 }}
              animate={{ opacity: 1, y: 0 }}
              transition={getSpringTransition(0.65)}
              style={{ willChange: "transform, opacity" }}
              className="h-full"
            >
              <Suspense fallback={<SkeletonCard />}>
                <NewDashboardLeaderboard />
              </Suspense>
            </motion.div>
          </Grid>
        </Grid>
      </div>
    </div>
  );
}
