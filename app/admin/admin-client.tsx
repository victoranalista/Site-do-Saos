"use client";

import { FormEvent, useCallback, useEffect, useRef, useState } from "react";
import Link from "next/link";
import type { Preset } from "../../lib/presets";

const emptyPreset: Partial<Preset> = {
  slug: "",
  title: "",
  platform: "QUAD CORTEX",
  category: "COLEÇÃO COMPLETA",
  description: "",
  checkoutUrl: "",
  installments: "",
  cashPrice: "",
  badge: "NOVO",
  featuredOrder: null,
  published: true,
};

const platformOptions: Preset["platform"][] = ["QUAD CORTEX", "HX STOMP"];
const categoryOptions: Preset["category"][] = ["COLEÇÃO COMPLETA", "OVERDRIVE", "AMBIÊNCIA", "LEAD", "CLEAN"];

type Pricing = { cash: string; count: string; installment: string };

// Converte texto em número (aceita "R$ 1.199,00", "199", "20,58").
function toNumber(value: string): number | null {
  if (!value) return null;
  const cleaned = value
    .replace(/[^\d.,]/g, "")
    .replace(/\.(?=\d{3}(\D|$))/g, "")
    .replace(",", ".");
  const parsed = Number.parseFloat(cleaned);
  return Number.isFinite(parsed) ? parsed : null;
}

function formatBR(value: number): string {
  return value.toLocaleString("pt-BR", { minimumFractionDigits: 2, maximumFractionDigits: 2 });
}

// Extrai o valor monetário logo após "R$" (ou o primeiro número, como fallback).
function moneyFromText(text: string | undefined): number | null {
  if (!text) return null;
  const match = text.match(/R\$\s*([\d.,]+)/i);
  return match ? toNumber(match[1]) : toNumber(text);
}

function derivePricing(preset: Partial<Preset>): Pricing {
  const cash = moneyFromText(preset.cashPrice);
  const installment = moneyFromText(preset.installments);
  const countMatch = (preset.installments ?? "").match(/(\d+)\s*x/i);
  return {
    cash: cash != null ? formatBR(cash) : "",
    count: countMatch ? countMatch[1] : "12",
    installment: installment != null ? formatBR(installment) : "",
  };
}

function UploadIcon() {
  return (
    <svg viewBox="0 0 24 24" aria-hidden="true">
      <path d="M12 15V4m0 0L8 8m4-4 4 4" />
      <path d="M4 15v3a2 2 0 0 0 2 2h12a2 2 0 0 0 2-2v-3" />
    </svg>
  );
}

