import type { LucideIcon } from "lucide-react";

export default function SocialBtn({
  Icon,
  className = "",
}: {
  Icon: LucideIcon;
  className?: string;
}) {
  return (
    <button
      className={`liquid-glass rounded-[1rem] w-14 h-14 flex items-center justify-center text-cream hover:bg-white/10 transition ${className}`}
    >
      <Icon size={20} />
    </button>
  );
}
