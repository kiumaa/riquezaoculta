# 📚 Documentação Geral - Riqueza Oculta V2

> **Produto**: Ebook "Riqueza Oculta" + Simulador Financeiro Interativo  
> **Mercado**: Angola e países de língua portuguesa (prioridade Angola)  
> **Modelo**: Infoproduto digital com funil de vendas automatizado  
> **Preço**: 4.500 Kz (promocional) / 7.500 Kz (preço normal)

---

## 📋 Índice

1. [Visão Geral do Produto](#1-visão-geral-do-produto)
2. [Arquitetura Técnica](#2-arquitetura-técnica)
3. [Design System](#3-design-system)
4. [Funil de Vendas](#4-funil-de-vendas)
5. [Sistema de Quiz](#5-sistema-de-quiz)
6. [Estratégias de Conversão](#6-estratégias-de-conversão)
7. [Sistema de Pagamentos](#7-sistema-de-pagamentos)
8. [Recuperação de Abandonos](#8-recuperação-de-abandonos)
9. [Assistente Virtual (Sofia)](#9-assistente-virtual-sofia)
10. [Painel Administrativo](#10-painel-administrativo)
11. [Marketing e Analytics](#11-marketing-e-analytics)
12. [Configurações](#12-configurações)

---

## 1. Visão Geral do Produto

### 1.1 Conceito
O **Riqueza Oculta** é um ecossistema de educação financeira composto por:

- **Ebook Principal**: Guia definitivo sobre os 5 pilares da riqueza mental
- **Simulador Interativo**: Quiz de 5 perguntas que gera um perfil financeiro personalizado
- **Conteúdo Complementar**: Audiobook, checklists, planilhas
- **Comunidade**: Grupo VIP no WhatsApp

### 1.2 Proposta de Valor
```
"Trabalhas, corres, prometes mudar... mas nada muda."
```

O produto aborda o problema fundamental: **padrões invisíveis** que travam o progresso financeiro. Não é apenas mais um ebook de finanças — é um diagnóstico comportamental com solução personalizada.

### 1.3 Diferenciais Competitivos

| Aspecto | Abordagem |
|---------|-----------|
| **Diagnóstico** | Quiz científico com 4 pilares psicológicos |
| **Personalização** | 12 perfis únicos baseados em dominante/fraco |
| **Entrega** | Resultado por WhatsApp + acesso imediato |
| **Comunidade** | Grupo VIP com suporte humano |
| **Garantia** | 7 dias ou dinheiro de volta |

### 1.4 Entregáveis do Produto

```
📦 PACOTE RIQUEZA OCULTA
├── 📖 Ebook Completo (PDF)
├── 🎧 Audiobook (MP3)
├── ✅ Checklist de Hábitos Diários
├── 📊 Simulador de Riqueza 2026
├── 💬 Acesso ao Grupo VIP WhatsApp
└── 🛡️ Garantia de 7 Dias
```

---

## 2. Arquitetura Técnica

### 2.1 Stack Tecnológico

| Camada | Tecnologia |
|--------|------------|
| **Framework** | Next.js 15 (App Router) |
| **Linguagem** | TypeScript |
| **Estilização** | Tailwind CSS |
| **Banco de Dados** | PostgreSQL (Neon) |
| **ORM** | Drizzle ORM |
| **Estado Global** | Zustand |
| **Hospedagem** | Vercel |
| **Fonte** | Space Grotesk |

### 2.2 Estrutura de Diretórios

```
riqueza-oculta-v2/
├── app/                      # Next.js App Router
│   ├── admin/               # Painel administrativo
│   ├── api/                 # Endpoints da API
│   ├── checkout/            # Fluxo de pagamento
│   ├── oferta/              # Página de vendas
│   ├── simulador/           # Quiz e resultado
│   ├── globals.css          # Estilos globais
│   ├── layout.tsx           # Layout raiz
│   ├── landing-client.tsx   # Landing page (client)
│   └── page.tsx             # Landing page (server)
├── components/              # Componentes React
│   └── funnel/             # Componentes do funil
├── lib/                     # Bibliotecas e utilidades
│   ├── providers/          # Integrações (pagamento, SMS)
│   ├── quiz/               # Motor do quiz
│   ├── store/              # Zustand stores
│   └── *.ts                # Utilidades
├── db/                      # Schema do banco
├── public/                  # Assets estáticos
├── scripts/                 # Scripts utilitários
└── docs/                    # Documentação
```

### 2.3 Schema do Banco de Dados

```typescript
// Entidades Principais

leads {
  id, name, phone, email, province
  source, quizProfile, status
  journey (JSON), createdAt
}

checkouts {
  id, reference, name, phone
  entity, paymentReference, amount
  status, providerPayload, createdAt
}

quizSubmissions {
  id, leadId, phone
  answers (JSON), scores (JSON)
  profile, profileTitle, createdAt
}

funnelContent {
  id, pageType, sectionKey
  content, metadata, updatedAt
}

memberContent {
  id, module, title, description
  type, fileUrl, videoUrl
  ordem, isActive, createdAt
}

settings {
  key, value
}
```

---

## 3. Design System

### 3.1 Identidade Visual

O design segue uma estética **"Dark Premium"** com foco em:
- **Exclusividade**: Cores sóbrias com destaque em verde luxo
- **Clareza**: Contraste alto para legibilidade
- **Conversão**: CTAs proeminentes e direcionados

### 3.2 Paleta de Cores

```css
:root {
  --bg: #030806;           /* Fundo principal - quase preto */
  --panel: #0a1712;        /* Cards e painéis */
  --brand: #20e67e;        /* Verde primário (destaque) */
  --brandDark: #15b663;    /* Verde escuro */
  --brandBright: #9bffcb;  /* Verde claro */
  --ink: #ebfff3;          /* Texto principal */
  --soft: #9cb8ab;         /* Texto secundário */
  --muted: #3d5a4f;        /* Texto terciário */
  --accent: #4af59a;       /* Verde de acentuação */
}
```

### 3.3 Tipografia

| Elemento | Fonte | Peso | Tamanho |
|----------|-------|------|---------|
| **Headlines** | Space Grotesk | 600 | 24-48px |
| **Subtítulos** | Space Grotesk | 500 | 16-20px |
| **Body** | Space Grotesk | 400 | 14-16px |
| **Labels** | Space Grotesk | 500 | 10-12px |

### 3.4 Componentes UI

#### GlassCard
```tsx
// Card com efeito glassmorphism
<GlassCard>
  {children}
</GlassCard>

// Features:
// - Fundo semi-transparente (panel/80)
// - Backdrop blur
// - Borda sutil
// - Linha de luz no topo
```

#### PrimaryButton
```tsx
// Botão primário com gradiente e shimmer
<PrimaryButton loading={false}>
  Texto do Botão
</PrimaryButton>

// Features:
// - Gradiente verde (brandDark → brand → accent)
// - Efeito shimmer no hover
// - Shadow glow
// - Estados: normal, hover, active, loading
```

#### OfferPanel
```tsx
// Painel de oferta completo
<OfferPanel angle={string} initialPrices={prices} />

// Features:
// - Imagem do produto
// - Preço tachado + promocional
// - Lista de features
// - CTA destacado
```

### 3.5 Animações

| Animação | Duração | Uso |
|----------|---------|-----|
| `fade-up` | 550ms | Entrada de elementos |
| `glow-pulse` | 3s | Indicadores de status |
| `aurora-1/2` | 14-18s | Fundos dinâmicos |
| `float-*` | 5-7s | Partículas flutuantes |

### 3.6 Responsividade

- **Mobile-first** design
- Breakpoints: sm (640px), md (768px), lg (1024px)
- Touch targets mínimos: 44x44px
- Safe area support para notches

---

## 4. Funil de Vendas

### 4.1 Fluxo Completo

```
┌─────────────────────────────────────────────────────────────┐
│  LANDING PAGE                                                │
│  ├─ Headline impactante                                     │
│  ├─ Badge de credibilidade                                  │
│  └─ CTA: "Iniciar Simulador"                                │
└────────────────────┬────────────────────────────────────────┘
                     │
                     ▼
┌─────────────────────────────────────────────────────────────┐
│  CAPTURA DE LEAD                                            │
│  ├─ Nome                                                    │
│  ├─ WhatsApp (com código do país)                           │
│  └─ CTA: "Iniciar análise gratuita"                         │
└────────────────────┬────────────────────────────────────────┘
                     │
                     ▼
┌─────────────────────────────────────────────────────────────┐
│  QUIZ (5 PERGUNTAS)                                         │
│  ├─ Perguntas embaralhadas                                  │
│  ├─ 4 pilares: emocional, clareza, acao, disciplina         │
│  └─ Progresso visual                                        │
└────────────────────┬────────────────────────────────────────┘
                     │
                     ▼
┌─────────────────────────────────────────────────────────────┐
│  RESULTADO PERSONALIZADO                                    │
│  ├─ Perfil financeiro único                                 │
│  ├─ Gráfico de pontuação                                    │
│  ├─ Ângulo de oferta personalizado                          │
│  └─ CTA: "Ver a solução"                                    │
└────────────────────┬────────────────────────────────────────┘
                     │
                     ▼
┌─────────────────────────────────────────────────────────────┐
│  PÁGINA DE OFERTA                                           │
│  ├─ VSL ou copy persuasiva                                  │
│  ├─ Prova social                                            │
│  ├─ Garantia destacada                                      │
│  ├─ Urgência (vagas limitadas)                              │
│  └─ CTA: "Desbloquear Agora"                                │
└────────────────────┬────────────────────────────────────────┘
                     │
                     ▼
┌─────────────────────────────────────────────────────────────┐
│  CHECKOUT                                                   │
│  ├─ Resumo do pedido                                        │
│  ├─ Métodos: Multicaixa Express ou Referência               │
│  ├─ Passo-a-passo visual                                    │
│  └─ Chat Sofia proativo                                     │
└────────────────────┬────────────────────────────────────────┘
                     │
                     ▼
┌─────────────────────────────────────────────────────────────┐
│  PÓS-PAGAMENTO                                              │
│  ├─ Confirmação                                             │
│  ├─ Acesso ao conteúdo                                      │
│  ├─ Link grupo WhatsApp                                     │
│  └─ Upsell (opcional)                                       │
└─────────────────────────────────────────────────────────────┘
```

### 4.2 Taxas de Conversão Esperadas

| Etapa | Taxa Esperada | Benchmark |
|-------|---------------|-----------|
| Landing → Quiz | 30-50% | Médio |
| Quiz → Resultado | 80-90% | Alto |
| Resultado → Oferta | 40-60% | Médio |
| Oferta → Checkout | 20-40% | Médio |
| Checkout → Venda | 15-25% | Baixo |
| **Global** | **0.5-2%** | Médio |

---

## 5. Sistema de Quiz

### 5.1 Pilares Psicológicos

O quiz avalia 4 dimensões do comportamento financeiro:

| Pilar | Descrição | O que Mede |
|-------|-----------|------------|
| **Emocional** | Inteligência emocional | Como lida com dinheiro sob stress |
| **Clareza** | Visão estratégica | Clareza de objetivos financeiros |
| **Ação** | Capacidade de execução | Tendência a agir vs procrastinar |
| **Disciplina** | Consistência | Hábitos e rotinas financeiras |

### 5.2 Estrutura das Perguntas

```typescript
// 5 perguntas totais
// 1 por pilar garantido + 1 extra aleatório

interface QuizQuestion {
  id: string;           // e.g., "q_emocional_1"
  pillar: Pillar;       // emocional | clareza | acao | disciplina
  prompt: string;       // Pergunta
  options: QuizOption[]; // 3 opções
}

interface QuizOption {
  id: string;           // "a", "b", "c"
  label: string;        // Texto da opção
  weights: Record<Pillar, number>; // Pesos 0-3
}
```

### 5.3 Algoritmo de Pontuação

```typescript
// 1. Soma pesos brutos por pilar
// 2. Normaliza para 0-100
// 3. Aplica multiplicadores aspiracionais:

const multipliers = {
  emocional: 1.40,  // Aumenta (já tem)
  clareza: 1.25,    // Aumenta (já tem)
  acao: 0.90,       // Diminui (precisa desenvolver)
  disciplina: 0.80  // Diminui (precisa desenvolver)
};
```

### 5.4 Perfis de Resultado (12 Únicos)

Formato: `{dominante}-{mais_fraco}`

| Perfil | Título | Resumo |
|--------|--------|--------|
| emocional-clareza | "Coração de Leão, Rota a Afinar" | Força interior + precisa de plano |
| emocional-acao | "Visão Poderosa, Momento de Agir" | Inteligência emocional alta |
| emocional-disciplina | "Alma Forte, Sistema a Construir" | Determinação + precisa consistência |
| clareza-emocional | "Mente Estratégica, Combustível a Despertar" | Sabe onde quer chegar |
| clareza-acao | "Estratégia Definida, Execução a Libertar" | Visão + precisa agir |
| clareza-disciplina | "Visão Nítida, Ritmo a Solidificar" | Clareza + precisa rotina |
| acao-emocional | "Energia em Movimento, Equilíbrio a Encontrar" | Ação rápida |
| acao-clareza | "Força de Fazer, Direcção a Afinar" | Impulso + precisa direção |
| acao-disciplina | "Impulso Real, Consistência a Cultivar" | Coragem + precisa manter |
| disciplina-emocional | "Método Sólido, Chama Interior a Acender" | Consistente |
| disciplina-clareza | "Ritmo Forte, Mapa a Definir" | Disciplina + precisa visão |
| disciplina-acao | "Consistência Presente, Coragem de Agir a Soltar" | Ritmo + precisa ousadia |

---

## 6. Estratégias de Conversão

### 6.1 Táticas de Urgência

| Tática | Implementação | Impacto |
|--------|---------------|---------|
| **Contador regressivo** | 15 min por sessão | +20% conversão |
| **Vagas limitadas** | X vagas ao preço promocional | +15% conversão |
| **Preço expira** | Mostra preço normal após timer | +10% conversão |
| **Notificações de venda** | Toast de compras recentes | +15% conversão |

### 6.2 Prova Social

```
✅ "Junte-se a 1.247 pessoas que já transformaram as suas finanças"

✅ Toast notifications:
   "João de Benguela acabou de comprar há 2 minutos"
   
✅ Depoimentos textuais na oferta

✅ Badge: "100% Anónimo" + "Resultado Imediato"
```

### 6.3 Garantia

```
┌─────────────────────────────┐
│  🛡️ GARANTIA DE 7 DIAS      │
│                             │
│  Se não gostares,           │
│  devolvemos 100% do valor   │
│  sem perguntas!             │
│                             │
│  ✅ Zero risco               │
│  ✅ Dinheiro de volta        │
│  ✅ Sem burocracia           │
└─────────────────────────────┘
```

### 6.4 Bônus por Compra Imediata

```
"Compra nos próximos 10 minutos e recebes:
✓ Ebook Riqueza Oculta
✓ Acesso ao Grupo VIP
✓ BÓNUS: Planilha de Controlo Financeiro (valor: 1.500 Kz)
✓ BÓNUS: Ebook '7 Dias para Mudar' (valor: 2.000 Kz)"
```

---

## 7. Sistema de Pagamentos

### 7.1 Provedor: KB Agency

Integração com gateway de pagamento angolano KB Agency:
- **Multicaixa Express**: Pagamento direto no telemóvel
- **Referência**: Pagamento em ATM/Internet Banking

### 7.2 Fluxo de Pagamento

```
1. Cliente escolhe método
   ├── Express → Insere número → Recebe notificação no telemóvel
   └── Referência → Recebe Entidade + Referência

2. Pagamento processado pela KB Agency

3. Webhook notifica sistema
   ├── Sucesso → Status: paid → Libera acesso
   └── Falha → Status: failed → Notifica cliente

4. Cliente redirecionado para página de acesso
```

### 7.3 Estrutura de Checkout

| Campo | Descrição |
|-------|-----------|
| `reference` | ROV2-XXXXXXXX (nosso ID) |
| `entity` | Código da entidade (KB Agency) |
| `paymentReference` | Referência única para pagamento |
| `amount` | Valor em Kwanzas (4500) |
| `status` | pending / paid / failed |

### 7.4 Modo de Segurança

```typescript
// Sem variáveis de pagamento configuradas
// o sistema opera em modo simulado

if (!apiKey) {
  console.log("[Payment] Modo simulado ativo");
  return mockReference;
}
```

---

## 8. Recuperação de Abandonos

### 8.1 Sequência de Recuperação

| Tempo | Canal | Mensagem |
|-------|-------|----------|
| T+5min | - | Detecta abandono no checkout |
| T+15min | SMS | "Esqueceste algo? A tua referência expira em 15 min" |
| T+30min | WhatsApp | Link direto + nova referência |
| T+2h | Email | "Oferta especial volta" + bônus |
| T+24h | SMS | "Última chance: preço promocional termina hoje" |

### 8.2 Exit-Intent Popup

```typescript
// Detecta intenção de saída
// Desktop: mouseleave da janela
// Mobile: scroll rápido para cima

Modal: "Espera! Oferta exclusiva de despedida"
- Desconto extra de 500 Kz
- Ou bônus adicional
```

### 8.3 Progresso Salvo

```typescript
// localStorage persiste:
- Nome e telefone
- Método de pagamento selecionado
- Timestamp do checkout

// Ao voltar:
"Continuaste onde ficaste"
```

---

## 9. Assistente Virtual (Sofia)

### 9.1 Características

| Aspecto | Detalhe |
|---------|---------|
| **Nome** | Sofia |
| **Avatar** | Imagem profissional feminina |
| **Tom** | Amigável, profissional, incentivador |
| **Idioma** | Português (PT-AO) |
| **IA** | API de chat (OpenAI/similar) |

### 9.2 Funcionalidades

```
💬 Chat em tempo real
   ├─ Saudação personalizada (usa nome do usuário)
   ├─ Respostas rápidas pré-definidas
   ├─ Histórico de conversa
   └─ Fallback para WhatsApp humano

📱 Widget flutuante
   ├─ Avatar no canto inferior direito
   ├─ Indicador "online"
   └─ Badge "Precisa de ajuda?"

🔗 Integração WhatsApp
   └─ Botão "Entrar no Grupo VIP"
```

### 9.3 Respostas Rápidas

```typescript
const DEFAULT_QUICK_REPLIES = [
  "É seguro pagar aqui?",
  "O que recebo exactamente?",
  "Como pago no ATM?",
  "4500 Kz é muito caro?"
];
```

---

## 10. Painel Administrativo

### 10.1 Módulos

```
┌─────────────────────────────────────────────────────────────┐
│  ADMIN DASHBOARD                                             │
├─────────────────────────────────────────────────────────────┤
│                                                              │
│  📊 ANALYTICS                                               │
│  ├─ Visitas por página                                      │
│  ├─ Taxas de conversão                                      │
│  ├─ Receita total                                           │
│  └─ Gráficos de tendência                                   │
│                                                              │
│  👥 LEADS                                                   │
│  ├─ Lista completa                                          │
│  ├─ Status (novo/contactado/comprou/abandonou)              │
│  ├─ Perfil do quiz                                          │
│  └─ Exportar CSV                                            │
│                                                              │
│  💰 PAGAMENTOS                                              │
│  ├─ Checkouts pendentes                                     │
│  ├─ Vendas confirmadas                                      │
│  ├─ Taxa de aprovação                                       │
│  └─ Atualizar manualmente                                   │
│                                                              │
│  📝 CONTEÚDO DO FUNIL                                       │
│  ├─ Landing page (headlines, CTAs)                          │
│  ├─ Oferta (preços, bullets)                                │
│  ├─ Quiz (perguntas)                                        │
│  └─ Configurações gerais                                    │
│                                                              │
│  🎯 SIMULADOR                                               │
│  ├─ Estatísticas de respostas                               │
│  ├─ Distribuição de perfis                                  │
│  └─ Performance por pergunta                                │
│                                                              │
│  ⚙️ DEFINIÇÕES                                              │
│  ├─ Preços                                                  │
│  ├─ Links WhatsApp                                          │
│  ├─ Configurações de pagamento                              │
│  └─ Gestão de administradores                               │
│                                                              │
└─────────────────────────────────────────────────────────────┘
```

### 10.2 Autenticação

- Login protegido por senha
- JWT tokens
- Session storage
- Logout seguro

---

## 11. Marketing e Analytics

### 11.1 Pixel do Facebook (Meta)

```typescript
// Eventos trackados:
- PageView (todas as páginas)
- Lead (captura de contato)
- InitiateCheckout (início checkout)
- Purchase (compra confirmada)
- ViewContent (visualização de conteúdo)
- Custom: ViewLandingPage, ViewSimulatorStart
```

### 11.2 Métricas Principais (KPIs)

| Métrica | Definição | Meta |
|---------|-----------|------|
| **CPA** | Custo por aquisição | < 2.000 Kz |
| **ROAS** | Retorno sobre ad spend | > 3x |
| **LTV** | Valor do cliente | > 10.000 Kz |
| **Taxa de abandono** | Checkout não completado | < 60% |
| **Taxa de reembolso** | Garantia acionada | < 5% |

### 11.3 Otimização Contínua

**Testes A/B Prioritários:**
1. Preço: 4.500 Kz vs 4.990 Kz (psicologia do 9)
2. CTA: "Comprar Agora" vs "Desbloquear Acesso" vs "Garantir o Meu"
3. Timer: 15 min vs 30 min vs 1 hora
4. Garantia: Topo vs Final da página

---

## 12. Configurações

### 12.1 Variáveis de Ambiente

```bash
# Database
DATABASE_URL=postgres://...

# KB Agency (Pagamentos)
KB_AGENCY_API_KEY=sk_live_...
KB_API_EXPRESS_KEY=sk_live_...
KB_AGENCY_WEBHOOK_SECRET=whsec_...

# Admin
ADMIN_PASSWORD_HASH=...
JWT_SECRET=...

# Integrações (Opcional)
BULKGATE_APP_ID=...
BULKGATE_TOKEN=...
```

### 12.2 Configurações Dinâmicas (DB)

| Chave | Descrição | Padrão |
|-------|-----------|--------|
| `price_original` | Preço de tabela | 7.500 |
| `price_promo` | Preço promocional | 4.500 |
| `whatsapp_group_link` | Link do grupo VIP | (configurar) |
| `scarcity_vagas` | Vagas ao preço promocional | 14 |

### 12.3 Deploy

```bash
# Setup inicial
cp .env.example .env
npm install

# Desenvolvimento
npm run dev

# Build produção
npm run build

# Database
npm run db:generate
npm run db:migrate
```

---

## 🚀 Roadmap e Melhorias Futuras

### Curto Prazo (1-2 semanas)
- [ ] Implementar notificações de venda em tempo real
- [ ] Exit-intent popup com desconto
- [ ] Sequência de recuperação SMS/WhatsApp

### Médio Prazo (1-2 meses)
- [ ] Contador de vagas dinâmico real
- [ ] Upsell pós-compra (consultoria)
- [ ] Programa de afiliados

### Longo Prazo (3-6 meses)
- [ ] App mobile nativo
- [ ] Curso em vídeo complementar
- [ ] Comunidade paga (assinatura)
- [ ] Webinars ao vivo

---

## 📞 Suporte e Contatos

- **Domínio**: https://www.riquezaoculta.click
- **Hospedagem**: Vercel
- **Pagamentos**: KB Agency
- **Suporte**: Grupo VIP WhatsApp

---

*Documentação gerada em: 17 de Março de 2026*  
*Versão do projeto: 2.0*
