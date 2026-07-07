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
  // Staggered Spring transition settings
  const getSpringTransition = (delaySec: number) => ({
    type: "spring",
    stiffness: 70,
    damping: 16,
    delay: delaySec,
  });

  return (
    <div className="relative -mx-4 -mt-16 min-h-[calc(100vh-4rem)] bg-[#f8f9ff] px-4 pb-24 pt-24 text-[#0d1c2e] antialiased md:-mx-6 md:-mt-6 md:px-6 md:pt-12 lg:-mx-8 lg:px-8 overflow-hidden">
      <style dangerouslySetInnerHTML={{ __html: `
        div, button, span, p, a, input, select, textarea, .font-sans, .font-serif, h1, h2, h3, h4, h5, h6 {
          font-family: 'Quicksand', sans-serif !important;
        }
      `}} />
      
      <div className="relative mx-auto flex max-w-[1200px] flex-col gap-10 select-none z-10">
        <OnboardingTour />
        
        {/* Step 1: Hero banner card */}
        <motion.div
          initial={{ opacity: 0, y: 35 }}
          animate={{ opacity: 1, y: 0 }}
          transition={getSpringTransition(0.15)}
          className="will-change-transform"
        >
          <Suspense fallback={<SkeletonCard />}>
            <NewDashboardHero />
          </Suspense>
        </motion.div>
        
        {/* Step 2: Upcoming Missions card */}
        <motion.div
          initial={{ opacity: 0, y: 35 }}
          animate={{ opacity: 1, y: 0 }}
          transition={getSpringTransition(0.35)}
          className="will-change-transform"
        >
          <Suspense fallback={<SkeletonCard />}>
            <NewDashboardUpcomingMissions />
          </Suspense>
        </motion.div>
        
        {/* Step 3: Study Chart & Leaderboard row */}
        <motion.div
          initial={{ opacity: 0, y: 35 }}
          animate={{ opacity: 1, y: 0 }}
          transition={getSpringTransition(0.55)}
          className="will-change-transform"
        >
          <Grid container spacing={4} className="mt-2">
            <Grid size={{ xs: 12, xl: 8 }}>
              <Suspense fallback={<SkeletonCard />}>
                <NewDashboardStudyChart />
              </Suspense>
            </Grid>
            <Grid size={{ xs: 12, xl: 4 }}>
              <Suspense fallback={<SkeletonCard />}>
                <NewDashboardLeaderboard />
              </Suspense>
            </Grid>
          </Grid>
        </motion.div>
 
        {/* Step 4: Recent Notebooks shelf */}
        <motion.div
          initial={{ opacity: 0, y: 35 }}
          animate={{ opacity: 1, y: 0 }}
          transition={getSpringTransition(0.75)}
          className="will-change-transform"
        >
          <Suspense fallback={<SkeletonCard />}>
            <NewDashboardRecentNotebooks />
          </Suspense>
        </motion.div>
        
        {/* Step 5: Recent Study Activities */}
        <motion.div
          initial={{ opacity: 0, y: 35 }}
          animate={{ opacity: 1, y: 0 }}
          transition={getSpringTransition(0.95)}
          className="will-change-transform"
        >
          <Suspense fallback={<SkeletonCard />}>
            <NewDashboardActivity />
          </Suspense>
        </motion.div>
      </div>
    </div>
  );
}
