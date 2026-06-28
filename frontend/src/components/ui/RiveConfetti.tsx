import { useRive, Layout, Fit, Alignment } from "@rive-app/react-canvas";

interface RiveConfettiProps {
  className?: string;
}

export function RiveConfetti({ className = "" }: RiveConfettiProps) {
  const { RiveComponent } = useRive({
    src: "/6626-12821-confit-animation.riv",
    autoplay: true,
    layout: new Layout({
      fit: Fit.Cover,
      alignment: Alignment.Center,
    }),
  });

  return (
    <div className={`absolute inset-0 pointer-events-none z-20 overflow-hidden ${className}`}>
      <RiveComponent style={{ width: "100%", height: "100%" }} />
    </div>
  );
}
