# Configuração do Cron — Recuperação de Pagamentos

O endpoint `/api/cron/recover-pending` reconcilia checkouts pendentes e envia
lembretes. Precisa de correr **com frequência** (idealmente de hora a hora ou
mais) para que as janelas de lembrete e a reconciliação funcionem.

O que o endpoint faz a cada execução:
1. Lembrete (SMS/WhatsApp) ~1h após o checkout (janela 55–75 min)
2. Lembrete ~6h após o checkout (janela 350–390 min)
3. Reconcilia pagamentos pendentes contra a API da KB
4. Marca referências expiradas (após 24h)
5. Envia carrinho abandonado quando o Express falha

## Scheduler em produção: cron-job.org (horário)

A Vercel no plano Hobby só permite cron **diário**, o que é insuficiente para os
lembretes acima. Por isso o scheduler real é o **cron-job.org**, a cada hora:

- **URL:** `https://www.riquezaoculta.click/api/cron/recover-pending`
- **Frequência:** a cada hora (`0 * * * *`) — ou a cada 5 min para reação mais rápida
- **HTTP Method:** `POST`
- **Header obrigatório:** `Authorization: Bearer <CRON_SECRET>`

> **Segurança:** o endpoint é *fail-closed* — em produção, sem `CRON_SECRET`
> correto no header, devolve `401`. O valor do `CRON_SECRET` vive **apenas** nas
> env vars da Vercel e na configuração do cron-job.org. **Nunca** o escrevas em
> ficheiros versionados. Se alguma vez foi exposto, rotaciona-o na Vercel e
> atualiza o job no cron-job.org.

## Fallback: Vercel Cron (diário)

`vercel.json` mantém um cron diário (`0 0 * * *`) como rede de segurança. Não
substitui o cron-job.org — serve só para apanhar pendentes uma vez por dia caso
o scheduler externo esteja em baixo.

## Alternativas ao cron-job.org

- **VPS/crontab:** `*/5 * * * * curl -X POST <URL> -H "Authorization: Bearer <CRON_SECRET>"`
- **GitHub Actions:** workflow agendado (`schedule: cron`) que faz `curl` ao endpoint com o header de auth (guardar o secret em GitHub Secrets).

## Verificação

```bash
curl -X POST https://www.riquezaoculta.click/api/cron/recover-pending \
  -H "Authorization: Bearer <CRON_SECRET>"
```

Logs na Vercel: Dashboard → Functions → `/api/cron/recover-pending`.
