"use client";

import { useEffect, useRef, type ReactNode } from "react";

/**
 * 横向滚动容器：支持鼠标滚轮横向滚动
 */
export default function HorizontalScroll({
  children,
  className = "",
}: {
  children: ReactNode;
  className?: string;
}) {
  const ref = useRef<HTMLDivElement>(null);

  useEffect(() => {
    const el = ref.current;
    if (!el) return;

    const handleWheel = (e: WheelEvent) => {
      // 如果已经是横向滚动，就不处理
      if (Math.abs(e.deltaX) > Math.abs(e.deltaY)) return;

      // 检查是否可以横向滚动
      const canScrollLeft = el.scrollLeft > 0;
      const canScrollRight = el.scrollLeft < el.scrollWidth - el.clientWidth;

      // 如果可以横向滚动，就阻止默认垂直滚动，改为横向滚动
      if ((canScrollLeft && e.deltaY < 0) || (canScrollRight && e.deltaY > 0)) {
        e.preventDefault();
        el.scrollLeft += e.deltaY;
      }
    };

    el.addEventListener("wheel", handleWheel, { passive: false });
    return () => el.removeEventListener("wheel", handleWheel);
  }, []);

  return (
    <div ref={ref} className={`scrollbar-hide overflow-x-auto ${className}`}>
      {children}
    </div>
  );
}
