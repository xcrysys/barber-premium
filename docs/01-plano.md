# DOCUMENTO DE ESPECIFICAÇÃO & PLANO DE AÇÃO TÉCNICO
## Sistema Barber Premium - Plataforma Completa de Agendamento e Gestão

**Versão:** 1.0.0  
**Autor:** Gerente de Projetos e Planejamento Técnico da Agência  
**Status:** Aprovado para Desenvolvimento e QA  
**Stack Principal:** Next.js 16 (App Router), React 19, Tailwind CSS v4, TypeScript, Supabase (PostgreSQL + RLS + Auth)

---

## 1. Visão Geral do Sistema & Arquitetura

O **Barber Premium** é um ecossistema completo de agendamento online e gestão operacional para barbearias de alto padrão. O sistema foi concebido para eliminar o atrito no agendamento de clientes (com suporte a reservas rápidas com e sem cadastro obrigatório), processar pagamentos de sinal ou valor integral via **PIX com QR Code dinâmico/estático EMVCo oficial**, e fornecer painéis especializados para o Dono/Administrador e para os Barbeiros.

### 1.1 Diagrama de Arquitetura da Solução

```
+-----------------------------------------------------------------------------------+
|                                 CLIENTE (WEB / MOBILE)                            |
|  - Landing Page Institucional Dark Luxury                                         |
|  - Wizard de Agendamento (Serviço -> Barbeiro -> Data/Horário -> Pagamento)      |
|  - Modal Interativo PIX (QR Code EMVCo, Copia-e-Cola, Timer 15 min, Status Real) |
+-----------------------------------------+-----------------------------------------+
                                          |
                                          | HTTPS / Server Actions / Route Handlers
                                          v
+-----------------------------------------------------------------------------------+
|                        NEXT.JS 16 (APP ROUTER) / SERVER RUNTIME                   |
|  - /app/agendar (Fluxo do Cliente & Cálculo de Slots em Fuso America/Sao_Paulo)   |
|  - /app/api/pix (Geração de BRCode EMVCo, Verificação e Webhooks)                 |
|  - /app/admin (Gestão de Faturamento, Equipe, Serviços e Agendamentos)            |
|  - /app/barbeiro (Agenda Diária, Faturamento Individual e Checklist de Cortes)    |
|  - Camada de Autenticação Segura (@supabase/ssr + Middleware)                     |
+-----------------------------------------+-----------------------------------------+
                                          |
                                          | Supabase JS SDK (RLS / Service Role)
                                          v
+-----------------------------------------------------------------------------------+
|                           SUPABASE CLOUD (POSTGRESQL 15+)                         |
|  - Autenticação e Perfis (auth.users <-> public.profiles)                         |
|  - RLS Blindado (Prevenção de loops de recursão e escalonamento de privilégios)   |
|  - Funções RPC PostgreSQL (is_admin, get_busy_slots com fuso horário)             |
|  - Armazenamento Relacional (services, barbers, availability, appointments)       |
+-----------------------------------------------------------------------------------+
```

### 1.2 Stack Tecnológica Detalhada

| Camada | Tecnologia | Justificativa Técnica |
| :--- | :--- | :--- |
| **Framework Web** | Next.js 16.1 (App Router) | Renderização híbrida (RSC), Server Actions para mutações atômicas sem expor chaves sensíveis, alta velocidade de carregamento. |
| **UI Library** | React 19 + Framer Motion | Animações fluidas de microinterações, transições de steps e modal PIX responsivo. |
| **Estilização** | Tailwind CSS v4 | Arquitetura CSS-first ultra rápida, sem build overhead, tema Dark Luxury nativo. |
| **Linguagem** | TypeScript 5 | Tipagem estrita de payloads, contratos de banco e interfaces de integração PIX. |
| **Banco & Auth** | Supabase (PostgreSQL) | Banco relacional escalável, controle de permissões no nível de linha (RLS), autenticação JWT nativa. |
| **Datas & Fuso** | `date-fns` v4 + `date-fns-tz` v3 | Tratamento rigoroso do fuso horário oficial brasileiro (`America/Sao_Paulo`), impedindo agendamentos com offset UTC incorreto. |
| **QR Code / PIX** | EMVCo BRCode Engine + SVG Renderer | Geração do payload oficial do Banco Central com cálculo de CRC16-CCITT em tempo de execução sem custo de gateways terceiros. |

