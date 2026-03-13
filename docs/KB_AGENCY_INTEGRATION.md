# KB Agency Pay — Lógica de Integração de Checkout

> Documento de referência para replicar a integração de pagamento usada no projecto Riqueza Oculta V2.
> Fornece este ficheiro (com `docs/apix-documentation.md` e `docs/apiexpress-documentation.md`) a qualquer IA para seguir exactamente a mesma lógica.

---

## 1. Visão Geral

Dois métodos de pagamento suportados, ambos servidos pela KB Agency Pay (`https://pay.kbagency.me`):

| Método | API | Chave de ambiente | Produto KB |
|--------|-----|-------------------|-----------|
| **Referência** (ATM / Internet Banking) | APIExpress | `KB_API_EXPRESS_KEY` | `/api/apiexpress/charge` |
| **MCX Express** (push no app) | APIx | `KB_AGENCY_API_KEY` | `/api/apix/charge` |

Ambos usam `Bearer Token` no header `Authorization`.

---

## 2. Variáveis de Ambiente

```env
KB_API_EXPRESS_KEY=      # chave da APIExpress (pagamento por referência)
KB_AGENCY_API_KEY=       # chave da APIx (Multicaixa Express)
KB_AGENCY_WEBHOOK_SECRET= # opcional — para validar webhooks
NEXT_PUBLIC_APP_URL=     # URL pública da app (ex: https://riquezaoculta.click)
```

**Fallback de chave para o método referência:** se `KB_API_EXPRESS_KEY` não existir, usa `KB_AGENCY_API_KEY`.

---

## 3. Geração de Referência Interna

```ts
function makeReference() {
  const random = Math.random().toString(36).slice(2, 7).toUpperCase();
  return `ROV2-${Date.now().toString(36).toUpperCase()}-${random}`;
}
// Exemplo: ROV2-LKJH4F2A-X7GQP
```

Esta referência interna (campo `reference`) serve para:
- Identificar o checkout na base de dados
- Ser passada à KB Agency como ID único da transacção
- Servir de parâmetro no polling de status

---

## 4. Método: Pagamento por Referência (APIExpress)

### 4.1 Criar cobrança

```
POST https://pay.kbagency.me/api/apiexpress/charge
Authorization: Bearer KB_API_EXPRESS_KEY
Content-Type: application/json

{
  "amount": 4500,
  "reference": "ROV2-LKJH4F2A-X7GQP",
  "description": "Ebook Riqueza Oculta V2"
}
```

**Resposta esperada (200):**
```json
{
  "status": "pending",
  "reference": "ROV2-LKJH4F2A-X7GQP",
  "payment_data": {
    "entity": "00000",
    "reference": "123456789",
    "amount": 4500.00
  },
  "check_status_url": "https://pay.kbagency.me/api/apiexpress/status/ROV2-..."
}
```

**Extracção do resultado:**
```ts
const paymentData = data.payment_data || data;
// paymentData.entity  → número da entidade para o cliente usar no ATM
// paymentData.reference → referência a mostrar ao cliente
// paymentData.amount  → valor confirmado
```

### 4.2 Verificar status

```
GET https://pay.kbagency.me/api/apiexpress/status/{reference}
Authorization: Bearer KB_API_EXPRESS_KEY
```

---

## 5. Método: Multicaixa Express — APIx

### 5.1 Criar cobrança

```
POST https://pay.kbagency.me/api/apix/charge
Authorization: Bearer KB_AGENCY_API_KEY
Content-Type: application/json

{
  "phone": "923456789",
  "amount": 4500,
  "reference": "ROV2-LKJH4F2A-X7GQP",
  "redirect_url": "https://riquezaoculta.click/checkout/pagamento?success=true&ref=ROV2-...",
  "description": "Ebook Riqueza Oculta V2"
}
```

- `phone`: número de telemóvel MCX do cliente (9 dígitos, começa com 9)
- `redirect_url`: URL para onde a KB Agency redireciona após aprovação no app

**Resposta (200):**
```json
{
  "status": "pending",
  "reference": "ROV2-LKJH4F2A-X7GQP",
  "message": "Payment initiated. Awaiting confirmation."
}
```

O cliente recebe uma notificação push no app MCX. Não há dados de entidade/referência a mostrar — apenas uma tela de "aguardando aprovação".

### 5.2 Verificar status

```
GET https://pay.kbagency.me/api/apix/status/{reference}
Authorization: Bearer KB_AGENCY_API_KEY
```

---

## 6. Normalização de Status

Independentemente do método, normaliza o status retornado pela KB Agency assim:

