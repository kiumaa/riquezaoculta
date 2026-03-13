# Meta Ads CLI

CLI local para ligar e gerir campanhas do Meta Ads via Marketing API.

## Setup

1. Copie `.env.example` para `.env`.
2. Preencha:
   - `META_ACCESS_TOKEN`
   - `META_API_VERSION`
   - `META_AD_ACCOUNT_ID` (opcional, mas recomendado)

Exemplo:

```bash
cp .env.example .env
```

## Comandos

Ver identidade do token:

```bash
npm run meta -- me
```

Listar contas de anuncios acessiveis:

```bash
npm run meta -- adaccounts
```

Listar campanhas:

```bash
npm run meta -- campaigns --account act_1234567890
```

Listar conjuntos de anuncios:

```bash
npm run meta -- adsets --account act_1234567890
```

Listar anuncios:

```bash
npm run meta -- ads --account act_1234567890
```

Ler performance de uma campanha:

```bash
npm run meta -- insights --campaign 120000000000000000 --since 2026-03-01 --until 2026-03-07
```

Pausar ou ativar campanha:

```bash
npm run meta -- update-campaign-status --campaign 120000000000000000 --status PAUSED
```

Pausar ou ativar conjunto:

```bash
npm run meta -- update-adset-status --adset 120000000000000000 --status PAUSED
```

Pausar ou ativar anuncio:

```bash
npm run meta -- update-ad-status --ad 120000000000000000 --status PAUSED
```

Criar campanha em estado pausado:

```bash
npm run meta -- create-campaign --account act_1234567890 --name "Campanha teste" --objective OUTCOME_SALES
```

## Notas

- O token nao fica gravado no codigo.
- Como este token foi exposto no chat, o mais prudente e revoga-lo no Meta e gerar outro antes de uso real.
- A criacao de campanhas no Meta pode exigir campos adicionais conforme o objetivo, conta e categorias especiais. Este CLI cobre o arranque da integracao e operacoes basicas de conta, campanha, conjunto e anuncio.