---

## 2. Modelo de Dados e Estrutura de Banco (Supabase)

O banco de dados foi estruturado para suportar agendamentos com alta concorrência, clientes cadastrados ou anônimos (guest checkout com nome e WhatsApp), precificação dinâmica e auditoria de pagamentos.

### 2.1 Esquema Entidade-Relacionamento (ERD)

```
[ auth.users ]
      | 1:1
[ public.profiles ]
      | 1:1 (se role = 'barber')
[ public.barbers ]
      | 1:N
[ public.availability ] (dias 0-6, horário de expediente e intervalos)

[ public.services ]
      | N:M (armazenado como array UUID[] ou tabela pivô)
[ public.appointments ] <--- [ public.profiles (customer_id opcional) ]
      |
      +---> barber_id (FK public.barbers)
      +---> payment_method ('pix' | 'in_person' | 'credit_card')
      +---> payment_status ('pending' | 'paid' | 'refunded')
      +---> status ('pending' | 'confirmed' | 'completed' | 'cancelled' | 'no_show')
```

### 2.2 Dicionário de Tabelas

#### Tabela: `public.profiles`
| Coluna | Tipo | Restrições | Descrição |
| :--- | :--- | :--- | :--- |
| `id` | `uuid` | PK, References `auth.users(id)` ON DELETE CASCADE | ID do usuário autenticado |
| `full_name` | `text` | NULL | Nome completo |
| `avatar_url` | `text` | NULL | URL da foto de perfil |
| `role` | `text` | DEFAULT 'customer', CHECK (`role` IN ('customer', 'barber', 'admin')) | Papel de acesso |
| `phone` | `text` | NULL | Telefone / WhatsApp formatado |
| `created_at` | `timestamptz` | DEFAULT `now()` | Timestamp de criação |

#### Tabela: `public.barbers`
| Coluna | Tipo | Restrições | Descrição |
| :--- | :--- | :--- | :--- |
| `id` | `uuid` | PK, References `public.profiles(id)` ON DELETE CASCADE | Vínculo com perfil |
| `bio` | `text` | NULL | Apresentação profissional |
| `specialties` | `text[]` | NULL | Especialidades (ex: Degradê, Barba Terapia) |
| `instagram_handle` | `text` | NULL | @ do Instagram |
| `is_active` | `boolean` | DEFAULT `true` | Se está ativo para novos agendamentos |

#### Tabela: `public.services`
| Coluna | Tipo | Restrições | Descrição |
| :--- | :--- | :--- | :--- |
| `id` | `uuid` | PK, DEFAULT `uuid_generate_v4()` | Identificador do serviço |
| `name` | `text` | NOT NULL | Nome comercial do serviço |
| `description` | `text` | NULL | Detalhes do procedimento |
| `duration_minutes` | `integer` | NOT NULL, CHECK > 0 | Duração em minutos (ex: 30, 45, 60) |
| `price` | `numeric(10,2)`| NOT NULL, CHECK >= 0 | Valor em Reais (R$) |
| `image_url` | `text` | NULL | Foto do serviço |
| `category` | `text` | CHECK IN ('hair', 'beard', 'combo', 'treatment') | Categoria visual |
| `is_active` | `boolean` | DEFAULT `true` | Status ativo no catálogo |

#### Tabela: `public.availability`
| Coluna | Tipo | Restrições | Descrição |
| :--- | :--- | :--- | :--- |
| `id` | `uuid` | PK, DEFAULT `uuid_generate_v4()` | ID da regra de escala |
| `barber_id` | `uuid` | FK `public.barbers(id)` ON DELETE CASCADE | Barbeiro associado |
| `day_of_week` | `integer` | NOT NULL, CHECK (0 a 6) | 0=Domingo, 1=Segunda, ..., 6=Sábado |
| `start_time` | `time` | NOT NULL | Horário de início do turno (ex: 09:00:00) |
| `end_time` | `time` | NOT NULL | Horário de término do turno (ex: 19:00:00) |
| `break_start` | `time` | NULL | Início do intervalo (almoço) |
| `break_end` | `time` | NULL | Término do intervalo |
| *Constraint* | `unique` | UNIQUE (`barber_id`, `day_of_week`) | Apenas 1 configuração por dia/barbeiro |

