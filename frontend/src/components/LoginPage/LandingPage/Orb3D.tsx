export default function Orb3D() {
  return (
    <div className="scene-3d absolute inset-0 flex items-center justify-center pointer-events-none">
      <div className="relative animate-float-orb" style={{ width: 360, height: 360 }}>
        {/* Core orb */}
        <div className="absolute inset-12 rounded-full bg-[radial-gradient(circle_at_30%_30%,#6FFF00,#0a3d00_70%,#000_100%)] animate-pulse-glow" />
        {/* Rings */}
        <div
          className="absolute inset-0 rounded-full border border-neon/40 animate-spin-slow"
          style={{ transform: "rotateX(70deg)" }}
        />
        <div
          className="absolute inset-4 rounded-full border border-cream/20 animate-spin-slow"
          style={{ transform: "rotateX(60deg) rotateZ(40deg)", animationDuration: "30s" }}
        />
        <div
          className="absolute inset-8 rounded-full border border-purple-400/30 animate-spin-slow"
          style={{ transform: "rotateX(75deg) rotateY(20deg)", animationDuration: "40s" }}
        />
        {/* Orbiting dot */}
        <div
          className="absolute inset-0 animate-spin-slow"
          style={{ transform: "rotateX(70deg)", animationDuration: "12s" }}
        >
          <div className="absolute top-0 left-1/2 -translate-x-1/2 w-3 h-3 rounded-full bg-neon shadow-[0_0_20px_#6FFF00]" />
        </div>
      </div>
    </div>
  );
}
