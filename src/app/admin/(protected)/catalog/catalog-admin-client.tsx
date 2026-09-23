"use client";

import { useEffect, useState } from "react";

type Tag = { id: string; name: string; color: string; sortOrder: number };
type BrandRow = { id: string; name: string; code: string; sortOrder: number; tags: string[] };
type MediaAsset = { id: string; url: string; name: string };

export default function CatalogAdminClient({
  tags,
  info,
  brands,
  mediaAssets,
}: {
  tags: Tag[];
  info: Record<string, string>;
  brands: BrandRow[];
  mediaAssets: MediaAsset[];
}) {
  const [msg, setMsg] = useState("");
  const [pickerFor, setPickerFor] = useState<string | null>(null);
  const [infoValues, setInfoValues] = useState<Record<string, string>>(info);
  const [brandTags, setBrandTags] = useState<Record<string, string[]>>(
    Object.fromEntries(brands.map((b) => [b.id, b.tags]))
  );
  const [sortValues, setSortValues] = useState<Record<string, number>>(
    Object.fromEntries(brands.map((b) => [b.id, b.sortOrder]))
  );
  const [cats, setCats] = useState<{ id: string; name: string; sortOrder: number }[]>([]);
  const [catsOpen, setCatsOpen] = useState(false);
  const [newCat, setNewCat] = useState("");

  async function loadCats() {
    const r = await fetch("/api/admin/catalog/categories");
    setCats(await r.json());
  }
  useEffect(() => { loadCats(); }, []);

  async function addCat() {
    if (!newCat.trim()) return;
    await fetch("/api/admin/catalog/categories", { method: "POST", body: JSON.stringify({ name: newCat }) });
    setNewCat("");
    loadCats();
  }
  async function updateCat(id: string, name: string, sortOrder: number) {
    await fetch(`/api/admin/catalog/categories/${id}`, { method: "PUT", body: JSON.stringify({ name, sortOrder }) });
    loadCats();
  }
  async function deleteCat(id: string) {
    if (!confirm("确认删除这个品类？")) return;
    await fetch(`/api/admin/catalog/categories/${id}`, { method: "DELETE" });
    loadCats();
  }

  async function saveInfo() {
    const res = await fetch("/api/admin/catalog/info", {
      method: "POST",
      body: JSON.stringify(infoValues),
    });
    setMsg(res.ok ? "公司信息已保存" : "保存失败");
  }

  async function saveTag(id: string, formData: FormData) {
    await fetch(`/api/admin/catalog/tags/${id}`, { method: "POST", body: JSON.stringify(Object.fromEntries(formData)) });
    setMsg("标签已保存");
  }

  async function saveBrand(id: string) {
    await fetch(`/api/admin/catalog/brands/${id}`, {
      method: "POST",
      body: JSON.stringify({ sortOrder: sortValues[id], tags: brandTags[id] }),
    });
    setMsg("品牌已保存");
  }

  function pickImage(url: string) {
    if (pickerFor) setInfoValues((v) => ({ ...v, [pickerFor]: url }));
    setPickerFor(null);
  }

  return (
    <div className="space-y-8">
      <h1 className="text-xl font-bold">产品目录管理</h1>
      {msg && <div className="rounded bg-green-50 px-3 py-2 text-sm text-green-700">{msg}</div>}

      {/* 公司信息 */}
      <section className="rounded-lg border bg-white p-6">
        <h2 className="mb-4 text-lg font-semibold">公司介绍</h2>
        <div className="space-y-3">
          {[
            ["heroTitle", "Hero 标题"],
            ["heroSub", "Hero 副标题"],
            ["aboutTitle", "关于我们标题"],
            ["aboutText", "关于我们正文"],
            ["statBrands", "统计-代理品牌数"],
            ["statModels", "统计-产品型号数"],
            ["statSupport", "统计-支持率"],
            ["address", "公司地址"],
            ["mapUrl", "百度地图 iframe 链接"],
            ["phone", "联系电话"],
          ].map(([k, label]) => (
            <div key={k}>
              <label className="mb-1 block text-sm text-slate-600">{label}</label>
              <input
                value={infoValues[k] ?? ""}
                onChange={(e) => setInfoValues((v) => ({ ...v, [k]: e.target.value }))}
                className="w-full rounded border px-3 py-2 text-sm"
              />
            </div>
          ))}
          <div>
            <label className="mb-1 block text-sm text-slate-600">微信公众号二维码</label>
            <div className="flex items-center gap-2">
              <input
                value={infoValues.wechatQr ?? ""}
                onChange={(e) => setInfoValues((v) => ({ ...v, wechatQr: e.target.value }))}
                className="flex-1 rounded border px-3 py-2 text-sm"
              />
              <button
                type="button"
                onClick={() => setPickerFor("wechatQr")}
                className="rounded border px-3 py-2 text-sm"
              >
                从素材库选择
              </button>
              {infoValues.wechatQr && (
                <img src={infoValues.wechatQr} alt="qr" className="h-10 w-10 rounded border object-cover" />
              )}
            </div>
          </div>
          <button onClick={saveInfo} className="rounded bg-sky-600 px-4 py-2 text-sm text-white">
            保存公司信息
          </button>
        </div>
      </section>

      {/* 标签管理 */}
      <section className="rounded-lg border bg-white p-6">
        <h2 className="mb-4 text-lg font-semibold">标签管理</h2>
        <div className="space-y-2">
          {tags.map((t) => (
            <form key={t.id} action={(fd) => saveTag(t.id, fd)} className="flex items-center gap-3 rounded border p-3">
              <input name="name" defaultValue={t.name} className="w-32 rounded border px-2 py-1 text-sm" />
              <input name="color" type="color" defaultValue={t.color} className="h-8 w-12" />
              <input name="sortOrder" type="number" defaultValue={t.sortOrder} className="w-20 rounded border px-2 py-1 text-sm" />
              <button className="rounded bg-sky-600 px-3 py-1 text-sm text-white">保存</button>
            </form>
          ))}
        </div>
      </section>

      {/* 品类管理 */}
      <section className="rounded-lg border bg-white p-6">
        <button onClick={() => setCatsOpen(!catsOpen)} className="flex w-full items-center justify-between text-left">
          <h2 className="text-lg font-semibold">产品品类（前台"产品品类"区展示，共 {cats.length} 个）</h2>
          <span className="text-xl text-slate-400">{catsOpen ? "▾" : "▸"}</span>
        </button>
        {catsOpen && (
        <>
        <div className="mt-4 mb-4 flex gap-2">
          <input
            value={newCat}
            onChange={(e) => setNewCat(e.target.value)}
            placeholder="新品类名称，如：示波器"
            className="flex-1 rounded border px-3 py-2 text-sm"
          />
          <button onClick={addCat} className="rounded bg-sky-600 px-4 py-2 text-sm text-white">新增</button>
        </div>
        <table className="w-full text-sm">
          <thead>
            <tr className="border-b text-left text-slate-500">
              <th className="py-2">排序</th>
              <th>名称</th>
              <th></th>
            </tr>
          </thead>
          <tbody>
            {cats.map((c) => (
              <tr key={c.id} className="border-b">
                <td className="py-2">
                  <input
                    type="number"
                    defaultValue={c.sortOrder}
                    onBlur={(e) => updateCat(c.id, c.name, Number(e.target.value))}
                    className="w-16 rounded border px-2 py-1"
                  />
                </td>
                <td>
                  <input
                    defaultValue={c.name}
                    onBlur={(e) => updateCat(c.id, e.target.value, c.sortOrder)}
                    className="w-48 rounded border px-2 py-1"
                  />
                </td>
                <td>
                  <button onClick={() => deleteCat(c.id)} className="rounded bg-red-500 px-3 py-1 text-white">删除</button>
                </td>
              </tr>
            ))}
          </tbody>
        </table>
        </>
        )}
      </section>

      {/* 品牌排序与标签 */}
      <section className="rounded-lg border bg-white p-6">
        <h2 className="mb-4 text-lg font-semibold">品牌排序与标签</h2>
        <table className="w-full text-sm">
          <thead>
            <tr className="border-b text-left text-slate-500">
              <th className="py-2">排序</th>
              <th>品牌</th>
              <th>标签</th>
              <th></th>
            </tr>
          </thead>
          <tbody>
            {brands.map((b) => (
              <tr key={b.id} className="border-b">
                <td className="py-2">
                  <input
                    type="number"
                    value={sortValues[b.id]}
                    onChange={(e) => setSortValues((v) => ({ ...v, [b.id]: Number(e.target.value) }))}
                    className="w-16 rounded border px-2 py-1"
                  />
                </td>
                <td className="px-2">{b.name}</td>
                <td className="px-2">
                  <div className="flex flex-wrap gap-2">
                    {tags.map((t) => {
                      const checked = brandTags[b.id]?.includes(t.name);
                      return (
                        <label key={t.id} className="flex items-center gap-1 text-xs">
                          <input
                            type="checkbox"
                            checked={!!checked}
                            onChange={(e) => {
                              const cur = brandTags[b.id] ?? [];
                              setBrandTags((v) => ({
                                ...v,
                                [b.id]: e.target.checked ? [...cur, t.name] : cur.filter((x) => x !== t.name),
                              }));
                            }}
                          />
                          <span style={{ color: t.color }}>{t.name}</span>
                        </label>
                      );
                    })}
                  </div>
                </td>
                <td>
                  <button onClick={() => saveBrand(b.id)} className="rounded bg-sky-600 px-3 py-1 text-white">
                    保存
                  </button>
                </td>
              </tr>
            ))}
          </tbody>
        </table>
      </section>

      {/* 素材选择弹窗 */}
      {pickerFor && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/50" onClick={() => setPickerFor(null)}>
          <div className="max-h-[80vh] w-full max-w-4xl overflow-auto rounded bg-white p-6" onClick={(e) => e.stopPropagation()}>
            <h3 className="mb-4 text-lg font-semibold">选择图片</h3>
            <div className="grid grid-cols-4 gap-3">
              {mediaAssets.map((m) => (
                <button
                  key={m.id}
                  onClick={() => pickImage(m.url)}
                  className="group relative aspect-square overflow-hidden rounded border"
                >
                  <img src={m.url} alt={m.name} className="h-full w-full object-cover" />
                  <div className="absolute inset-x-0 bottom-0 truncate bg-black/60 px-1 py-0.5 text-[10px] text-white">
                    {m.name}
                  </div>
                </button>
              ))}
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
