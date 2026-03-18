-- =============================================================
-- Hist2025.2 — Seed de Disciplinas do Semestre 2025.2
-- =============================================================
-- Execute APÓS criar sua conta e o primeiro semestre.
-- Substitua 'YOUR_USER_ID' e 'YOUR_SEMESTER_ID' pelos UUIDs reais.
-- Você pode obter esses valores no Supabase Dashboard > Table Editor.

-- Inserir as 5 disciplinas do semestre 2025.2
INSERT INTO public.subjects (user_id, semester_id, name, professor_contact_kind) VALUES
  ('YOUR_USER_ID', 'YOUR_SEMESTER_ID', 'EDUCAÇÃO BRASILEIRA: LEGISLAÇÃO, ORGANIZAÇÃO E POLÍTICAS', 'whatsapp'),
  ('YOUR_USER_ID', 'YOUR_SEMESTER_ID', 'FUNDAMENTOS DE FILOSOFIA', 'whatsapp'),
  ('YOUR_USER_ID', 'YOUR_SEMESTER_ID', 'GEOGRAFIA FÍSICA E HUMANA GERAL', 'whatsapp'),
  ('YOUR_USER_ID', 'YOUR_SEMESTER_ID', 'HISTÓRIA DAS SOCIEDADES DA ANTIGUIDADE MEDITERRÂNEA', 'whatsapp'),
  ('YOUR_USER_ID', 'YOUR_SEMESTER_ID', 'LÍNGUA BRASILEIRA DE SINAIS - LIBRAS', 'whatsapp');

-- Após inserir as disciplinas acima, pegue os IDs gerados e insira os horários:
-- Segunda: EDUCAÇÃO BRASILEIRA 18:30–20:10
-- Terça:   HISTÓRIA 18:30–20:10
-- Quarta:  FILOSOFIA 18:30–20:10
-- Quinta:  LIBRAS 18:30–20:10
-- Sexta:   GEOGRAFIA 18:30–20:10

-- Exemplo de inserção de horários (substitua SUBJECT_ID_X pelos IDs reais):
/*
INSERT INTO public.subject_meetings (user_id, subject_id, day_of_week, starts_at, ends_at) VALUES
  ('YOUR_USER_ID', 'SUBJECT_ID_EDUCACAO',  'monday',    '18:30', '20:10'),
  ('YOUR_USER_ID', 'SUBJECT_ID_HISTORIA',  'tuesday',   '18:30', '20:10'),
  ('YOUR_USER_ID', 'SUBJECT_ID_FILOSOFIA', 'wednesday', '18:30', '20:10'),
  ('YOUR_USER_ID', 'SUBJECT_ID_LIBRAS',    'thursday',  '18:30', '20:10'),
  ('YOUR_USER_ID', 'SUBJECT_ID_GEOGRAFIA', 'friday',    '18:30', '20:10');
*/
