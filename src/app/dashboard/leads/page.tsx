import Link from "next/link";
import { getSupabaseServerClient } from "@/lib/supabase-server";

type LeadRow = {
  id: string;
  customer_phone: string;
  slug: string;
  answers: Record<string, unknown> | null;
  status: string;
  handoff_to_human: boolean;
  updated_at: string;
};

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
  const supabase = await getSupabaseServerClient();
  const { data, error } = await supabase
    .from("conversations")
    .select(
      "id, customer_phone, slug, answers, status, handoff_to_human, updated_at"
    )
    .eq("tenant_id", "default")
    .order("updated_at", { ascending: false })
    .limit(50);

  if (error) {
    throw new Error(error.message);
  }

  const leads = (data ?? []) as LeadRow[];

  return (
    <section className="card">
      <div className="flex items-center justify-between">
        <div>
          <p className="text-xs uppercase tracking-[0.4em] muted">Leads</p>
          <h1 className="mt-2 text-2xl font-semibold">Últimos leads</h1>
        </div>
        <span className="muted text-sm">{leads.length} registros</span>
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
            {leads.map((lead) => (
              <tr key={lead.id}>
                <td>
                  <Link
                    href={`/dashboard/leads/${lead.slug}`}
                    className="text-sm font-semibold"
                  >
                    {lead.customer_phone}
                  </Link>
                </td>
                <td className="muted text-sm">{getService(lead.answers)}</td>
                <td>
                  <span className="badge badge--lavender">{lead.status}</span>
                </td>
                <td className="text-sm">{lead.handoff_to_human ? "🧑‍💼" : "🤖"}</td>
                <td className="muted text-sm">{formatDate(lead.updated_at)}</td>
              </tr>
            ))}
          </tbody>
        </table>
      </div>
    </section>
  );
}
