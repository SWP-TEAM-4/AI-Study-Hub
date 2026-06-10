import type { LucideIcon } from "lucide-react";

export default function Field({
  Icon,
  type,
  placeholder,
}: {
  Icon: LucideIcon;
  type: string;
  placeholder: string;
}) {
  return (
    <div className="liquid-glass rounded-[16px] flex items-center px-4 py-3 gap-3">
      <Icon size={18} className="text-cream/60" />
      <input
        type={type}
        placeholder={placeholder}
        className="bg-transparent outline-none w-full font-mono text-[14px] placeholder:text-cream/40 text-cream"
      />
    </div>
  );
}