```ts
const rawStatus = String(data.status || data.data?.status || "pending").toLowerCase();

const normalized =
  rawStatus === "success" || rawStatus === "paid" || rawStatus === "completed"
    ? "paid"
    : rawStatus === "failed" || rawStatus === "cancelled"
      ? "failed"
      : "pending";
```

Estados internos usados: `"pending"` | `"paid"` | `"failed"`

---

## 7. Timeout e Gestão de Erros

- **Timeout:** 12 segundos em todas as chamadas à KB Agency (via `AbortController`)
- **Fallback silencioso:** se a chamada falhar (timeout, erro de rede, status != 2xx), retorna um objeto simulado com `mode: "simulated"`, sem lançar excepção ao utilizador

```ts
// Fallback para referência
return {
  mode: "simulated",
  entity: "00999",
  paymentReference: `${Math.floor(100000000 + Math.random() * 899999999)}`,
  amount: input.amount,
  raw: { fallback: true, error: String(error) }
};

// Fallback para express
return { mode: "simulated", reference: input.reference, amount: input.amount };
```

---

## 8. Endpoints de Sessão de Pagamento

### 8.1 Referência (`/api/payment/session`)

**Responsabilidades:**
1. Rate limiting: 10 pedidos por minuto por IP
2. Validação Zod do body
3. Gerar referência interna única
4. Obter preço promoção das settings (`getSettings()`)
5. Chamar `createCharge()` para criar referência Multicaixa
6. Persistir registo de checkout na DB
7. Retornar dados ao cliente

**Schema de validação:**
```ts
{
  name: string (2–80 chars),
  phone: string (7–24 chars),          // telemóvel WhatsApp do cliente
  method: "reference"
}
```

**Resposta:**
```json
{
  "reference": "ROV2-...",
  "method": "reference",
  "payment": {
    "entity": "00000",
    "reference": "123456789",
    "amount": 4500,
    "mode": "live"
  }
}
```

### 8.2 Express (`/api/payment/express`)

**Nota importante:** Esta rota é fixada na região `cpt1` (Cape Town) da Vercel para garantir que as chamadas à API da KB Agency saiam de um IP sul-africano, conforme exigido pelo endpoint APIx.

```ts
export const preferredRegion = "cpt1";
```

**Responsabilidades:**
1. Rate limiting: 10 pedidos por minuto por IP
2. Validação Zod do body
3. Gerar referência interna única
4. Obter preço promoção das settings (`getSettings()`)
5. Chamar `createExpressCharge()` para iniciar pagamento MCX Express
6. Persistir registo de checkout na DB
7. Retornar dados ao cliente

**Schema de validação:**
```ts
{
  name: string (2–80 chars),
  phone: string (7–24 chars),          // telemóvel WhatsApp do cliente
  expressPhone: string (9–15 chars)    // número para notificação MCX Express
}
```

**Resposta:**
```json
{
  "reference": "ROV2-...",
  "method": "express",
  "payment": {
    "reference": "ROV2-...",
    "amount": 4500,
    "mode": "live"
  }
}
```

---

## 9. Endpoint de Status (`/api/payment/status/[reference]`)

```
GET /api/payment/status/{internalReference}
```

**Lógica:**
1. Procura checkout na DB pelo `reference` interno
2. Se `status === "pending"`: chama `getChargeStatus()` na KB Agency
   - Determina o método: `entity === "express"` → APIx, caso contrário → APIExpress
   - Usa a referência interna (não a referência ATM do cliente) para consultar a KB Agency
3. Se status vier `paid` ou `failed`: actualiza a DB
4. **Dev sem API key:** auto-paga após 20 segundos para facilitar testes

**Resposta:**
```json
{ "reference": "ROV2-...", "status": "pending" }
{ "reference": "ROV2-...", "status": "paid" }
{ "reference": "ROV2-...", "status": "failed" }
```

---

## 10. Polling no Cliente

```ts
// Inicia polling a cada 3 segundos após criação da sessão
const interval = setInterval(async () => {
  const res = await fetch(`/api/payment/status/${paymentReference}`);
  const data = await res.json();

  if (data.status === "paid") {
    // Mostrar ecrã de sucesso, disparar evento de Purchase no pixel
    clearInterval(interval);
  }
  if (data.status === "failed") {
    // Mostrar erro
    clearInterval(interval);
  }
}, 3000);
```

