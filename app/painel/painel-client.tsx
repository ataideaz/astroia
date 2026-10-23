"use client";

import { FormEvent, useCallback, useEffect, useState } from "react";

type Bucket = { visits: number; offerViews?: number; offerOpens?: number; maps: number; checkouts: number; pix?: number; sales: number; revenue: number };
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
type People = {
  sales: Array<{ at: number; email: string | null; name: string | null; items: string; value: number; status: string; order: string; source: string }>;
  maps: Array<{ at: number; name: string | null; email: string | null; consent: boolean; recipient: string; source: string; bought: string; checkout: boolean }>;
  leads: Array<{ email: string; at: number }>;
};
type Tab = "resumo" | "vendas" | "mapas" | "emails";
const when = (t: number) => new Date(t).toLocaleString("pt-BR", { timeZone: "America/Sao_Paulo", day: "2-digit", month: "2-digit", year: "2-digit", hour: "2-digit", minute: "2-digit" });
const STATUS: Record<string, string> = { approved: "Pago", refunded: "Reembolsado", charged_back: "Contestado" };
const RECIPIENT: Record<string, string> = { self: "Para si", child: "Filho(a)", partner: "Par", friend: "Amigo(a)", family: "Família", other: "Outra pessoa" };

function downloadCsv(name: string, rows: Array<Array<string | number>>) {
  const csv = rows.map((r) => r.map((c) => `"${String(c ?? "").replace(/"/g, '""')}"`).join(";")).join("\r\n");
  const blob = new Blob(["\ufeff" + csv], { type: "text/csv;charset=utf-8" });
  const link = document.createElement("a");
  link.href = URL.createObjectURL(blob); link.download = name; link.click();
  setTimeout(() => URL.revokeObjectURL(link.href), 2000);
}
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
          <tr><th>{first}</th><th>Visitas</th><th>Mapas grátis</th><th>Viram a oferta</th><th>Abriram a compra</th><th>Clicaram em pagar</th><th>Vendas</th><th>Faturamento</th><th>Visita → venda</th></tr>
        </thead>
        <tbody>
          {rows.map((r) => (
            <tr key={r.label + (r.hint || "")}>
              <td>{r.label}{r.hint ? <small> · {r.hint}</small> : null}</td>
              <td>{r.visits}</td>
              <td>{r.maps} <small>{pct(r.maps, r.visits)}</small></td>
              <td>{r.offerViews ?? 0} <small>{pct(r.offerViews ?? 0, r.maps)} dos mapas</small></td>
              <td>{r.offerOpens ?? 0} <small>{pct(r.offerOpens ?? 0, r.offerViews ?? 0)}</small></td>
              <td>{r.checkouts} <small>{pct(r.checkouts, r.offerOpens ?? 0)}</small></td>
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

function PeopleView({ people, tab, search, setSearch }: { people: People | null; tab: Tab; search: string; setSearch: (v: string) => void }) {
  if (!people) return <p className="pn-empty">Carregando…</p>;
  const q = search.trim().toLowerCase();
  const match = (...values: Array<string | null | undefined>) => !q || values.some((v) => v?.toLowerCase().includes(q));

  if (tab === "vendas") {
    const rows = people.sales.filter((s) => match(s.email, s.name, s.order, s.source));
    return (
      <>
        <div className="pn-tools">
          <input onChange={(e) => setSearch(e.target.value)} placeholder="Buscar por e-mail, nome ou pedido (ast_…)" value={search} />
          <button className="pn-link" onClick={() => downloadCsv("astroia-vendas.csv", [["Data", "E-mail", "Nome no mapa", "Compra", "Valor", "Situação", "Origem", "Pedido"], ...rows.map((s) => [when(s.at), s.email || "", s.name || "", items(s.items), s.value.toFixed(2).replace(".", ","), STATUS[s.status] || s.status, s.source, s.order])])} type="button">⬇ Baixar planilha</button>
        </div>
        {rows.length ? (
          <div className="pn-table-wrap"><table className="pn-table">
            <thead><tr><th>Quando</th><th>E-mail</th><th>Nome no mapa</th><th>Compra</th><th>Valor</th><th>Situação</th><th>Origem</th><th>Pedido</th></tr></thead>
            <tbody>{rows.map((s) => (
              <tr key={s.order}>
                <td>{when(s.at)}</td><td>{s.email || "—"}</td><td>{s.name || "—"}</td><td>{items(s.items)}</td><td>{money(s.value)}</td>
                <td><span className={`pn-badge ${s.status === "approved" ? "ok" : "bad"}`}>{STATUS[s.status] || s.status}</span></td>
                <td>{s.source}</td><td><small>{s.order}</small></td>
              </tr>
            ))}</tbody>
          </table></div>
        ) : <p className="pn-empty">Nenhuma venda encontrada.</p>}
      </>
    );
  }

  if (tab === "mapas") {
    const rows = people.maps.filter((m) => match(m.email, m.name, m.source));
    const bought = rows.filter((m) => m.bought).length;
    return (
      <>
        <p className="pn-note">{rows.length} mapas · {bought} viraram compra ({rows.length ? Math.round((bought / rows.length) * 100) : 0}%) · {rows.filter((m) => m.checkout && !m.bought).length} abriram o pagamento e não pagaram</p>
        <div className="pn-tools">
          <input onChange={(e) => setSearch(e.target.value)} placeholder="Buscar por e-mail, nome ou origem" value={search} />
          <button className="pn-link" onClick={() => downloadCsv("astroia-mapas-gratis.csv", [["Data", "Nome no mapa", "Para quem", "E-mail", "Aceita e-mails", "Origem", "Comprou"], ...rows.map((m) => [when(m.at), m.name || "", RECIPIENT[m.recipient] || m.recipient, m.email || "", m.consent ? "sim" : "não", m.source, m.bought ? items(m.bought) : m.checkout ? "abriu o pagamento" : "não"])])} type="button">⬇ Baixar planilha</button>
        </div>
        {rows.length ? (
          <div className="pn-table-wrap"><table className="pn-table">
            <thead><tr><th>Quando</th><th>Nome no mapa</th><th>Para quem</th><th>E-mail</th><th>Aceita e-mails</th><th>Origem</th><th>Comprou?</th></tr></thead>
            <tbody>{rows.map((m, i) => (
              <tr key={i}>
                <td>{when(m.at)}</td><td>{m.name || "—"}</td><td>{RECIPIENT[m.recipient] || m.recipient}</td><td>{m.email || "—"}</td>
                <td>{m.consent ? "✓" : "—"}</td><td>{m.source}</td>
                <td>{m.bought ? <span className="pn-badge ok">{items(m.bought)}</span> : m.checkout ? <span className="pn-badge warn">Abriu o pagamento</span> : "—"}</td>
              </tr>
            ))}</tbody>
          </table></div>
        ) : <p className="pn-empty">Nenhum mapa grátis neste período.</p>}
      </>
    );
  }

  const rows = people.leads.filter((l) => match(l.email));
  return (
    <>
      <p className="pn-note">Só aparece aqui quem marcou que aceita receber e-mails do AstroIA e não cancelou. Use esta lista para promoções; sempre ofereça o link de cancelar (é a lei).</p>
      <div className="pn-tools">
        <input onChange={(e) => setSearch(e.target.value)} placeholder="Buscar e-mail" value={search} />
        <button className="pn-link" onClick={() => downloadCsv("astroia-emails-marketing.csv", [["E-mail", "Aceitou em"], ...rows.map((l) => [l.email, when(l.at)])])} type="button">⬇ Baixar lista</button>
      </div>
      {rows.length ? (
        <div className="pn-table-wrap"><table className="pn-table">
          <thead><tr><th>E-mail</th><th>Aceitou receber em</th></tr></thead>
          <tbody>{rows.map((l) => <tr key={l.email}><td>{l.email}</td><td>{when(l.at)}</td></tr>)}</tbody>
        </table></div>
      ) : <p className="pn-empty">Ainda ninguém na lista.</p>}
    </>
  );
}

export default function PainelClient() {
  const [key, setKey] = useState("");
  const [days, setDays] = useState(7);
  const [data, setData] = useState<Data | null>(null);
  const [error, setError] = useState("");
  const [loading, setLoading] = useState(false);
  const [tab, setTab] = useState<Tab>("resumo");
  const [people, setPeople] = useState<People | null>(null);
  const [search, setSearch] = useState("");

  const load = useCallback(async (secret: string, period: number) => {
    setLoading(true); setError("");
    try {
      const response = await fetch(`/api/painel?dias=${period}`, { headers: { "x-admin-key": secret }, cache: "no-store" });
      const payload = await response.json();
      if (!response.ok) throw new Error(payload.error || "Não foi possível carregar.");
      setData(payload as Data);
      try { window.localStorage.setItem(KEY, secret); } catch { /* sem armazenamento */ }
      const peopleResponse = await fetch(`/api/painel/pessoas?dias=${period}`, { headers: { "x-admin-key": secret }, cache: "no-store" });
      if (peopleResponse.ok) setPeople(await peopleResponse.json() as People);
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

          <div className="pn-tabs" role="tablist">
            {([["resumo", "Resumo"], ["vendas", `Vendas${people ? ` (${people.sales.length})` : ""}`], ["mapas", `Mapas grátis${people ? ` (${people.maps.length})` : ""}`], ["emails", `E-mails${people ? ` (${people.leads.length})` : ""}`]] as Array<[Tab, string]>).map(([id, label]) => (
              <button aria-selected={tab === id} className={tab === id ? "on" : ""} key={id} onClick={() => setTab(id)} role="tab" type="button">{label}</button>
            ))}
          </div>

          {tab !== "resumo" ? (
            <PeopleView people={people} search={search} setSearch={setSearch} tab={tab} />
          ) : <>
          {t ? (
            <section className="pn-cards">
              <div><span>Visitas</span><strong>{t.visits}</strong></div>
              <div><span>Mapas grátis</span><strong>{t.maps}</strong><small>{pct(t.maps, t.visits)} das visitas</small></div>
              <div><span>Viram a oferta</span><strong>{t.offerViews ?? 0}</strong><small>{pct(t.offerViews ?? 0, t.maps)} dos mapas</small></div>
              <div><span>Abriram a compra</span><strong>{t.offerOpens ?? 0}</strong><small>{pct(t.offerOpens ?? 0, t.offerViews ?? 0)} de quem viu</small></div>
              <div><span>Clicaram em pagar</span><strong>{t.checkouts}</strong><small>{pct(t.checkouts, t.offerOpens ?? 0)} de quem abriu{t.pix ? ` · ${t.pix} Pix gerados` : ""}</small></div>
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
          </>}
          {error ? <p className="pn-error">{error}</p> : null}
        </>
      )}
    </main>
  );
}
