# Nosso Cantinho 💜 DAB

Site do Danilo & da Bia: início com contador de tempo juntos, calendário de datas especiais,
mural de polaroids, cronograma semanal, aba "Nós" e uma surpresa no dia do namoro.

Tudo fica salvo no **Supabase** (banco de dados + fotos), protegido pela senha do site.
Vocês dois veem as mesmas coisas, em qualquer celular ou computador.

Feito com **Vite + React + Tailwind CSS v4 + Supabase**.

---

## O que vocês vão precisar

| O quê | Onde | Custa |
| --- | --- | --- |
| Node.js **22 ou mais novo** (versão LTS) | https://nodejs.org | grátis |
| Conta no Supabase (banco de dados) | https://supabase.com | grátis |
| Conta na Vercel (para ter um link do site) | https://vercel.com | grátis |

Plano grátis do Supabase: **1 GB para fotos** e 500 MB de banco de dados.
O site diminui cada foto antes de enviar (cerca de 300 KB), então cabem **uns 3.000 fotos**.

---

## Passo 1: Criar o projeto no Supabase

1. Entre em **https://supabase.com** e clique em **Start your project**. Dá pra entrar com a conta do GitHub ou com e-mail.
2. Clique em **New project**.
   - **Name:** `nosso-cantinho`
   - **Database Password:** clique em *Generate a password* e guarde num lugar seguro.
     (Essa senha **não** é a do site, é a do banco. Vocês quase nunca vão usar.)
   - **Region:** `South America (São Paulo)`
   - Clique em **Create new project** e espere uns 2 minutos até ele ficar pronto.

## Passo 2: Criar as tabelas e a pasta de fotos

1. No menu da esquerda, clique em **SQL Editor**.
2. Clique em **New query**.
3. Abra o arquivo **`supabase/setup.sql`** (está dentro da pasta do projeto), copie **tudo** e cole lá.
4. Clique em **Run** (ou aperte Ctrl + Enter).
5. Tem que aparecer **"Success. No rows returned"**.

Isso cria:
- a tabela `items`, onde ficam as datas, a semana e as informações das fotos;
- a pasta privada `fotos`, onde as imagens são guardadas;
- as regras de segurança, para que só quem digitou a senha consiga ver alguma coisa.

## Passo 3: Criar o "usuário" do casal (é a senha do site)

A senha do site é a senha de um usuário do Supabase. O site completa a senha por dentro:
se o PIN é `0814`, a senha guardada no Supabase é `dab-cantinho-0814`.

1. No menu da esquerda, clique em **Authentication**, depois em **Users**.
2. Clique em **Add user** e depois em **Create new user**.
   - **Email:** um e-mail qualquer, por exemplo `dab@nossocantinho.com` (não precisa existir).
   - **Password:** `dab-cantinho-0814`
   - Marque **Auto Confirm User**.
   - Clique em **Create user**.

## Passo 4: Fechar a porta para estranhos

Para ninguém conseguir criar outra conta no projeto de vocês:

1. Vá em **Authentication** e procure a área **Sign In / Providers**.
2. Desligue a opção **Allow new users to sign up**.
3. Clique em **Save**.

## Passo 5: Pegar os dados de conexão

1. Clique no botão **Connect** no topo da página do projeto, ou vá em **Project Settings → Data API**.
   Copie a **Project URL**. Ela é parecida com `https://abcdefgh.supabase.co`.
2. Vá em **Project Settings → API Keys** e copie a **Publishable key**.
   Ela começa com `sb_publishable_`.
   (Nunca use a *secret key* no site.)

## Passo 6: Configurar o projeto no seu computador

No terminal do VS Code (PowerShell), dentro da pasta `nosso-cantinho`:

```powershell
Copy-Item .env.example .env
code .env
```

O arquivo `.env` vai abrir. Troque pelos seus dados e salve (Ctrl + S):

```
VITE_SUPABASE_URL=https://abcdefgh.supabase.co
VITE_SUPABASE_PUBLISHABLE_KEY=sb_publishable_xxxxxxxxxxxx
VITE_COUPLE_EMAIL=dab@nossocantinho.com
```

Depois instale e rode:

```powershell
npm install
npm run dev
```

Abra **http://localhost:5173** e digite a senha **0814**. 🎉

> Se aparecer a tela **"Falta ligar o banco de dados"**, o `.env` não foi encontrado
> ou falta alguma linha. Ele precisa estar na pasta `nosso-cantinho`, junto do `package.json`.

### Tinha coisas salvas na versão antiga?

Abra o site **no mesmo navegador de antes**, entre com a senha e vá na aba **Nós**.
Vai aparecer o botão **"Enviar o que estava salvo neste navegador"**: ele manda as fotos,
as datas e a semana para o banco de dados.

---

## Passo 7: Colocar no ar (para abrir nos celulares)

```powershell
npm install -g vercel
vercel
```

Responda às perguntas: faça login, escolha *Set up and deploy* e aperte Enter no resto.

Depois coloque as 3 informações do `.env` na Vercel (uma de cada vez, colando o valor quando ele pedir):

```powershell
vercel env add VITE_SUPABASE_URL production
vercel env add VITE_SUPABASE_PUBLISHABLE_KEY production
vercel env add VITE_COUPLE_EMAIL production
vercel --prod
```

No final ele mostra o link do site, algo como `https://nosso-cantinho.vercel.app`.
Abram nos celulares e usem **"Adicionar à tela de início"** para ficar parecendo um app 💜

Sempre que mudar algo no código, rode `vercel --prod` de novo para atualizar o site.

---

## Senha do site 🔐

- A senha inicial é **0814**. Ela é pedida toda vez que o site é aberto de novo.
- Para trocar: aba **Nós → Senha do site**. Digite a senha atual, a nova (de 4 a 8 números) e repita a nova.
- A troca vale para os dois na hora.
- Esqueceram a senha? No Supabase, abra o **SQL Editor** e rode (trocando o e-mail e a senha nova):

  ```sql
  update auth.users
  set encrypted_password = extensions.crypt('dab-cantinho-1234', extensions.gen_salt('bf'))
  where email = 'dab@nossocantinho.com';
  ```

  Depois disso a senha do site passa a ser `1234`.
- O cadeado no topo do site tranca na hora.

## Bom saber

- **Projeto pausado:** no plano grátis, o Supabase pausa o projeto depois de 7 dias sem ninguém abrir o site.
  Se o site parar de entrar, abra o painel do Supabase e clique em **Restore project**. Nada é perdido.
- **Espaço usado:** dá para ver em **Project Settings → Usage** no Supabase.
- **iPhone:** fotos em HEIC normalmente viram JPG sozinhas ao escolher pela galeria.
  Se alguma não for, o site avisa.

---

## Onde mexer no código

| Quero mudar… | Arquivo |
| --- | --- |
| Cores, fontes, animações | `src/index.css` |
| Página de início | `src/components/Home.jsx` |
| Calendário e datas especiais | `src/components/Calendar.jsx` |
| Mural de fotos e foto em tela cheia | `src/components/Photos.jsx` |
| Cronograma semanal e sugestões | `src/components/Weekly.jsx` |
| Aba Nós (nomes, data, senha) | `src/components/Settings.jsx` |
| Surpresa do dia especial | `src/components/SpecialDay.jsx` |
| Tela de senha | `src/components/LockScreen.jsx` |
| Conexão com o banco | `src/lib/supabase.js` e `src/lib/store.js` |
| Tabelas e regras do banco | `supabase/setup.sql` |
