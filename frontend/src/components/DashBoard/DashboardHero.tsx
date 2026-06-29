import { useTranslation } from "react-i18next";
import { useNavigate } from "react-router-dom";
import { Flame, GraduationCap, Users } from "lucide-react";
import { useQuery } from "@tanstack/react-query";
import { userService } from "../../services/userService";

export function DashboardHero() {
  const { t } = useTranslation();
  const navigate = useNavigate();

  // Fetch real user data
  const { data: profileRes, isLoading } = useQuery({
    queryKey: ["userProfile"],
    queryFn: () => userService.getMyProfile(),
    staleTime: 5 * 60 * 1000,
  });

  const userName = profileRes?.data?.fullName?.split(" ")?.pop() || "bạn";

  return (
    <section className="surface-card gradient-hero p-6 lg:p-8 flex flex-col lg:flex-row gap-6 items-center overflow-hidden relative min-h-[250px] shadow-sm rounded-2xl">
      <div className="flex-1 min-w-0 z-10 relative text-left">
        <div className="inline-flex items-center gap-1.5 px-3 py-1 rounded-full bg-primary/10 text-primary text-xs font-semibold">
          <Flame size={14} aria-hidden="true" /> 
          <span>{t("dashboard.hero.streak") || "Chuỗi học 7 ngày liên tiếp"}</span>
        </div>
        
        <h1 className="mt-4 text-3xl lg:text-4xl font-bold tracking-tight text-foreground">
          {isLoading ? (
            <div className="h-10 w-64 bg-muted animate-pulse rounded-md" />
          ) : (
            t("dashboard.hero.greeting", { name: userName === "User" ? "bạn" : userName })
          )}
        </h1>
        
        <p className="mt-3 text-muted-foreground text-sm max-w-xl leading-relaxed">
          {t("dashboard.hero.description")}
        </p>
 
        <div className="mt-6 flex flex-wrap gap-3">
          <button 
            onClick={() => navigate("/quiz")}
            className="flex-1 lg:flex-none py-2.5 px-5 rounded-xl font-bold text-sm glow-button focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-primary inline-flex items-center justify-center gap-2"
            aria-label="Làm bài Quiz ôn tập"
          >
            <GraduationCap size={16} aria-hidden="true" /> {t("dashboard.hero.doQuiz")}
          </button>
          
          <button
            onClick={() => navigate("/community")}
            className="inline-flex items-center gap-2 px-5 h-10 rounded-full bg-card border border-border text-sm font-semibold hover:bg-muted transition-colors focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-primary focus-visible:ring-offset-2 focus-visible:ring-offset-background"
            aria-label="Xem cộng đồng"
          >
            <Users size={16} aria-hidden="true" /> {t("dashboard.hero.viewCommunity")}
          </button>
        </div>
      </div>
    </section>
  );
}
