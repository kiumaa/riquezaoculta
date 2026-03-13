# 🔍 GUIA DE DIAGNÓSTICO - PAGAMENTOS FALHADOS

## ⚠️ SINTOMAS COMUNS

- [ ] Pagamentos ficam em "pending" para sempre
- [ ] Webhook não actualiza status
- [ ] Clientes dizem que pagaram mas sistema não detecta
- [ ] Pagamentos Express falham
- [ ] Referências geradas mas não confirmam

---

## 🔎 CHECKLIST DE VERIFICAÇÃO

### 1. VARIÁVEIS DE AMBIENTE (Vercel)

Vai a `vercel.com` → Project → Settings → Environment Variables

```
✅ KB_AGENCY_API_KEY      = sk_live_... ou sk_test_...
✅ KB_API_EXPRESS_KEY     = sk_live_... ou sk_test_...
✅ KB_AGENCY_WEBHOOK_SECRET = whsec_...
✅ DATABASE_URL           = postgres://...
```

**Teste:** Corres tudo em maiúsculas/minúsculas correctas?

---

### 2. WEBHOOK CONFIGURADO NO KB AGENCY

No dashboard da KB Agency (pay.kbagency.me):

```
URL do Webhook: https://www.riquezaoculta.click/api/webhooks/kbagency
Método: POST
Eventos: payment.success, payment.failed
Secret: (mesmo que KB_AGENCY_WEBHOOK_SECRET)
```

**Teste:** Faz um pagamento de teste e verifica se o webhook foi chamado:
```bash
# Ver logs na Vercel
curl -s https://www.riquezaoculta.click/api/admin/checkouts
```

---

### 3. ENDPOINTS ACESSÍVEIS

Testa cada endpoint:

```bash
# Health check
curl https://www.riquezaoculta.click/api/health

# Criar sessão (deve retornar referência)
curl -X POST https://www.riquezaoculta.click/api/payment/session \
  -H "Content-Type: application/json" \
  -d '{"name":"Teste","phone":"244923456789","method":"reference"}'

# Verificar status
curl https://www.riquezaoculta.click/api/payment/status/REFERENCIA_AQUI
```

---

### 4. VERIFICAR PAGAMENTOS PENDENTES

```bash
# Lista os últimos 20 checkouts
curl https://www.riquezaoculta.click/api/admin/checkouts \
  -H "Authorization: Bearer TOKEN_ADMIN"

# Ou executa o script de diagnóstico:
node scripts/test_pendings.ts
```

---

## 🚨 PROBLEMAS COMUNS E SOLUÇÕES

### PROBLEMA 1: Pagamentos ficam "pending" para sempre

**Causas:**
1. Webhook não configurado correctamente
2. KB Agency não está a chamar o webhook
3. Erro no processamento do webhook

**Diagnóstico:**
```bash
# Ver logs do webhook na Vercel
# Procura por: "[Webhook] Received"
```

**Solução:**
- Verifica se KB_AGENCY_WEBHOOK_SECRET está configurado
- Testa fazer um pagamento e vê se aparece log na Vercel
- Se não aparecer, o problema é do lado da KB Agency

---

### PROBLEMA 2: Express falha sempre

**Causas:**
1. KB_API_EXPRESS_KEY inválida ou expirada
2. Formato do telefone errado
3. Problema na API da KB Agency

**Diagnóstico:**
```bash
# Ver logs na Vercel procurando:
# "[Express Payment] ALERTA: Modo simulado" = chave não configurada
# "KB Express charge failed" = erro na API
```

**Solução:**
- Verifica se KB_API_EXPRESS_KEY começa com "sk_"
- Testa com um número em formato 923456789 (sem +244)
- Contacta KB Agency se o erro persistir

---

### PROBLEMA 3: Referência gera mas não confirma

**Causas:**
1. Cliente não pagou ainda (normal)
2. Pagou mas webhook falhou
3. Referência expirou (24-48h)

**Diagnóstico:**
```bash
# Verifica se o checkout existe:
curl https://www.riquezaoculta.click/api/payment/status/ROV2-XXXXXXX

# Deve retornar status (pending/paid/failed)
```

**Solução:**
- Confirma com cliente se pagou e como (ATM/Internet Banking)
- Se pagou, verifica nos logs se webhook foi recebido
- Se não foi, actualiza manualmente no admin

---

### PROBLEMA 4: Sistema gera referências simuladas

**Sintoma:** No log aparece `mode: "simulated"`

**Causa:** KB_AGENCY_API_KEY não está configurada

**Solução:**
```bash
# Verifica variável na Vercel
# Deve estar em Production (não só Development)
```

---

## 📊 COMO VER LOGS

### Na Vercel (Dashboard):
1. Vai a `vercel.com`
2. Selecciona o projecto
3. Clica em "Logs" (tab superior)
4. Filtra por:
   - Function: `/api/payment/*`
   - Function: `/api/webhooks/kbagency`

### Na linha de comando:
```bash
npx vercel logs --json
```

---

## 🔧 TESTE COMPLETO PASSO-A-PASSO

### Teste 1: Criar Referência
```bash
curl -X POST https://www.riquezaoculta.click/api/payment/session \
  -H "Content-Type: application/json" \
  -d '{
    "name": "Teste Diagnóstico",
    "phone": "244923456789",
    "method": "reference"
  }'
```

**Esperado:**
```json
{
  "reference": "ROV2-...",
  "method": "reference",
  "payment": {
    "entity": "10111",
    "reference": "123456789",
    "amount": 4500,
    "mode": "live"
  }
}
```

Se `mode` for `simulated` → **PROBLEMA: API key não configurada**

---

### Teste 2: Verificar Status
```bash
curl https://www.riquezaoculta.click/api/payment/status/ROV2-XXXXXXXX
```

**Esperado:**
```json
{
  "reference": "ROV2-...",
  "status": "pending"
}
```

---

### Teste 3: Simular Webhook
```bash
curl -X POST https://www.riquezaoculta.click/api/webhooks/kbagency \
  -H "Content-Type: application/json" \
  -H "x-kbagency-signature: teste" \
  -d '{
    "reference": "ROV2-XXXXXXXX",
    "status": "paid"
  }'
```

**Esperado:** Status 200 ou 401 (se tiver signature configurada)

Se retornar 500 → **PROBLEMA no código do webhook**

---

## 🆘 SE NADA FUNCIONAR

1. **Exporta logs das últimas 24h:**
```bash
npx vercel logs --since=24h > logs-24h.txt
```

2. **Envia-me:**
   - Logs de erros
   - Screenshot das variáveis de ambiente (oculta valores)
   - Exemplo de referência que falhou

3. **Teste alternativo:**
   - Desactiva temporariamente o Express
   - Foca só em Referência
   - Se Referência funcionar, o problema é específico do Express

---

## ✅ CHECKLIST FINAL

Antes de dizer que está tudo bem, verifica:

- [ ] Variáveis de ambiente todas configuradas
- [ ] Webhook configurado no dashboard KB Agency
- [ ] Último pagamento teste aparece na base de dados
- [ ] Logs não mostram erros
- [ ] Cron job está a correr (se configurado)

**Se tudo isto estiver OK e ainda houver falhas, o problema é do lado da KB Agency.**
