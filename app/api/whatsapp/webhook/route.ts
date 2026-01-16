import crypto from 'crypto';
import { NextRequest } from 'next/server';
import { supabaseAdmin } from '@/lib/supabaseAdmin';
import { ensureSlug } from '@/lib/slug';
import { sendButtons, sendList, sendText } from '@/lib/waSend';
import { tree, type TreeNode } from '@/bot/tree';

export const runtime = 'nodejs';

type TenantConfig = {
  tenant_id: string;
  phone_number_id: string;
  access_token: string;
  graph_version: string;
};

function verifySignature(raw: string, signature?: string | null) {
  const secret = process.env.META_APP_SECRET;
  if (!secret) return true;
  if (!signature) return false;

  const [scheme, hash] = signature.split('=');
  if (scheme !== 'sha256' || !hash) return false;

  const expected = crypto
    .createHmac('sha256', secret)
    .update(raw, 'utf8')
    .digest('hex');

  if (expected.length !== hash.length) return false;

  return crypto.timingSafeEqual(Buffer.from(hash, 'hex'), Buffer.from(expected, 'hex'));
}

function extractInput(msg: any): { id?: string; text?: string } {
  if (!msg) return {};
  if (msg.type === 'interactive') {
    const interactive = msg.interactive || {};
    if (interactive.button_reply) return { id: interactive.button_reply.id, text: interactive.button_reply.title };
    if (interactive.list_reply) return { id: interactive.list_reply.id, text: interactive.list_reply.title };
  }
  if (msg.type === 'button' && msg.button) {
    return { id: msg.button.payload || msg.button.text, text: msg.button.text };
  }
  if (msg.type === 'text' && msg.text) {
    return { text: msg.text.body?.trim() };
  }
  return {};
}

function pickTenantConfig(row?: Partial<TenantConfig> | null) {
  const accessToken = row?.access_token || process.env.WHATSAPP_ACCESS_TOKEN;
  if (!accessToken) throw new Error('Missing WhatsApp access token');

  return {
    tenantId: row?.tenant_id || 'default',
    accessToken,
    graphVersion: row?.graph_version || process.env.WHATSAPP_GRAPH_VERSION || 'v22.0',
  };
}

function nodeFromKey(key: string): TreeNode {
  return tree[key] || tree.start;
}

async function handleNode(
  currentKey: string,
  input: { id?: string; text?: string },
  answers: Record<string, unknown>
): Promise<{ nextKey: string; updatedAnswers: Record<string, unknown>; repeat: boolean }> {
  const node = nodeFromKey(currentKey);
  let nextKey = node.type === 'end' ? 'end' : node.type === 'text' ? node.next : 'start';
  let repeat = false;

  if (node.type === 'text') {
    if (node.saveAs && input.text) answers[node.saveAs] = input.text;
    nextKey = node.next;
  }

  if (node.type === 'buttons' || node.type === 'list') {
    const selectedId = input.id || input.text;
    const option = node.options.find((opt) => opt.id === selectedId);
    if (option) {
      if (node.saveAs) answers[node.saveAs] = option.title;
      nextKey = option.next;
    } else {
      repeat = true;
      nextKey = currentKey === 'start' ? 'start' : currentKey;
    }
  }

  if (node.type === 'end') {
    nextKey = 'end';
  }

  return { nextKey, updatedAnswers: answers, repeat };
}

async function sendNodePrompt(
  nodeKey: string,
  to: string,
  cfg: { accessToken: string; graphVersion: string; phoneNumberId: string }
) {
  const node = nodeFromKey(nodeKey);
  if (node.type === 'end') {
    await sendText({ ...cfg, to }, node.text);
    return;
  }

  if (node.type === 'text') {
    await sendText({ ...cfg, to }, node.text);
    return;
  }

  if (node.type === 'buttons') {
    await sendButtons({ ...cfg, to }, node.text, node.options);
    return;
  }

  if (node.type === 'list') {
    await sendList({ ...cfg, to }, node.text, node.options, node.buttonLabel, node.sectionTitle);
  }
}

