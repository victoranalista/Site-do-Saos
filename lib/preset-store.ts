import { neon } from "@neondatabase/serverless";
import { initialPresets, type Preset } from "./presets";

type PresetRow = {
  id: string;
  slug: string;
  title: string;
  platform: string;
  category: string;
  description: string;
  image_url: string;
  checkout_url: string;
  installments: string;
  cash_price: string;
  badge: string;
  featured_order: number | null;
  published: boolean;
};

let schemaPromise: Promise<void> | null = null;

function database() {
  const connectionString = process.env.POSTGRES_URL;
  if (!connectionString) throw new Error("POSTGRES_URL não configurada");
  return neon(connectionString);
}

function rowToPreset(row: PresetRow): Preset {
  return {
    id: row.id,
    slug: row.slug,
    title: row.title,
    platform: row.platform as Preset["platform"],
    category: row.category as Preset["category"],
    description: row.description,
    imageUrl: row.image_url,
    checkoutUrl: row.checkout_url,
    installments: row.installments,
    cashPrice: row.cash_price,
    badge: row.badge,
    featuredOrder: row.featured_order,
    published: Boolean(row.published),
  };
}

async function writePreset(preset: Preset) {
  const now = new Date().toISOString();
  await database().query(
    `INSERT INTO presets (id, slug, title, platform, category, description, image_url, checkout_url, installments, cash_price, badge, featured_order, published, created_at, updated_at)
     VALUES ($1,$2,$3,$4,$5,$6,$7,$8,$9,$10,$11,$12,$13,$14,$14)
     ON CONFLICT (id) DO UPDATE SET slug=EXCLUDED.slug, title=EXCLUDED.title, platform=EXCLUDED.platform, category=EXCLUDED.category, description=EXCLUDED.description, image_url=EXCLUDED.image_url, checkout_url=EXCLUDED.checkout_url, installments=EXCLUDED.installments, cash_price=EXCLUDED.cash_price, badge=EXCLUDED.badge, featured_order=EXCLUDED.featured_order, published=EXCLUDED.published, updated_at=EXCLUDED.updated_at`,
    [preset.id, preset.slug, preset.title, preset.platform, preset.category, preset.description, preset.imageUrl, preset.checkoutUrl, preset.installments, preset.cashPrice, preset.badge, preset.featuredOrder, preset.published, now],
  );
}

async function ensureSchema() {
  if (!schemaPromise) {
    schemaPromise = (async () => {
      const db = database();
      await db`CREATE TABLE IF NOT EXISTS presets (
        id TEXT PRIMARY KEY,
        slug TEXT NOT NULL UNIQUE,
        title TEXT NOT NULL,
        platform TEXT NOT NULL,
        category TEXT NOT NULL,
        description TEXT NOT NULL,
        image_url TEXT NOT NULL,
        checkout_url TEXT NOT NULL,
        installments TEXT NOT NULL,
        cash_price TEXT NOT NULL,
        badge TEXT NOT NULL,
        featured_order INTEGER,
        published BOOLEAN NOT NULL DEFAULT TRUE,
        created_at TEXT NOT NULL,
        updated_at TEXT NOT NULL
      )`;
      await db`CREATE INDEX IF NOT EXISTS presets_published_idx ON presets (published)`;
      await db`CREATE INDEX IF NOT EXISTS presets_featured_idx ON presets (featured_order)`;
      await db.query(
        "UPDATE presets SET image_url = $1 WHERE id = $2 AND image_url IN ($3, $4)",
        ["/images/products/quad-cortex-editorial-v3.webp", "tone-pack-full", "/images/products/quad-cortex-clean-hd.webp", "/images/quad-cortex-tone-pack.webp"],
      );
      await db.query(
        "UPDATE presets SET image_url = $1 WHERE id = $2 AND image_url IN ($3, $4)",
        ["/images/products/hx-stomp-editorial-v3.webp", "hx-stomp-complete", "/images/products/hx-stomp-clean-hd.webp", "/images/hx-stomp-complete.webp"],
      );
      await db.query(
        "UPDATE presets SET image_url = $1 WHERE id = $2 AND image_url IN ($3, $4, $5)",
        ["/images/products/boutique-overdrive-editorial-v4.webp", "boutique-overdrive", "/images/products/boutique-overdrive-editorial-v3.webp", "/images/boutique-overdrive.webp", "/images/products/boutique-overdrive-v2.webp"],
      );
      const count = await db`SELECT COUNT(*)::int AS total FROM presets` as Array<{ total: number }>;
      if ((count[0]?.total ?? 0) === 0) {
        for (const preset of initialPresets) await writePreset(preset);
      }
    })();
  }
  await schemaPromise;
}

export async function listPresets({ publishedOnly = false, featuredOnly = false } = {}) {
  await ensureSchema();
  const db = database();
  let rows: PresetRow[];
  if (publishedOnly && featuredOnly) rows = await db`SELECT * FROM presets WHERE published = TRUE AND featured_order IS NOT NULL ORDER BY featured_order ASC` as PresetRow[];
  else if (publishedOnly) rows = await db`SELECT * FROM presets WHERE published = TRUE ORDER BY created_at DESC` as PresetRow[];
  else if (featuredOnly) rows = await db`SELECT * FROM presets WHERE featured_order IS NOT NULL ORDER BY featured_order ASC` as PresetRow[];
  else rows = await db`SELECT * FROM presets ORDER BY created_at DESC` as PresetRow[];
  return rows.map(rowToPreset);
}

export async function savePreset(preset: Preset) {
  await ensureSchema();
  if (preset.featuredOrder) {
    await database().query("UPDATE presets SET featured_order = NULL, updated_at = $1 WHERE featured_order = $2 AND id <> $3", [new Date().toISOString(), preset.featuredOrder, preset.id]);
  }
  await writePreset(preset);
}

export async function deletePreset(id: string) {
  await ensureSchema();
  await database().query("DELETE FROM presets WHERE id = $1", [id]);
}
