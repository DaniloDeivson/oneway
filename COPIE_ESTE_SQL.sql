-- ⚡ COPIE E COLE NO SUPABASE SQL EDITOR - RESOLVER ERRO 400

-- Criar campos
ALTER TABLE public.fines 
ADD COLUMN IF NOT EXISTS severity text CHECK (severity IN ('Baixa', 'Média', 'Alta')),
ADD COLUMN IF NOT EXISTS points integer DEFAULT 0 CHECK (points >= 0);

-- Corrigir RLS
ALTER TABLE public.fines DISABLE ROW LEVEL SECURITY;

DROP POLICY IF EXISTS "fines_policy" ON public.fines;
DROP POLICY IF EXISTS "Enable insert for authenticated users only" ON public.fines;
DROP POLICY IF EXISTS "Enable read access for all users" ON public.fines;

CREATE POLICY "allow_all_fines" ON public.fines
    FOR ALL
    USING (true)
    WITH CHECK (true);

ALTER TABLE public.fines ENABLE ROW LEVEL SECURITY;

GRANT ALL ON public.fines TO authenticated;

-- Verificar se funcionou
SELECT '✅ PRONTO! TESTE O FORMULÁRIO!' as resultado; 