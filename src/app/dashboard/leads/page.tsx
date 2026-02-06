import Link from "next/link";
import { fetchLeads } from "@/lib/server-api";
import type { LeadRow } from "@/lib/types/dashboard";

function getService(answers: Record<string, unknown> | null) {
  return (answers?.service as string | undefined) || "Sin servicio";
}

function formatDate(value: string) {
  return new Date(value).toLocaleDateString("es-MX", {
    day: "2-digit",
    month: "short",
    year: "numeric",
  });
}

export default async function LeadsPage() {
  const leads = await fetchLeads();

  return (
    <section className="card">
      <div className="section-header">
        <div>
          <p className="section-kicker">Leads</p>
          <h1 className="section-title">Últimos leads</h1>
          <p className="section-description">
            Gestiona conversaciones activas y prioriza con base en el estado actual.
          </p>
        </div>
        <div className="section-actions">
          <span className="pill">{leads.length} registros</span>
        </div>
      </div>

      <div className="mt-6 overflow-x-auto">
        <table className="table">
          <thead>
            <tr>
              <th>Teléfono</th>
              <th>Servicio</th>
              <th>Status</th>
              <th>Handoff</th>
              <th>Última actividad</th>
            </tr>
          </thead>
          <tbody>
            {leads.map((lead: LeadRow) => (
              <tr key={lead.id}>
                <td>
                  <Link href={`/dashboard/leads/${lead.slug}`} className="text-sm font-semibold hover:underline">
                    {lead.customer_phone}
                  </Link>
                </td>
                <td className="muted text-sm">{getService(lead.answers)}</td>
                <td>
                  <span className="badge badge--lavender">{lead.status}</span>
                </td>
                <td className="text-sm">{lead.handoff_to_human ? "Humano" : "Bot"}</td>
                <td className="muted text-sm">{formatDate(lead.updated_at)}</td>
              </tr>
            ))}
          </tbody>
        </table>
      </div>
    </section>
  );
}
