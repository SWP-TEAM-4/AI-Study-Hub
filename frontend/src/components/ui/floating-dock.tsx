import { cn } from "../../lib/utils";
import { AnimatePresence, motion, useMotionValue, useSpring, useTransform } from "framer-motion";
import { useRef, useState } from "react";

export const FloatingDock = ({
    items,
    desktopClassName,
}: {
    items: { title: string; icon: React.ReactNode; onClick?: () => void }[];
    desktopClassName?: string;
}) => {
    return (
        <FloatingDockDesktop
            items={items}
            className={desktopClassName}
        />
    );
};
const FloatingDockDesktop = ({
    items,
    className,
}: {
    items: { title: string; icon: React.ReactNode; onClick?: () => void }[];
    className?: string;
}) => {
    // Khởi tạo mouseX là Infinity
    let mouseX = useMotionValue(Infinity);
    return (
        <motion.div
            // Sửa từ e.pageY thành e.pageX
            onMouseMove={(e) => mouseX.set(e.pageX)}
            onMouseLeave={() => mouseX.set(Infinity)}
            className={cn(
                "mx-auto flex h-16 gap-4 items-center rounded-2xl bg-white/10 dark:bg-neutral-900/50 backdrop-blur-md border border-white/20 dark:border-neutral-800 px-4 shadow-xl z-50",
                className
            )}
        >
            {items.map((item) => (
                <IconContainer mouseX={mouseX} key={item.title} {...item} />
            ))}
        </motion.div>
    );
};
function IconContainer({
    mouseX,
    title,
    icon,
    onClick,
}: {
    mouseX: any;
    title: string;
    icon: React.ReactNode;
    onClick?: () => void;
}) {
    // Đổi ref thành HTMLButtonElement
    let ref = useRef<HTMLButtonElement>(null);

    let distance = useTransform(mouseX, (val: number) => {
        let bounds = ref.current?.getBoundingClientRect() ?? { x: 0, width: 0 };
        return val - bounds.x - bounds.width / 2;
    });

    // Khôi phục lại tỷ lệ phóng đại chuẩn của Aceternity UI (tối đa là 80px)
    let widthTransform = useTransform(distance, [-150, 0, 150], [40, 80, 40]);
    let heightTransform = useTransform(distance, [-150, 0, 150], [40, 80, 40]);

    let widthTransformIcon = useTransform(distance, [-150, 0, 150], [20, 40, 20]);
    let heightTransformIcon = useTransform(distance, [-150, 0, 150], [20, 40, 20]);

    let width = useSpring(widthTransform, { mass: 0.1, stiffness: 150, damping: 12 });
    let height = useSpring(heightTransform, { mass: 0.1, stiffness: 150, damping: 12 });

    let widthIcon = useSpring(widthTransformIcon, { mass: 0.1, stiffness: 150, damping: 12 });
    let heightIcon = useSpring(heightTransformIcon, { mass: 0.1, stiffness: 150, damping: 12 });

    const [hovered, setHovered] = useState(false);

    return (
        <motion.button
            ref={ref}
            style={{ width, height }}
            onClick={onClick}
            onMouseEnter={() => setHovered(true)}
            onMouseLeave={() => setHovered(false)}
            className="relative flex aspect-square items-center justify-center rounded-full border border-neutral-200 bg-gray-100 dark:border-neutral-700 dark:bg-neutral-800 transition-colors hover:bg-gray-200 dark:hover:bg-neutral-700 focus:outline-none"
        >
            {/* Tooltip hiện tên */}
            <AnimatePresence>
                {hovered && (
                    <motion.div
                        initial={{ opacity: 0, y: 10, x: "-50%" }}
                        animate={{ opacity: 1, y: 0, x: "-50%" }}
                        exit={{ opacity: 0, y: 2, x: "-50%" }}
                        className="px-2 py-1 whitespace-pre rounded-md bg-neutral-900 text-white dark:bg-white dark:text-neutral-950 absolute left-1/2 -top-10 text-xs font-medium w-fit shadow-md pointer-events-none z-50"
                    >
                        {title}
                    </motion.div>
                )}
            </AnimatePresence>

            {/* Wrapper bọc icon co giãn theo chuột */}
            <motion.div
                style={{ width: widthIcon, height: heightIcon }}
                // Thêm các class Tailwind tinh chỉnh SVG dưới đây
                className="flex items-center justify-center text-neutral-600 dark:text-neutral-300 [&>svg]:w-full [&>svg]:h-full"
            >
                {icon}
            </motion.div>
        </motion.button>
    );
}