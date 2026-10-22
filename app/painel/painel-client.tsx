"use client";

import { FormEvent, useCallback, useEffect, useState } from "react";

type Bucket = { visits: number; maps: number; checkouts: number; sales: number; revenue: number };
type Data = {
  days: number;
  totals: Bucket;
  refunds: { count: number; value: number };
  byDay: Array<Bucket & { day: string }>;
  bySource: Array<Bucket & { source: string }>;
  byCampaign: Array<Bucket & { campaign: string; source: string }>;
  products: Array<{ items: string; orders: number; revenue: number }>;
  recent: Array<{ at: number; items: string; value: number; source: string; campaign: string | null }>;
  meta: { pixel: boolean; capi: boolean };
};

const KEY = "astroia-painel-key";
const LABEL: Record<string, string> = { map: "Mapa completo", compat: "Compatibilidade", name: "Numerologia do Nome" };
const money = (v: number) => v.toLocaleString("pt-BR", { style: "currency", currency: "BRL" });
const pct = (a: number, b: number) => (b ? `${((a / b) * 100).toLocaleString("pt-BR", { maximumFractionDigits: 1 })}%` : "—");
const items = (mode: string) => mode.split("+").map((i) => LABEL[i] || i).join(" + ");

function FunnelTable({ rows, first }: { rows: Array<Bucket & { label: string; hint?: string }>; first: string }) {
  if (!rows.length) return <p className="pn-empty">Ainda sem dados neste período.</p>;
  return (
    <div className="pn-table-wrap">
      <table className="pn-table">
        <thead>
          <tr><th>{first}</th><th>Visitas</th><th>Mapas grátis</th><th>Checkouts</th><th>Vendas</th><th>Faturamento</th><th>Visita → venda</th></tr>
        </thead>
        <tbody>
          {rows.map((r) => (
            <tr key={r.label + (r.hint || "")}>
              <td>{r.label}{r.hint ? <small> · {r.hint}</small> : null}</td>
              <td>{r.visits}</td>
              <td>{r.maps} <small>{pct(r.maps, r.visits)}</small></td>
              <td>{r.checkouts}</td>
              <td>{r.sales} <small>{pct(r.sales, r.maps)} dos mapas</small></td>
              <td>{money(r.revenue)}</td>
              <td>{pct(r.sales, r.visits)}</td>
            </tr>
          ))}
        </tbody>
      </table>
    </div>
  );
}

