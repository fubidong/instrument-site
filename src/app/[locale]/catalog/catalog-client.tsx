"use client";

import { useEffect, useState } from "react";

type CatGrand = { id: string; name: string };
type CatChild = { id: string; name: string; icon: string; children?: CatGrand[] };
type BrandCat = { id: string; name: string; icon: string; children: CatChild[] };
type Brand = {
  id: string;
  code: string;
  name: string;
  description: string;
  logo: string;
  website: string;
  tags: string[];
  categories: BrandCat[];
};
type Tag = { name: string; color: string };
type TopCat = { name: string; sub: string[] };

export default function CatalogClient({
  brands,
  tags,
  info,
  categories,
  locale,
}: {
  brands: Brand[];
  tags: Tag[];
  info: Record<string, string>;
  categories: TopCat[];
  locale: string;
}) {
  const [activeTags, setActiveTags] = useState<string[]>([]);
  const [expanded, setExpanded] = useState<Record<string, boolean>>({});
  const [visible, setVisible] = useState<Set<string>>(new Set());

  const allTags = ["全部", ...tags.map((t) => t.name)];
  const filtered =
    activeTags.length === 0 ? brands : brands.filter((b) => activeTags.every((t) => b.tags.includes(t)));

  function toggleTag(name: string) {
    if (name === "全部") return setActiveTags([]);
    setActiveTags((p) => (p.includes(name) ? p.filter((x) => x !== name) : [...p, name]));
  }

  useEffect(() => {
    const obs = new IntersectionObserver(
      (entries) => {
        entries.forEach((e) => {
          if (e.isIntersecting) setVisible((prev) => new Set(prev).add((e.target as HTMLElement).dataset.id!));
        });
      },
      { threshold: 0.1 }
    );
    document.querySelectorAll("[data-id]").forEach((el) => obs.observe(el));
    return () => obs.disconnect();
  }, [filtered]);

  return (
    <div className="min-h-screen bg-gradient-to-b from-slate-950 via-slate-900 to-slate-950 text-white">
      {/* Hero */}
      <section className="relative overflow-hidden px-6 py-32 text-center">
        <div className="absolute inset-0 bg-[radial-gradient(ellipse_at_top,_var(--tw-gradient-stops))] from-sky-900/40 via-transparent to-transparent" />
        <div className="relative z-10 mx-auto max-w-5xl">
          <div className="mb-4 text-sm font-medium tracking-[0.3em] text-sky-400">PRODUCT CATALOG</div>
          <h1 className="bg-gradient-to-b from-white to-slate-400 bg-clip-text text-5xl font-black leading-tight text-transparent md:text-7xl">
            {info.heroTitle ?? "产品目录"}
          </h1>
          <p className="mx-auto mt-6 max-w-2xl text-lg leading-relaxed text-slate-400">{info.heroSub}</p>
        </div>
      </section>

      {/* 合作品牌全景 */}
      <section className="border-t border-white/10 px-6 py-16">
        <div className="mx-auto max-w-7xl">
          <div className="mb-10 text-center">
            <h2 className="text-3xl font-bold">合作品牌</h2>
            <p className="mt-3 text-slate-400">全球知名测试测量仪器品牌 · 原厂授权</p>
          </div>
          <div className="grid grid-cols-3 gap-4 sm:grid-cols-4 md:grid-cols-6 lg:grid-cols-8">
            {brands.map((b) => (
              <a
                key={b.id}
                href={b.website || "#"}
                target="_blank"
                rel="noopener noreferrer"
                className="group flex aspect-video items-center justify-center rounded-xl border border-white/10 bg-white/[0.03] p-4 transition hover:border-sky-400/40 hover:bg-white/[0.07]"
              >
                {b.logo ? (
                  <img src={b.logo} alt={b.name} className="max-h-full max-w-full object-contain brightness-0 invert transition group-hover:brightness-100" />
                ) : (
                  <span className="text-sm font-medium text-slate-300">{b.name}</span>
                )}
              </a>
            ))}
          </div>
        </div>
      </section>

      {/* 产品品类全景 */}
      <section className="border-t border-white/10 bg-white/[0.02] px-6 py-16">
        <div className="mx-auto max-w-7xl">
          <div className="mb-10 text-center">
            <h2 className="text-3xl font-bold">产品品类</h2>
            <p className="mt-3 text-slate-400">覆盖电子测量、光电、通信、电源、射频、电磁兼容等领域</p>
          </div>
          <div className="grid gap-4 sm:grid-cols-2 md:grid-cols-3 lg:grid-cols-4">
            {categories.map((c) => (
              <div key={c.name} className="rounded-xl border border-white/10 bg-white/[0.03] p-5 transition hover:border-sky-400/30">
                <div className="text-base font-semibold">{c.name}</div>
              </div>
            ))}
          </div>
        </div>
      </section>

      {/* 标签筛选 */}
      <section className="px-6 py-12">
        <div className="mx-auto flex max-w-6xl flex-wrap items-center justify-center gap-3">
          {allTags.map((name) => {
            const tag = tags.find((t) => t.name === name);
            const active = name === "全部" ? activeTags.length === 0 : activeTags.includes(name);
            return (
              <button
                key={name}
                onClick={() => toggleTag(name)}
                className={`rounded-full px-5 py-2 text-sm font-medium transition-all duration-300 ${
                  active ? "text-white shadow-lg" : "border border-white/10 bg-white/5 text-slate-300 hover:bg-white/10"
                }`}
                style={active && tag ? { backgroundColor: tag.color, boxShadow: `0 10px 30px -10px ${tag.color}` } : {}}
              >
                {name}
              </button>
            );
          })}
        </div>
      </section>

      {/* 品牌卡片 */}
      <section className="mx-auto max-w-7xl px-6 pb-24">
        <div className="grid gap-6 md:grid-cols-2 lg:grid-cols-3">
          {filtered.map((b, idx) => {
            const isVisible = visible.has(b.id);
            return (
              <div
                key={b.id}
                data-id={b.id}
                style={{ transitionDelay: `${idx * 60}ms` }}
                className={`group relative overflow-hidden rounded-2xl border border-white/10 bg-gradient-to-br from-white/[0.07] to-white/[0.02] p-6 backdrop-blur transition-all duration-700 hover:border-sky-400/50 hover:shadow-2xl hover:shadow-sky-500/10 ${
                  isVisible ? "translate-y-0 opacity-100" : "translate-y-8 opacity-0"
                }`}
              >
                <div className="absolute -right-20 -top-20 h-40 w-40 rounded-full bg-sky-500/10 blur-3xl transition-all duration-500 group-hover:bg-sky-500/20" />

                <div className="relative flex items-start justify-between">
                  <div className="flex-1">
                    {b.logo ? (
                      <img src={b.logo} alt={b.name} className="mb-3 h-10 object-contain brightness-0 invert" />
                    ) : (
                      <h3 className="mb-2 text-2xl font-bold">{b.name}</h3>
                    )}
                    <p className="line-clamp-2 text-xs leading-relaxed text-slate-400">{b.description}</p>
                  </div>
                  {b.website && (
                    <a
                      href={b.website}
                      target="_blank"
                      rel="noopener noreferrer"
                      className="ml-3 rounded-lg border border-white/10 p-2 text-slate-400 transition hover:border-sky-400 hover:text-sky-400"
                      title="访问官网"
                    >
                      <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth={1.8} className="h-4 w-4">
                        <path strokeLinecap="round" strokeLinejoin="round" d="M13.5 6H18m0 0v4.5M18 6l-7.5 7.5M6 18h12M6 18H4.5A1.5 1.5 0 013 16.5v-12A1.5 1.5 0 014.5 3H12" />
                      </svg>
                    </a>
                  )}
                </div>

                {b.tags.length > 0 && (
                  <div className="relative mt-4 flex flex-wrap gap-1.5">
                    {b.tags.map((t) => {
                      const tag = tags.find((x) => x.name === t);
                      return (
                        <span
                          key={t}
                          className="rounded px-2 py-0.5 text-[10px] font-medium"
                          style={{ backgroundColor: (tag?.color ?? "#0ea5e9") + "22", color: tag?.color ?? "#7dd3fc" }}
                        >
                          {t}
                        </span>
                      );
                    })}
                  </div>
                )}

                {b.categories.length > 0 && (
                  <div className="relative mt-5 border-t border-white/10 pt-4">
                    <button
                      onClick={() => setExpanded((p) => ({ ...p, [b.id]: !p[b.id] }))}
                      className="flex w-full items-center justify-between text-sm text-slate-300 transition hover:text-white"
                    >
                      <span className="font-medium">{b.categories.length} 个产品分类</span>
                      <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth={2} className={`h-4 w-4 transition-transform duration-300 ${expanded[b.id] ? "rotate-180" : ""}`}>
                        <path strokeLinecap="round" strokeLinejoin="round" d="M19 9l-7 7-7-7" />
                      </svg>
                    </button>
                    <div className={`grid transition-all duration-500 ${expanded[b.id] ? "mt-3 grid-rows-[1fr] opacity-100" : "grid-rows-[0fr] opacity-0"}`}>
                      <div className="overflow-hidden">
                        <div className="flex flex-wrap gap-2">
                          {b.categories.map((c) => (
                            <div key={c.id} className="rounded-lg border border-white/10 bg-white/5 px-3 py-2">
                              <div className="text-xs font-medium text-slate-200">{c.name}</div>
                              {c.children.length > 0 && (
                                <div className="mt-1.5 space-y-1.5">
                                  {c.children.map((ch) => (
                                    <div key={ch.id} className="text-xs">
                                      <div className="font-medium text-sky-300">{ch.name}</div>
                                      {ch.children && ch.children.length > 0 && (
                                        <div className="ml-2 mt-0.5 flex flex-wrap gap-1">
                                          {ch.children.map((g) => (
                                            <span key={g.id} className="rounded bg-white/10 px-1.5 py-0.5 text-[10px] text-slate-400">
                                              {g.name}
                                            </span>
                                          ))}
                                        </div>
                                      )}
                                    </div>
                                  ))}
                                </div>
                              )}
                            </div>
                          ))}
                        </div>
                      </div>
                    </div>
                  </div>
                )}
              </div>
            );
          })}
        </div>
      </section>

      {/* 公司介绍 */}
      <section className="border-t border-white/10 bg-white/[0.02] px-6 py-20">
        <div className="mx-auto max-w-6xl">
          {/* 公司简介整栏 */}
          <div className="mb-12 text-center">
            <h2 className="text-3xl font-bold">{info.aboutTitle ?? "关于我们"}</h2>
            <p className="mx-auto mt-4 max-w-3xl leading-relaxed text-slate-300">{info.aboutText}</p>
            <div className="mt-8 grid gap-8 grid-cols-3">
              {[
                { num: info.statBrands ?? "20+", label: "代理品牌" },
                { num: info.statModels ?? "3700+", label: "产品型号" },
                { num: info.statSupport ?? "100%", label: "原厂授权" },
              ].map((s) => (
                <div key={s.label} className="text-center">
                  <div className="bg-gradient-to-br from-sky-400 to-cyan-400 bg-clip-text text-4xl font-black text-transparent">{s.num}</div>
                  <div className="mt-2 text-sm text-slate-400">{s.label}</div>
                </div>
              ))}
            </div>
          </div>
          {/* 地址联系方式 + 微信公众号 + 地图 左右两栏 */}
          <div className="grid gap-10 md:grid-cols-2">
            <div className="space-y-3 rounded-lg border border-white/10 bg-white/5 p-5">
              <div className="flex gap-3">
                <span className="w-20 shrink-0 text-slate-500">公司地址：</span>
                <span className="text-slate-200">{info.address || "深圳市"}</span>
              </div>
              <div className="flex gap-3">
                <span className="w-20 shrink-0 text-slate-500">联系方式：</span>
                <span className="text-slate-200">{info.phone || "0755-8888 6666"}</span>
              </div>
              {info.wechatQr && (
                <div className="pt-3">
                  <div className="text-slate-500">微信公众号：</div>
                  <img src={info.wechatQr} alt="微信公众号" className="mt-2 h-32 w-32 rounded" />
                </div>
              )}
            </div>
            <div className="overflow-hidden rounded-xl border border-white/10">
              <iframe
                src={info.mapUrl || "https://api.map.baidu.com/staticimage/v2?center=114.057868,22.543099&width=600&height=400&zoom=15&markers=114.057868,22.543099"}
                className="h-full min-h-[280px] w-full"
                style={{ border: 0 }}
                loading="lazy"
              />
            </div>
          </div>
        </div>
      </section>

      {/* CTA */}
      <section className="border-t border-white/10 bg-gradient-to-r from-sky-900/20 via-transparent to-cyan-900/20 px-6 py-20 text-center">
        <h2 className="text-3xl font-bold md:text-4xl">需要选型支持？</h2>
        <p className="mx-auto mt-4 max-w-xl text-slate-400">专业工程师团队为您提供原厂授权产品选型、技术咨询与快速报价服务</p>
        <a href={`/${locale}/contact`} className="mt-8 inline-block rounded-full bg-sky-500 px-8 py-3 font-semibold text-white shadow-lg shadow-sky-500/30 transition hover:bg-sky-400">
          联系我们 →
        </a>
      </section>
    </div>
  );
}
