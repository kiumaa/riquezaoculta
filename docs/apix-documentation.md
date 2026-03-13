# APIx - Headless Checkout API

> **KB Agency Pay** | Última atualização: 06/03/2026

APIx é uma API headless para Multicaixa Express que permite construir interfaces de pagamento totalmente personalizadas.

## 🔐 Autenticação

**OBRIGATÓRIA**: Todas as requisições exigem Bearer Token.

```bash
Authorization: Bearer YOUR_API_KEY
```

Obtenha sua chave no painel: **Configurações → API**

### Erro de Autenticação

```json
{
  "error": "Unauthorized",
  "message": "Valid API key required"
}
```
**Status**: `401 Unauthorized`

## 🆚 APIx vs API Standard

| Característica | API Standard (/api/payments) | APIx (/api/apix) |
|---|---|---|
| **Acesso** | Todos merchants | Super Admin only |
| **UI** | Hosted (pay.kbagency.me) | Custom (headless) |
| **Redirect** | Sim | Não |
| **Webhook** | Configurável | Não disponível |
| **Métodos** | GPO + Referência | GPO only |

## Quickstart

```bash
curl -X POST https://pay.kbagency.me/api/apix/charge \
  -H "Authorization: Bearer YOUR_API_KEY" \
  -H "Content-Type: application/json" \
  -d '{
    "phone": "923456789",
    "amount": 5000.00,
    "reference": "ORDER-12345",
    "redirect_url": "https://yourapp.com/success"
  }'
```

## Endpoints

### 1. Processar Pagamento

**POST** `https://pay.kbagency.me/api/apix/charge`

#### Headers
```
Authorization: Bearer YOUR_API_KEY
Content-Type: application/json
```

#### Request Body
```json
{
  "phone": "923456789",
  "amount": 5000.00,
  "reference": "ORDER-12345",
  "redirect_url": "https://yourapp.com/success",
  "description": "Optional description"
}
```

| Campo | Tipo | Obrigatório | Descrição |
|---|---|---|---|
| phone | string | ✅ Sim | Telemóvel (9 dígitos, começa com 9) |
| amount | number | ✅ Sim | Valor em AOA (mínimo: 100) |
| reference | string | ✅ Sim | ID único da transação |
| redirect_url | string | ✅ Sim | URL de redirecionamento |
| description | string | ❌ Não | Descrição do pagamento |

#### Response (200 OK)
```json
{
  "status": "pending",
  "reference": "ORDER-12345",
  "redirect_url": "https://yourapp.com/success",
  "message": "Payment initiated. Awaiting confirmation.",
  "check_status_url": "https://pay.kbagency.me/api/apix/status/ORDER-12345"
}
```

### 2. Verificar Status

**GET** `https://pay.kbagency.me/api/apix/status/{reference}`

#### Headers
```
Authorization: Bearer YOUR_API_KEY
```

#### Response (200 OK)
```json
{
  "status": "success",
  "reference": "ORDER-12345",
  "amount": 5000.00,
  "created_at": "2026-02-05T12:00:00Z",
  "paid_at": "2026-02-05T12:01:30Z",
  "redirect_url": "https://yourapp.com/success"
}
```

## Códigos de Erro

| Código | Erro | Descrição |
|---|---|---|
| 401 | Unauthorized | API Key ausente ou inválida |
| 404 | Not Found | Pag amento não encontrado |
| 422 | Validation Error | Dados de entrada inválidos |
| 500 | Server Error | Erro interno |

### Exemplo de Erro de Validação
```json
{
  "message": "The given data was invalid.",
  "errors": {
    "phone": ["The phone field is required."],
    "amount": ["The amount must be at least 100."]
  }
}
```

## Exemplos de Código

### JavaScript (Fetch)
```javascript
async function processPayment(phone, amount, orderId) {
  const response = await fetch('https://pay.kbagency.me/api/apix/charge', {
    method: 'POST',
    headers: {
      'Authorization': 'Bearer YOUR_API_KEY',
      'Content-Type': 'application/json'
    },
    body: JSON.stringify({
      phone: phone,
      amount: amount,
      reference: orderId,
      redirect_url: 'https://yourapp.com/success'
    })
  });
  
  const data = await response.json();
  
  if (data.status === 'pending') {
    // Poll status every 3 seconds
    const interval = setInterval(async () => {
      const status = await checkStatus(data.reference);
      if (status.status === 'success') {
        clearInterval(interval);
        window.location.href = status.redirect_url;
      }
    }, 3000);
  }
}

async function checkStatus(reference) {
  const resp = await fetch(`https://pay.kbagency.me/api/apix/status/${reference}`, {
    headers: { 'Authorization': 'Bearer YOUR_API_KEY' }
  });
  return await resp.json();
}
```

### PHP (cURL)
```php
$apiKey = 'YOUR_API_KEY';

$ch = curl_init('https://pay.kbagency.me/api/apix/charge');
curl_setopt($ch, CURLOPT_RETURNTRANSFER, true);
curl_setopt($ch, CURLOPT_POST, true);
curl_setopt($ch, CURLOPT_HTTPHEADER, [
    'Authorization: Bearer ' . $apiKey,
    'Content-Type: application/json'
]);
curl_setopt($ch, CURLOPT_POSTFIELDS, json_encode([
    'phone' => '923456789',
    'amount' => 5000.00,
    'reference' => 'ORDER-12345',
    'redirect_url' => 'https://yourapp.com/success'
]));

$response = curl_exec($ch);
$data = json_decode($response, true);
```

### Python (Requests)
```python
import requests

API_KEY = 'YOUR_API_KEY'

response = requests.post('https://pay.kbagency.me/api/apix/charge',
    headers={'Authorization': f'Bearer {API_KEY}'},
    json={
        'phone': '923456789',
        'amount': 5000.00,
        'reference': 'ORDER-12345',
        'redirect_url': 'https://yourapp.com/success'
    }
)

data = response.json()
print(f"Payment {data['status']}")
```

## Integração No-Code

### Zapier / Make.com
1. Adicionar módulo "Webhooks" ou "HTTP Request"
2. Método: POST
3. URL: `https://pay.kbagency.me/api/apix/charge`
4. Header: `Authorization: Bearer YOUR_API_KEY`
5. Body Type: JSON
6. Mapear campos: phone, amount, reference, redirect_url

### Bubble.io
1. Instalar plugin "API Connector"
2. Criar nova API: "KB Agency APIx"
3. Adicionar Call: "Process Payment"
4. Configurar como POST request
5. Usar workflow action "API Connector - Process Payment"

## Status Possíveis

- `pending`: Aguardando confirmação no Multicaixa Express
- `success`: Pagamento confirmado
- `failed`: Pagamento falhou ou expirado

## Suporte

- **Email**: suporte@kbagency.me
- **Documentação completa**: https://pay.kbagency.me/docs/KB_AGENCY_PAY_API.md

---

**Versão**: 3.0 | **Data**: 06/03/2026
