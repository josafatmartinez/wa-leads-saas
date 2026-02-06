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
  const currentLead = lead;
  const lastActivity = formatDate(currentLead.last_inbound_at || currentLead.created_at);

  async function updateLead(formData: FormData) {
    "use server";
    const status = formData.get("status") as string;
    const notes = (formData.get("notes") as string) || "";

    await updateLeadDetail(currentLead.slug, { status, notes });

    revalidatePath(`/dashboard/leads/${currentLead.slug}`);
  }

  return (
    <form className="grid gap-6" action={updateLead}>
      <section className="card">
        <div className="section-header">
          <div>
            <p className="section-kicker">Lead</p>
            <h1 className="section-title">{currentLead.customer_phone}</h1>
            <p className="section-description">Última actividad: {lastActivity}</p>
          </div>
          <div className="section-actions">
            <span className="badge badge--lavender">{currentLead.status}</span>
            <a
              className="btn btn--primary"
              href={`https://wa.me/${sanitizePhone(currentLead.customer_phone)}`}
              target="_blank"
              rel="noreferrer"
            >
              Abrir WhatsApp
            </a>
          </div>
        </div>
        <div className="mt-6 grid gap-4 md:grid-cols-2">
          <div className="card--subtle">
            <p className="section-kicker">Servicio</p>
            <p className="mt-2 text-sm font-semibold">{getAnswerValue(currentLead.answers, "service") || "Sin servicio"}</p>
          </div>
          <div className="card--subtle">
            <p className="section-kicker">Fecha</p>
            <p className="mt-2 text-sm font-semibold">
              {getAnswerValue(currentLead.answers, "date") ||
                formatDate(currentLead.last_inbound_at || currentLead.created_at)}
            </p>
          </div>
          <div className="card--subtle">
            <p className="section-kicker">Ciudad</p>
            <p className="mt-2 text-sm font-semibold">{getAnswerValue(currentLead.answers, "city") || "N/A"}</p>
          </div>
          <div className="card--subtle">
            <p className="section-kicker">Presupuesto</p>
            <p className="mt-2 text-sm font-semibold">{getAnswerValue(currentLead.answers, "budget") || "N/A"}</p>
          </div>
        </div>
      </section>

      <section className="card">
        <div className="grid gap-4 md:grid-cols-[1fr_2fr]">
          <div className="field">
            <label className="text-sm font-semibold">Status</label>
            <select name="status" className="select mt-2" defaultValue={currentLead.status}>
              {STATUS_OPTIONS.map((option) => (
                <option key={option} value={option}>
                  {option}
                </option>
              ))}
            </select>
          </div>
          <div className="field">
            <label className="text-sm font-semibold">Notas internas</label>
            <textarea
              name="notes"
              className="input mt-2 h-28 resize-none"
              defaultValue={getAnswerValue(currentLead.answers, "notes")}
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
