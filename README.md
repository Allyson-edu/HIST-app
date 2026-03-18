# Hist2025.2 — Organizador Acadêmico

Aplicativo web de gerenciamento acadêmico universitário para a turma de História 2025.2. Cada aluno possui sua própria conta e visualiza apenas seus dados.

## Stack Tecnológica

- **Next.js 14** (App Router) + TypeScript
- **Supabase** (Auth + PostgreSQL com RLS)
- **Tailwind CSS v3**
- **lucide-react** para ícones
- Design **Bauhaus** — mobile-first, sem border-radius, bordas duras

## Funcionalidades

- 🔐 Autenticação com usuário e senha (sem OAuth)
- 📅 Gestão de Semestres (criar, encerrar, arquivar)
- 📚 Disciplinas por semestre com horários, professor e contato
- ✅ Registro de presenças e faltas por aula
- 📝 Diário de aula com anotações por disciplina
- 🏆 Notas por unidade (U1, U2, U3) com soma automática
- 🎯 Atividades extracurriculares recorrentes
- 📆 Calendário de alertas e prazos
- 📊 Dashboard diário com aulas, atividades e eventos do dia

## Setup

### 1. Clone o repositório

```bash
git clone https://github.com/Allyson-edu/HIST-app.git
cd HIST-app
```

### 2. Instale as dependências

```bash
npm install
```

### 3. Configure as variáveis de ambiente

Copie o arquivo de exemplo e preencha com suas credenciais Supabase:

```bash
cp .env.example .env.local
```

```env
NEXT_PUBLIC_SUPABASE_URL=https://seu-projeto.supabase.co
NEXT_PUBLIC_SUPABASE_ANON_KEY=sua_anon_key
```

### 4. Configure o schema do Supabase

Execute o schema SQL no **SQL Editor** do Supabase Dashboard. O schema inclui as tabelas:
- `profiles` — dados do usuário
- `semesters` — semestres acadêmicos
- `subjects` — disciplinas
- `subject_meetings` — horários das aulas
- `attendance_records` — registros de presença
- `class_notes` — anotações de aula
- `grade_entries` — notas por unidade
- `recurring_activities` — atividades extracurriculares
- `calendar_events` — eventos e prazos

### 5. Execute o projeto

```bash
npm run dev
```

Acesse [http://localhost:3000](http://localhost:3000)

## Adicionando as 5 Disciplinas do Semestre 2025.2

Após criar sua conta e o primeiro semestre no app, você pode usar o arquivo `supabase/seed.sql` como referência para inserir as disciplinas manualmente pelo Supabase Dashboard, ou simplesmente cadastrá-las pela interface do app.

As disciplinas do semestre 2025.2 são:

| Disciplina | Dia | Horário |
|---|---|---|
| Educação Brasileira: Legislação, Organização e Políticas | Segunda | 18:30–20:10 |
| Fundamentos de Filosofia | Quarta | 18:30–20:10 |
| Geografia Física e Humana Geral | Sexta | 18:30–20:10 |
| História das Sociedades da Antiguidade Mediterrânea | Terça | 18:30–20:10 |
| Língua Brasileira de Sinais - LIBRAS | Quinta | 18:30–20:10 |

## Licença

MIT
