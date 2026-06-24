"use client";

import { useEffect, useState } from "react";

const BUYERS = [
  { name: "Madalena", city: "Luanda" },
  { name: "Kézio", city: "Benguela" },
  { name: "Francisca", city: "Huambo" },
  { name: "Adilson", city: "Lubango" },
  { name: "Telma", city: "Cabinda" },
  { name: "Nelson", city: "Viana" },
  { name: "Joelma", city: "Luanda" },
  { name: "Helder", city: "Lobito" },
  { name: "Neusa", city: "Uíge" },
  { name: "Dércio", city: "Luanda" },
  { name: "Celma", city: "Namibe" },
  { name: "Valter", city: "Malanje" },
  { name: "Idalina", city: "Benguela" },
  { name: "Osvaldo", city: "Luanda" },
  { name: "Maritza", city: "Huambo" },
];

// "Há X min" DETERMINÍSTICO por comprador (sem reshuffle aleatório a cada rotação,
// que torna a prova social detetável como falsa). Cada comprador mostra sempre o
// mesmo valor recente (1–14 min), e a rotação é sequencial.
function minutesFor(i: number) {
  return ((i * 7 + 2) % 14) + 1;
}

export function SocialProofBar() {
  // Seed inicial único (variação realista entre visitantes); a partir daí é determinístico.
  const [index, setIndex] = useState(() => Math.floor(Math.random() * BUYERS.length));
  const [visible, setVisible] = useState(true);

  useEffect(() => {
    const interval = setInterval(() => {
      setVisible(false);
      setTimeout(() => {
        setIndex(prev => (prev + 1) % BUYERS.length);
        setVisible(true);
      }, 400);
    }, 5000);
    return () => clearInterval(interval);
  }, []);

  const buyer = BUYERS[index];
  const minutes = minutesFor(index);

  return (
    <div className="w-full rounded-lg bg-brand/[0.08] border border-brand/15 px-3 py-2 mb-4">
      <div
        className={`flex items-center justify-center gap-2 text-xs transition-all duration-400 ${
          visible ? "opacity-100 translate-y-0" : "opacity-0 -translate-y-2"
        }`}
      >
        <span className="relative flex h-2 w-2 shrink-0">
          <span className="absolute inline-flex h-full w-full animate-ping rounded-full bg-brand opacity-75" />
          <span className="relative inline-flex h-2 w-2 rounded-full bg-brand" />
        </span>
        <span className="text-muted">
          <strong className="text-foreground">{buyer.name}</strong> de {buyer.city} comprou{" "}
          <span className="text-brand">há {minutes} min</span>
        </span>
      </div>
    </div>
  );
}
