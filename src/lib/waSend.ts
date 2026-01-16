type SendConfig = {
  accessToken: string;
  graphVersion: string;
  phoneNumberId: string;
  to: string;
};

async function postMessage(config: SendConfig, payload: Record<string, unknown>) {
  const { accessToken, graphVersion, phoneNumberId } = config;
  const res = await fetch(
    `https://graph.facebook.com/${graphVersion}/${phoneNumberId}/messages`,
    {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        Authorization: `Bearer ${accessToken}`,
      },
      body: JSON.stringify({ messaging_product: 'whatsapp', ...payload }),
    }
  );

  if (!res.ok) {
    const text = await res.text();
    console.error('WhatsApp send failed', res.status, text);
  }
}

export async function sendText(
  config: SendConfig,
  text: string
): Promise<void> {
  await postMessage(config, {
    to: config.to,
    text: { body: text },
  });
}

type Option = { id: string; title: string; next?: string };

export async function sendList(
  config: SendConfig,
  text: string,
  options: Option[],
  buttonLabel = 'Choose',
  sectionTitle = 'Options'
): Promise<void> {
  await postMessage(config, {
    to: config.to,
    type: 'interactive',
    interactive: {
      type: 'list',
      body: { text },
      action: {
        button: buttonLabel,
        sections: [
          {
            title: sectionTitle,
            rows: options.map((opt) => ({ id: opt.id, title: opt.title })),
          },
        ],
      },
    },
  });
}

export async function sendButtons(
  config: SendConfig,
  text: string,
  options: Option[]
): Promise<void> {
  await postMessage(config, {
    to: config.to,
    type: 'interactive',
    interactive: {
      type: 'button',
      body: { text },
      action: {
        buttons: options.map((opt) => ({
          type: 'reply',
          reply: { id: opt.id, title: opt.title },
        })),
      },
    },
  });
}
