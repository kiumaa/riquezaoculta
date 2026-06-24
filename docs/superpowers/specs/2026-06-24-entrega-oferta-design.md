# Spec — Modelação e entrega da oferta (Guia 1M + Bónus Riqueza Oculta)

**Data:** 2026-06-24
**Estado:** Aprovado para implementação

## Problema

A entrega pós-pagamento está incorreta:

1. **Ficheiro errado no produto principal.** A rota `/api/download/[reference]` serve sempre
   `data/Riqueza_Oculta.pdf`, mas o produto principal é o **Guia 1M em Uma Semana**. Quem compra o
   guia recebe o PDF do bónus.
2. **Produto principal exposto de graça.** O PDF do guia 1M está em `public/` →
   descarregável por qualquer pessoa sem pagar.
3. **Order bump nunca entregue.** O "Riqueza Oculta" (order bump, +priceOrderBump) não é gravado
   como flag (só entra no `amount`/`description`) nem entregue como produto separado.

## Modelo-alvo

| Produto | `product` | Entregável |
|---|---|---|
| Análise do Quiz | `quiz` | Análise on-page (sem PDF). Download → 403. |
| Guia 1M em Uma Semana | `ebook` / `ebook_upsell` | `data/guia-1m-em-uma-semana.pdf` |
| + Bónus Riqueza Oculta (order bump, só com ebook) | flag `orderBump` no payload | `data/Riqueza_Oculta.pdf` (**além** do guia 1M) |

Verificado: o PDF do guia 1M é o produto certo, completo (30 págs, 4177 palavras) e limpo (sem
watermark/branding de gateway). O "okandapay" era só rótulo no nome do ficheiro.

## Alterações

1. **Proteger o guia.** `public/ebook_1m_em_uma_semana_v2_okandapay.pdf` → `data/guia-1m-em-uma-semana.pdf`.
   Remover duplicado `assets/Riqueza_Oculta.pdf` (idêntico a `data/`, não importado).
2. **Tracing no build.** `next.config.mjs` → `outputFileTracingIncludes` para a rota de download
   incluir explicitamente os 2 PDFs de `data/` (senão dão 404 no standalone da Vercel).
3. **Flag do order bump.** Em `session/route.ts` e `express/route.ts`, gravar `orderBump: <valor>` no
   `providerPayload` quando `orderBump>0`.
4. **`lib/fulfillment.ts` (fonte única).** `getDeliverables(payload, amount) → Deliverable[]`:
   - quiz → `[]`
   - ebook → `[guia1m]` + (`bonus` se flag `orderBump`; *fallback legado*: `amount > pricePromo`)
   - `getDeliverableById(id)` mapeia `guia1m`/`bonus` → ficheiro + nome de download.
5. **Download route.** Aceita `?item=guia1m|bonus` (default `guia1m`); valida que o item pertence aos
   entregáveis do checkout pago; serve o ficheiro de `data/`. Quiz/itens não autorizados → 403.
6. **verify route.** Devolve `{ paid, name, items:[{id,title}] }` (substitui `isEbook`).
7. **/acesso.** Um botão de download por entregável (cross-device via `?ref`, lendo `items` do verify).
8. **Sucesso do checkout.** Mostra o botão do bónus quando `orderBumpChecked`.
9. **(opcional) Mensagem de confirmação** menciona o bónus quando incluído.

## Arquitetura

Abordagem **A**: uma rota de download com `?item=` + resolver central `lib/fulfillment.ts`.
Autenticação/validação num só sítio; cross-device seguro; DRY.

## Legado

Checkouts pagos antes da flag: guia 1M sempre entregue (productType ebook); bónus inferido por
`amount > pricePromo`.

## Verificação

`tsc --noEmit`, `eslint`, `next build`. Confirmar que o download serve o ficheiro certo por `item` e
que o /acesso mostra 1 ou 2 botões conforme o order bump.
