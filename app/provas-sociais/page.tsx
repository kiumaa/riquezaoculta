import type { Metadata } from "next";
import ProvasSociaisClient from "./client";

export const metadata: Metadata = {
  title: "Resultados Reais | 1M Em Uma Semana",
  description:
    "Vê conversas reais de pessoas que compraram o Guia 1M Em Uma Semana e transformaram os seus resultados em menos de 48 horas.",
};

export default function ProvasSociaisPage() {
  return <ProvasSociaisClient />;
}
