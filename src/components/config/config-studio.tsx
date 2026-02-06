"use client";

import { useEffect, useMemo, useRef, useState } from "react";
import type { TenantConfig, TenantTreeStatus, TenantWhatsappStatus } from "@/lib/types/dashboard";

type ConfigStudioProps = {
  initialConfig: TenantConfig;
  initialWhatsapp: TenantWhatsappStatus;
  initialTree: TenantTreeStatus;
};

type SectionKey = "whatsapp" | "tree" | "bot";
type SaveState = "idle" | "saving" | "saved" | "error";

type SaveOrigin = "auto" | "manual";

const DEFAULT_TREE = {
  nodes: {
    start: {
      type: "text",
      body: "Hola, en que te puedo ayudar?",
      next: "end",
    },
    end: {
      type: "end",
      body: "Gracias por escribirnos.",
    },
  },
};

function normalizeTreePayload(rawTree: Record<string, unknown>) {
  const hasNodesObject =
    typeof rawTree.nodes === "object" && rawTree.nodes !== null && !Array.isArray(rawTree.nodes);

  if (hasNodesObject) return rawTree;

  const nodes = Object.entries(rawTree).reduce<Record<string, Record<string, unknown>>>(
    (acc, [key, value]) => {
      if (!value || typeof value !== "object" || Array.isArray(value)) return acc;

      const node = value as Record<string, unknown>;
      const type = typeof node.type === "string" ? node.type : "text";
      const body =
        typeof node.body === "string"
          ? node.body
          : typeof node.text === "string"
            ? node.text
            : "";

      const normalizedNode: Record<string, unknown> = {
        ...node,
        type,
        body,
      };
      delete normalizedNode.text;

      if ((type === "text" || type === "buttons" || type === "list") && typeof normalizedNode.next !== "string") {
        normalizedNode.next = "end";
      }

      if ((type === "buttons" || type === "list") && !Array.isArray(normalizedNode.options)) {
        normalizedNode.options = [{ label: "Opcion 1", next: "end" }];
      }

      acc[key] = normalizedNode;
      return acc;
    },
    {}
  );

  return { nodes };
}

function formatSavedAt(date: Date | null) {
  if (!date) return "Sin guardado reciente";
  return `Guardado ${date.toLocaleTimeString("es-MX", { hour: "2-digit", minute: "2-digit" })}`;
}