export async function GET(req: NextRequest) {
  const search = req.nextUrl.searchParams;
  const mode = search.get('hub.mode');
  const token = search.get('hub.verify_token');
  const challenge = search.get('hub.challenge');

  if (mode === 'subscribe') {
    if (token && token === process.env.WHATSAPP_VERIFY_TOKEN) {
      return new Response(challenge || '', { status: 200 });
    }
    return new Response('Forbidden', { status: 403 });
  }

  return new Response('OK', { status: 200 });
}

export async function POST(req: NextRequest) {
  const rawBody = await req.text();
  const signature = req.headers.get('x-hub-signature-256');

  if (!verifySignature(rawBody, signature)) {
    return new Response('Invalid signature', { status: 401 });
  }

  try {
    const body: any = JSON.parse(rawBody);

    const value = body?.entry?.[0]?.changes?.[0]?.value;
    const msg = value?.messages?.[0];

    if (!msg) {
      return Response.json({ ok: true });
    }

    const from = msg.from as string;
    const messageId = msg.id as string | undefined;
    const phoneNumberId = value?.metadata?.phone_number_id as string | undefined;

    const { data: tenantRow, error: tenantError } = await supabaseAdmin
      .from('tenant_whatsapp')
      .select('*')
      .eq('phone_number_id', phoneNumberId || '')
      .limit(1)
      .maybeSingle();

    if (tenantError) {
      console.error('Failed to load tenant row', tenantError);
    }

    const tenantConfig = pickTenantConfig(tenantRow || undefined);
    const accessToken = tenantConfig.accessToken;
    const graphVersion = tenantConfig.graphVersion;
    const tenantId = tenantConfig.tenantId;

    if (messageId) {
      const { data: dedupe, error: dedupeError } = await supabaseAdmin
        .from('wa_inbound_dedupe')
        .select('id')
        .eq('id', messageId)
        .maybeSingle();

      if (dedupeError) {
        console.error('Failed dedupe lookup', dedupeError);
      }

      if (dedupe) {
        return Response.json({ ok: true });
      }

      const { error: insertDedupeError } = await supabaseAdmin
        .from('wa_inbound_dedupe')
        .insert({ id: messageId, tenant_id: tenantId });
      if (insertDedupeError) {
        console.error('Failed to insert dedupe', insertDedupeError);
      }
    }

    const { data: conversation, error: conversationError } = await supabaseAdmin
      .from('conversations')
      .select('id, current_node, answers, slug, handoff_to_human')
      .eq('tenant_id', tenantId)
      .eq('customer_phone', from)
      .limit(1)
      .maybeSingle();

    if (conversationError) {
      console.error('Failed to load conversation', conversationError);
    }

    if (conversation?.handoff_to_human) {
      return Response.json({ ok: true });
    }

    const currentNode = conversation?.current_node || 'start';
    const answers = (conversation?.answers as Record<string, unknown>) || {};
    const input = extractInput(msg);

    const { nextKey, updatedAnswers, repeat } = await handleNode(currentNode, input, { ...answers });
    const nextNode = nodeFromKey(nextKey);

    const slug = await ensureSlug(tenantId, from, conversation?.slug);

    const upsertPayload: Record<string, unknown> = {
      tenant_id: tenantId,
      customer_phone: from,
      current_node: nextKey,
      answers: updatedAnswers,
      last_inbound_at: new Date().toISOString(),
      updated_at: new Date().toISOString(),
      slug,
    };

    if (nextNode.type === 'end') {
      upsertPayload.handoff_to_human = true;
    }

    const { error: upsertError } = await supabaseAdmin
      .from('conversations')
      .upsert(upsertPayload, { onConflict: 'tenant_id,customer_phone' });

    if (upsertError) {
      console.error('Failed to upsert conversation', upsertError);
    }

    const sendCfg = {
      accessToken,
      graphVersion,
      phoneNumberId: phoneNumberId || tenantRow?.phone_number_id || '',
    };

    if (repeat) {
      await sendNodePrompt(currentNode, from, sendCfg);
    } else {
      await sendNodePrompt(nextKey, from, sendCfg);
    }

    return Response.json({ ok: true });
  } catch (err) {
    console.error('WhatsApp webhook error', err);
    return new Response('Server error', { status: 500 });
  }
}
