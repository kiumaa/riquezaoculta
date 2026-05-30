# Plano de Trafego Pago - Riqueza Oculta

Data: 2026-05-24
Modelo atualizado: quiz pago de entrada + e-book como upsell
Produto 1: Analise Completa do Quiz - 1.000 Kz
Produto 2: Riqueza Oculta: Guia Definitivo - 2.499 Kz
Funil: Landing -> Simulador -> Quiz -> Resultado parcial -> Pagamento Quiz -> Resultado completo -> Oferta Ebook -> Checkout Ebook -> Acesso

## Diagnostico 360 Atualizado

A experiencia anterior mostrou um padrao claro: quiz gratuito gera consumo, curiosidade e volume, mas nao necessariamente compradores. A mudanca para quiz pago de 1.000 Kz e estrategicamente boa porque cria uma microconversao antes do e-book.

O objetivo agora nao e apenas gerar leads. O objetivo e gerar compradores baratos.

O projeto ja esta tecnicamente preparado para isso:

- Existe `priceQuiz` com default de 1.000 Kz.
- O checkout aceita `product=quiz`.
- O evento `Purchase` identifica produto de 1.000 Kz como `quiz_report`.
- A tela de resultado ja diferencia `quizPaid` e `ebookPaid`.
- O admin separa vendas de quiz e vendas de e-book pelo valor/produto.

Ponto de atencao: no backend, `ebook_upsell` esta hardcoded em 3.000 Kz. Se o e-book principal deve continuar a 2.499 Kz tambem no upsell, alinhar esse valor antes de escalar.

## Hipotese Central

Quem paga 1.000 Kz para desbloquear a analise completa tem muito mais probabilidade de comprar o e-book, porque ja fez uma primeira transacao e ja percebeu valor personalizado.

Nova escada de valor:

1. Entrada: curiosidade pelo perfil financeiro.
2. Microcompra: relatorio completo do quiz por 1.000 Kz.
3. Upsell: e-book completo por 2.499 Kz.
4. Retencao: grupo VIP, conteudo, suporte e afiliados.

Mensagem central:

"Faz o simulador, ve uma previa do teu perfil e desbloqueia a analise completa por 1.000 Kz."

Evitar promessas:

- "Compra e vais ficar rico"
- "Este quiz vai resolver a tua vida financeira"
- "Ganha dinheiro garantido"
- "Estas pobre porque..."
- "O teu dinheiro desaparece porque tens este problema"

## Estrutura de Campanhas

### Campanha 1 - Quiz Pago / Compradores

Objetivo: Sales.

Otimizacao inicial:

- Se a conta ainda tem poucas compras: `InitiateCheckout`.
- Assim que houver volume: `Purchase`.

Funcao:

Levar trafego frio para o simulador e medir o custo por compra do quiz.

Orcamento inicial:

- Conservador: 10.000 Kz/dia
- Recomendado: 20.000 Kz/dia
- Agressivo: 35.000 Kz/dia

Conjuntos:

1. `AO_BROAD_18-45_ADV`
   - Angola
   - 18-45
   - Aberto
   - Advantage+ placements

2. `AO_INTERESSES_DINHEIRO_MENTALIDADE_18-45`
   - Angola
   - 18-45
   - Educacao financeira, empreendedorismo, desenvolvimento pessoal, livros, negocios

3. `AO_JOVENS_AMBICIOSOS_18-34`
   - Angola
   - 18-34
   - Carreira, universidade, pequenos negocios, tecnologia, marketing digital

4. `CPLP_TESTE_18-45`
   - Angola, Mocambique, Cabo Verde, Portugal, Brasil
   - Budget pequeno ate provar conversao

URL:

`https://www.riquezaoculta.click/?utm_source=meta&utm_medium=paid_social&utm_campaign=ro_v2_sales_quiz_pago&utm_content={{ad.name}}&utm_term={{adset.name}}`

KPIs:

- CTR link acima de 1,2%
- CPC link abaixo de 250 Kz
- Custo por checkout iniciado do quiz abaixo de 450 Kz
- CPA compra quiz excelente: ate 500 Kz
- CPA compra quiz aceitavel: 501 a 800 Kz
- CPA compra quiz alerta: 801 a 1.000 Kz
- CPA compra quiz ruim: acima de 1.000 Kz

Nota: se o CPA do quiz ficar acima de 1.000 Kz, o produto de entrada deixa de se pagar sozinho e precisa depender fortemente do upsell.

### Campanha 2 - Retargeting Relatorio Completo

Objetivo: Sales.

Funcao:

Recuperar quem fez quiz, viu resultado parcial, visitou checkout do quiz ou interagiu com anuncios, mas ainda nao pagou os 1.000 Kz.

Publicos:

- Visitou site 30 dias e nao comprou quiz.
- Lead 30 dias e nao comprou quiz.
- Visitou `/simulador/resultado` 14 dias e nao comprou quiz.
- Iniciou checkout com `product=quiz` 14 dias e nao comprou.
- Engajou Instagram/Facebook 30 dias.

