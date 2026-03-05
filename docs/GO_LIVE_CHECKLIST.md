# Go-Live Checklist V2

## Seguranca

- [ ] Definir `KB_AGENCY_API_KEY` no ambiente de producao
- [ ] Definir `KB_AGENCY_WEBHOOK_SECRET` e validar assinatura
- [ ] Definir `BULKGATE_APP_ID` e `BULKGATE_APP_TOKEN`
- [ ] Definir `DATABASE_URL` de producao
- [ ] Rotacionar segredos antigos do projeto legado

## Plataforma

- [ ] Provisionar PostgreSQL com backups automaticos
- [ ] Rodar migracoes Drizzle
- [ ] Configurar dominio e HTTPS
- [ ] Configurar logs centralizados

## Conversao

- [ ] Validar textos finais por etapa
- [ ] Revisar oferta e prova social
- [ ] Configurar Pixel/Analytics de funil
- [ ] Testar checkout completo em mobile real

## QA

- [ ] Testar fluxo completo sem login
- [ ] Testar webhook com payload valido/invalido
- [ ] Testar rate limit em endpoints criticos
- [ ] Testar fallback sem `KB_AGENCY_API_KEY`
