# Alberto Mota — site de composições

Site em React + Vite + TypeScript + Tailwind, com Supabase como backend (banco de dados,
autenticação, storage de arquivos).

Recria a estrutura do albertomota.com.br: Hero, Método (6 etapas), destaque "Andarilho",
vídeo, grade de composições (com player de áudio e curtidas), comentários, área de envio de
mídia por fãs, sobre e rodapé — agora tudo dinâmico via Supabase, mais um painel `/admin`.

## 1. Instalar dependências

```bash
npm install
```

## 2. Criar o projeto no Supabase

1. Crie uma conta/projeto em [supabase.com](https://supabase.com).
2. Em **Project Settings > API**, copie a **Project URL** e a **anon public key**.
3. Copie `.env.example` para `.env.local` e preencha:

```bash
cp .env.example .env.local
```

```
VITE_SUPABASE_URL=https://seu-projeto.supabase.co
VITE_SUPABASE_ANON_KEY=sua-chave-anon
```

4. No painel do Supabase, vá em **SQL Editor > New query**, cole todo o conteúdo de
  `supabase/schema.sql` e clique em **Run**. Isso cria as tabelas (`profiles`,
  `compositions`, `comments`, `likes`, `fan_submissions`, `music_projects`,
  `music_versions`, `music_payments`), as políticas de segurança (RLS)
   e os buckets de storage (`covers`, `audio`, `fan-uploads`).

## 3. Rodar localmente

```bash
npm run dev
```

Abra http://localhost:5173.

## 4. Criar sua conta de administrador

1. No site, clique em **Entrar > Cadastre-se** e crie sua conta com o e-mail que você usa.
2. No Supabase, confirme o e-mail (ou desative a confirmação de e-mail em
   **Authentication > Providers > Email** durante o desenvolvimento).
3. No **SQL Editor**, rode (trocando pelo seu e-mail):

```sql
update public.profiles set is_admin = true
where id = (select id from auth.users where email = 'seu-email@exemplo.com');
```

4. Faça login novamente. O link **"Painel admin"** vai aparecer no menu, e `/admin` ficará
   acessível.

## 5. Cadastrar composições

Em `/admin`, preencha título, descrição, história relacionada (opcional), letra (opcional),
suba a imagem de capa e o arquivo de áudio. A capa e o áudio são enviados para o Supabase
Storage, e a composição aparece imediatamente na home, com player de áudio e botão de curtir.

## 6. Moderar envios de fãs

Visitantes logados podem enviar foto/áudio/vídeo pela seção "Espaço dos fãs" na home. Esses
envios ficam com status `pending` e aparecem em `/admin` para você aprovar ou rejeitar.

## 7. Estúdio de criação

Usuários autenticados acessam `/criar` para informar título, direção melódica e letra. O
pedido fica salvo em `music_projects`, a primeira tentativa em `music_versions` e o valor
em `music_payments`. A estrutura já permite registrar melhorias como novas versões.

As chaves da Suno e do Asaas devem ser usadas em Supabase Edge Functions. Não coloque essas
credenciais em variáveis `VITE_*` ou no código do navegador. A integração da Suno usa as funções
`generate-music` e `suno-callback`:

```bash
supabase functions deploy generate-music
supabase functions deploy suno-callback --no-verify-jwt
supabase secrets set SUNO_API_KEY="sua-chave-da-suno"
```

O endpoint usado é `POST https://api.sunoapi.org/api/v1/generate`, com o header
`Authorization: Bearer ...`. A Suno chama `suno-callback` quando a geração termina. O checkout
do Asaas ainda precisa ser conectado antes de cobrar ou liberar a geração em produção.

## 8. Deploy

Funciona em qualquer serviço de hospedagem estática (Vercel, Netlify, Cloudflare Pages):

```bash
npm run build
```

Isso gera a pasta `dist/`. Configure as mesmas variáveis de ambiente
(`VITE_SUPABASE_URL`, `VITE_SUPABASE_ANON_KEY`) no painel do serviço escolhido, apontando
para o build a partir de `dist/`.

## Estrutura do projeto

```
src/
  components/     -> seções e peças de UI reutilizáveis
  pages/          -> Home, Login, Admin
  context/        -> AuthContext (sessão, perfil, login/cadastro/logout)
  lib/            -> cliente do Supabase
  types/          -> tipos TypeScript das tabelas
supabase/
  schema.sql      -> tabelas, RLS e buckets de storage
```

## Personalizar o visual

- Cores: `tailwind.config.js` (paleta `ink`, `paper`, `clay`, `moss`, `sand`).
- Tipografia: `Fraunces` (títulos) + `Inter` (texto), carregadas via Google Fonts em
  `index.html`.
- Vídeo em destaque ("Na estação"): troque o placeholder em
  `src/components/VideoSection.tsx` pelo embed real do YouTube/TikTok.
- Foto de perfil / logo: substitua os blocos de cor sólida (`bg-sand`) em `Hero.tsx` e
  `About.tsx` por `<img>` reais.

## Observação sobre este ambiente

Este projeto foi escrito manualmente neste ambiente porque o acesso ao registro do npm
estava bloqueado pela política de rede do sandbox usado para gerar o código — ou seja, não
foi possível rodar `npm install` / `npm run build` aqui para testar ao vivo. O código foi
revisado com cuidado (checagem de sintaxe de todos os arquivos TypeScript/TSX), mas rode
`npm run build` na sua máquina antes de publicar, e me avise se aparecer algum erro para eu
corrigir.
