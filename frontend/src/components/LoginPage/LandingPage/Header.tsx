import { Mail, Twitter, Github } from "lucide-react";
import SocialBtn from "./SocialBtn";
import { NAV } from "../../constants";

export default function Header() {
  return (
    <header className="flex items-center justify-between">
      <span className="font-grotesk text-[16px] uppercase tracking-wider">
        AI Study Hub
      </span>
      <nav className="hidden lg:block liquid-glass rounded-[28px] px-[52px] py-[24px]">
        <ul className="flex gap-10">
          {NAV.map((n) => (
            <li key={n}>
              <a
                href="#"  
                className="font-grotesk text-[13px] uppercase tracking-wider hover:text-neon transition"
              >
                {n}
              </a>
            </li>
          ))}
        </ul>
      </nav>
      <div className="hidden lg:flex flex-col gap-3">
        <SocialBtn Icon={Mail} />
        <SocialBtn Icon={Twitter} />
        <SocialBtn Icon={Github} />
      </div>
    </header>
  );
}