export function ConfigStudio({ initialConfig, initialWhatsapp, initialTree }: ConfigStudioProps) {
  const [activeSection, setActiveSection] = useState<SectionKey>("whatsapp");
  const [feedback, setFeedback] = useState<string | null>(null);
  const [feedbackType, setFeedbackType] = useState<"success" | "error">("success");

  const [saveState, setSaveState] = useState<Record<SectionKey, SaveState>>({
    whatsapp: "idle",
    tree: "idle",
    bot: "idle",
  });
  const [savedAt, setSavedAt] = useState<Record<SectionKey, Date | null>>({
    whatsapp: null,
    tree: null,
    bot: null,
  });
  const [dirty, setDirty] = useState<Record<SectionKey, boolean>>({
    whatsapp: false,
    tree: false,
    bot: false,
  });

  const [phoneNumberId, setPhoneNumberId] = useState(initialWhatsapp.phone_number_id || "");
  const [accessToken, setAccessToken] = useState("");
  const [verifyToken, setVerifyToken] = useState("");
  const [metaAppSecret, setMetaAppSecret] = useState("");
  const [whatsappConfigured, setWhatsappConfigured] = useState(initialWhatsapp.configured);

  const [treeName, setTreeName] = useState(initialTree.name || "Arbol principal");
  const [treeVersion, setTreeVersion] = useState(initialTree.version || "1.0.0");
  const [treeJson, setTreeJson] = useState(JSON.stringify(initialTree.tree || DEFAULT_TREE, null, 2));
  const [treeConfigured, setTreeConfigured] = useState(initialTree.configured);

  const [botEnabled, setBotEnabled] = useState(initialConfig.bot_enabled);
  const [welcomeText, setWelcomeText] = useState(initialConfig.welcome_text || "");
  const [closingText, setClosingText] = useState(initialConfig.closing_text || "");

  const initialized = useRef<Record<SectionKey, boolean>>({
    whatsapp: false,
    tree: false,
    bot: false,
  });
  const saveWhatsappRef = useRef<(origin: SaveOrigin) => Promise<boolean>>(async () => false);
  const saveTreeRef = useRef<(origin: SaveOrigin) => Promise<boolean>>(async () => false);
  const saveBotRef = useRef<(origin: SaveOrigin) => Promise<boolean>>(async () => false);

  const progress = useMemo(() => {
    const done = [whatsappConfigured, treeConfigured, true].filter(Boolean).length;
    return Math.round((done / 3) * 100);
  }, [treeConfigured, whatsappConfigured]);

  function markDirty(section: SectionKey) {
    setDirty((current) => ({ ...current, [section]: true }));
    setSaveState((current) => ({ ...current, [section]: current[section] === "saving" ? "saving" : "idle" }));
  }

  function setMessage(type: "success" | "error", message: string) {
    setFeedbackType(type);
    setFeedback(message);
  }

  function updateSaveSuccess(section: SectionKey) {
    const now = new Date();
    setDirty((current) => ({ ...current, [section]: false }));
    setSaveState((current) => ({ ...current, [section]: "saved" }));
    setSavedAt((current) => ({ ...current, [section]: now }));
  }

  function updateSaveError(section: SectionKey) {
    setSaveState((current) => ({ ...current, [section]: "error" }));
  }

  function setSectionSaving(section: SectionKey, value: boolean) {
    setSaveState((current) => ({ ...current, [section]: value ? "saving" : current[section] }));
  }

  async function saveWhatsapp(origin: SaveOrigin) {
    if (!phoneNumberId.trim()) {
      if (origin === "manual") setMessage("error", "Phone Number ID es requerido.");
      updateSaveError("whatsapp");
      return false;
    }

    setSectionSaving("whatsapp", true);
    if (origin === "manual") setFeedback(null);

    try {
      const response = await fetch("/api/tenant/whatsapp", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          phoneNumberId: phoneNumberId.trim(),
          accessToken: accessToken.trim() || undefined,
          verifyToken: verifyToken.trim() || undefined,
          metaAppSecret: metaAppSecret.trim() || undefined,
        }),
      });

      const payload = await response.json().catch(() => ({}));
      if (!response.ok || !payload?.ok) {
        const message = payload?.error || payload?.message || "No se pudo guardar WhatsApp.";
        if (origin === "manual") setMessage("error", message);
        updateSaveError("whatsapp");
        return false;
      }

      setWhatsappConfigured(Boolean(payload?.whatsapp?.configured));
      if (origin === "manual") {
        setMessage("success", "WhatsApp actualizado correctamente.");
      }
      updateSaveSuccess("whatsapp");
      return true;
    } finally {
      setSectionSaving("whatsapp", false);
    }
  }

  async function saveTree(origin: SaveOrigin) {
    let normalizedTree: Record<string, unknown>;
    try {
      normalizedTree = normalizeTreePayload(JSON.parse(treeJson) as Record<string, unknown>);
    } catch {
      if (origin === "manual") setMessage("error", "El JSON del arbol no es valido.");
      updateSaveError("tree");
      return false;
    }

    const nodes = normalizedTree.nodes;
    if (!nodes || typeof nodes !== "object" || Array.isArray(nodes)) {
      if (origin === "manual") setMessage("error", "El arbol debe incluir un objeto `nodes`.");
      updateSaveError("tree");
      return false;
    }

    setSectionSaving("tree", true);
    if (origin === "manual") setFeedback(null);

    try {
      const response = await fetch("/api/tenant/tree", {
        method: "PUT",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          tree: normalizedTree,
          name: treeName.trim() || "Arbol principal",
          version: treeVersion.trim() || "1.0.0",
        }),
      });

      const payload = await response.json().catch(() => ({}));
      if (!response.ok || !payload?.ok) {
        const message = payload?.error || payload?.message || "No se pudo guardar el arbol.";
        if (origin === "manual") setMessage("error", message);
        updateSaveError("tree");
        return false;
      }

      setTreeConfigured(Boolean(payload?.tree?.configured));
      if (origin === "manual") setMessage("success", "Arbol de decisiones actualizado.");
      updateSaveSuccess("tree");
      return true;
    } finally {
      setSectionSaving("tree", false);
    }
  }

  async function saveBot(origin: SaveOrigin) {
    setSectionSaving("bot", true);
    if (origin === "manual") setFeedback(null);

    try {
      const response = await fetch("/api/dashboard/config", {
        method: "PATCH",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          bot_enabled: botEnabled,
          welcome_text: welcomeText,
          closing_text: closingText,
        }),
      });

      const payload = await response.json().catch(() => ({}));
      if (!response.ok || !payload?.ok) {
        const message = payload?.error || payload?.message || "No se pudo guardar la configuracion.";
        if (origin === "manual") setMessage("error", message);
        updateSaveError("bot");
        return false;
      }

      if (origin === "manual") setMessage("success", "Configuracion del bot actualizada.");
      updateSaveSuccess("bot");
      return true;
    } finally {
      setSectionSaving("bot", false);
    }
  }

  saveWhatsappRef.current = saveWhatsapp;
  saveTreeRef.current = saveTree;
  saveBotRef.current = saveBot;

  function withDirtySetter<T>(section: SectionKey, setter: (value: T) => void) {
    return (value: T) => {
      setter(value);
      markDirty(section);
    };
  }

  function updateTreeNodes(mutator: (nodes: Record<string, Record<string, unknown>>) => void) {
    try {
      const parsed = normalizeTreePayload(JSON.parse(treeJson) as Record<string, unknown>);
      const currentNodes =
        typeof parsed.nodes === "object" && parsed.nodes !== null && !Array.isArray(parsed.nodes)
          ? ({ ...(parsed.nodes as Record<string, Record<string, unknown>>) } as Record<
              string,
              Record<string, unknown>
            >)
          : {};

      mutator(currentNodes);
      const nextTree = { ...parsed, nodes: currentNodes };
      setTreeJson(JSON.stringify(nextTree, null, 2));
      markDirty("tree");
      setMessage("success", "Plantilla aplicada al arbol. Se guardara automaticamente.");
    } catch {
      setMessage("error", "No se pudo aplicar la plantilla porque el JSON actual no es valido.");
    }
  }

  function addTemplateNode(type: "text" | "buttons" | "list" | "end") {
    const id = `node_${Date.now().toString(36)}`;

    updateTreeNodes((nodes) => {
      if (type === "text") {
        nodes[id] = { type: "text", body: "Nuevo mensaje", next: "end" };
        return;
      }

      if (type === "buttons") {
        nodes[id] = {
          type: "buttons",
          body: "Selecciona una opcion",
          options: [{ label: "Opcion 1", next: "end" }],
          next: "end",
        };
        return;
      }

      if (type === "list") {
        nodes[id] = {
          type: "list",
          body: "Elige una alternativa",
          options: [{ label: "Opcion A", next: "end" }],
          next: "end",
        };
        return;
      }

      nodes[id] = { type: "end", body: "Cierre de conversacion" };
    });
  }

  useEffect(() => {
    if (!initialized.current.whatsapp) {
      initialized.current.whatsapp = true;
      return;
    }
    markDirty("whatsapp");
  }, [phoneNumberId, accessToken, verifyToken, metaAppSecret]);

  useEffect(() => {
    if (!dirty.whatsapp || saveState.whatsapp === "saving") return;
    const timeout = setTimeout(() => {
      void saveWhatsappRef.current("auto");
    }, 900);
    return () => clearTimeout(timeout);
  }, [dirty.whatsapp, saveState.whatsapp, phoneNumberId, accessToken, verifyToken, metaAppSecret]);

  useEffect(() => {
    if (!initialized.current.tree) {
      initialized.current.tree = true;
      return;
    }
    markDirty("tree");
  }, [treeName, treeVersion, treeJson]);

  useEffect(() => {
    if (!dirty.tree || saveState.tree === "saving") return;
    const timeout = setTimeout(() => {
      void saveTreeRef.current("auto");
    }, 1200);
    return () => clearTimeout(timeout);
  }, [dirty.tree, saveState.tree, treeName, treeVersion, treeJson]);

  useEffect(() => {
    if (!initialized.current.bot) {
      initialized.current.bot = true;
      return;
    }
    markDirty("bot");
  }, [botEnabled, welcomeText, closingText]);

  useEffect(() => {
    if (!dirty.bot || saveState.bot === "saving") return;
    const timeout = setTimeout(() => {
      void saveBotRef.current("auto");
    }, 900);
    return () => clearTimeout(timeout);
  }, [dirty.bot, saveState.bot, botEnabled, welcomeText, closingText]);

  async function handleWhatsappSubmit(event: React.FormEvent<HTMLFormElement>) {
    event.preventDefault();
    const ok = await saveWhatsapp("manual");
    if (ok) setActiveSection("tree");
  }

  async function handleTreeSubmit(event: React.FormEvent<HTMLFormElement>) {
    event.preventDefault();
    const ok = await saveTree("manual");
    if (ok) setActiveSection("bot");
  }

  async function handleBotSubmit(event: React.FormEvent<HTMLFormElement>) {
    event.preventDefault();
    await saveBot("manual");
  }

  return (
    <section className="config-studio card">
      <div className="config-studio__header">
        <div>
          <p className="section-kicker">Centro de configuracion</p>
          <h1 className="section-title">Control de WhatsApp y automatizacion</h1>
          <p className="section-description">
            Gestiona credenciales, flujo conversacional y mensajes del bot desde un solo lugar.
          </p>
          <p className="config-autosave-note">Autosave activo: los cambios se guardan automaticamente.</p>
        </div>
        <div className="config-progress">
          <p className="text-xs font-semibold uppercase tracking-[0.22em] text-[var(--muted)]">Progreso</p>
          <p className="config-progress__value">{progress}%</p>
          <div className="config-progress__bar">
            <span style={{ width: `${progress}%` }} />
          </div>
        </div>
      </div>

      {feedback ? (
        <p className={`auth-alert ${feedbackType === "error" ? "auth-alert--error" : "auth-alert--success"}`}>
          {feedback}
        </p>
      ) : null}

      <div className="config-studio__grid">
        <aside className="config-nav">
          <button
            type="button"
            className={`config-nav__item ${activeSection === "whatsapp" ? "config-nav__item--active" : ""}`}
            onClick={() => setActiveSection("whatsapp")}
          >
            <span>WhatsApp</span>
            <span className={`badge ${whatsappConfigured ? "" : "badge--lavender"}`}>
              {saveState.whatsapp === "saving"
                ? "Guardando"
                : whatsappConfigured
                  ? "Listo"
                  : saveState.whatsapp === "error"
                    ? "Error"
                    : "Pendiente"}
            </span>
          </button>
          <p className="config-nav__meta">{formatSavedAt(savedAt.whatsapp)}</p>

          <button
            type="button"
            className={`config-nav__item ${activeSection === "tree" ? "config-nav__item--active" : ""}`}
            onClick={() => setActiveSection("tree")}
          >
            <span>Arbol de decisiones</span>
            <span className={`badge ${treeConfigured ? "" : "badge--lavender"}`}>
              {saveState.tree === "saving"
                ? "Guardando"
                : treeConfigured
                  ? "Listo"
                  : saveState.tree === "error"
                    ? "Error"
                    : "Pendiente"}
            </span>
          </button>
          <p className="config-nav__meta">{formatSavedAt(savedAt.tree)}</p>

          <button
            type="button"
            className={`config-nav__item ${activeSection === "bot" ? "config-nav__item--active" : ""}`}
            onClick={() => setActiveSection("bot")}
          >
            <span>Mensajeria del bot</span>
            <span className="badge">
              {saveState.bot === "saving" ? "Guardando" : saveState.bot === "error" ? "Error" : "Editable"}
            </span>
          </button>
          <p className="config-nav__meta">{formatSavedAt(savedAt.bot)}</p>
        </aside>

        <div className="config-panel">
          {activeSection === "whatsapp" ? (
            <form className="grid gap-4" onSubmit={handleWhatsappSubmit}>
              <div className="field">
                <label className="text-sm font-semibold">Phone Number ID</label>
                <input
                  className="input"
                  value={phoneNumberId}
                  onChange={(event) => withDirtySetter("whatsapp", setPhoneNumberId)(event.target.value)}
                  placeholder="15551230099"
                  required
                />
              </div>

              <div className="field">
                <label className="text-sm font-semibold">Access Token</label>
                <input
                  className="input"
                  value={accessToken}
                  onChange={(event) => withDirtySetter("whatsapp", setAccessToken)(event.target.value)}
                  placeholder="EAAG..."
                />
              </div>

              <div className="field">
                <label className="text-sm font-semibold">Verify Token</label>
                <input
                  className="input"
                  value={verifyToken}
                  onChange={(event) => withDirtySetter("whatsapp", setVerifyToken)(event.target.value)}
                  placeholder="mi-token-verificacion"
                />
              </div>

              <div className="field">
                <label className="text-sm font-semibold">Meta App Secret</label>
                <input
                  className="input"
                  value={metaAppSecret}
                  onChange={(event) => withDirtySetter("whatsapp", setMetaAppSecret)(event.target.value)}
                  placeholder="app-secret"
                />
              </div>

              <button className="btn btn--primary" type="submit" disabled={saveState.whatsapp === "saving"}>
                {saveState.whatsapp === "saving" ? "Guardando WhatsApp..." : "Guardar ahora"}
              </button>
            </form>
          ) : null}

          {activeSection === "tree" ? (
            <form className="grid gap-4" onSubmit={handleTreeSubmit}>
              <div className="grid grid--2">
                <div className="field">
                  <label className="text-sm font-semibold">Nombre del arbol</label>
                  <input
                    className="input"
                    value={treeName}
                    onChange={(event) => withDirtySetter("tree", setTreeName)(event.target.value)}
                  />
                </div>
                <div className="field">
                  <label className="text-sm font-semibold">Version</label>
                  <input
                    className="input"
                    value={treeVersion}
                    onChange={(event) => withDirtySetter("tree", setTreeVersion)(event.target.value)}
                  />
                </div>
              </div>

              <div className="config-tree-templates">
                <p className="config-tree-templates__title">Plantillas rapidas de nodos</p>
                <div className="config-tree-templates__actions">
                  <button type="button" className="btn btn--ghost" onClick={() => addTemplateNode("text")}>
                    + Texto
                  </button>
                  <button type="button" className="btn btn--ghost" onClick={() => addTemplateNode("buttons")}>
                    + Buttons
                  </button>
                  <button type="button" className="btn btn--ghost" onClick={() => addTemplateNode("list")}>
                    + List
                  </button>
                  <button type="button" className="btn btn--ghost" onClick={() => addTemplateNode("end")}>
                    + End
                  </button>
                </div>
              </div>

              <div className="field">
                <label className="text-sm font-semibold">Definicion JSON del arbol</label>
                <textarea
                  className="input config-tree-editor"
                  value={treeJson}
                  onChange={(event) => withDirtySetter("tree", setTreeJson)(event.target.value)}
                />
              </div>

              <button className="btn btn--primary" type="submit" disabled={saveState.tree === "saving"}>
                {saveState.tree === "saving" ? "Guardando arbol..." : "Guardar ahora"}
              </button>
            </form>
          ) : null}

          {activeSection === "bot" ? (
            <form className="grid gap-4" onSubmit={handleBotSubmit}>
              <label className="config-switch">
                <input
                  type="checkbox"
                  checked={botEnabled}
                  onChange={(event) => withDirtySetter("bot", setBotEnabled)(event.target.checked)}
                />
                <span className="config-switch__label">
                  <strong>Bot habilitado</strong>
                  <small>Activa respuestas automaticas en conversaciones nuevas.</small>
                </span>
              </label>

              <div className="field">
                <label className="text-sm font-semibold">Mensaje de bienvenida</label>
                <textarea
                  className="input h-24 resize-none"
                  value={welcomeText}
                  onChange={(event) => withDirtySetter("bot", setWelcomeText)(event.target.value)}
                />
              </div>

              <div className="field">
                <label className="text-sm font-semibold">Mensaje de cierre</label>
                <textarea
                  className="input h-24 resize-none"
                  value={closingText}
                  onChange={(event) => withDirtySetter("bot", setClosingText)(event.target.value)}
                />
              </div>

              <button className="btn btn--primary" type="submit" disabled={saveState.bot === "saving"}>
                {saveState.bot === "saving" ? "Guardando configuracion..." : "Guardar ahora"}
              </button>
            </form>
          ) : null}
        </div>
      </div>
    </section>
  );
}