#### Tabela: `public.appointments`
| Coluna | Tipo | Restrições | Descrição |
| :--- | :--- | :--- | :--- |
| `id` | `uuid` | PK, DEFAULT `uuid_generate_v4()` | Identificador único da reserva |
| `customer_id` | `uuid` | FK `public.profiles(id)` NULL | Cliente cadastrado (se houver) |
| `customer_name` | `text` | NULL | Nome do cliente (obrigatório se guest) |
| `customer_phone` | `text` | NULL | WhatsApp do cliente para avisos |
| `barber_id` | `uuid` | FK `public.barbers(id)` NOT NULL | Barbeiro escalado |
| `service_ids` | `uuid[]` | NOT NULL | Serviços contratados |
| `start_time` | `timestamptz` | NOT NULL | Data e hora de início (armazenada em UTC) |
| `end_time` | `timestamptz` | NOT NULL | Data e hora de término calculada |
| `total_price` | `numeric(10,2)`| NOT NULL | Valor total do agendamento |
| `status` | `text` | CHECK IN ('pending', 'confirmed', 'completed', 'cancelled', 'no_show') | Status do atendimento |
| `payment_method` | `text` | CHECK IN ('credit_card', 'pix', 'in_person') | Forma de pagamento |
| `payment_status` | `text` | CHECK IN ('pending', 'paid', 'refunded') | Status financeiro |
| `pix_txid` | `text` | NULL | Identificador único de transação PIX |
| `pix_payload` | `text` | NULL | Código BRCode Copia-e-Cola gerado |
| `pix_expiration` | `timestamptz` | NULL | Timestamp limite para pagamento (15 min) |
| `notes` | `text` | NULL | Observações do cliente |
| `created_at` | `timestamptz` | DEFAULT `now()` | Timestamp de registro |

### 2.3 Blindagem RLS (Row Level Security) Sem Recursão

> [!IMPORTANT]
> A causa primária de erros de recursão no Supabase (`infinite recursion detected in policy for relation profiles`) ocorre quando a política de `profiles` faz consulta a `profiles` para checar se o usuário é `admin`.
> **Solução Arquitetural:** Utilização de uma função `SECURITY DEFINER` isolada (`public.is_admin()`), que consulta diretamente sem disparar as políticas RLS.

```sql
-- 1. Função de Verificação de Admin Blindada
create or replace function public.is_admin()
returns boolean
language sql
security definer
set search_path = public
stable
as $$
  select exists (
    select 1 from public.profiles
    where id = auth.uid() and role = 'admin'
  );
$$;

-- 2. Habilitação de RLS em Todas as Tabelas
alter table public.profiles enable row level security;
alter table public.barbers enable row level security;
alter table public.services enable row level security;
alter table public.availability enable row level security;
alter table public.appointments enable row level security;

-- 3. Políticas para Profiles
create policy "Perfis visíveis publicamente" on public.profiles
  for select using (true);

create policy "Usuário edita o próprio perfil" on public.profiles
  for update using (auth.uid() = id);

-- 4. Políticas para Serviços, Barbeiros e Disponibilidade (Público Lê, Admin Escreve)
create policy "Serviços visíveis publicamente" on public.services
  for select using (true);
create policy "Admin gerencia serviços" on public.services
  for all using (public.is_admin());

create policy "Barbeiros visíveis publicamente" on public.barbers
  for select using (true);
create policy "Admin gerencia barbeiros" on public.barbers
  for all using (public.is_admin());

create policy "Disponibilidade visível publicamente" on public.availability
  for select using (true);
create policy "Admin gerencia disponibilidade" on public.availability
  for all using (public.is_admin());

-- 5. Políticas para Agendamentos (Appointments)
-- Leitura: Cliente vê os seus, Barbeiro vê os designados a ele, Admin vê todos
create policy "Visualização de agendamentos autorizados" on public.appointments
  for select using (
    auth.uid() = customer_id
    or barber_id = auth.uid()
    or public.is_admin()
  );

-- Inserção: Permitida para qualquer usuário (autenticado ou anônimo via Service Role/Server Action)
create policy "Criação de agendamento" on public.appointments
  for insert with check (true);

-- Atualização: Admin tem controle total; Barbeiro pode atualizar status dos seus clientes
create policy "Atualização de agendamentos" on public.appointments
  for update using (
    barber_id = auth.uid()
    or public.is_admin()
  );
```

