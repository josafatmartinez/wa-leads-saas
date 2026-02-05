import { revalidatePath } from "next/cache";
import { fetchConfig, updateConfig as sendConfigUpdate } from "@/lib/server-api";

export default async function ConfigPage() {
  const config = await fetchConfig();

  async function updateConfig(formData: FormData) {
    "use server";
    const botEnabled = formData.get("bot_enabled") === "on";
    const welcomeText = (formData.get("welcome_text") as string) || "";
    const closingText = (formData.get("closing_text") as string) || "";

    await sendConfigUpdate({
      bot_enabled: botEnabled,
      welcome_text: welcomeText,
      closing_text: closingText,
    });

    revalidatePath("/dashboard/config");
  }

  return (
    <form className="grid gap-6" action={updateConfig}>
      <section className="card">
        <div>
          <p className="text-xs uppercase tracking-[0.4em] muted">Configuración</p>
          <h1 className="mt-2 text-2xl font-semibold">Bot de WhatsApp</h1>
        </div>

        <div className="mt-6 grid gap-4">
          <label className="flex items-center gap-3">
            <input
              type="checkbox"
              name="bot_enabled"
              defaultChecked={config.bot_enabled}
            />
            <span className="text-sm font-semibold">Bot habilitado</span>
          </label>

          <div>
            <label className="text-sm font-semibold">Welcome text</label>
            <textarea
              name="welcome_text"
              className="input mt-2 h-24 resize-none"
              defaultValue={config.welcome_text ?? ""}
            />
          </div>

          <div>
            <label className="text-sm font-semibold">Closing text</label>
            <textarea
              name="closing_text"
              className="input mt-2 h-24 resize-none"
              defaultValue={config.closing_text ?? ""}
            />
          </div>

          <div className="card--subtle">
            <p className="text-xs uppercase tracking-[0.3em] muted">
              WhatsApp conectado
            </p>
            <p className="mt-2 text-sm font-semibold">+52 55 0000 0000</p>
          </div>
        </div>

        <button className="btn btn--primary mt-6" type="submit">
          Guardar configuración
        </button>
      </section>
    </form>
  );
}