export default function PainelClient() {
  const [key, setKey] = useState("");
  const [days, setDays] = useState(7);
  const [data, setData] = useState<Data | null>(null);
  const [error, setError] = useState("");
  const [loading, setLoading] = useState(false);

  const load = useCallback(async (secret: string, period: number) => {
    setLoading(true); setError("");
    try {
      const response = await fetch(`/api/painel?dias=${period}`, { headers: { "x-admin-key": secret }, cache: "no-store" });
      const payload = await response.json();
      if (!response.ok) throw new Error(payload.error || "Não foi possível carregar.");
      setData(payload as Data);
      try { window.localStorage.setItem(KEY, secret); } catch { /* sem armazenamento */ }
    } catch (e) {
      setData(null);
      setError(e instanceof Error ? e.message : "Erro ao carregar.");
    } finally { setLoading(false); }
  }, []);

  useEffect(() => {
    let saved = "";
    try { saved = window.localStorage.getItem(KEY) || ""; } catch { /* ignora */ }
    if (saved) { setKey(saved); void load(saved, 7); }
  }, [load]);

  function submit(event: FormEvent) { event.preventDefault(); if (key) void load(key, days); }
  function period(value: number) { setDays(value); if (key) void load(key, value); }
  function logout() { try { window.localStorage.removeItem(KEY); } catch { /* ignora */ } setKey(""); setData(null); }

  const t = data?.totals;
  return (
    <main className="pn-page">
      <header className="pn-head">
        <a className="brand" href="/"><span className="brand-mark" aria-hidden="true">✦</span><span>AstroIA</span></a>
        <h1>Painel de vendas</h1>
        {data ? <button className="pn-link" onClick={logout} type="button">Sair</button> : null}
      </header>

      {!data ? (
        <form className="pn-login" onSubmit={submit}>
          <label htmlFor="pn-key">Chave do painel</label>
          <input id="pn-key" type="password" value={key} onChange={(e) => setKey(e.target.value)} autoComplete="current-password" />
          <button className="primary-button" disabled={loading || !key} type="submit">{loading ? "Carregando…" : "Entrar"}</button>
          {error ? <p className="pn-error">{error}</p> : null}
        </form>
      ) : (
        <>
          <div className="pn-periods" role="tablist">
            {[1, 7, 30, 90].map((d) => (
              <button aria-pressed={days === d} className={days === d ? "on" : ""} key={d} onClick={() => period(d)} type="button">
                {d === 1 ? "Hoje" : `${d} dias`}
              </button>
            ))}
            <button className="pn-link" onClick={() => void load(key, days)} type="button">{loading ? "Atualizando…" : "↻ Atualizar"}</button>
          </div>

          {t ? (
            <section className="pn-cards">
              <div><span>Visitas</span><strong>{t.visits}</strong></div>
              <div><span>Mapas grátis</span><strong>{t.maps}</strong><small>{pct(t.maps, t.visits)} das visitas</small></div>
              <div><span>Checkouts abertos</span><strong>{t.checkouts}</strong></div>
              <div><span>Vendas</span><strong>{t.sales}</strong><small>{pct(t.sales, t.maps)} dos mapas</small></div>
              <div><span>Faturamento</span><strong>{money(t.revenue)}</strong><small>ticket médio {t.sales ? money(t.revenue / t.sales) : "—"}</small></div>
              <div><span>Reembolsos</span><strong>{data.refunds.count}</strong><small>{money(data.refunds.value)}</small></div>
            </section>
          ) : null}

          {!data.meta.pixel ? <p className="pn-note">Pixel da Meta ainda não configurado (META_PIXEL_ID).</p>
            : !data.meta.capi ? <p className="pn-note">Pixel ativo. Falta o token da API de Conversões (META_CAPI_TOKEN).</p> : null}

          <h2>De onde vêm</h2>
          <FunnelTable first="Origem" rows={data.bySource.map((r) => ({ ...r, label: r.source }))} />

          <h2>Campanhas (utm_campaign)</h2>
          <FunnelTable first="Campanha" rows={data.byCampaign.map((r) => ({ ...r, label: r.campaign, hint: r.source }))} />

          <h2>Por dia</h2>
          <FunnelTable first="Dia" rows={data.byDay.map((r) => ({ ...r, label: r.day.split("-").reverse().join("/") }))} />

          <h2>Produtos</h2>
          {data.products.length ? (
            <div className="pn-table-wrap"><table className="pn-table">
              <thead><tr><th>Compra</th><th>Pedidos</th><th>Faturamento</th></tr></thead>
              <tbody>{data.products.map((p) => <tr key={p.items}><td>{items(p.items)}</td><td>{p.orders}</td><td>{money(p.revenue)}</td></tr>)}</tbody>
            </table></div>
          ) : <p className="pn-empty">Nenhuma venda neste período.</p>}

          <h2>Últimas vendas</h2>
          {data.recent.length ? (
            <div className="pn-table-wrap"><table className="pn-table">
              <thead><tr><th>Quando</th><th>Compra</th><th>Valor</th><th>Origem</th></tr></thead>
              <tbody>{data.recent.map((s, i) => (
                <tr key={i}>
                  <td>{new Date(s.at).toLocaleString("pt-BR", { timeZone: "America/Sao_Paulo", day: "2-digit", month: "2-digit", hour: "2-digit", minute: "2-digit" })}</td>
                  <td>{items(s.items)}</td><td>{money(s.value)}</td>
                  <td>{s.source}{s.campaign ? <small> · {s.campaign}</small> : null}</td>
                </tr>
              ))}</tbody>
            </table></div>
          ) : <p className="pn-empty">Nenhuma venda neste período.</p>}
          {error ? <p className="pn-error">{error}</p> : null}
        </>
      )}
    </main>
  );
}
