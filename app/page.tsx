"use client";

import { useCallback, useEffect, useRef, useState } from "react";
import type { Preset } from "../lib/presets";

const products = [
  {
    index: "01",
    device: "QUAD CORTEX",
    name: "Tone Pack Full",
    author: "MATEUS SAOS",
    installments: "12 x de R$ 20,58*",
    cash: "R$ 199,00 à vista",
    image: "/images/products/quad-cortex-editorial-v3.webp",
    href: "https://pay.hotmart.com/C106564201Y?bid=1784202862324",
    description: "A coleção mais completa para atravessar cleans, ambiências, bases e leads sem reconstruir seu setup a cada música.",
    benefits: ["Coleção completa para Quad Cortex", "Timbres organizados para transições rápidas", "Base pronta para adaptar ao seu instrumento"],
    badge: "MAIS COMPLETO",
    tone: "violet",
    media: "wide",
  },
  {
    index: "02",
    device: "QUAD CORTEX",
    name: "Boutique Overdrive Collection",
    author: "MATEUS SAOS",
    installments: "12 x de R$ 13,34*",
    cash: "R$ 129,00 à vista",
    image: "/images/products/boutique-overdrive-editorial-v4.webp",
    href: "https://pay.hotmart.com/Q106604579U?bid=1784202877258",
    description: "Overdrives boutique com resposta orgânica para quem quer dinâmica, presença e ganho musical sem encobrir a identidade da guitarra.",
    benefits: ["15 capturas premium", "Variações de ganho para base e lead", "Resposta natural à intensidade da mão"],
    badge: "OVERDRIVES BOUTIQUE",
    tone: "copper",
    media: "wide",
  },
  {
    index: "03",
    device: "HX STOMP",
    name: "Complete Collection",
    author: "MATEUS SAOS",
    installments: "12 x de R$ 12,40*",
    cash: "R$ 119,90 à vista",
    image: "/images/products/hx-stomp-editorial-v3.webp",
    href: "https://pay.hotmart.com/E106592458P",
    description: "Uma coleção pronta para ampliar a versatilidade da HX Stomp e reduzir o tempo entre imaginar o timbre e começar a tocar.",
    benefits: ["Coleção completa para HX Stomp", "Timbres para diferentes momentos da música", "Ponto de partida consistente para seu setup"],
    badge: "HX STOMP",
    tone: "ice",
    media: "wide",
  },
];

const pedals = [
  {
    index: "01",
    type: "PREAMP BOOST",
    name: "Coral Boost",
    description: "Mais presença, ataque e volume para fazer o lead avançar sem perder a identidade do timbre.",
    color: "coral",
    off: "/images/gear/coral-off.webp",
  },
];

function Arrow({ diagonal = false }: { diagonal?: boolean }) {
  return (
    <svg aria-hidden="true" viewBox="0 0 24 24">
      <path d={diagonal ? "M5 19 19 5M8 5h11v11" : "M4 12h16M14 6l6 6-6 6"} />
    </svg>
  );
}