Exclusoes:

- Compradores do quiz.
- Compradores do e-book.

Orcamento:

- 20% a 30% do budget total.

URL:

`https://www.riquezaoculta.click/simulador/resultado?utm_source=meta&utm_medium=paid_social&utm_campaign=ro_v2_retargeting_quiz&utm_content={{ad.name}}&utm_term={{adset.name}}`

Se a pagina de resultado exigir estado local do quiz, usar como fallback:

`https://www.riquezaoculta.click/?utm_source=meta&utm_medium=paid_social&utm_campaign=ro_v2_retargeting_quiz&utm_content={{ad.name}}&utm_term={{adset.name}}`

### Campanha 3 - Upsell Ebook para Compradores do Quiz

Objetivo: Sales.

Funcao:

Vender o e-book apenas para quem ja pagou o quiz ou iniciou pagamento do quiz.

Publicos:

- Compradores do quiz 30 dias.
- Compradores do quiz 180 dias, se houver pouco volume.
- Checkout quiz pago/confirmado.

Exclusoes:

- Compradores do e-book.

Orcamento:

- 15% a 25% do budget total no inicio.
- Pode subir se o ROAS for forte.

URL:

`https://www.riquezaoculta.click/oferta?utm_source=meta&utm_medium=paid_social&utm_campaign=ro_v2_upsell_ebook_quiz_buyers&utm_content={{ad.name}}&utm_term={{adset.name}}`

KPIs:

- CPA e-book excelente: ate 900 Kz
- CPA e-book aceitavel: 901 a 1.300 Kz
- ROAS minimo: 2,0
- Taxa quiz buyer -> e-book: alvo inicial 10% a 20%

### Campanha 4 - Venda Direta do Ebook

Objetivo: Sales.

Funcao:

Teste pequeno. Nao deve consumir o budget principal ate provar que vende melhor que o funil com quiz pago.

Budget:

- 5% a 10% do total.

Regra:

- Pausar se gastar 2x o CPA alvo sem compra.

## Biblioteca de Anuncios Prontos

### Criativo A - Quiz Pago / Curiosidade

Formato: video vertical 9:16, 15-25s.

Roteiro:

Cena 1: tela com pergunta do quiz.
Texto: "Qual e o teu perfil financeiro?"

Cena 2: barras/pilares do resultado.
Texto: "Clareza, disciplina, acao ou emocional?"

Cena 3: resultado bloqueado.
Texto: "Ve a previa e desbloqueia a analise completa por 1.000 Kz."

Copy principal:

O Simulador Riqueza Oculta mostra uma previa do teu perfil financeiro e ajuda-te a perceber qual pilar pode precisar de mais atencao: clareza, disciplina, acao ou emocional.

Depois da previa, podes desbloquear a analise completa por apenas 1.000 Kz.

Headline:

Descobre o teu perfil financeiro

Descricao:

Previa do resultado + analise completa por 1.000 Kz.

CTA:

Comecar

Destino:

`/`

### Criativo B - Relatorio de 1.000 Kz

Formato: imagem 4:5 ou video curto.

Copy principal:

Uma analise personalizada pode mostrar onde o teu comportamento financeiro ganha forca e onde perde consistencia.

Faz o simulador e desbloqueia o relatorio completo por 1.000 Kz.

Headline:

Relatorio completo por 1.000 Kz

Descricao:

Resultado personalizado apos o quiz.

CTA:

Saber mais

Destino:

`/`

### Criativo C - Pilares

Formato: carrossel.

Cards:

1. "O teu perfil financeiro tem 4 pilares"
2. "Clareza: direcao"
3. "Disciplina: consistencia"
4. "Acao: movimento"
5. "Emocional: controlo"
6. "Faz o simulador e desbloqueia a analise completa"

Copy principal:

Nem todo bloqueio financeiro vem de falta de esforco. As vezes o problema esta no pilar errado: clareza, disciplina, acao ou emocional.

Faz o simulador e recebe uma leitura personalizada.

Headline:

Qual pilar precisa de mais atencao?

CTA:

Comecar

### Criativo D - Retargeting Quiz

Formato: imagem/video com resultado bloqueado.

Copy principal:

Comecaste a descobrir o teu perfil financeiro. Agora podes desbloquear a analise completa e ver os pontos que ficaram ocultos no resultado.

Disponivel por 1.000 Kz.

Headline:

Desbloqueia a tua analise completa

Descricao:

Continua de onde paraste.

CTA:

Concluir

### Criativo E - Upsell Ebook

Formato: imagem do e-book.

Copy principal:

Ja tens a tua analise do quiz. O proximo passo e aplicar um metodo mais completo para organizar pensamentos, habitos e decisoes financeiras.

O Guia Definitivo Riqueza Oculta aprofunda os pilares do teu perfil com passos praticos.

Headline:

Continua com o Guia Definitivo

Descricao:

E-book completo com acesso imediato.

CTA:

Comprar agora

Destino:

`/oferta`

## Copies Alternativas