**Tratamento de redirect da KB Agency (método express):**
```ts
// URL: /checkout/pagamento?success=true&ref=ROV2-...
// NÃO confiar no redirect como prova de pagamento.
// Apenas guardar a referência e deixar o polling confirmar via DB.
if (searchParams.get("success") === "true") {
  const ref = searchParams.get("ref");
  if (ref) setPaymentReference(ref);
  setPaymentStatus("pending"); // será actualizado pelo polling
}
```

---

## 11. Registo de Checkout na DB

Campos guardados por cada tentativa de pagamento:

| Campo | Tipo | Descrição |
|-------|------|-----------|
| `reference` | string | Referência interna (`ROV2-...`) — chave primária de tracking |
| `name` | string | Nome do cliente |
| `phone` | string | Telemóvel normalizado do cliente (WhatsApp) |
| `entity` | string | Entidade ATM retornada pela KB, ou `"express"` para MCX |
| `paymentReference` | string | Referência ATM a mostrar ao cliente (ou ref interna para express) |
| `amount` | number | Valor em AOA |
| `status` | enum | `"pending"` \| `"paid"` \| `"failed"` |
| `providerPayload` | json | Resposta raw da KB Agency |
| `createdAt` | datetime | Timestamp de criação |
| `updatedAt` | datetime | Timestamp da última actualização |

---

## 12. Estados de UI no Frontend

```
"select"           → Cliente escolhe método (Referência ou Express)
"express_waiting"  → MCX: aguardar aprovação no app (spinner)
"reference_active" → Referência: mostrar entidade + referência ATM (copiáveis)
paymentStatus === "paid"    → Mostrar ecrã de sucesso + download + grupo VIP
paymentStatus === "failed"  → Mostrar erro
```

Para o método referência, se a KB Agency retornar um `paymentUrl`, mostrar botão de redirect para a página hosted da KB. Caso contrário, mostrar entidade e referência directamente com botões de copiar.

---

## 13. Integração com Webhooks (Opcional)

A APIExpress suporta webhook de confirmação. Helpers para processar o payload:

```ts
// Extrair referência do payload do webhook
function extractWebhookReference(payload) {
  return payload.reference
    || payload.transaction_id
    || payload.order_id
    || payload.data?.reference
    || null;
}

// Verificar se o webhook confirma pagamento
function isWebhookPaid(payload) {
  const event = String(payload.event ?? "").toLowerCase();
  const status = String(payload.status ?? payload.data?.status ?? "").toLowerCase();
  return (
    event === "payment.success" ||
    status === "success" ||
    status === "paid" ||
    status === "completed"
  );
}
```

---

## 14. Fluxo Completo — Diagrama

```
Cliente selecciona método
        │
        ▼
POST /api/payment/session
  ├─ Valida input (Zod)
  ├─ Rate limit (10/min por IP)
  ├─ Gera referência interna (ROV2-...)
  ├─ getSettings() → pricePromo
  │
  ├─ [express] → createExpressCharge()
  │     └─ POST /api/apix/charge → KB Agency (phone, amount, reference, redirect_url)
  │
  └─ [reference] → createCharge()
        └─ POST /api/apiexpress/charge → KB Agency (amount, reference, description)
                │
                ▼
        Retorna {entity, reference, amount} do payment_data
        │
        ▼
insertCheckout() → salva na DB com status "pending"
        │
        ▼
Responde ao cliente com dados de pagamento
        │
        ▼
Cliente inicia polling: GET /api/payment/status/{ref} cada 3s
        │
        ▼
/api/payment/status/[reference]
  ├─ findCheckout(reference)
  ├─ Se pending: getChargeStatus() → KB Agency
  │     ├─ express → GET /api/apix/status/{ref}
  │     └─ reference → GET /api/apiexpress/status/{ref}
  ├─ Normaliza status (success/paid/completed → "paid")
  └─ Se paid/failed: updateCheckoutStatus() → DB
        │
        ▼
Cliente recebe status "paid" → mostra sucesso + download
```

---

## 15. Notas Importantes

1. **Sempre usar a referência interna** (`ROV2-...`) como `reference` nas chamadas à KB Agency — não a referência ATM que a KB devolve ao cliente.

2. **Nunca confiar no redirect** da KB Agency como confirmação de pagamento. Sempre verificar via API de status.

3. **Modo simulado:** se não houver chave de API, o sistema opera sem erros (retorna dados fictícios) — útil para desenvolvimento.

4. **O valor é sempre obtido das settings** (tabela `settings` na DB / `runtime.json`) e nunca é passado pelo cliente no body do pagamento.

5. **O campo `entity` na DB** distingue o método: `"express"` → APIx, qualquer outro valor (número de entidade ATM) → APIExpress.
