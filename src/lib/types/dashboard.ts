export type LeadRow = {
  id: string;
  customer_phone: string;
  slug: string;
  answers: Record<string, unknown> | null;
  status: string;
  handoff_to_human: boolean;
  updated_at: string;
};

export type LeadDetail = {
  id: string;
  customer_phone: string;
  slug: string;
  answers: Record<string, unknown> | null;
  status: string;
  last_inbound_at: string | null;
  created_at: string;
};

export type TenantConfig = {
  tenant_id: string;
  bot_enabled: boolean;
  welcome_text: string | null;
  closing_text: string | null;
};

export type SessionUser = {
  id: string;
  email?: string | null;
  phone?: string | null;
  role?: string | null;
  created_at?: string | null;
  last_sign_in_at?: string | null;
  email_confirmed_at?: string | null;
  phone_confirmed_at?: string | null;
  app_metadata?: Record<string, unknown> | null;
  user_metadata?: Record<string, unknown> | null;
  identities?: Array<Record<string, unknown>>;
};

export type SessionResponse =
  | { ok: true; user: SessionUser }
  | { ok: false; error?: string };
