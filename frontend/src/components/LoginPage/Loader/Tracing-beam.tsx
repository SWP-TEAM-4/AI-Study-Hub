"use client";
import React, { useEffect, useRef, useState } from "react";
import {
    motion,
    useTransform,
    useScroll,
    useSpring,
} from "motion/react";
import { cn } from "../../../../utils";

export const TracingBeam = ({
    children,
    className,
}: {
    children: React.ReactNode;
    className?: string;
}) => {
    const ref = useRef<HTMLDivElement>(null);

    // Lắng nghe trực tiếp tiến trình cuộn của container chứa nó
    const { scrollYProgress } = useScroll({
        target: ref,
        offset: ["start start", "end end"],
    });

    const contentRef = useRef<HTMLDivElement>(null);
    const [svgHeight, setSvgHeight] = useState(0);

    useEffect(() => {
        if (contentRef.current) {
            setSvgHeight(contentRef.current.offsetHeight);
        }
    }, [children]);

    const y1 = useSpring(
        useTransform(scrollYProgress, [0, 0.8], [50, svgHeight]),
        { stiffness: 500, damping: 90 }
    );
    const y2 = useSpring(
        useTransform(scrollYProgress, [0, 1], [50, svgHeight - 200]),
        { stiffness: 500, damping: 90 }
    );

    return (
        <motion.div
            ref={ref}
            className={cn("relative w-full json-beam-container", className)}
        >
            {/* Định vị thanh Beam nằm ở phía bên trái của phần nội dung landing page */}
            <div className="absolute top-3 left-4 md:left-8 z-20">
                <motion.div
                    transition={{ duration: 0.2, delay: 0.5 }}
                    animate={{
                        boxShadow:
                            scrollYProgress.get() > 0
                                ? "none"
                                : "rgba(0, 0, 0, 0.24) 0px 3px 8px",
                    }}
                    className="ml-[27px] flex h-4 w-4 items-center justify-center rounded-full border border-neutral-700 bg-space shadow-sm"
                >
                    <motion.div
                        transition={{ duration: 0.2, delay: 0.5 }}
                        animate={{
                            backgroundColor: scrollYProgress.get() > 0 ? "#A3E635" : "#10b981", // Màu neon phối hợp với Orbis
                            borderColor: scrollYProgress.get() > 0 ? "#A3E635" : "#059669",
                        }}
                        className="h-2 w-2 rounded-full border bg-white"
                    />
                </motion.div>

                <svg
                    viewBox={`0 0 20 ${svgHeight}`}
                    width="20"
                    height={svgHeight}
                    className="ml-4 block"
                    aria-hidden="true"
                >
                    <motion.path
                        d={`M 1 0V -36 l 18 24 V ${svgHeight * 0.8} l -18 24V ${svgHeight}`}
                        fill="none"
                        stroke="#ffffff"
                        strokeOpacity="0.1"
                        strokeWidth="1.5"
                    />
                    <motion.path
                        d={`M 1 0V -36 l 18 24 V ${svgHeight * 0.8} l -18 24V ${svgHeight}`}
                        fill="none"
                        stroke="url(#orbis-beam-gradient)"
                        strokeWidth="2"
                        className="motion-reduce:hidden"
                    />
                    <defs>
                        <motion.linearGradient
                            id="orbis-beam-gradient"
                            gradientUnits="userSpaceOnUse"
                            x1="0"
                            x2="0"
                            y1={y1}
                            y2={y2}
                        >
                            <stop stopColor="#A3E635" stopOpacity="0" />
                            <stop stopColor="#A3E635" /> {/* Màu Neon của Orbis */}
                            <stop offset="0.325" stopColor="#a855f7" /> {/* Tím mờ chuyển tiếp */}
                            <stop offset="1" stopColor="#6366f1" stopOpacity="0" />
                        </motion.linearGradient>
                    </defs>
                </svg>
            </div>

            <div ref={contentRef} className="w-full">
                {children}
            </div>
        </motion.div>
    );
};