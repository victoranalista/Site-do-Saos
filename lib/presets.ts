export type Preset = {
  id: string;
  slug: string;
  title: string;
  platform: "QUAD CORTEX" | "HX STOMP";
  category: "COLEÇÃO COMPLETA" | "OVERDRIVE" | "AMBIÊNCIA" | "LEAD" | "CLEAN";
  description: string;
  imageUrl: string;
  checkoutUrl: string;
  installments: string;
  cashPrice: string;
  badge: string;
  featuredOrder: number | null;
  published: boolean;
};

export const initialPresets: Preset[] = [
  {
    id: "tone-pack-full",
    slug: "quad-cortex-tone-pack-full",
    title: "Tone Pack Full",
    platform: "QUAD CORTEX",
    category: "COLEÇÃO COMPLETA",
    description: "Cleans, ambiências, bases e leads organizados para atravessar o repertório sem reconstruir o setup a cada música.",
    imageUrl: "/images/products/quad-cortex-editorial-v3.webp",
    checkoutUrl: "https://pay.hotmart.com/C106564201Y?bid=1784202862324",
    installments: "12 x de R$ 20,58*",
    cashPrice: "R$ 199,00 à vista",
    badge: "MAIS COMPLETO",
    featuredOrder: 1,
    published: true,
  },
  {
    id: "boutique-overdrive",
    slug: "boutique-overdrive-collection",
    title: "Boutique Overdrive Collection",
    platform: "QUAD CORTEX",
    category: "OVERDRIVE",
    description: "15 capturas boutique com variações de ganho, resposta orgânica e dinâmica preservada para base e lead.",
    imageUrl: "/images/products/boutique-overdrive-editorial-v4.webp",
    checkoutUrl: "https://pay.hotmart.com/Q106604579U?bid=1784202877258",
    installments: "12 x de R$ 13,34*",
    cashPrice: "R$ 129,00 à vista",
    badge: "15 CAPTURAS",
    featuredOrder: 2,
    published: true,
  },
  {
    id: "hx-stomp-complete",
    slug: "hx-stomp-complete-collection",
    title: "Complete Collection",
    platform: "HX STOMP",
    category: "COLEÇÃO COMPLETA",
    description: "Uma coleção pronta para ampliar a versatilidade da HX Stomp e reduzir a distância entre imaginar o timbre e começar a tocar.",
    imageUrl: "/images/products/hx-stomp-editorial-v3.webp",
    checkoutUrl: "https://pay.hotmart.com/E106592458P",
    installments: "12 x de R$ 12,40*",
    cashPrice: "R$ 119,90 à vista",
    badge: "HX STOMP",
    featuredOrder: 3,
    published: true,
  },
];
