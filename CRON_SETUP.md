# Configuração do Cron Job para Recuperação de Pagamentos

## Opção 1: Cron-job.org (Recomendado - Gratuito)

### Passos para configurar:

1. **Acede a:** https://cron-job.org/en/

2. **Cria conta ou faz login**

3. **Clica em "Create cronjob"**

4. **Preenche os seguintes campos:**

   | Campo | Valor |
   |-------|-------|
   | **Title** | `Riqueza Oculta - Recover Payments` |
   | **URL** | `https://www.riquezaoculta.click/api/cron/recover-pending` |
   | **Schedule** | `Every 5 minutes` |
   | **HTTP Method** | `POST` |
   | **Content-Type** | `application/json` |

5. **Clica em "Create"**

6. **Ativa o job** (toggle switch)

### Notificações (opcional):
- Podes configurar email para receber alertas quando o job falha

---

## Opção 2: Servidor Próprio (VPS/Cloud)

Se tens acesso a um servidor Linux, adiciona ao crontab:

```bash
# Editar crontab
crontab -e

# Adicionar esta linha (executa a cada 5 minutos)
*/5 * * * * curl -X POST https://www.riquezaoculta.click/api/cron/recover-pending -H "Content-Type: application/json" > /dev/null 2>&1
```

Ou usa o script Node.js incluído:

```bash
# Adicionar ao crontab
*/5 * * * * cd /caminho/para/o/projeto && node scripts/cron-recovery.js >> /var/log/ro-recovery.log 2>&1
```

---

## Opção 3: GitHub Actions (Gratuito)

Cria um ficheiro `.github/workflows/recover-payments.yml`:

```yaml
name: Recover Pending Payments

on:
  schedule:
    - cron: '*/5 * * * *'  # A cada 5 minutos
  workflow_dispatch:

jobs:
  recover:
    runs-on: ubuntu-latest
    steps:
      - name: Call recovery endpoint
        run: |
          curl -X POST https://www.riquezaoculta.click/api/cron/recover-pending \
            -H "Content-Type: application/json"
```

**Nota:** GitHub Actions pode ter delays de 5-15 minutos em contas gratuitas.

---

## Opção 4: Outros Serviços Gratuitos

- **UptimeRobot:** https://uptimerobot.com/ (monitorização + ping a cada 5 min)
- **StatusCake:** https://www.statuscake.com/
- **Freshping:** https://www.freshworks.com/website-monitoring/

---

## Verificação

Para verificar se o cron job está funcionando, podes:

1. **Ver logs na Vercel:**
   - Dashboard → Functions → `/api/cron/recover-pending`

2. **Testar manualmente:**
   ```bash
   curl -X POST https://www.riquezaoculta.click/api/cron/recover-pending
   ```

3. **Verificar no dashboard do cron-job.org** se aparece "Success" nos logs

---

## Importante

Sem este cron job a correr frequentemente (a cada 5 minutos):
- Pagamentos pendentes só são atualizados quando o utilizador está na página de checkout
- Pagamentos que o webhook falha processar podem ficar pendentes indefinidamente

**Recomendação:** Configurar pelo menos uma das opções acima.
