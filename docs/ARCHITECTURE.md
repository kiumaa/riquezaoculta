# Arquitetura V2 (Projeto Unificado)

## Objetivo

Unificar simulador + oferta + checkout num funil unico, rapido e com baixa friccao.

## Camadas

1. `app/`: UI + rotas do funil + APIs HTTP.
2. `lib/`: regras de negocio (quiz, pagamento, validacao, storage).
3. `db/`: schema Drizzle para PostgreSQL.
4. `components/`: UI reutilizavel orientada a conversao.

## Persistencia

- Primario: PostgreSQL (quando `DATABASE_URL` estiver configurado).
- Fallback: `data/runtime.json` para desenvolvimento local rapido.

## Integracoes

- KB Agency: criacao de referencia e consulta de estado.
- BulkGate: reservado para notificacoes de acesso via SMS.
- Webhook KB Agency com validacao HMAC (`x-kbagency-signature`/`x-signature`).

## Principios

- Sem segredos hardcoded.
- Foco em TTI e UX mobile.
- Uma acao principal por tela.
- Observabilidade simples e extensivel.
