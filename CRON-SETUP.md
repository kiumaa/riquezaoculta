# Configuração do Cron Job

## Vercel Cron (Conta Hobby)
A Vercel com conta Hobby só permite cron jobs diários. O cron está configurado para correr às 9h UTC todos os dias.

## Cron-job.org (Recomendado para frequência horária)
Para lembretes SMS funcionarem correctamente (1h e 6h após checkout), recomendamos usar o cron-job.org configurado a cada hora:

- **URL:** `https://www.riquezaoculta.click/api/cron/recover-pending`
- **Frequência:** A cada hora (`0 * * * *`)
- **Job ID:** 7369694
- **API Key:** m2Q6K12t+sKouPGOP3/VKY4j5J9m70b01z+QOZ3XwOc=

O código está preparado para:
1. Enviar SMS de lembrete aos 1h (janela: 55-75min)
2. Enviar SMS de lembrete aos 6h (janela: 350-390min)
3. Processar checkouts pendentes
4. Marcar referências expiradas (após 24h)

## Vantagens do Cron Horário
- Lembretes enviados no momento certo (não no dia seguinte)
- Maior taxa de recuperação de abandonos
- Resposta imediata a checkouts pendentes