### 2.4 RPC de Verificação de Horários Ocupados (Anti-Conflito de Fuso)

```sql
create or replace function public.get_busy_slots(
  p_barber_id uuid,
  p_start_time timestamptz,
  p_end_time timestamptz
)
returns table (start_time timestamptz, end_time timestamptz)
language sql
security definer
stable
as $$
  select a.start_time, a.end_time
  from public.appointments a
  where a.barber_id = p_barber_id
    and a.status not in ('cancelled')
    and (a.start_time < p_end_time and a.end_time > p_start_time);
$$;
```

---

## 3. Especificação Técnica da Integração PIX (EMVCo BRCode)

Para garantir que o dinheiro entre **diretamente na conta bancária do dono da barbearia** sem intermediários, taxas abusivas de gateway ou retenção de saldo, o sistema implementa um **Gerador Nativo de BRCode Padrão EMVCo** conforme as especificações normativas do Banco Central do Brasil.

### 3.1 Padrão EMVCo TLV (Tag-Length-Value) e Chave PIX

A string do Pix Copia-e-Cola é uma sequência de blocos no formato:
`[ID da Tag: 2 caracteres][Comprimento do Valor: 2 caracteres][Valor do Campo]`

#### Estrutura das Tags do Payload Estático/Dinâmico:
1. **Payload Format Indicator (Tag 00):** Tamanho fixo `02`, valor `01`.
2. **Merchant Account Information (Tag 26):**
   - Subtag 00: `br.gov.bcb.pix` (Domínio do Bacen)
   - Subtag 01: Chave PIX do recebedor (CPF, CNPJ, Telefone, E-mail ou Chave Aleatória EVP)
3. **Merchant Category Code (Tag 52):** Tamanho `04`, valor `0000` (Geral / Serviços).
4. **Transaction Currency (Tag 53):** Tamanho `03`, valor `986` (código ISO do Real Brasileiro - BRL).
5. **Transaction Amount (Tag 54):** Valor formatado com 2 casas decimais (ex: `80.00`).
6. **Country Code (Tag 58):** Tamanho `02`, valor `BR`.
7. **Merchant Name (Tag 59):** Nome do titular da conta / barbearia (até 25 caracteres, sem acentos).
8. **Merchant City (Tag 60):** Cidade da barbearia (até 15 caracteres, sem acentos, ex: `SAO PAULO` ou `VITORIA`).
9. **Additional Data Field Template (Tag 62):**
   - Subtag 05: Reference Label / TxID (Identificador do agendamento, ex: `BARBER1024` ou `***`).
10. **CRC16-CCITT (Tag 63):** Tag `6304` seguida de 4 caracteres hexadecimais em maiúsculo calculados sobre toda a string anterior.

### 3.2 Algoritmo de Cálculo CRC16-CCITT (Polinômio 0x1021)

```typescript
/**
 * Utilitário Oficial de Cálculo CRC16-CCITT para BRCode PIX
 * Polinômio: 0x1021 | Valor Inicial: 0xFFFF
 */
export function calculateCRC16(payload: string): string {
    let crc = 0xFFFF;
    const polynomial = 0x1021;

    for (let i = 0; i < payload.length; i++) {
        crc ^= (payload.charCodeAt(i) << 8);
        for (let j = 0; j < 8; j++) {
            if ((crc & 0x8000) !== 0) {
                crc = ((crc << 1) ^ polynomial) & 0xFFFF;
            } else {
                crc = (crc << 1) & 0xFFFF;
            }
        }
    }

    return crc.toString(16).toUpperCase().padStart(4, '0');
}
```

### 3.3 Variáveis de Ambiente Necessárias (.env.local)

```env
# Configurações do Recebedor PIX (Dono da Barbearia)
NEXT_PUBLIC_PIX_KEY="financeiro@barberpremium.com.br"
NEXT_PUBLIC_PIX_RECEIVER_NAME="BARBER PREMIUM CLUB"
NEXT_PUBLIC_PIX_RECEIVER_CITY="SAO PAULO"

# Chaves do Supabase
NEXT_PUBLIC_SUPABASE_URL="https://seu-projeto.supabase.co"
NEXT_PUBLIC_SUPABASE_ANON_KEY="eyJhbGciOi..."
SUPABASE_SERVICE_ROLE_KEY="eyJhbGciOi..."
```

