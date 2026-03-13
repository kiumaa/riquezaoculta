#!/usr/bin/env node

import { readFileSync, existsSync } from "node:fs";
import process from "node:process";

loadEnvFile();

const API_VERSION = process.env.META_API_VERSION;
const ACCESS_TOKEN = process.env.META_ACCESS_TOKEN;
const DEFAULT_ACCOUNT_ID = process.env.META_AD_ACCOUNT_ID;

const args = process.argv.slice(2);
const command = args[0];

if (!command || command === "help" || command === "--help") {
  printHelp();
  process.exit(0);
}

if (!API_VERSION || !ACCESS_TOKEN) {
  exitWithHelp(
    "Defina META_API_VERSION e META_ACCESS_TOKEN no ambiente ou num ficheiro .env."
  );
}

const options = parseOptions(args.slice(1));

try {
  switch (command) {
    case "me":
      printJson(await apiGet("/me", { fields: "id,name" }));
      break;
    case "adaccounts":
      printJson(
        await apiGet("/me/adaccounts", {
          fields: "id,name,account_status,currency,timezone_name",
        })
      );
      break;
    case "campaigns":
      printJson(
        await apiGet(`/${requiredAccountId(options)}/campaigns`, {
          fields:
            "id,name,status,effective_status,objective,buying_type,daily_budget,lifetime_budget,created_time",
          limit: options.limit || "50",
        })
      );
      break;
    case "adsets":
      printJson(
        await apiGet(`/${requiredAccountId(options)}/adsets`, {
          fields:
            "id,name,status,effective_status,campaign_id,daily_budget,lifetime_budget,billing_event,optimization_goal",
          limit: options.limit || "50",
        })
      );
      break;
    case "ads":
      printJson(
        await apiGet(`/${requiredAccountId(options)}/ads`, {
          fields:
            "id,name,status,effective_status,adset_id,campaign_id,creative{id,name}",
          limit: options.limit || "50",
        })
      );
      break;
    case "insights":
      printJson(
        await apiGet(`/${requiredCampaignId(options)}/insights`, {
          fields:
            options.fields ||
            "campaign_name,spend,impressions,reach,clicks,cpc,ctr,actions",
          time_range: JSON.stringify({
            since: requiredOption(options, "since"),
            until: requiredOption(options, "until"),
          }),
          limit: options.limit || "50",
        })
      );
      break;
    case "update-campaign-status":
      printJson(
        await apiPost(`/${requiredCampaignId(options)}`, {
          status: requiredStatus(options),
        })
      );
      break;
    case "update-adset-status":
      printJson(
        await apiPost(`/${requiredAdsetId(options)}`, {
          status: requiredStatus(options),
        })
      );
      break;
    case "update-ad-status":
      printJson(
        await apiPost(`/${requiredAdId(options)}`, {
          status: requiredStatus(options),
        })
      );
      break;
    case "create-campaign":
      printJson(
        await apiPost(`/${requiredAccountId(options)}/campaigns`, {
          name: requiredOption(options, "name"),
          objective: requiredOption(options, "objective"),
          status: options.status || "PAUSED",
          special_ad_categories: options.specialAdCategories || "[]",
        })
      );
      break;
    default:
      exitWithHelp(`Comando desconhecido: ${command}`);
  }
} catch (error) {
  console.error(error.message);
  process.exit(1);
}

function printHelp() {
  console.log(`
Meta Ads CLI

Uso:
  npm run meta -- me
  npm run meta -- adaccounts
  npm run meta -- campaigns --account act_123
  npm run meta -- adsets --account act_123
  npm run meta -- ads --account act_123
  npm run meta -- insights --campaign 123 --since 2026-03-01 --until 2026-03-07
  npm run meta -- update-campaign-status --campaign 123 --status PAUSED
  npm run meta -- update-adset-status --adset 123 --status PAUSED
  npm run meta -- update-ad-status --ad 123 --status PAUSED
  npm run meta -- create-campaign --account act_123 --name "Teste" --objective OUTCOME_SALES

Opcoes:
  --account <act_id>              ID da conta de anuncios. Usa META_AD_ACCOUNT_ID se omisso.
  --campaign <campaign_id>        ID da campanha.
  --adset <adset_id>              ID do conjunto de anuncios.
  --ad <ad_id>                    ID do anuncio.
  --status <ACTIVE|PAUSED>        Novo estado da campanha.
  --since <YYYY-MM-DD>            Data inicial para insights.
  --until <YYYY-MM-DD>            Data final para insights.
  --fields <csv>                  Campos adicionais para insights.
  --name <text>                   Nome da campanha.
  --objective <value>             Objetivo ODAX da campanha.
  --specialAdCategories <json>    Ex: [] ou ["CREDIT"].
  --limit <n>                     Numero maximo de resultados.
`);
}

