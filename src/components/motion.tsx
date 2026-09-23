"use client";

import { useEffect, useRef, useState } from "react";

/**
 * FadeIn — 克制的入场动效：opacity + translateY
 * 只触发一次，移动端去掉位移
 */
export function FadeIn({
  children,
  delay = 0,
  className = "",
}: {
  children: React.ReactNode;
  delay?: number;
  className?: string;
}) {
  const ref = useRef<HTMLDivElement>(null);
  const [visible, setVisible] = useState(false);

  useEffect(() => {
    const el = ref.current;
    if (!el) return;
    const observer = new IntersectionObserver(
      (entries) => {
        entries.forEach((entry) => {
          if (entry.isIntersecting) {
            setVisible(true);
            observer.disconnect();
          }
        });
      },
      { threshold: 0.1, rootMargin: "0px 0px -40px 0px" }
    );
    observer.observe(el);
    return () => observer.disconnect();
  }, []);

  const isMobile = typeof window !== "undefined" && window.innerWidth < 640;

  return (
    <div
      ref={ref}
      className={className}
      style={{
        opacity: visible ? 1 : 0,
        transform: visible ? "translateY(0)" : isMobile ? "translateY(0)" : "translateY(16px)",
        transition: `opacity var(--motion-slow, 400ms) var(--motion-ease-out, cubic-bezier(0.16,1,0.3,1)) ${delay}ms, transform var(--motion-slow, 400ms) var(--motion-ease-out, cubic-bezier(0.16,1,0.3,1)) ${delay}ms`,
      }}
    >
      {children}
    </div>
  );
}

/**
 * StaggerGroup — 子元素依次入场
 */
export function StaggerGroup({
  children,
  step = 70,
  className = "",
}: {
  children: React.ReactNode[];
  step?: number;
  className?: string;
}) {
  return (
    <div className={className}>
      {children.map((child, i) => (
        <FadeIn key={i} delay={i * step}>
          {child}
        </FadeIn>
      ))}
    </div>
  );
}

/**
 * CountUp — 数字滚动
 */
export function CountUp({
  value,
  duration = 1400,
  className = "",
}: {
  value: string;
  duration?: number;
  className?: string;
}) {
  const ref = useRef<HTMLSpanElement>(null);
  const [display, setDisplay] = useState("0");
  const started = useRef(false);

  // 提取数字部分和后缀
  const match = value.match(/^(\d+)(.*)$/);
  const num = match ? parseInt(match[1], 10) : 0;
  const suffix = match ? match[2] : value;
  const hasNumber = !!match;

  useEffect(() => {
    const el = ref.current;
    if (!el || !hasNumber) return;

    const observer = new IntersectionObserver(
      (entries) => {
        entries.forEach((entry) => {
          if (entry.isIntersecting && !started.current) {
            started.current = true;
            const start = performance.now();
            const tick = (now: number) => {
              const elapsed = now - start;
              const progress = Math.min(elapsed / duration, 1);
              const eased = 1 - Math.pow(1 - progress, 3);
              setDisplay(Math.round(num * eased).toString());
              if (progress < 1) requestAnimationFrame(tick);
            };
            requestAnimationFrame(tick);
            observer.disconnect();
          }
        });
      },
      { threshold: 0.1 }
    );
    observer.observe(el);
    return () => observer.disconnect();
  }, [num, duration, hasNumber]);

  if (!hasNumber) {
    return <span ref={ref} className={className}>{value}</span>;
  }

  return (
    <span ref={ref} className={className}>
      {display}{suffix}
    </span>
  );
}
