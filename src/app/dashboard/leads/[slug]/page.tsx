import { revalidatePath } from "next/cache";
import { fetchLeadDetail, updateLeadDetail } from "@/lib/server-api";
import type { LeadDetail } from "@/lib/types/dashboard";

type LeadDetailPageProps = {
  params: { slug: string };
};

const STATUS_OPTIONS = ["new", "contacted", "won", "lost"] as const;

function getAnswerValue(answers: Record<string, unknown> | null, key: string) {
  const value = answers?.[key];
  if (typeof value === "string") return value;
  return "";
}

function formatDate(value: string | null) {
  if (!value) return "N/A";
  return new Date(value).toLocaleDateString("es-MX", {
    day: "2-digit",
    month: "short",
    year: "numeric",
  });
}

function sanitizePhone(phone: string) {
  return phone.replace(/\D/g, "");
}

export default async function LeadDetailPage({ params }: LeadDetailPageProps) {
  const lead = (await fetchLeadDetail(params.slug)) as LeadDetail | null;
  if (!lead) {
    throw new Error("Lead no encontrado.");
  }

  async function updateLead(formData: FormData) {
    "use server";
    const status = formData.get("status") as string;
    const notes = (formData.get("notes") as string) || "";

    await updateLeadDetail(lead.slug, { status, notes });

    revalidatePath(`/dashboard/leads/${lead.slug}`);
  }

  return (
    <form className="grid gap-6" action={updateLead}>
      <section className="card">
        <div className="flex items-center justify-between">
          <div>
            <p className="text-xs uppercase tracking-[0.4em] muted">Lead</p>
            <h1 className="mt-2 text-2xl font-semibold">{lead.customer_phone}</h1>
          </div>
          <a
            className="btn btn--primary"
            href={`https://wa.me/${sanitizePhone(lead.customer_phone)}`}
            target="_blank"
            rel="noreferrer"
          >
            Open WhatsApp
          </a>
        </div>
        <div className="mt-6 grid gap-4 md:grid-cols-2">
          <div className="card--subtle">
            <p className="text-xs uppercase tracking-[0.3em] muted">Servicio</p>
            <p className="mt-2 text-sm font-semibold">
              {getAnswerValue(lead.answers, "service") || "Sin servicio"}
            </p>
          </div>
          <div className="card--subtle">
            <p className="text-xs uppercase tracking-[0.3em] muted">Fecha</p>
            <p className="mt-2 text-sm font-semibold">
              {getAnswerValue(lead.answers, "date") ||
                formatDate(lead.last_inbound_at || lead.created_at)}
            </p>
          </div>
          <div className="card--subtle">
            <p className="text-xs uppercase tracking-[0.3em] muted">Ciudad</p>
            <p className="mt-2 text-sm font-semibold">
              {getAnswerValue(lead.answers, "city") || "N/A"}
            </p>
          </div>
          <div className="card--subtle">
            <p className="text-xs uppercase tracking-[0.3em] muted">Presupuesto</p>
            <p className="mt-2 text-sm font-semibold">
              {getAnswerValue(lead.answers, "budget") || "N/A"}
            </p>
          </div>
        </div>
      </section>

      <section className="card">
        <div className="grid gap-4 md:grid-cols-[1fr_2fr]">
          <div>
            <label className="text-sm font-semibold">Status</label>
            <select
              name="status"
              className="select mt-2"
              defaultValue={lead.status}
            >
              {STATUS_OPTIONS.map((option) => (
                <option key={option} value={option}>
                  {option}
                </option>
              ))}
            </select>
          </div>
          <div>
            <label className="text-sm font-semibold">Notas internas</label>
            <textarea
              name="notes"
              className="input mt-2 h-28 resize-none"
              defaultValue={getAnswerValue(lead.answers, "notes")}
              placeholder="Notas para el equipo comercial."
            />
          </div>
        </div>

        <button className="btn btn--secondary mt-6" type="submit">
          Guardar cambios
        </button>
      </section>
    </form>
  );
}
