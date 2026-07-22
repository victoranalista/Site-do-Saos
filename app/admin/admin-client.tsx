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

export function AdminClient() {
  const [authenticated, setAuthenticated] = useState<boolean | null>(null);
  const [presets, setPresets] = useState<Preset[]>([]);
  const [editing, setEditing] = useState<Partial<Preset>>(emptyPreset);
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
    form.set("published", editing.published === false ? "false" : "true");
    const response = await fetch("/api/admin/presets", { method: "POST", body: form });
    const body = await response.json() as { error?: string };
    setSaving(false);
    if (!response.ok) {
      setMessage(body.error ?? "Não foi possível salvar.");
      return;
    }
    setMessage(editing.id ? "Preset atualizado." : "Novo preset adicionado.");
    setEditing(emptyPreset);
    formRef.current?.reset();
    await loadPresets();
  }

  async function remove(id: string) {
    if (!window.confirm("Excluir este preset do catálogo?")) return;
    await fetch(`/api/admin/presets/${encodeURIComponent(id)}`, { method: "DELETE" });
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
      <header className="admin-header"><Link className="brand" href="/">MATEUS <span>SAOS</span></Link><div><Link href="/presets">Ver catálogo</Link><button onClick={logout}>Sair</button></div></header>
      <section className="admin-intro"><p>GESTÃO DE CATÁLOGO</p><h1>Presets,<br /><em>sem complicação.</em></h1><span>Adicione novos produtos ou edite por completo os que já existem: nome, foto, link, preço, descrição e posição de destaque.</span></section>
      <section className="admin-workspace">
        <form className="admin-form" ref={formRef} onSubmit={save}>
          <div className="admin-form-title"><strong>{editing.id ? "Editar preset" : "Adicionar preset"}</strong>{editing.id && <button type="button" onClick={() => { setEditing(emptyPreset); formRef.current?.reset(); }}>Cancelar edição</button>}</div>
          <label className="admin-span-2">NOME DO PRESET<input name="title" value={editing.title ?? ""} onChange={(event) => setEditing((current) => ({ ...current, title: event.target.value }))} required /></label>
          <label className="admin-span-2">URL INTERNA / SLUG<input name="slug" value={editing.slug ?? ""} onChange={(event) => setEditing((current) => ({ ...current, slug: event.target.value }))} placeholder="Gerada automaticamente se ficar em branco" /></label>
          <label>PLATAFORMA<select name="platform" value={editing.platform} onChange={(event) => setEditing((current) => ({ ...current, platform: event.target.value as Preset["platform"] }))}><option>QUAD CORTEX</option><option>HX STOMP</option></select></label>
          <label>CATEGORIA<select name="category" value={editing.category} onChange={(event) => setEditing((current) => ({ ...current, category: event.target.value as Preset["category"] }))}><option>COLEÇÃO COMPLETA</option><option>OVERDRIVE</option><option>AMBIÊNCIA</option><option>LEAD</option><option>CLEAN</option></select></label>
          <label className="admin-span-2">DESCRIÇÃO<textarea name="description" rows={4} value={editing.description ?? ""} onChange={(event) => setEditing((current) => ({ ...current, description: event.target.value }))} required /></label>
          <label>VALOR PARCELADO<input name="installments" value={editing.installments ?? ""} onChange={(event) => setEditing((current) => ({ ...current, installments: event.target.value }))} placeholder="12 x de R$ 20,58*" required /></label>
          <label>VALOR À VISTA<input name="cashPrice" value={editing.cashPrice ?? ""} onChange={(event) => setEditing((current) => ({ ...current, cashPrice: event.target.value }))} placeholder="R$ 199,00 à vista" required /></label>
          <label className="admin-span-2">LINK DA HOTMART<input name="checkoutUrl" type="url" value={editing.checkoutUrl ?? ""} onChange={(event) => setEditing((current) => ({ ...current, checkoutUrl: event.target.value }))} required /></label>
          <label>SELO<input name="badge" value={editing.badge ?? ""} onChange={(event) => setEditing((current) => ({ ...current, badge: event.target.value }))} placeholder="MAIS COMPLETO" /></label>
          <label>DESTAQUE NA HOME<select name="featuredOrder" value={editing.featuredOrder ?? ""} onChange={(event) => setEditing((current) => ({ ...current, featuredOrder: event.target.value ? Number(event.target.value) : null }))}><option value="">Não destacar</option><option value="1">Destaque 1</option><option value="2">Destaque 2</option><option value="3">Destaque 3</option></select></label>
          {editing.imageUrl && <div className="admin-current-image admin-span-2">
            {/* eslint-disable-next-line @next/next/no-img-element */}
            <img src={editing.imageUrl} alt={`Foto atual de ${editing.title ?? "preset"}`} />
            <div><small>FOTO ATUAL</small><strong>Envie outra imagem abaixo para substituir</strong></div>
          </div>}
          <label className="admin-span-2 admin-upload">{editing.id ? "SUBSTITUIR FOTO" : "FOTO DO PRODUTO"}<input name="image" type="file" accept="image/jpeg,image/png,image/webp" required={!editing.imageUrl} /><span>{editing.id ? "Opcional: a foto atual será mantida se nenhum arquivo for escolhido." : "JPG, PNG ou WebP · até 8 MB"}</span></label>
          <label className="admin-check"><input type="checkbox" checked={editing.published !== false} onChange={(event) => setEditing((current) => ({ ...current, published: event.target.checked }))} /> Publicado no catálogo</label>
          {message && <span className="admin-message admin-span-2">{message}</span>}
          <button className="admin-save admin-span-2" type="submit" disabled={saving}>{saving ? "Salvando…" : editing.id ? "Salvar alterações" : "Adicionar ao catálogo"}</button>
        </form>

        <div className="admin-list">
          <div className="admin-list-heading"><span>CATÁLOGO</span><strong>{String(presets.length).padStart(2, "0")}</strong></div>
          {presets.map((preset) => <article key={preset.id}>
            {/* eslint-disable-next-line @next/next/no-img-element */}
            <img src={preset.imageUrl} alt="" />
            <div><small>{preset.platform}{preset.featuredOrder ? ` · DESTAQUE ${preset.featuredOrder}` : ""}</small><h2>{preset.title}</h2><span>{preset.published ? "PUBLICADO" : "RASCUNHO"}</span></div>
            <div className="admin-row-actions"><button onClick={() => { setEditing(preset); requestAnimationFrame(() => formRef.current?.scrollIntoView({ behavior: "smooth", block: "start" })); }}>Editar tudo</button><button onClick={() => void remove(preset.id)}>Excluir</button></div>
          </article>)}
        </div>
      </section>
    </main>
  );
}
