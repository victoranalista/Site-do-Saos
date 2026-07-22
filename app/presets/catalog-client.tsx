"use client";

import { useEffect, useMemo, useState } from "react";
import Link from "next/link";
import { initialPresets, type Preset } from "../../lib/presets";

const platforms = ["TODOS", "QUAD CORTEX", "HX STOMP"] as const;
const categories = ["TODAS", "COLEÇÃO COMPLETA", "OVERDRIVE", "AMBIÊNCIA", "LEAD", "CLEAN"] as const;

function Arrow() {
  return <svg aria-hidden="true" viewBox="0 0 24 24"><path d="M5 19 19 5M8 5h11v11" /></svg>;
}

export function CatalogClient({ presets = initialPresets }: { presets?: Preset[] }) {
  const [catalogPresets, setCatalogPresets] = useState(presets);
  const [query, setQuery] = useState("");
  const [platform, setPlatform] = useState<(typeof platforms)[number]>("TODOS");
  const [category, setCategory] = useState<(typeof categories)[number]>("TODAS");

  useEffect(() => {
    let active = true;
    fetch("/api/presets")
      .then((response) => response.ok ? response.json() : Promise.reject())
      .then((data: Preset[]) => active && setCatalogPresets(data))
      .catch(() => undefined);
    return () => { active = false; };
  }, []);

  const visiblePresets = useMemo(() => {
    const normalized = query.trim().toLocaleLowerCase("pt-BR");
    return catalogPresets.filter((preset) => {
      if (!preset.published) return false;
      if (platform !== "TODOS" && preset.platform !== platform) return false;
      if (category !== "TODAS" && preset.category !== category) return false;
      if (!normalized) return true;
      return `${preset.title} ${preset.platform} ${preset.category} ${preset.description}`.toLocaleLowerCase("pt-BR").includes(normalized);
    });
  }, [catalogPresets, category, platform, query]);

  return (
    <main className="catalog-page">
      <header className="catalog-header">
        <Link className="brand" href="/">MATEUS <span>SAOS</span></Link>
        <nav aria-label="Navegação do catálogo"><Link href="/">Início</Link><Link href="/presets">Presets</Link><Link className="catalog-admin-link" href="/admin">Área do artista</Link></nav>
      </header>

      <section className="catalog-hero">
        <p className="eyebrow"><span /> CATÁLOGO DE TIMBRES</p>
        <div className="catalog-hero-copy">
          <h1>Encontre o timbre<br /><em>que a música pede.</em></h1>
          <p>Busque por plataforma, coleção ou intenção. O catálogo foi construído para crescer sem perder clareza.</p>
        </div>
      </section>

      <section className="catalog-toolbar" aria-label="Filtros do catálogo">
        <label className="catalog-search"><span>BUSCAR</span><input type="search" value={query} onChange={(event) => setQuery(event.target.value)} placeholder="Nome, plataforma ou estilo" /></label>
        <div className="catalog-filter"><span>PLATAFORMA</span><div>{platforms.map((item) => <button className={platform === item ? "is-active" : ""} key={item} onClick={() => setPlatform(item)}>{item}</button>)}</div></div>
        <label className="catalog-select"><span>CATEGORIA</span><select value={category} onChange={(event) => setCategory(event.target.value as (typeof categories)[number])}>{categories.map((item) => <option key={item}>{item}</option>)}</select></label>
      </section>

      <section className="catalog-results">
        <div className="catalog-results-meta"><strong>{String(visiblePresets.length).padStart(2, "0")}</strong><span>{visiblePresets.length === 1 ? "PRESET ENCONTRADO" : "PRESETS ENCONTRADOS"}</span></div>
        <div className="catalog-grid">
          {visiblePresets.map((preset, index) => (
            <article className="catalog-card" key={preset.id}>
              <div className="catalog-card-media">
                {/* eslint-disable-next-line @next/next/no-img-element */}
                <img src={preset.imageUrl} alt={preset.title} />
                <span>{String(index + 1).padStart(2, "0")}</span>
              </div>
              <div className="catalog-card-topline"><span>{preset.platform}</span><span>{preset.badge}</span></div>
              <h2>{preset.title}</h2>
              <p>{preset.description}</p>
              <div className="catalog-card-price"><small>{preset.installments}</small><strong>{preset.cashPrice}</strong></div>
              <a href={preset.checkoutUrl} target="_blank" rel="noreferrer">Ver este preset <Arrow /></a>
            </article>
          ))}
        </div>
        {visiblePresets.length === 0 && <div className="catalog-empty"><strong>Nenhum preset encontrado.</strong><p>Tente retirar um filtro ou buscar por outro termo.</p></div>}
      </section>

      <footer className="catalog-footer"><Link className="brand" href="/">MATEUS <span>SAOS</span></Link><p>Presets criados para tocar — não para perder tempo regulando.</p></footer>
    </main>
  );
}