---

## 4. Especificação de UI/UX: Design System Dark Luxury

A experiência visual deve transmitir sofisticação, precisão e exclusividade, alinhada com as melhores barbearias do mundo (estética Mayfair, Nova York e Milão).

### 4.1 Paleta de Cores e Tokens Visuais

```css
/* Tokens Dark Luxury */
--bg-primary: #0a0a0a;       /* Neutral 950 - Preto Profundo */
--bg-surface: #141414;       /* Neutral 900 - Superfície dos Cards */
--bg-surface-hover: #1c1c1c; /* Hover Suave */
--accent-gold: #f59e0b;      /* Amber 500 - Dourado Clássico */
--accent-gold-light: #fbbf24;/* Amber 400 - Realces e Glow */
--border-subtle: rgba(255, 255, 255, 0.07);
--border-gold: rgba(245, 158, 11, 0.3);
--text-primary: #f5f5f5;
--text-secondary: #a3a3a3;
--text-muted: #737373;
```

### 4.2 Modal PIX Interativo (Substituição Total de `alert()`)

O componente `PixPaymentModal.tsx` substitui os diálogos nativos do navegador por uma janela modal imersiva.

#### Elementos do Modal PIX:
1. **Cabeçalho com Badge de Status:** Exibe "Aguardando Pagamento" em amarelo/âmbar pulsante.
2. **Timer Regressivo Dinâmico (15:00):**
   - Barra de progresso decrescente linear.
   - Formatação visual `MM:SS`.
   - Se o timer zerar, o modal muda para estado `EXPIRADO` com botão de revalidar/tentar novamente.
3. **Display Central do QR Code:**
   - Renderização limpa em SVG ou Canvas com margem segura branca para leitura rápida por qualquer aplicativo de banco (Nubank, Itaú, Bradesco, Inter, Santander, etc.).
4. **Área Copia-e-Cola com Feedback Háptico:**
   - Caixa com o código EMVCo truncado.
   - Botão proeminente **"Copiar Código PIX"** que troca para **"Copiado com Sucesso! ✓"** com animação de confirmação.
5. **Botão de Ação "Já Realizei o Pagamento":**
   - Dispara verificação instantânea no backend.
   - Exibe spinner animado "Validando comprovante...".
   - Altera para tela comemorativa com ícone dourado de sucesso e dados do agendamento confirmado.
6. **Opção de Pagamento no Local:**
   - Para clientes que preferem pagar presencialmente com cartão ou dinheiro na cadeira.

---

## 5. Painéis Administrativo & Barbeiro

### 5.1 Painel Administrativo (`/admin`)

- **Dashboard Financeiro & Operacional:**
  - Métricas de faturamento do dia, semana e mês.
  - Taxa de conversão de agendamentos e no-shows.
  - Gráfico de serviços mais rentáveis.
- **Gestão Central de Agendamentos:**
  - Tabela responsiva com filtros combinados (Data, Status, Barbeiro, Nome do Cliente).
  - Ações rápidas: Marcar como Pago, Confirmar Presença, Cancelar com liberação de horário.
- **Gestão de Barbeiros & Horários:**
  - Cadastro de profissionais com foto, bio e especialidades.
  - Configuração individual de escala semanal e horários de intervalo.
- **Gestão de Serviços:**
  - CRUD completo com controle de preço, duração em minutos e categoria.

### 5.2 Painel do Barbeiro (`/barbeiro`)

- **Agenda Diária com Visão Sequencial (Timeline):**
  - Lista em ordem cronológica com horários marcados, nome do cliente e WhatsApp com link direto `wa.me/55...`.
  - Sinalizador visual de status de pagamento: **PAGO VIA PIX** (Verde) ou **PAGAR NO LOCAL** (Laranja).
- **Ações Rápidas de Atendimento:**
  - Botão "Iniciar Atendimento".
  - Botão "Concluir Serviço" (atualiza status para `completed` e contabiliza no faturamento do barbeiro).
- **Métricas Pessoais:**
  - Quantidade de cortes realizados no dia e faturamento gerado.

