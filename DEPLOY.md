# 🚀 GUIA DEFINITIVO DE DEPLOY GRATUITO - BARBER PREMIUM

> **Meta**: Colocar a plataforma Barber Premium 100% no ar em produção, com banco de dados PostgreSQL em nuvem (Supabase) e hospedagem de alta performance (Vercel) no plano gratuito (**Free Tier $0/mês**), com suporte a pagamentos instantâneos via PIX e painel administrativo completo.

---

## 📋 SUMÁRIO EXECUTIVO

1. [Pré-requisitos](#1-pré-requisitos)
2. [Passo 1: Banco de Dados no Supabase (Gratuito)](#2-passo-1-banco-de-dados-no-supabase-gratuito)
3. [Passo 2: Configuração da Chave PIX Real do Sandro](#3-passo-2-configuração-da-chave-pix-real-do-sandro)
4. [Passo 3: Publicação Gratuita na Vercel](#4-passo-3-publicação-gratuita-na-vercel)
5. [Passo 4: Criação do Primeiro Usuário Administrador (Sandro)](#5-passo-4-criação-do-primeiro-usuário-administrador-sandro)
6. [Passo 5: Checklist Pós-Deploy no Celular](#6-passo-5-checklist-pós-deploy-no-celular)
7. [Resolução de Dúvidas Comuns](#7-resolução-de-dúvidas-comuns)

---

## 1. PRÉ-REQUISITOS

Você precisará apenas de contas gratuitas nas seguintes plataformas:
1. **GitHub** (https://github.com) — para hospedar o código do projeto.
2. **Supabase** (https://supabase.com) — banco de dados PostgreSQL serverless com Auth e Row Level Security (RLS).
3. **Vercel** (https://vercel.com) — hospedagem global de altíssima velocidade para aplicações Next.js.
4. **Sua Chave PIX** (CPF, CNPJ, Celular, E-mail ou Chave Aleatória).

---

## 2. PASSO 1: BANCO DE DADOS NO SUPABASE (GRATUITO)

### 2.1 Criar o Projeto no Supabase
1. Acesse [supabase.com](https://supabase.com) e clique em **"Start your project"**.
2. Faça login com sua conta do GitHub.
3. Clique em **"New Project"**.
4. Preencha as informações:
   - **Name**: `barber-premium` (ou o nome que preferir).
   - **Database Password**: Escolha uma senha segura e anote-a.
   - **Region**: Selecione **`São Paulo (sa-east-1)`** para menor latência no Brasil.
   - **Pricing Plan**: Free Tier ($0/month).
5. Clique em **"Create new project"** e aguarde cerca de 1 a 2 minutos até o provisionamento concluir.

### 2.2 Executar o Script de Banco Consolidado (`schema_production.sql`)
1. No menu lateral esquerdo do painel do Supabase, clique no ícone **SQL Editor** (ícone `>_`).
2. Clique no botão **"New query"** (ou "+").
3. Abra em seu computador o arquivo:
   `c:\Users\Sandro\Desktop\UP_SANDRO\SANDRO\barber-premium\supabase\schema_production.sql`
4. Copie **todo o conteúdo** do arquivo e cole dentro do editor do Supabase.
5. Clique no botão verde **"Run"** (no canto inferior direito ou superior direito).
6. Você verá a mensagem **"Success. No rows returned"** em verde.

> **O que esse script faz automaticamente:**
> - Habilita a extensão de UUIDs.
> - Cria todas as tabelas (`profiles`, `barbers`, `services`, `availability`, `appointments`).
> - Habilita Row Level Security (RLS) protegido contra recursão usando funções `SECURITY DEFINER`.
> - Cria a trigger de sincronização de novos usuários cadastrados.
> - Insere o catálogo inicial de serviços da barbearia (Corte Tradicional, Barba Terapia Imperial, Combo VIP Signature, etc.).

### 2.3 Obter as Chaves de API do Supabase
1. No menu lateral esquerdo, clique no ícone de engrenagem **"Project Settings"**.
2. Clique em **"API"**.
3. Copie os seguintes valores para usar no próximo passo:
   - **Project URL**: (ex: `https://xxxx.supabase.co`)
   - **anon public key**: (chave longa que começa com `eyJhbGci...`)
   - **service_role key** (Secret): clique em *Reveal* e copie (começa com `eyJhbGci...`).
     *(⚠️ Guarde a service_role key em segredo absoluto, pois ela possui acesso administrativo).*

---

## 3. PASSO 2: CONFIGURAÇÃO DA CHAVE PIX REAL DO SANDRO

O sistema Barber Premium já possui o algoritmo oficial do Banco Central (EMVCo BRCode / CRC16-CCITT) nativo, sem custos ou intermediários bancários que cobram taxas por transação. O dinheiro cai diretamente na conta bancária vinculada à chave PIX!

### 3.1 No arquivo local `.env.local`
Abra o arquivo `c:\Users\Sandro\Desktop\UP_SANDRO\SANDRO\barber-premium\.env.local` e configure:

```env
# Conexão com o Supabase (obtidas no Passo 2.3)
NEXT_PUBLIC_SUPABASE_URL=https://SEU_PROJETO.supabase.co
NEXT_PUBLIC_SUPABASE_ANON_KEY=sua_chave_anon_aqui
SUPABASE_SERVICE_ROLE_KEY=sua_chave_service_role_aqui

# Dados Reais do PIX do Sandro
NEXT_PUBLIC_PIX_KEY=sua_chave_pix_aqui
NEXT_PUBLIC_PIX_RECEIVER_NAME=SANDRO BARBER
NEXT_PUBLIC_PIX_RECEIVER_CITY=SAO PAULO
```

### Exemplos válidos de `NEXT_PUBLIC_PIX_KEY`:
- E-mail: `sandro@exemplo.com.br`
- CPF: `12345678900` (apenas números)
- CNPJ: `12345678000195` (apenas números)
- Celular: `+5511999998888` (com DDD e código do país)
- Chave Aleatória: `123e4567-e89b-12d3-a456-426614174000`

---

## 4. PASSO 3: PUBLICAÇÃO GRATUITA NA VERCEL

### 4.1 Subir o Projeto para o GitHub
Se ainda não subiu para o seu GitHub:
1. Abra o terminal na pasta `c:\Users\Sandro\Desktop\UP_SANDRO\SANDRO\barber-premium`.
2. Execute:
   ```bash
   git init
   git add .
   git commit -m "feat: Barber Premium pronto para producao"
   git branch -M main
   git remote add origin https://github.com/SEU_USUARIO/barber-premium.git
   git push -u origin main
   ```

### 4.2 Importar o Projeto na Vercel
1. Acesse [vercel.com](https://vercel.com) e entre com sua conta do GitHub.
2. Clique no botão **"Add New..."** -> **"Project"**.
3. Localize o repositório **`barber-premium`** e clique em **"Import"**.
4. Na tela de configuração:
   - **Framework Preset**: Next.js (detectado automaticamente).
   - **Root Directory**: `./` (se o repositório estiver na raiz) ou `barber-premium`.

### 4.3 Cadastrar as Variáveis de Ambiente na Vercel
Na seção **"Environment Variables"**, adicione as 6 variáveis abaixo:

| Nome da Variável | Valor |
| :--- | :--- |
| `NEXT_PUBLIC_SUPABASE_URL` | Sua URL do Supabase (ex: `https://xxxx.supabase.co`) |
| `NEXT_PUBLIC_SUPABASE_ANON_KEY` | Sua chave Anon do Supabase |
| `SUPABASE_SERVICE_ROLE_KEY` | Sua chave Service Role do Supabase |
| `NEXT_PUBLIC_PIX_KEY` | Sua chave PIX real |
| `NEXT_PUBLIC_PIX_RECEIVER_NAME` | Nome do titular/empresa da conta PIX (sem acentos) |
| `NEXT_PUBLIC_PIX_RECEIVER_CITY` | Cidade do recebedor (ex: `SAO PAULO` sem acentos) |

5. Clique em **"Deploy"**.
6. Em cerca de 60 a 90 segundos, a Vercel gerará o seu link de produção seguro com SSL grátis (ex: `https://barber-premium-xxxx.vercel.app`).

---

## 5. PASSO 4: CRIAÇÃO DO PRIMEIRO USUÁRIO ADMINISTRADOR (SANDRO)

Para acessar o painel de agendamentos, equipe e relatórios, você precisa de um usuário com papel de `admin`.

### Opção A: Pela tela de configuração rápida da aplicação
1. Acesse a URL do seu sistema publicado adicionando `/setup/admin` ao final:
   `https://seu-dominio.vercel.app/setup/admin`
2. Digite seu e-mail e uma senha forte (mínimo 6 caracteres).
3. Clique em **"Criar Admin"**.
4. O sistema criará o usuário e atribuirá a permissão de administrador instantaneamente.
5. Pronto! Acesse `https://seu-dominio.vercel.app/admin` ou `/login` com essas credenciais.

### Opção B: Direto pelo SQL do Supabase (Alternativa infalível)
Se preferir cadastrar via tela normal de login e promover manualmente:
1. Cadastre-se na tela `/login` do sistema.
2. Vá no **SQL Editor** do Supabase e rode:
   ```sql
   UPDATE public.profiles
   SET role = 'admin'
   WHERE id IN (
     SELECT id FROM auth.users WHERE email = 'seu_email@exemplo.com'
   );
   ```

---

## 6. PASSO 5: CHECKLIST PÓS-DEPLOY NO CELULAR

Faça este teste prático no seu smartphone para validar a experiência do cliente:

- [ ] **Acesso ao Site**: Abra o link da Vercel no Chrome ou Safari Mobile e confira o design responsivo dark & gold.
- [ ] **Fluxo de Agendamento**:
  - [ ] Acesse a aba **Agendar**.
  - [ ] Escolha um Serviço (ex: Corte Tradicional).
  - [ ] Selecione o Barbeiro.
  - [ ] Escolha uma data e horário disponível.
  - [ ] Digite seu nome e WhatsApp.
- [ ] **Teste de Pagamento PIX**:
  - [ ] Selecione a opção **"Pagar 50% no Pix (Garantir Reserva)"**.
  - [ ] O modal abrirá com o **QR Code oficial** e o botão **"Copiar Código"**.
  - [ ] Toque em **"Copiar Código"** e valide se a confirmação "Copiado com sucesso!" aparece.
  - [ ] Cole no app do seu banco: confirme se o valor do sinal (50%) e o nome do recebedor aparecem exatamente como configurado.
  - [ ] Clique em **"Já realizei o pagamento (Confirmar)"** e verifique a tela de agendamento reservado com sucesso.
- [ ] **Painel Administrativo**:
  - [ ] No celular ou computador, faça login em `/login`.
  - [ ] Acesse `/admin/agendamentos` e veja o novo agendamento listado em tempo real.
  - [ ] Toque no ícone do WhatsApp do cliente para testar a abertura direta da conversa com mensagem pré-preenchida.
  - [ ] Mude o status do agendamento (Confirmar / Concluir Corte / Cancelar).

---

## 7. RESOLUÇÃO DE DÚVIDAS COMUNS

- **Os clientes precisam criar conta com senha para agendar?**
  *Não!* O sistema conta com **Guest Checkout**, permitindo que qualquer pessoa agende informando apenas Nome e WhatsApp, reduzindo drasticamente o abandono de agendamento.
- **O que acontece quando o tempo limite de 15 minutos do PIX expira?**
  *O sistema protege o banco de dados e sinaliza a expiração, evitando pagamentos fora da janela de reserva do horário.*
- **Como adicionar novos barbeiros à equipe?**
  *Basta entrar em `/admin/barbeiros` e clicar em **"Novo Barbeiro"**, informando Nome, E-mail e Senha de acesso. O barbeiro já terá acesso direto a `/barbeiro/agenda` para controlar apenas seus clientes.*

---
🎉 **Parabéns! Sua Barbearia Premium agora está operando em padrão internacional e faturando via PIX 24 horas por dia!**
