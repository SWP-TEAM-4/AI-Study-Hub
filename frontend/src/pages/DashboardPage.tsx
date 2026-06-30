import { useEffect, useRef } from "react";
import { DashboardHero } from "../components/DashBoard/DashboardHero";
import { DashboardUpcomingMissions } from "../components/DashBoard/DashboardUpcomingMissions";
import { DashboardStudyChart } from "../components/DashBoard/DashboardStudyChart";
import { DashboardLeaderboardWidget } from "../components/DashBoard/DashboardLeaderboardWidget";
import { DashboardRecentNotebooks } from "../components/DashBoard/DashboardRecentNotebooks";
import { DashboardQuizFlashcards } from "../components/DashBoard/DashboardQuizFlashcards";
import { OnboardingTour } from "../components/DashBoard/OnboardingTour";

function OrbitalBackdrop() {
  const canvasRef = useRef<HTMLCanvasElement | null>(null);

  useEffect(() => {
    const canvas = canvasRef.current;
    if (!canvas) return;

    const context = canvas.getContext("2d");
    if (!context) return;

    let animationFrame = 0;
    let width = 0;
    let height = 0;
    let isVisible = document.visibilityState === "visible";

    const stars = Array.from({ length: 170 }, (_, index) => ({
      x: (Math.sin(index * 91.7) + 1) / 2,
      y: (Math.cos(index * 47.3) + 1) / 2,
      radius: 0.42 + ((index * 13) % 100) / 120,
      phase: index * 0.37,
      drift: 0.000014 + (index % 7) * 0.000005,
      opacity: 0.2 + (index % 5) * 0.08,
    }));

    const resize = () => {
      const dpr = Math.min(window.devicePixelRatio || 1, 2);
      width = window.innerWidth;
      height = window.innerHeight;
      canvas.width = Math.floor(width * dpr);
      canvas.height = Math.floor(height * dpr);
      canvas.style.width = width + "px";
      canvas.style.height = height + "px";
      context.setTransform(dpr, 0, 0, dpr, 0, 0);
    };

    const draw = (time: number) => {
      if (!isVisible) return;

      context.clearRect(0, 0, width, height);
      const centerX = width * 0.58;
      const centerY = height * 0.42;
      const slowTime = time * 0.000035;

      const nebula = context.createRadialGradient(centerX, centerY, 0, centerX, centerY, Math.max(width, height) * 0.76);
      nebula.addColorStop(0, "rgba(112, 211, 255, 0.13)");
      nebula.addColorStop(0.27, "rgba(183, 121, 255, 0.08)");
      nebula.addColorStop(0.56, "rgba(255, 176, 96, 0.045)");
      nebula.addColorStop(1, "rgba(0, 0, 0, 0)");
      context.fillStyle = nebula;
      context.fillRect(0, 0, width, height);

      context.save();
      context.translate(centerX, centerY);
      context.rotate(slowTime);
      for (let ring = 0; ring < 3; ring += 1) {
        context.beginPath();
        context.ellipse(0, 0, width * (0.28 + ring * 0.12), height * (0.13 + ring * 0.045), -0.18, 0, Math.PI * 2);
        context.strokeStyle = "rgba(181, 220, 255, " + (0.085 - ring * 0.018) + ")";
        context.lineWidth = 1;
        context.stroke();
      }
      context.restore();

      stars.forEach((star) => {
        const x = ((star.x + time * star.drift) % 1) * width;
        const y = (star.y + Math.sin(time * 0.00012 + star.phase) * 0.018) * height;
        const glow = Math.max(0.08, star.opacity + Math.sin(time * 0.001 + star.phase) * 0.12);
        context.beginPath();
        context.arc(x, y, star.radius, 0, Math.PI * 2);
        context.fillStyle = "rgba(229, 244, 255, " + glow + ")";
        context.fill();
      });

      animationFrame = requestAnimationFrame(draw);
    };

    const onVisibilityChange = () => {
      isVisible = document.visibilityState === "visible";
      if (isVisible) animationFrame = requestAnimationFrame(draw);
      else cancelAnimationFrame(animationFrame);
    };

    resize();
    animationFrame = requestAnimationFrame(draw);
    window.addEventListener("resize", resize);
    document.addEventListener("visibilitychange", onVisibilityChange);

    return () => {
      cancelAnimationFrame(animationFrame);
      window.removeEventListener("resize", resize);
      document.removeEventListener("visibilitychange", onVisibilityChange);
    };
  }, []);

  return (
    <div className="pointer-events-none fixed inset-0 z-0 overflow-hidden bg-[#05070d]" aria-hidden="true">
      <canvas ref={canvasRef} className="absolute inset-0 opacity-90" />
      <div className="absolute inset-0 bg-[radial-gradient(circle_at_16%_20%,rgba(255,176,96,0.14),transparent_24%),radial-gradient(circle_at_86%_8%,rgba(97,188,255,0.18),transparent_29%),radial-gradient(circle_at_72%_78%,rgba(137,92,246,0.12),transparent_34%),linear-gradient(180deg,rgba(5,7,13,0.08),rgba(5,7,13,0.94))]" />
      <div className="dashboard-orbit-drift absolute -left-[18vw] top-[18vh] h-[58vw] w-[58vw] rounded-full border border-cyan-200/10 shadow-[0_0_90px_rgba(88,166,255,0.18),inset_0_0_70px_rgba(255,255,255,0.025)]" />
      <div className="dashboard-planet-shadow absolute right-[-10vw] top-[6vh] h-[34vw] w-[34vw] rounded-full bg-[radial-gradient(circle_at_35%_32%,rgba(255,220,177,0.18),rgba(126,92,255,0.08)_42%,transparent_68%)] blur-[1px]" />
      <div className="absolute inset-0 opacity-[0.12] [background-image:linear-gradient(rgba(255,255,255,0.07)_1px,transparent_1px),linear-gradient(90deg,rgba(255,255,255,0.05)_1px,transparent_1px)] [background-size:72px_72px] [mask-image:radial-gradient(circle_at_50%_18%,black,transparent_72%)]" />
      <div className="dashboard-light-sweep absolute inset-0 bg-[linear-gradient(120deg,transparent_0%,rgba(255,255,255,0.05)_42%,transparent_58%)]" />
    </div>
  );
}

export default function DashboardPage() {
  return (
    <div className="mission-dashboard relative isolate -mx-4 -mt-16 min-h-[calc(100vh-4rem)] overflow-hidden px-4 pb-12 pt-20 text-slate-100 md:-mx-6 md:-mt-6 md:px-6 md:pt-8 lg:-mx-8 lg:px-8">
      <OrbitalBackdrop />
      <div className="pointer-events-none absolute inset-x-0 top-0 z-0 h-44 bg-gradient-to-b from-[#05070d] via-[#05070d]/80 to-transparent" aria-hidden="true" />

      <div className="relative z-10 mx-auto flex max-w-[1500px] flex-col gap-6 select-none">
        <OnboardingTour />
        <DashboardHero />
        <DashboardUpcomingMissions />
        <section className="grid gap-6 xl:grid-cols-[minmax(0,1.55fr)_minmax(330px,0.75fr)]">
          <DashboardStudyChart />
          <DashboardLeaderboardWidget />
        </section>
        <DashboardRecentNotebooks />
        <DashboardQuizFlashcards />
      </div>
    </div>
  );
}
