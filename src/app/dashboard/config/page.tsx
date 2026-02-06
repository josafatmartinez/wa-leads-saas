import { ConfigStudio } from "@/components/config/config-studio";
import {
  fetchConfig,
  fetchTenantTreeStatus,
  fetchTenantWhatsappStatus,
} from "@/lib/server-api";

export default async function ConfigPage() {
  const [config, whatsappResult, treeResult] = await Promise.all([
    fetchConfig(),
    fetchTenantWhatsappStatus(),
    fetchTenantTreeStatus(),
  ]);

  return (
    <ConfigStudio
      initialConfig={config}
      initialWhatsapp={whatsappResult.whatsapp}
      initialTree={treeResult.tree}
    />
  );
}
