import type { Metadata } from "next";
import { CatalogClient } from "./catalog-client";

export const metadata: Metadata = {
  title: "Catálogo de presets | Mateus Saos",
  description: "Explore os presets de Mateus Saos para Quad Cortex e HX Stomp.",
};

export default function PresetsPage() {
  return <CatalogClient />;
}

