# 🚀 Setup Supabase — Painel Izzat (login e-mail + senha)
### Guia passo-a-passo. Tudo no plano FREE.

> Você já tem o projeto Supabase criado (as chaves estão no `.env.local`:
> `NEXT_PUBLIC_SUPABASE_URL` + `NEXT_PUBLIC_SUPABASE_ANON_KEY`). Projeto: `pwgkwbdzuseggxobdpuk`.

---

## Passo 1 — Rodar o schema (criar as tabelas)
1. Abra o **Supabase Dashboard** → seu projeto → menu lateral **SQL Editor** → **New query**.
2. Cole TODO o conteúdo de `supabase/schema.sql` e clique **Run**.
3. Deve aparecer "Success". As tabelas surgem em **Table Editor** (colaboradores, tarefas, rotinas…).

> Pode rodar de novo sem medo — o script é idempotente (`if not exists`).

---

## Passo 2 — Ativar login por e-mail + senha
1. Dashboard → **Authentication** → **Providers** → **Email**.
2. Deixe **Enable Email provider** = ON (já vem ligado).
3. **Confirm email**: para time interno, recomendo **DESLIGAR** ("Confirm email" OFF) — assim a
   pessoa entra direto com a senha que você definir, sem precisar confirmar caixa de entrada.
   (Se preferir mais segurança, deixe ON e cada um confirma pelo e-mail.)
4. Salve.

---

## Passo 3 — Criar os usuários (as 15 pessoas)
Dois jeitos:

**A) Pelo Dashboard (manual, simples):**
- **Authentication** → **Users** → **Add user** → **Create new user**.
- Preencha **e-mail** (o mesmo da pessoa em `lib/data.ts`) + **senha** provisória.
- Marque **Auto Confirm User** (entra na hora).
- Repita para cada pessoa.

**B) Em lote (eu gero o SQL/script):** me avise que eu crio um script que cria os 15 usuários de
uma vez via API admin (precisa da **service_role key** — vou pedir, ela é secreta, fica só no servidor).

---

## Passo 4 — Ligar cada login à pessoa (auth_id)
Cada usuário do **Auth** tem um `id` (uuid). A tabela `colaboradores` tem a coluna `auth_id` e
`email`. A ligação é feita **por e-mail** automaticamente quando migrarmos o store (Fase 2), ou
manualmente com este SQL (rode no SQL Editor depois de criar os usuários):

```sql
update public.colaboradores c
set auth_id = u.id
from auth.users u
where lower(c.email) = lower(u.email);
```

---

## Passo 5 — Conferir as env vars
- **Local** (`.env.local`): já tem as 2 chaves públicas. ✅
- **Vercel** (Produção): Dashboard Vercel → projeto → **Settings → Environment Variables** →
  confirme que existem `NEXT_PUBLIC_SUPABASE_URL` e `NEXT_PUBLIC_SUPABASE_ANON_KEY`
  (Production + Preview). Sem elas, o app no ar não conecta no banco.
- Para criar usuários em lote (passo 3B), adicione `SUPABASE_SERVICE_ROLE` **só no servidor**
  (nunca com prefixo `NEXT_PUBLIC_` — essa chave é secreta e dá acesso total).

---

## Como o login vai funcionar (Fase 2 — código)
Hoje: `login(id)` só seleciona um perfil. Vai virar:
```ts
// entrar
const { data, error } = await supabase.auth.signInWithPassword({ email, senha });
// sessão persiste sozinha (cookie/localStorage gerenciado pelo Supabase)
// no load do app: supabase.auth.getSession() → acha o colaborador por email → usuarioAtual
// sair
await supabase.auth.signOut();
```
A tela de seleção de perfil vira tela de **e-mail + senha**. A sessão fica salva pelo próprio
Supabase, então **não pede login toda hora** e funciona em qualquer device.

---

## Ordem das fases (recap)
| Fase | O quê | Quem |
|------|-------|------|
| 1 | Tabelas (schema.sql) + ativar Email auth + criar usuários | **Você** (Dashboard) |
| 2 | Migrar o store pra Supabase (colaboradores/salários primeiro) + tela de login real | **Eu** (código) |
| 3 | RLS por papel (admin vê tudo, colaborador vê o seu) | Eu |
| 4 | Presença ao vivo (Realtime) | Eu |

---

## ✅ Quando terminar os Passos 1–3, me avise
Aí eu começo a **Fase 2**: troco o `localStorage` por Supabase começando pelos **colaboradores +
salários** (a dor que você citou), valido essa fatia no ar, e sigo pro resto. Também faço a tela
de login e-mail+senha e o seed inicial (importar os colaboradores de `lib/data.ts` pro banco).

> Free tier aguenta tudo isso pra 15 pessoas. Custo: **R$ 0**.
