# APIExpress - Internal Reference API

> **KB Agency Pay** | Última atualização: 06/03/2026

APIExpress é uma API simplificada para pagamentos por referência, ideal para integrações rápidas em projetos internos e ferramentas no-code.

## 🔐 Autenticação

**OBRIGATÓRIA**: Todas as requisições exigem Bearer Token da APIExpress.

```bash
Authorization: Bearer YOUR_API_EXPRESS_KEY
```

Obtenha sua chave no painel SuperAdmin: **APIExpress**

## Quickstart

```bash
curl -X POST https://pay.kbagency.me/api/apiexpress/charge \
  -H "Authorization: Bearer YOUR_API_EXPRESS_KEY" \
  -H "Content-Type: application/json" \
  -d '{
    "amount": 5000.00,
    "reference": "ORDER-12345"
  }'
```

## Endpoints

### 1. Gerar Referência

**POST** `https://pay.kbagency.me/api/apiexpress/charge`

#### Request Body
```json
{
  "amount": 5000.00,
  "reference": "ORDER-12345",
  "description": "Opcional"
}
```

#### Response (200 OK)
```json
{
  "status": "pending",
  "reference": "ORDER-12345",
  "payment_data": {
    "entity": "00000",
    "reference": "123456789",
    "amount": 5000.00
  },
  "check_status_url": "https://pay.kbagency.me/api/apiexpress/status/ORDER-12345"
}
```

### 2. Verificar Status

**GET** `https://pay.kbagency.me/api/apiexpress/status/{reference}`

## Status Possíveis

- `pending`: Aguardando pagamento no Multicaixa
- `success`: Pagamento confirmado
- `failed`: Pagamento falhou ou expirado

