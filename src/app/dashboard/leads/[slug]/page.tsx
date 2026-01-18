type LeadDetailPageProps = {
  params: Promise<{ slug: string }>;
};

type LeadRecord = {
  id: string;
  customer_phone: string;
  slug: string;
  answers: Record<string, unknown> | null;
  status: string;
  last_inbound_at: string | null;
  created_at: string;
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

const MOCK_LEADS: LeadRecord[] = [
  {
    id: "lead-001",
    customer_phone: "+52 55 1111 2222",
    slug: "lead-001",
    answers: {
      service: "Campanas Meta",
      date: "Oct 01, 2024",
      city: "Ciudad de Mexico",
      budget: "$25,000 MXN",
      notes: "Interesado en optimizar conversiones.",
    },
    status: "new",
    last_inbound_at: "2024-10-01T18:45:00.000Z",
    created_at: "2024-09-30T15:00:00.000Z",
  },
  {
    id: "lead-002",
    customer_phone: "+52 55 3333 4444",
    slug: "lead-002",
    answers: {
      service: "Automatizacion de ventas",
      date: "Sep 28, 2024",
      city: "Guadalajara",
      budget: "$18,000 MXN",
      notes: "Solicita demo antes de decidir.",
    },
    status: "contacted",
    last_inbound_at: "2024-09-28T14:30:00.000Z",
    created_at: "2024-09-27T10:00:00.000Z",
  },
  {
    id: "lead-003",
    customer_phone: "+52 55 5555 6666",
    slug: "lead-003",
    answers: {
      service: "WhatsApp Business API",
      date: "Sep 25, 2024",
      city: "Monterrey",
      budget: "$40,000 MXN",
      notes: "Equipo listo para iniciar este mes.",
    },
    status: "won",
    last_inbound_at: "2024-09-25T09:15:00.000Z",
    created_at: "2024-09-20T12:00:00.000Z",
  },
];

export default async function LeadDetailPage({ params }: LeadDetailPageProps) {
  const { slug } = await params;
  const lead =
    MOCK_LEADS.find((item) => item.slug === slug) ??
    ({
      id: "lead-unknown",
      customer_phone: "+52 55 0000 0000",
      slug,
      answers: null,
      status: "new",
      last_inbound_at: null,
      created_at: new Date().toISOString(),
    } satisfies LeadRecord);

  return (
    <form className="grid gap-6">
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

        <button className="btn btn--secondary mt-6" type="button">
          Guardar cambios
        </button>
      </section>
    </form>
  );
}
