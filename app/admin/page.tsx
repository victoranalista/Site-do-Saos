import type { Metadata } from "next";
import { AdminClient } from "./admin-client";

export const metadata: Metadata = {
  title: "Área do artista | Mateus Saos",
  robots: { index: false, follow: false },
};

export default function AdminPage() {
  return <AdminClient />;
}

