# Migration Plan (Legado -> V2)

## Fase 1 - Paralelo seguro

1. Subir V2 em subdominio (`v2.riquezaoculta.click`).
2. Rodar tracking paralelo por 7-14 dias.
3. Comparar conversao de etapas vs funil atual.

## Fase 2 - Integracoes e hardening

1. Migrar webhook oficial para endpoint V2.
2. Mover base de leads/checkouts para PostgreSQL definitivo.
3. Ativar monitorizacao + alertas criticos.

## Fase 3 - Cutover

1. Trocar dominio principal para V2.
2. Manter legado em rota de contingencia por 7 dias.
3. Congelar escrita no legado e arquivar.

## KPI de decisao

- Conversao `landing -> quiz_start`
- Conversao `quiz_complete -> oferta_click`
- Conversao `oferta_click -> pagamento_gerado`
- Conversao `pagamento_gerado -> pagamento_confirmado`
