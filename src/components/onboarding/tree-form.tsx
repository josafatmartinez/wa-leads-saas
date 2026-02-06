"use client";

import { useRouter } from "next/navigation";
import { useState } from "react";

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

  if (hasNodesObject) {
    return rawTree;
  }

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

      if (type === "text" && typeof normalizedNode.next !== "string") {
        normalizedNode.next = "end";
      }

      acc[key] = normalizedNode;
      return acc;
    },
    {}
  );

  return { nodes };
}

export function TreeForm() {
  const router = useRouter();
  const [name, setName] = useState("Árbol principal");
  const [version, setVersion] = useState("1.0.0");
  const [treeJson, setTreeJson] = useState(JSON.stringify(DEFAULT_TREE, null, 2));
  const [isSaving, setIsSaving] = useState(false);
  const [message, setMessage] = useState<string | null>(null);

  const onSubmit = async (event: React.FormEvent<HTMLFormElement>) => {
    event.preventDefault();

    let tree: Record<string, unknown>;
    try {
      tree = normalizeTreePayload(JSON.parse(treeJson) as Record<string, unknown>);
    } catch {
      setMessage("El JSON del árbol no es válido.");
      return;
    }

    const nodes = tree.nodes;
    if (!nodes || typeof nodes !== "object" || Array.isArray(nodes)) {
      setMessage("El árbol debe incluir un objeto `nodes`.");
      return;
    }

    setIsSaving(true);
    setMessage(null);

    const response = await fetch("/api/tenant/tree", {
      method: "PUT",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ tree, name, version }),
    });

    const payload = await response.json().catch(() => ({}));
    if (!response.ok || !payload?.ok) {
      setMessage(payload?.error || payload?.message || "No se pudo guardar el árbol.");
      setIsSaving(false);
      return;
    }

    router.push("/dashboard/leads");
  };

  return (
    <form className="auth-card space-y-4" onSubmit={onSubmit}>
      <div className="field">
        <label className="text-sm font-semibold">Nombre del árbol</label>
        <input className="input" value={name} onChange={(event) => setName(event.target.value)} required />
      </div>

      <div className="field">
        <label className="text-sm font-semibold">Versión</label>
        <input className="input" value={version} onChange={(event) => setVersion(event.target.value)} />
      </div>

      <div className="field">
        <label className="text-sm font-semibold">Definición JSON</label>
        <textarea
          className="input min-h-[280px] font-mono text-xs"
          value={treeJson}
          onChange={(event) => setTreeJson(event.target.value)}
          required
        />
      </div>

      {message ? <p className="text-sm text-red-600">{message}</p> : null}

      <button className="btn btn--primary w-full" disabled={isSaving} type="submit">
        {isSaving ? "Guardando..." : "Finalizar onboarding"}
      </button>
    </form>
  );
}
