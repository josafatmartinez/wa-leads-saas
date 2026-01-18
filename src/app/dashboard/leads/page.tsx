import Link from "next/link";

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

const MOCK_LEADS: LeadRow[] = [
  {
    id: "lead-001",
    customer_phone: "+52 55 1111 2222",
    slug: "lead-001",
    answers: { service: "Campanas Meta" },
    status: "new",
    handoff_to_human: false,
    updated_at: "2024-10-01T18:45:00.000Z",
  },
  {
    id: "lead-002",
    customer_phone: "+52 55 3333 4444",
    slug: "lead-002",
    answers: { service: "Automatizacion de ventas" },
    status: "contacted",
    handoff_to_human: true,
    updated_at: "2024-09-28T14:30:00.000Z",
  },
  {
    id: "lead-003",
    customer_phone: "+52 55 5555 6666",
    slug: "lead-003",
    answers: { service: "WhatsApp Business API" },
    status: "won",
    handoff_to_human: true,
    updated_at: "2024-09-25T09:15:00.000Z",
  },
];

export default function LeadsPage() {
  const leads = MOCK_LEADS;

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
