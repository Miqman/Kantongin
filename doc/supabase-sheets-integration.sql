-- Google Sheets Integration Table
CREATE TABLE IF NOT EXISTS public.user_integrations (
  id UUID DEFAULT gen_random_uuid() PRIMARY KEY,
  user_id UUID NOT NULL REFERENCES auth.users(id) ON DELETE CASCADE,
  provider TEXT NOT NULL DEFAULT 'google_sheets',
  access_token TEXT,
  refresh_token TEXT,
  token_expires_at TIMESTAMPTZ,
  spreadsheet_id TEXT,
  last_synced_at TIMESTAMPTZ,
  is_active BOOLEAN DEFAULT true,
  created_at TIMESTAMPTZ DEFAULT now(),
  
  UNIQUE(user_id, provider)
);

-- RLS Policies
ALTER TABLE public.user_integrations ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Users can view own integrations"
  ON public.user_integrations FOR SELECT
  USING (auth.uid() = user_id);

CREATE POLICY "Users can insert own integrations"
  ON public.user_integrations FOR INSERT
  WITH CHECK (auth.uid() = user_id);

CREATE POLICY "Users can update own integrations"
  ON public.user_integrations FOR UPDATE
  USING (auth.uid() = user_id);

CREATE POLICY "Users can delete own integrations"
  ON public.user_integrations FOR DELETE
  USING (auth.uid() = user_id);