function exitWithHelp(message) {
  console.error(message);
  console.error("");
  printHelp();
  process.exit(1);
}

function parseOptions(rawArgs) {
  const parsed = {};

  for (let index = 0; index < rawArgs.length; index += 1) {
    const token = rawArgs[index];
    if (!token.startsWith("--")) {
      continue;
    }

    const key = token.slice(2);
    const value = rawArgs[index + 1];

    if (!value || value.startsWith("--")) {
      parsed[key] = "true";
      continue;
    }

    parsed[key] = value;
    index += 1;
  }

  return parsed;
}

function requiredAccountId(options) {
  return options.account || DEFAULT_ACCOUNT_ID || missing("--account");
}

function requiredCampaignId(options) {
  return options.campaign || missing("--campaign");
}

function requiredAdsetId(options) {
  return options.adset || missing("--adset");
}

function requiredAdId(options) {
  return options.ad || missing("--ad");
}

function requiredStatus(options) {
  const status = requiredOption(options, "status").toUpperCase();
  if (!["ACTIVE", "PAUSED"].includes(status)) {
    throw new Error("O --status deve ser ACTIVE ou PAUSED.");
  }
  return status;
}

function requiredOption(options, key) {
  return options[key] || missing(`--${key}`);
}

function missing(flag) {
  throw new Error(`Falta o parametro obrigatorio ${flag}.`);
}

async function apiGet(path, params = {}) {
  const url = buildUrl(path, params);
  const response = await fetch(url);
  return handleResponse(response);
}

async function apiPost(path, params = {}) {
  const url = buildUrl(path);
  const body = new URLSearchParams({
    ...params,
    access_token: ACCESS_TOKEN,
  });
  const response = await fetch(url, {
    method: "POST",
    headers: {
      "Content-Type": "application/x-www-form-urlencoded",
    },
    body,
  });
  return handleResponse(response);
}

function buildUrl(path, params = {}) {
  const url = new URL(`https://graph.facebook.com/${API_VERSION}${path}`);
  url.searchParams.set("access_token", ACCESS_TOKEN);

  for (const [key, value] of Object.entries(params)) {
    url.searchParams.set(key, value);
  }

  return url;
}

async function handleResponse(response) {
  const data = await response.json();
  if (!response.ok || data.error) {
    const message =
      data?.error?.message ||
      `Pedido falhou com estado HTTP ${response.status}.`;
    const code = data?.error?.code ? ` (code ${data.error.code})` : "";
    throw new Error(`${message}${code}`);
  }
  return data;
}

function printJson(value) {
  console.log(JSON.stringify(value, null, 2));
}

function loadEnvFile() {
  const envPath = `${process.cwd()}/.env`;
  if (!existsSync(envPath)) {
    return;
  }

  const contents = readFileSync(envPath, "utf8");
  for (const line of contents.split(/\r?\n/)) {
    const trimmed = line.trim();
    if (!trimmed || trimmed.startsWith("#")) {
      continue;
    }

    const separatorIndex = trimmed.indexOf("=");
    if (separatorIndex === -1) {
      continue;
    }

    const key = trimmed.slice(0, separatorIndex).trim();
    const value = trimmed.slice(separatorIndex + 1).trim();

    if (!(key in process.env)) {
      process.env[key] = stripWrappingQuotes(value);
    }
  }
}

function stripWrappingQuotes(value) {
  if (
    (value.startsWith('"') && value.endsWith('"')) ||
    (value.startsWith("'") && value.endsWith("'"))
  ) {
    return value.slice(1, -1);
  }

  return value;
}
