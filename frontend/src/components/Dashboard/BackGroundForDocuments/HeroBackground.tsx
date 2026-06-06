import { type ReactNode } from "react";
import "./HeroBackground.css";

interface HeroBackgroundProps {
  videoSrc?: string;
  poster?: string;
  showVeil?: boolean;
  showFrame?: boolean;
  children?: ReactNode;
}

export default function HeroBackground({
  videoSrc = "/hf_20260314_131748_f2ca2a28-fed7-44c8-b9a9-bd9acdd5ec31.mp4",
  poster,
  showVeil = true,
  showFrame = true,
  children,
}: HeroBackgroundProps) {
  return (
    // Thay đổi: Đổi minHeight thành width/height 100% để vừa khít vùng upload cha
    <div className="hero-bg" style={{ position: "relative", width: "100%", height: "100%", overflow: "hidden" }}>
      <video
        className="hero-bg__video"
        autoPlay
        muted
        loop
        playsInline
        preload="auto"
        poster={poster}
        style={{
          position: "absolute",
          top: 0,
          left: 0,
          width: "100%",
          height: "100%",
          objectFit: "cover",
          zIndex: 1,
        }}
      >
        <source src={videoSrc} type="video/mp4" />
      </video>

      {showVeil && (
        <div 
          className="hero-bg__veil" 
          style={{ position: "absolute", top: 0, left: 0, width: "100%", height: "100%", zIndex: 2 }} 
        />
      )}
      
      {showFrame && <div className="hero-bg__frame" style={{ position: "absolute", zIndex: 2 }} />}

      {children && (
        <div className="hero-bg__content" style={{ position: "relative", zIndex: 3 }}>
          {children}
        </div>
      )}
    </div>
  );
}