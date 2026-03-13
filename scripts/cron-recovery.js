#!/usr/bin/env node
/**
 * Script de recuperação de pagamentos pendentes
 * Pode ser executado via cron em qualquer servidor
 * 
 * Uso: node cron-recovery.js
 * Ou adicionar ao crontab: a cada 5 minutos
 */

const SITE_URL = process.env.SITE_URL || "https://www.riquezaoculta.click";

async function recoverPendingPayments() {
  const timestamp = new Date().toISOString();
  console.log(`[${timestamp}] Iniciando recuperação de pagamentos...`);
  
  try {
    const response = await fetch(`${SITE_URL}/api/cron/recover-pending`, {
      method: "POST",
      headers: {
        "Content-Type": "application/json"
      }
    });
    
    const data = await response.json();
    
    if (response.ok) {
      console.log(`[${timestamp}] ✅ Sucesso:`, {
        processed: data.processed,
        updated: data.updated,
        failed: data.failed,
        duration: data.duration
      });
    } else {
      console.error(`[${timestamp}] ❌ Erro:`, data);
    }
    
    return data;
  } catch (error) {
    console.error(`[${timestamp}] 💥 Erro fatal:`, error.message);
    throw error;
  }
}

// Executar
recoverPendingPayments().catch(() => process.exit(1));
