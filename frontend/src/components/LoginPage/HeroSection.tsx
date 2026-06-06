import { Mail, Twitter, Github } from "lucide-react";
import Header from "./Header";
import SocialBtn from "./SocialBtn";
import { HERO_VIDEO } from "../constants";

export default function HeroSection() {
  return (
    <section className="relative w-full min-h-screen overflow-hidden rounded-b-[32px]">
      <video
        autoPlay
        loop
        muted
        playsInline
        className="absolute inset-0 w-full h-full object-cover"
        src={HERO_VIDEO}
      />
      <div className="relative max-w-[1831px] mx-auto px-5 sm:px-8 lg:px-14 py-6 min-h-screen flex flex-col">
        <Header />

        {/* Hero content */}
        <div className="flex-1 flex items-end pb-20 lg:pb-32">
          <div className="relative lg:ml-32 max-w-[780px]">
            <h1 className="font-grotesk uppercase text-[40px] sm:text-[60px] md:text-[75px] lg:text-[90px] leading-[1.05] sm:leading-[1]">
              Beyond earth
              <br />
              and ( its ) familiar boundaries
            </h1>
            <span className="font-condiment text-neon text-[24px] sm:text-[32px] md:text-[40px] lg:text-[48px] absolute -right-2 lg:right-8 top-2 -rotate-1 opacity-90 mix-blend-exclusion">
              Nft collection
            </span>
          </div>
        </div>

        {/* Mobile socials */}
        <div className="flex lg:hidden justify-center gap-3 pb-10">
          <SocialBtn Icon={Mail} />
          <SocialBtn Icon={Twitter} />
          <SocialBtn Icon={Github} />
        </div>
      </div>
    </section>
  );
}
