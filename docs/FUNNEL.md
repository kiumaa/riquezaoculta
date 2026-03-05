# Funil de Conversao V2

## Fluxo principal

1. `/` Landing com CTA unico
2. `/simulador/inicio` captura de nome
3. `/simulador/quiz` perguntas aleatorias com cobertura de pilares
4. `/simulador/resultado` diagnostico + oferta discreta
5. `/oferta` pagina de vendas curta
6. `/checkout/contato` captura WhatsApp
7. `/checkout/pagamento` referencia + polling
8. `/acesso` pos-pagamento

## Regras de Conversao

- Sem menu de distracao no funil.
- Copy objetiva orientada a acao.
- Progresso visual no quiz.
- Oferta contextual baseada no resultado.
- Reducao de campos ao minimo.

## Medicao recomendada

- `landing_cta_click`
- `quiz_start`
- `quiz_complete`
- `offer_view`
- `offer_cta_click`
- `whatsapp_submitted`
- `payment_reference_generated`
- `payment_confirmed`
