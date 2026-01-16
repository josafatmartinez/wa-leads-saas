import { supabaseAdmin } from './supabaseAdmin';

const MAX_ATTEMPTS = 5;

export async function ensureSlug(
  tenantId: string,
  phone: string,
  existingSlug?: string | null
): Promise<string> {
  if (existingSlug) return existingSlug;

  const digits = phone.replace(/\D/g, '');
  const last4 = digits.slice(-4) || '0000';
  const now = new Date();
  const base = `lead-${last4}-${String(now.getDate()).padStart(2, '0')}-${String(
    now.getMonth() + 1
  ).padStart(2, '0')}`;

  for (let i = 0; i < MAX_ATTEMPTS; i += 1) {
    const slug = i === 0 ? base : `${base}-${i + 1}`;
    const { data, error } = await supabaseAdmin
      .from('conversations')
      .select('id')
      .eq('tenant_id', tenantId)
      .eq('slug', slug)
      .limit(1)
      .maybeSingle();

    if (error) throw error;
    if (!data) return slug;
  }

  return `${base}-${Date.now()}`;
}
