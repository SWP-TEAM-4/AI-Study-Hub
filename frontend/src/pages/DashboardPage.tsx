import { DashboardHero } from "../components/DashBoard/DashboardHero";
import { DashboardUpcomingMissions } from "../components/DashBoard/DashboardUpcomingMissions";
import { DashboardStudyChart } from "../components/DashBoard/DashboardStudyChart";
import { DashboardLeaderboardWidget } from "../components/DashBoard/DashboardLeaderboardWidget";
import { DashboardRecentNotebooks } from "../components/DashBoard/DashboardRecentNotebooks";
import { DashboardQuizFlashcards } from "../components/DashBoard/DashboardQuizFlashcards";

export default function DashboardPage() {
  return (
    <div className="space-y-8 select-none max-w-7xl mx-auto pb-10">
      
      {/* ─── I. HERO BANNER ─── */}
      <DashboardHero />

      {/* ─── II. TARGET STUDY GOALS & MISSIONS ─── */}
      <DashboardUpcomingMissions />

      {/* ─── III. STUDY MINUTES CHART & LEADERBOARD WIDGET ─── */}
      <section className="grid lg:grid-cols-3 gap-5">
        <div className="lg:col-span-2">
          <DashboardStudyChart />
        </div>
        <div>
          <DashboardLeaderboardWidget />
        </div>
      </section>

      {/* ─── IV. RECENT NOTEBOOKS, NOTIFICATIONS & COMMUNITY ─── */}
      <DashboardRecentNotebooks />

      {/* ─── V. QUIZ & FLASHCARDS DETAILS ─── */}
      <DashboardQuizFlashcards />

    </div>
  );
}