#!/usr/bin/env node
/**
 * Diagnóstico Completo de Pagamentos
 * Executar: node scripts/diagnostico-pagamentos.js
 */

const SITE_URL = process.env.SITE_URL || "https://www.riquezaoculta.click";

async function testarEndpoint(url, method = "GET", body = null) {
  const start = Date.now();
  try {
    const options = {
      method,
      headers: { "Content-Type": "application/json" }
    };
    if (body) options.body = JSON.stringify(body);
    
    const res = await fetch(`${SITE_URL}${url}`, options);
    const tempo = Date.now() - start;
    const data = await res.json().catch(() => ({}));
    
    return {
      ok: res.ok,
      status: res.status,
      tempo,
      data
    };
  } catch (error) {
    return {
      ok: false,
      error: error.message,
      tempo: Date.now() - start
    };
  }
}

async function diagnosticar() {
  console.log("🔍 DIAGNÓSTICO DE PAGAMENTOS");
  console.log("============================\n");
  
  // 1. Health Check
  console.log("1️⃣  Health Check...");
  const health = await testarEndpoint("/api/health");
  console.log(`   Status: ${health.ok ? "✅ OK" : "❌ FALHA"} (${health.tempo}ms)`);
  
  // 2. Testar criação de sessão (simulado)
  console.log("\n2️⃣  Teste de Sessão de Pagamento...");
  const sessao = await testarEndpoint("/api/payment/session", "POST", {
    name: "Teste Diagnóstico",
    phone: "244923456789",
    method: "reference"
  });
  console.log(`   Status: ${sessao.ok ? "✅ OK" : "❌ FALHA"} (${sessao.tempo}ms)`);
  if (sessao.ok) {
    console.log(`   Modo: ${sessao.data.payment?.mode || "desconhecido"}`);
    console.log(`   Entidade: ${sessao.data.payment?.entity || "N/A"}`);
    console.log(`   Referência: ${sessao.data.payment?.reference || "N/A"}`);
  } else {
    console.log(`   Erro: ${sessao.data?.error || sessao.error}`);
  }
  
  // 3. Testar Express (se possível)
  console.log("\n3️⃣  Teste de Express...");
  const express = await testarEndpoint("/api/payment/express", "POST", {
    name: "Teste Diagnóstico",
    phone: "244923456789",
    expressPhone: "923456789"
  });
  console.log(`   Status: ${express.ok ? "✅ OK" : "❌ FALHA"} (${express.tempo}ms)`);
  if (!express.ok) {
    console.log(`   Erro: ${express.data?.error || express.error}`);
  }
  
  // 4. Verificar status de referência de teste
  if (sessao.ok && sessao.data.reference) {
    console.log("\n4️⃣  Verificação de Status...");
    const status = await testarEndpoint(`/api/payment/status/${sessao.data.reference}`);
    console.log(`   Status: ${status.ok ? "✅ OK" : "❌ FALHA"} (${status.tempo}ms)`);
    console.log(`   Estado: ${status.data?.status || "desconhecido"}`);
  }
  
  console.log("\n============================");
  console.log("✅ Diagnóstico concluído");
  console.log(`\n🔗 URL testada: ${SITE_URL}`);
  console.log(`⏰ Data: ${new Date().toISOString()}`);
}

diagnosticar().catch(console.error);