---

## 6. Roteiro de Implementação para os Agentes

### Fase 1: Fundação & Regras de Negócio (Prioridade P0)
- [x] Especificação Técnica e Modelo de Dados documentados em `docs/01-plano.md`.
- [ ] Implementar utilitário oficial de geração de BRCode PIX EMVCo (`src/lib/pix.ts`) com cálculo de CRC16 rigoroso.
- [ ] Aplicar e consolidar os scripts SQL no Supabase para garantir RLS com função `is_admin()` sem recursão.
- [ ] Atualizar as Server Actions (`src/app/agendar/actions.ts`) para incluir criação do agendamento com dados de PIX e status.

### Fase 2: Experiência do Cliente & Modal PIX (Prioridade P0)
- [ ] Criar o componente `src/components/booking/PixPaymentModal.tsx` com timer regressivo de 15 minutos, botão de cópia com feedback e QR Code renderizado.
- [ ] Integrar o modal na página de agendamento (`src/app/agendar/page.tsx`), eliminando definitivamente chamadas a `alert()`.
- [ ] Refinar o seletor de horários livres (`src/lib/db.ts`) assegurando o fuso horário `America/Sao_Paulo` com `date-fns-tz`.

### Fase 3: Painéis Admin e Barbeiro (Prioridade P1)
- [ ] Validar a sincronização de status em tempo real na tabela de agendamentos (`AppointmentsTable.tsx`).
- [ ] Adicionar modal de detalhes do agendamento com histórico de pagamento e link de WhatsApp para contato com o cliente.
- [ ] Testar acesso diferenciado com perfis `admin` e `barber`.

### Fase 4: Garantia de Qualidade (QA & Reality Check) (Prioridade P0)
- [ ] Executar build de produção (`npm run build`) para assegurar conformidade do TypeScript e Next.js 16.
- [ ] Validar payload PIX em leitor bancário real para certificar que o CRC16 e as tags EMVCo são 100% aceitas.
- [ ] Simular agendamento em horário de pico para garantir bloqueio de concorrência e ausência de double-booking.

---

## 7. Guia Completo para Deploy Gratuito na Vercel e Supabase

### Passo 1: Configuração do Supabase (100% Gratuito)
1. Acesse [supabase.com](https://supabase.com) e crie uma conta gratuita.
2. Crie um novo projeto com nome **barber-premium** e defina uma senha forte para o banco de dados.
3. No painel do Supabase, acesse **SQL Editor**.
4. Copie o script SQL consolidado de criação de tabelas e RLS (`supabase/schema.sql` atualizado) e clique em **RUN**.
5. No menu lateral, acesse **Project Settings -> API** e copie:
   - `Project URL`
   - `anon public key`
   - `service_role secret key`

### Passo 2: Configuração das Variáveis de Ambiente
Crie ou configure as variáveis no arquivo `.env.local` e no dashboard da Vercel:
```env
NEXT_PUBLIC_SUPABASE_URL=https://xxxxxxxxxxxx.supabase.co
NEXT_PUBLIC_SUPABASE_ANON_KEY=eyJhbGciOiJIUzI1NiIsInR5cCI6...
SUPABASE_SERVICE_ROLE_KEY=eyJhbGciOiJIUzI1NiIsInR5cCI6...

NEXT_PUBLIC_PIX_KEY=sua-chave-pix@aqui.com
NEXT_PUBLIC_PIX_RECEIVER_NAME=NOME DA SUA BARBEARIA
NEXT_PUBLIC_PIX_RECEIVER_CITY=SAO PAULO
```

### Passo 3: Deploy na Vercel (100% Gratuito)
1. Acesse [vercel.com](https://vercel.com) e conecte seu GitHub/GitLab.
2. Importe o repositório do projeto `barber-premium`.
3. Na seção **Environment Variables**, adicione todas as 6 variáveis listadas no Passo 2.
4. Clique em **Deploy**. O Next.js 16 será compilado e distribuído na CDN global da Vercel em menos de 2 minutos.
5. Acesse a URL gerada (ex: `https://barber-premium.vercel.app`) e realize um agendamento de teste.

---

> **Aprovação Técnica:** Este documento serve como especificação oficial para os agentes Desenvolvedor Fullstack e Analista de QA da Agência.