1. "Antes de mudar tudo, descobre primeiro qual pilar financeiro precisa de mais atencao."

2. "Faz o simulador, ve a previa do teu perfil e desbloqueia a analise completa por 1.000 Kz."

3. "Clareza, disciplina, acao ou emocional: qual destes pilares mais influencia as tuas decisoes financeiras?"

4. "Uma microanalise simples para entender melhor os teus habitos financeiros."

5. "O relatorio completo mostra os teus pontos fortes, pontos de alerta e um plano pratico de 7 dias."

## Criativos a Produzir Agora

Prioridade maxima:

- 2 videos verticais mostrando a experiencia do quiz.
- 1 video mostrando o resultado parcialmente bloqueado.
- 2 imagens 4:5 com a promessa do relatorio completo por 1.000 Kz.
- 1 carrossel dos 4 pilares.
- 2 criativos de upsell com a capa do e-book.

Assets disponiveis:

- `assets/main ebook cover.png`
- `assets/ebook_cover_3d.webp`
- `assets/og-image.png`
- `public/og-image.png`
- Avatares/testemunhos em `assets/avatar_*`

## Naming Convention

Campanhas:

- `RO_V2_SALES_QUIZ_PAGO_AO_20260524`
- `RO_V2_RT_QUIZ_UNLOCK_AO_20260524`
- `RO_V2_UPSELL_EBOOK_QUIZ_BUYERS_AO_20260524`
- `RO_V2_DIRECT_EBOOK_TEST_AO_20260524`

Conjuntos:

- `AO_BROAD_18-45_ADV`
- `AO_INTERESSES_DINHEIRO_MENTALIDADE_18-45`
- `AO_JOVENS_AMBICIOSOS_18-34`
- `RT_RESULTADO_14D_NO_QUIZ_PURCHASE`
- `RT_CHECKOUT_QUIZ_14D_NO_PURCHASE`
- `BUYERS_QUIZ_30D_NO_EBOOK`

Anuncios:

- `VID_QUIZ_PERFIL_9x16_V1`
- `VID_RESULTADO_BLOQUEADO_9x16_V1`
- `IMG_RELATORIO_1000KZ_4x5_V1`
- `CAR_4_PILARES_1x1_V1`
- `IMG_UPSELL_EBOOK_4x5_V1`

## Regras de Otimizacao

Primeiras 72 horas:

- Nao mexer em conjuntos com entrega estavel antes de ter dados suficientes.
- Pausar anuncio com CTR link abaixo de 0,8% apos 1.500 impressoes.
- Pausar conjunto que gastar 2x o CPA alvo do quiz sem compra.
- Se muitos iniciam checkout mas poucos pagam, melhorar checkout, metodo de pagamento e recuperacao.

Depois de 7 dias:

- Escalar apenas campanhas com CPA quiz abaixo de 800 Kz ou com upsell forte.
- Duplicar os 2 melhores hooks.
- Aumentar budget no maximo 20% a 30% por dia.
- Criar publico de compradores do quiz para upsell.
- Criar lookalike de compradores do quiz quando houver volume suficiente.

## Metas Financeiras

Produto quiz: 1.000 Kz

- CPA ideal: ate 500 Kz
- CPA aceitavel: 501 a 800 Kz
- CPA limite: ate 1.000 Kz, apenas se o upsell compensar

Produto e-book: 2.499 Kz

- CPA ideal: ate 900 Kz
- CPA aceitavel: 901 a 1.300 Kz
- CPA limite: 1.301 a 1.700 Kz, apenas com volume e recompra/upsell

Metricas chave:

- Compra quiz / clique
- Compra quiz / checkout iniciado
- Compra e-book / compradores do quiz
- Receita por comprador do quiz
- ROAS blended: quiz + e-book

## Checklist Antes de Ligar

- Atualizar textos que ainda digam "quiz gratuito" se o posicionamento publico passar a ser pago.
- Manter claro que pode existir previa gratuita, se esse for o fluxo.
- Confirmar se o valor `ebook_upsell` deve ser 3.000 Kz ou 2.499 Kz.
- Pixel ativo.
- CAPI ativo com `FACEBOOK_PIXEL_ID` e `FACEBOOK_ACCESS_TOKEN`.
- Eventos separados para compra do quiz e compra do e-book.
- Publico de compradores do quiz criado para upsell.
- Publico de compradores do e-book criado para exclusao.
- Links com UTM.
- Anuncios criados pausados para revisao.

## Observacoes de Politica

Meta revê texto, imagem, segmentacao e destino do anuncio. Em temas de dinheiro, evitar promessas de rendimento, antes/depois financeiro, urgencia enganosa e copy que declare atributos pessoais sensiveis do utilizador.

Fontes consultadas:

- Meta Ads Review: https://www.facebook.com/business/ads/review-policy-guidelines
- Meta Prohibited Financial Products and Services: https://www.facebook.com/policies/ads/prohibited_content/prohibited_financial_products_and_services
- Meta Ad Targeting: https://www.facebook.com/business/ads/ad-targeting