export default function Home() {
  const [menuOpen, setMenuOpen] = useState(false);
  const [featuredProducts, setFeaturedProducts] = useState(products);
  const [activePedal, setActivePedal] = useState(false);
  const [pressingPedal, setPressingPedal] = useState(false);
  const pressTimers = useRef<number[]>([]);

  useEffect(() => {
    let active = true;
    fetch("/api/presets?featured=true")
      .then((response) => response.ok ? response.json() : Promise.reject())
      .then((presets: Preset[]) => {
        if (!active || presets.length === 0) return;
        const tones = ["violet", "copper", "ice"];
        const mapped = presets.slice(0, 3).map((preset, index) => ({
          index: String(index + 1).padStart(2, "0"),
          device: preset.platform,
          name: preset.title,
          author: "MATEUS SAOS",
          installments: preset.installments,
          cash: preset.cashPrice,
          image: preset.imageUrl,
          href: preset.checkoutUrl,
          description: preset.description,
          benefits: preset.category === "OVERDRIVE"
            ? ["Resposta dinâmica à intensidade da mão", "Ganho musical para base e lead", "Pronto para adaptar ao seu instrumento"]
            : preset.platform === "HX STOMP"
              ? ["Construído para HX Stomp", "Transições rápidas entre momentos da música", "Ponto de partida consistente para seu setup"]
              : ["Construído para Quad Cortex", "Timbres organizados para tocar sem distração", "Base pronta para adaptar ao seu instrumento"],
          badge: preset.badge,
          tone: tones[index] ?? "violet",
          media: "wide",
        }));
        setFeaturedProducts(mapped);
      })
      .catch(() => undefined);
    return () => { active = false; };
  }, []);

  const triggerPedalPress = useCallback(() => {
    setPressingPedal(true);

    const stateTimer = window.setTimeout(() => {
      setActivePedal((current) => !current);
    }, 260);

    const releaseTimer = window.setTimeout(() => {
      setPressingPedal(false);
    }, 720);

    pressTimers.current.push(stateTimer, releaseTimer);
  }, []);

  useEffect(() => {
    const root = document.documentElement;
    const revealItems = Array.from(document.querySelectorAll<HTMLElement>("[data-reveal]"));
    const parallaxItems = Array.from(document.querySelectorAll<HTMLElement>("[data-parallax]"));
    const observer = new IntersectionObserver(
      (entries) => entries.forEach((entry) => entry.isIntersecting && entry.target.classList.add("is-visible")),
      { threshold: 0.01, rootMargin: "0px 0px -7% 0px" },
    );
    revealItems.forEach((item) => observer.observe(item));

    let frame = 0;
    const update = () => {
      frame = 0;
      const y = window.scrollY;
      const max = Math.max(document.documentElement.scrollHeight - window.innerHeight, 1);
      root.style.setProperty("--page-progress", String(y / max));
      root.style.setProperty("--scroll-y", `${y}px`);
      parallaxItems.forEach((item) => {
        const rect = item.getBoundingClientRect();
        const distance = rect.top + rect.height / 2 - window.innerHeight / 2;
        const offset = Math.max(-48, Math.min(48, distance * -.055));
        item.style.setProperty("--parallax-offset", `${offset}px`);
      });
    };

    const requestUpdate = () => {
      if (!frame) frame = requestAnimationFrame(update);
    };

    requestUpdate();
    window.addEventListener("scroll", requestUpdate, { passive: true });
    window.addEventListener("resize", requestUpdate);

    return () => {
      observer.disconnect();
      window.removeEventListener("scroll", requestUpdate);
      window.removeEventListener("resize", requestUpdate);
      if (frame) cancelAnimationFrame(frame);
    };
  }, []);

  useEffect(() => () => {
    pressTimers.current.forEach((timer) => window.clearTimeout(timer));
  }, []);

  useEffect(() => {
    document.body.style.overflow = menuOpen ? "hidden" : "";
    return () => { document.body.style.overflow = ""; };
  }, [menuOpen]);

  const closeMenu = () => setMenuOpen(false);

  return (
    <main>
      <div className="page-progress" aria-hidden="true" />

      <header className="site-header">
        <a className="brand" href="#top" aria-label="Mateus Saos — início">
          MATEUS <span>SAOS</span>
        </a>
        <nav className={menuOpen ? "nav is-open" : "nav"} aria-label="Navegação principal">
          <a href="#experiencia" onClick={closeMenu}>Experiência</a>
          <a href="/presets" onClick={closeMenu}>Todos os presets</a>
          <a href="#sobre" onClick={closeMenu}>O artista</a>
          <a className="nav-cta" href="/presets" onClick={closeMenu}><span>Ver catálogo</span><Arrow /></a>
        </nav>
        <button
          className={menuOpen ? "menu-button is-open" : "menu-button"}
          onClick={() => setMenuOpen((open) => !open)}
          aria-expanded={menuOpen}
          aria-label={menuOpen ? "Fechar menu" : "Abrir menu"}
        ><span /><span /></button>
      </header>

      <section className="hero" id="top">
        <div className="hero-photo" role="img" aria-label="Mateus Saos tocando guitarra no palco">
          {/* eslint-disable-next-line @next/next/no-img-element */}
          <img src="/images/artist/mateus-hero-245.jpg" alt="" />
          <div className="hero-photo-meta"><span>PALCO · ESTÚDIO · DIREÇÃO MUSICAL</span><strong>MATEUS SAOS</strong></div>
        </div>
        <div className="hero-shade" aria-hidden="true" />
        <div className="film-grain hero-grain" aria-hidden="true" />

        <div className="hero-copy">
          <p className="eyebrow hero-enter hero-enter-1"><span /> PRESETS AUTORAIS / QUAD CORTEX + HX STOMP</p>
          <h1 aria-label="Pare de procurar. Comece a tocar.">
            <span className="hero-line hero-enter hero-enter-2"><i>PARE DE</i></span>
            <span className="hero-line hero-enter hero-enter-3"><i>PROCURAR.</i></span>
            <span className="hero-line hero-line-accent hero-enter hero-enter-4"><i>COMECE A TOCAR.</i></span>
          </h1>
          <p className="hero-description hero-enter hero-enter-5">Timbres construídos por Mateus Saos em situações reais de palco, ensaio e gravação. Uma base confiável para você gastar menos tempo regulando e mais tempo fazendo música.</p>
          <div className="hero-buttons hero-enter hero-enter-5">
            <a className="hero-primary" href="/presets">Explorar presets <Arrow /></a>
            <a className="hero-secondary" href="#experiencia">Sentir os efeitos</a>
          </div>
          <div className="hero-trust hero-enter hero-enter-5"><span>DOWNLOAD DIGITAL</span><span>CHECKOUT HOTMART</span><span>QUAD CORTEX + HX STOMP</span></div>
        </div>

        <div className="hero-foot">
          <span>TIMBRES CRIADOS PARA TOCAR</span><span>ENTREGA DIGITAL</span><span>CONTINUE PARA BAIXO ↓</span>
        </div>
      </section>

      <section className={`pedal-sequence pedal-feature pedal-coral${activePedal ? " is-active" : ""}${pressingPedal ? " is-pressing" : ""}`} id="experiencia">
        <div className="pedal-feature-copy" data-reveal="from-left">
          <p className="eyebrow"><span /> PREAMP BOOST / 01</p>
          <h2>Coral<br /><em>Boost.</em></h2>
          <p className="sequence-description">Mais presença, ataque e volume para fazer o lead avançar sem apagar a identidade do seu timbre.</p>
          <div className="pedal-status"><i /> PEDAL {activePedal ? "ATIVADO" : "DESLIGADO"}</div>
        </div>
        <div className="pedal-feature-control" data-reveal="from-right">
            <button
              className="pedal-object pedal-feature-object"
              type="button"
              aria-pressed={activePedal}
              aria-label={`Coral Boost: clique para ${activePedal ? "desligar" : "ativar"}`}
              disabled={pressingPedal}
              onClick={triggerPedalPress}
            >
              <div className="pedal-halo" aria-hidden="true" />
              <span className="pedal-image-stage">
                {/* eslint-disable-next-line @next/next/no-img-element */}
                <img className="pedal-frame" src={pedals[0].off} alt="Pedal Coral Boost" />
                <span className="pedal-led" aria-hidden="true" />
                <span className="pedal-switch-depth" aria-hidden="true" />
              </span>
              <span className="pedal-click-label">CLIQUE PARA {activePedal ? "DESLIGAR" : "ATIVAR"}</span>
            </button>
          <p>PRESSIONE O FOOTSWITCH · O LED CONFIRMA O ESTÁGIO</p>
        </div>
      </section>

      <section className="manifesto">
        <div className="manifesto-label" data-reveal="fade">
          <span>POR QUE FUNCIONA</span><span>01—03</span>
        </div>
        <div className="manifesto-copy">
          <div className="manifesto-text">
            <h2 data-reveal="clip">O timbre certo<br />não interrompe.<br /><em>Ele acompanha.</em></h2>
            <div className="manifesto-aside" data-reveal="from-left">
              <p>Você já tem técnica, instrumento e repertório. O que não deveria consumir sua energia é reconstruir o som toda vez que conecta o equipamento.</p>
              <div className="manifesto-proof"><span><strong>01</strong>Menos tempo regulando</span><span><strong>02</strong>Mais consistência ao tocar</span><span><strong>03</strong>Uma base criada em uso real</span></div>
            </div>
          </div>
          <figure className="manifesto-photo" data-reveal="image-right">
            {/* eslint-disable-next-line @next/next/no-img-element */}
            <img src="/images/artist/mateus-live-wide.webp" alt="Mateus Saos tocando guitarra ao vivo com a banda" loading="lazy" />
            <figcaption>O TIMBRE A SERVIÇO DA MÚSICA</figcaption>
          </figure>
        </div>
      </section>

      <section className="artist-section" id="sobre">
        <div className="artist-label" data-reveal="fade"><span>O ARTISTA POR TRÁS DO TIMBRE</span><span>PALCO · ESTÚDIO · DIREÇÃO MUSICAL</span></div>
        <div className="artist-lead">
          <figure className="artist-main-photo" data-reveal="image-left">
            {/* eslint-disable-next-line @next/next/no-img-element */}
            <img src="/images/artist/mateus-main.webp" alt="Mateus Saos sorrindo enquanto toca guitarra no palco" loading="lazy" />
            <figcaption>MATEUS SAOS / AO VIVO</figcaption>
          </figure>
          <div className="artist-copy" data-reveal="from-right">
            <p className="eyebrow"><span /> GUITARRISTA · PRODUTOR · DIRETOR MUSICAL</p>
            <h2>Não são presets feitos para a tela.<br /><em>São timbres feitos para a música.</em></h2>
            <p>Mateus Saos transforma a experiência de palco, ensaio e gravação em coleções prontas que levam o guitarrista ao som que imaginou — e ao timbre que o mercado procura — com dinâmica, intenção e espaço para a própria identidade.</p>
            <blockquote>“Não é sobre ter mais efeitos. É sobre ter o som certo quando a música pede.”</blockquote>
            <a href="https://www.instagram.com/_mateusaos/" target="_blank" rel="noreferrer">Conhecer o trabalho do Mateus <Arrow diagonal /></a>
          </div>
        </div>
        <div className="artist-gallery">
          <figure data-reveal="image-left">
            {/* eslint-disable-next-line @next/next/no-img-element */}
            <img src="/images/artist/mateus-artist-72.jpg" alt="Mateus Saos tocando guitarra com a banda no palco" loading="lazy" />
          </figure>
          <figure data-reveal="fade">
            {/* eslint-disable-next-line @next/next/no-img-element */}
            <img src="/images/artist/mateus-backstage.webp" alt="Mateus Saos preparando a guitarra nos bastidores" loading="lazy" />
          </figure>
          <figure data-reveal="image-right">
            {/* eslint-disable-next-line @next/next/no-img-element */}
            <img src="/images/artist/mateus-live-light.webp" alt="Mateus Saos com guitarra sob as luzes do palco" loading="lazy" />
          </figure>
        </div>
      </section>

      <section className="products-section" id="presets">
        <div className="products-heading" data-reveal="clip">
          <div><p className="eyebrow"><span /> ESCOLHA SEU PONTO DE PARTIDA</p><p className="products-intro">Não escolha pelo número de arquivos. Escolha pelo problema que você quer parar de resolver toda vez que toca.</p></div>
          <h2>Menos ajuste.<br /><em>Mais música.</em></h2>
        </div>

        <div className="product-list">
          {featuredProducts.map((product, index) => (
            <article className={`product-row product-${product.tone}`} key={product.href} data-reveal="fade">
              <div className="product-index"><span>{product.index}</span><small>{product.device}</small></div>
              <div className={`product-media media-${product.media}`} data-reveal={index % 2 === 0 ? "image-left" : "image-right"}>
                {/* Product artwork is served directly because the Sites runtime does not expose Next's image optimizer. */}
                {/* eslint-disable-next-line @next/next/no-img-element */}
                <img src={product.image} alt={`Capa do produto ${product.name}`} loading="lazy" />
                <span className="media-corner">MS / {product.index}</span>
              </div>
              <div className="product-info" data-reveal="from-right">
                <div>
                  <div className="product-topline"><p className="product-device">{product.device}</p><span>{product.badge}</span></div>
                  <h3>{product.name}</h3>
                  <p className="product-description">{product.description}</p>
                  <ul className="product-benefits">{product.benefits.map((benefit) => <li key={benefit}>{benefit}</li>)}</ul>
                </div>
                <div className="product-commerce">
                  <p className="product-author">Autor: <strong>{product.author}</strong></p>
                  <div className="product-price"><span>{product.installments}</span><strong>Ou {product.cash}</strong></div>
                  <a href={product.href} target="_blank" rel="noreferrer">Quero este tone pack <Arrow diagonal /></a>
                  <p className="secure-checkout"><span>✓</span> Compra processada com segurança pela Hotmart</p>
                </div>
              </div>
            </article>
          ))}
        </div>
        <p className="checkout-note">*As condições de parcelamento podem variar no checkout. Pagamento e entrega digital processados pela Hotmart.</p>
        <a className="products-catalog-cta" href="/presets"><span>Não encontrou o que procura?</span><strong>Ver todos os presets</strong><Arrow /></a>
      </section>

      <section className="conversion-section">
        <div className="conversion-kicker" data-reveal="fade"><span>O QUE VOCÊ LEVA</span><span>NÃO É SÓ UM ARQUIVO</span></div>
        <div className="conversion-content">
          <h2 data-reveal="clip">Compre menos tempo perdido.<br /><em>Ganhe mais tempo tocando.</em></h2>
          <div className="conversion-grid" data-reveal="from-right">
            <article><span>01</span><h3>Comece de uma base confiável</h3><p>Abra o preset, conecte seu setup e parta de uma estrutura pensada por quem vive o palco.</p></article>
            <article><span>02</span><h3>Mantenha o foco na execução</h3><p>Troque de momento musical sem deixar a regulagem roubar sua atenção da música.</p></article>
            <article><span>03</span><h3>Adapte sem começar do zero</h3><p>Ajuste guitarra, monitoração e técnica sobre uma base coerente, sem reconstruir toda a cadeia.</p></article>
          </div>
          <a className="conversion-cta" href="/presets">Encontrar meu tone pack <Arrow /></a>
        </div>
      </section>

      <section className="faq-section">
        <div className="faq-title" data-reveal="from-left"><p className="eyebrow"><span /> INFORMAÇÕES</p><h2>Antes de<br /><em>tocar.</em></h2></div>
        <div className="faq-list" data-reveal="from-right">
          <details><summary>Como recebo os presets?<span>+</span></summary><p>Após a confirmação do pagamento, a Hotmart libera o acesso digital e envia as instruções para o e-mail usado na compra.</p></details>
          <details><summary>Consigo ouvir os timbres antes de comprar?<span>+</span></summary><p>Sim. No Instagram de Mateus Saos você encontra demonstrações dos presets em situações reais de execução.</p></details>
          <details><summary>O resultado será idêntico no meu equipamento?<span>+</span></summary><p>O som pode variar conforme guitarra, captadores, monitoração e técnica. Pequenos ajustes podem adaptar o preset ao seu setup.</p></details>
          <details><summary>Preciso dominar equalização para usar?<span>+</span></summary><p>Não. A proposta é entregar um ponto de partida pronto para tocar. Você pode usar como está ou fazer pequenos ajustes para combinar com sua guitarra e monitoração.</p></details>
          <details><summary>Qual coleção devo escolher?<span>+</span></summary><p>Escolha o Tone Pack Full se quer a solução mais completa para Quad Cortex; a Boutique Overdrive Collection se sua prioridade são drives; ou a Complete Collection se seu equipamento é a HX Stomp.</p></details>
        </div>
      </section>

      <section className="final-cta" data-reveal="scale">
        <p>A PRÓXIMA MÚSICA NÃO VAI ESPERAR A REGULAGEM</p>
        <h2><span>Menos dúvida.</span><span>Mais intenção.</span><em>Mais música.</em></h2>
        <a href="/presets">Escolher meu tone pack <Arrow /></a>
      </section>

      <footer>
        <a className="brand" href="#top">MATEUS <span>SAOS</span></a>
        <p>Presets profissionais para guitarra.</p>
        <div className="footer-links"><a href="https://www.instagram.com/_mateusaos/" target="_blank" rel="noreferrer">Instagram ↗</a><a href="https://www.youtube.com/watch?v=oZz1hxYEoGs" target="_blank" rel="noreferrer">YouTube ↗</a></div>
        <small>© 2026 Mateus Saos</small>
      </footer>
    </main>
  );
}