export function AdminClient() {
  const [authenticated, setAuthenticated] = useState<boolean | null>(null);
  const [presets, setPresets] = useState<Preset[]>([]);
  const [editing, setEditing] = useState<Partial<Preset>>(emptyPreset);
  const [pricing, setPricing] = useState<Pricing>(() => derivePricing(emptyPreset));
  const [imagePreview, setImagePreview] = useState<string | null>(null);
  const [message, setMessage] = useState("");
  const [saving, setSaving] = useState(false);
  const formRef = useRef<HTMLFormElement>(null);

  const loadPresets = useCallback(async () => {
    const response = await fetch("/api/admin/presets", { cache: "no-store" });
    if (response.status === 401) {
      setAuthenticated(false);
      return;
    }
    setPresets(await response.json() as Preset[]);
    setAuthenticated(true);
  }, []);

  useEffect(() => {
    const controller = new AbortController();
    fetch("/api/admin/presets", { cache: "no-store", signal: controller.signal })
      .then(async (response) => {
        if (response.status === 401) {
          setAuthenticated(false);
          return;
        }
        setPresets(await response.json() as Preset[]);
        setAuthenticated(true);
      })
      .catch(() => undefined);
    return () => controller.abort();
  }, []);

  useEffect(() => () => {
    if (imagePreview) URL.revokeObjectURL(imagePreview);
  }, [imagePreview]);

  const startEditing = useCallback((preset: Partial<Preset>) => {
    setEditing(preset);
    setPricing(derivePricing(preset));
    setImagePreview((previous) => {
      if (previous) URL.revokeObjectURL(previous);
      return null;
    });
    formRef.current?.reset();
  }, []);

  const resetForm = useCallback(() => {
    startEditing(emptyPreset);
    setMessage("");
  }, [startEditing]);

  function updateCash(value: string) {
    setPricing((current) => {
      const cash = toNumber(value);
      const count = Number.parseInt(current.count, 10);
      const installment = cash != null && count > 0 ? formatBR(cash / count) : current.installment;
      return { ...current, cash: value, installment };
    });
  }

  function updateCount(value: string) {
    setPricing((current) => {
      const cash = toNumber(current.cash);
      const count = Number.parseInt(value, 10);
      const installment = cash != null && count > 0 ? formatBR(cash / count) : current.installment;
      return { ...current, count: value, installment };
    });
  }

  function onImagePick(event: React.ChangeEvent<HTMLInputElement>) {
    const file = event.target.files?.[0];
    setImagePreview((previous) => {
      if (previous) URL.revokeObjectURL(previous);
      return file ? URL.createObjectURL(file) : null;
    });
  }

  const cashNumber = toNumber(pricing.cash);
  const installmentNumber = toNumber(pricing.installment);
  const cashString = cashNumber != null ? `R$ ${formatBR(cashNumber)} à vista` : "";
  const installmentString = installmentNumber != null && pricing.count
    ? `${pricing.count} x de R$ ${formatBR(installmentNumber)}*`
    : "";
  const previewImage = imagePreview ?? editing.imageUrl ?? null;

  async function login(event: FormEvent<HTMLFormElement>) {
    event.preventDefault();
    const data = new FormData(event.currentTarget);
    const response = await fetch("/api/admin/login", { method: "POST", headers: { "content-type": "application/json" }, body: JSON.stringify({ username: data.get("username"), password: data.get("password") }) });
    if (!response.ok) {
      setMessage("Usuário ou senha inválidos.");
      return;
    }
    setMessage("");
    await loadPresets();
  }

  async function save(event: FormEvent<HTMLFormElement>) {
    event.preventDefault();
    setSaving(true);
    setMessage("");
    const form = new FormData(event.currentTarget);
    form.set("id", editing.id ?? "");
    form.set("existingImageUrl", editing.imageUrl ?? "");
    form.set("platform", editing.platform ?? "QUAD CORTEX");
    form.set("category", editing.category ?? "COLEÇÃO COMPLETA");
    form.set("featuredOrder", editing.featuredOrder ? String(editing.featuredOrder) : "");
    form.set("installments", installmentString);
    form.set("cashPrice", cashString);
    form.set("published", editing.published === false ? "false" : "true");
    const response = await fetch("/api/admin/presets", { method: "POST", body: form });
    const body = await response.json() as { error?: string };
    setSaving(false);
    if (!response.ok) {
      setMessage(body.error ?? "Não foi possível salvar.");
      return;
    }
    setMessage(editing.id ? "Preset atualizado com sucesso." : "Novo preset adicionado ao catálogo.");
    startEditing(emptyPreset);
  }

  async function remove(id: string) {
    if (!window.confirm("Excluir este preset do catálogo?")) return;
    await fetch(`/api/admin/presets/${encodeURIComponent(id)}`, { method: "DELETE" });
    if (editing.id === id) startEditing(emptyPreset);
    await loadPresets();
  }

  async function logout() {
    await fetch("/api/admin/logout", { method: "POST" });
    setAuthenticated(false);
  }

  if (authenticated === null) return <main className="admin-loading">Carregando área do artista…</main>;

  if (!authenticated) {
    return (
      <main className="admin-login">
        <Link className="brand" href="/">MATEUS <span>SAOS</span></Link>
        <form onSubmit={login}>
          <p>ÁREA RESTRITA</p>
          <h1>Entre para<br /><em>gerenciar.</em></h1>
          <label>USUÁRIO<input name="username" autoComplete="username" required /></label>
          <label>SENHA<input name="password" type="password" autoComplete="current-password" required /></label>
          {message && <span className="admin-message">{message}</span>}
          <button type="submit">Entrar</button>
          <Link href="/">Voltar ao site</Link>
        </form>
      </main>
    );
  }

  return (
    <main className="admin-page">
      <header className="admin-header">
        <Link className="brand" href="/">MATEUS <span>SAOS</span></Link>
        <div><Link href="/presets">Ver catálogo</Link><button onClick={logout}>Sair</button></div>
      </header>

      <section className="admin-intro">
        <p>GESTÃO DE CATÁLOGO</p>
        <h1>Presets,<br /><em>sem complicação.</em></h1>
        <span>Preencha os campos abaixo e veja a prévia atualizar em tempo real. O preço é montado automaticamente a partir do valor à vista e das parcelas.</span>
      </section>

      <section className="admin-workspace">
        <form className="admin-form" ref={formRef} onSubmit={save}>
          <div className="admin-form-title">
            <div>
              <span className="admin-form-kicker">{editing.id ? "EDITANDO PRESET" : "NOVO PRESET"}</span>
              <strong>{editing.id ? "Editar preset" : "Adicionar preset"}</strong>
            </div>
            {editing.id && <button type="button" className="admin-form-cancel" onClick={resetForm}>Cancelar edição</button>}
          </div>

          <div className="admin-preview admin-span-2" aria-hidden="true">
            <div className="admin-preview-media">
              {previewImage
                // eslint-disable-next-line @next/next/no-img-element
                ? <img src={previewImage} alt="" />
                : <span>Prévia da imagem</span>}
              <span className="admin-preview-badge">{editing.badge || "NOVO"}</span>
            </div>
            <div className="admin-preview-body">
              <span className="admin-preview-platform">{editing.platform} · {editing.category}</span>
              <strong>{editing.title || "Nome do preset"}</strong>
              <p>{editing.description || "A descrição do produto aparece aqui conforme você digita."}</p>
              <div className="admin-preview-price">
                <small>{installmentString || "Parcelamento"}</small>
                <b>{cashString || "Preço à vista"}</b>
              </div>
            </div>
          </div>

          <div className="admin-section admin-span-2">
            <span className="admin-section-num">01</span>
            <h3>Identificação</h3>
            <p>Nome, plataforma e descrição que aparecem no catálogo.</p>
          </div>

          <label className="admin-field admin-span-2">NOME DO PRESET
            <input name="title" value={editing.title ?? ""} onChange={(event) => setEditing((current) => ({ ...current, title: event.target.value }))} placeholder="Ex.: Tone Pack Full" required />
          </label>

          <div className="admin-field admin-span-2">
            <span className="admin-field-label">PLATAFORMA</span>
            <div className="admin-segment" role="group" aria-label="Plataforma">
              {platformOptions.map((option) => (
                <button
                  type="button"
                  key={option}
                  className={editing.platform === option ? "is-active" : ""}
                  onClick={() => setEditing((current) => ({ ...current, platform: option }))}
                >{option}</button>
              ))}
            </div>
          </div>

          <label className="admin-field">CATEGORIA
            <select value={editing.category} onChange={(event) => setEditing((current) => ({ ...current, category: event.target.value as Preset["category"] }))}>
              {categoryOptions.map((option) => <option key={option}>{option}</option>)}
            </select>
          </label>

          <label className="admin-field">SELO / BADGE
            <input name="badge" value={editing.badge ?? ""} onChange={(event) => setEditing((current) => ({ ...current, badge: event.target.value }))} placeholder="Ex.: MAIS COMPLETO" />
          </label>

          <label className="admin-field admin-span-2">DESCRIÇÃO
            <textarea name="description" rows={3} value={editing.description ?? ""} onChange={(event) => setEditing((current) => ({ ...current, description: event.target.value }))} placeholder="Explique em poucas linhas o que este preset resolve." required />
          </label>

          <div className="admin-section admin-span-2">
            <span className="admin-section-num">02</span>
            <h3>Preço</h3>
            <p>Digite o valor à vista e as parcelas — o texto de preço é montado sozinho.</p>
          </div>

          <div className="admin-price-grid admin-span-2">
            <label className="admin-field admin-money">PREÇO À VISTA
              <div className="admin-money-input"><span>R$</span><input inputMode="decimal" value={pricing.cash} onChange={(event) => updateCash(event.target.value)} placeholder="199,00" /></div>
            </label>
            <label className="admin-field">PARCELAS
              <input type="number" min={1} max={12} value={pricing.count} onChange={(event) => updateCount(event.target.value)} placeholder="12" />
            </label>
            <label className="admin-field admin-money">VALOR DA PARCELA
              <div className="admin-money-input"><span>R$</span><input inputMode="decimal" value={pricing.installment} onChange={(event) => setPricing((current) => ({ ...current, installment: event.target.value }))} placeholder="20,58" /></div>
              <small>Calculado automaticamente. Ajuste se a Hotmart cobrar juros.</small>
            </label>
          </div>

          <div className="admin-price-preview admin-span-2">
            <span>COMO VAI APARECER</span>
            <small>{installmentString || "12 x de R$ —"}</small>
            <strong>{cashString || "R$ — à vista"}</strong>
          </div>

          <div className="admin-section admin-span-2">
            <span className="admin-section-num">03</span>
            <h3>Link e imagem</h3>
            <p>Link de compra da Hotmart e a foto do produto.</p>
          </div>

          <label className="admin-field admin-span-2">LINK DA HOTMART
            <input name="checkoutUrl" type="url" value={editing.checkoutUrl ?? ""} onChange={(event) => setEditing((current) => ({ ...current, checkoutUrl: event.target.value }))} placeholder="https://pay.hotmart.com/..." required />
          </label>

          <label className="admin-field admin-span-2 admin-dropzone">
            <input name="image" type="file" accept="image/jpeg,image/png,image/webp" onChange={onImagePick} />
            {previewImage
              // eslint-disable-next-line @next/next/no-img-element
              ? <div className="admin-dropzone-preview"><img src={previewImage} alt="" /><span>{imagePreview ? "Nova imagem selecionada" : "Imagem atual · clique para trocar"}</span></div>
              : <div className="admin-dropzone-empty"><UploadIcon /><strong>Arraste uma imagem ou clique para enviar</strong><span>JPG, PNG ou WebP · até 8 MB</span></div>}
          </label>

          <div className="admin-section admin-span-2">
            <span className="admin-section-num">04</span>
            <h3>Publicação</h3>
            <p>Defina o destaque na home e a visibilidade no catálogo.</p>
          </div>

          <div className="admin-field admin-span-2">
            <span className="admin-field-label">DESTAQUE NA HOME</span>
            <div className="admin-segment" role="group" aria-label="Destaque na home">
              <button type="button" className={!editing.featuredOrder ? "is-active" : ""} onClick={() => setEditing((current) => ({ ...current, featuredOrder: null }))}>Não destacar</button>
              {[1, 2, 3].map((order) => (
                <button type="button" key={order} className={editing.featuredOrder === order ? "is-active" : ""} onClick={() => setEditing((current) => ({ ...current, featuredOrder: order }))}>Destaque {order}</button>
              ))}
            </div>
          </div>

          <label className="admin-check">
            <input type="checkbox" checked={editing.published !== false} onChange={(event) => setEditing((current) => ({ ...current, published: event.target.checked }))} />
            Publicado no catálogo
          </label>

          <details className="admin-advanced admin-span-2">
            <summary>Opções avançadas</summary>
            <label>URL INTERNA / SLUG
              <input name="slug" value={editing.slug ?? ""} onChange={(event) => setEditing((current) => ({ ...current, slug: event.target.value }))} placeholder="Gerada automaticamente se ficar em branco" />
            </label>
          </details>

          {message && <span className="admin-message admin-span-2">{message}</span>}
          <button className="admin-save admin-span-2" type="submit" disabled={saving}>{saving ? "Salvando…" : editing.id ? "Salvar alterações" : "Adicionar ao catálogo"}</button>
        </form>

        <div className="admin-list">
          <div className="admin-list-heading"><span>CATÁLOGO</span><strong>{String(presets.length).padStart(2, "0")}</strong></div>
          {presets.length === 0 && <p className="admin-list-empty">Nenhum preset cadastrado ainda. Adicione o primeiro ao lado.</p>}
          {presets.map((preset) => <article key={preset.id} className={editing.id === preset.id ? "is-editing" : ""}>
            {/* eslint-disable-next-line @next/next/no-img-element */}
            <img src={preset.imageUrl} alt="" />
            <div>
              <small>{preset.platform}{preset.featuredOrder ? ` · DESTAQUE ${preset.featuredOrder}` : ""}</small>
              <h2>{preset.title}</h2>
              <span className={preset.published ? "admin-pill admin-pill-live" : "admin-pill"}>{preset.published ? "PUBLICADO" : "RASCUNHO"}</span>
            </div>
            <div className="admin-row-actions">
              <button onClick={() => { startEditing(preset); setMessage(""); requestAnimationFrame(() => formRef.current?.scrollIntoView({ behavior: "smooth", block: "start" })); }}>Editar</button>
              <button onClick={() => void remove(preset.id)}>Excluir</button>
            </div>
          </article>)}
        </div>
      </section>
    </main>
  );
}
