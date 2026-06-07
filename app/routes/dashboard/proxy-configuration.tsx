import type { ActionFunctionArgs, LoaderFunctionArgs } from "react-router";
import { UnifiedKeyGenerator } from "~/blocks/proxy-configuration/unified-key-generator";
import { EndpointConfiguration } from "~/blocks/proxy-configuration/endpoint-configuration";
import { RoutingPreferences } from "~/blocks/proxy-configuration/routing-preferences";
import { IntegrationGuide } from "~/blocks/proxy-configuration/integration-guide";
import { Reveal } from "~/components/ui/reveal";
import { requireAuth } from "~/services/session.server";
import { getOmniKey, createOmniKey, deleteOmniKey, getProviderKeys, type OmniKey } from "~/services/auth.server";
import styles from "./proxy-configuration.module.css";

export async function loader({ request }: LoaderFunctionArgs) {
  const user = await requireAuth(request);
  const omniKey = await getOmniKey(user.id);
  const providerKeys = await getProviderKeys(user.id);
  return { omniKey, providerKeys };
}

export async function action({ request }: ActionFunctionArgs) {
  const user = await requireAuth(request);
  const formData = await request.formData();
  const intent = formData.get("intent") as string;

  if (intent === "generate") {
    const providerKeys = await getProviderKeys(user.id);
    if (providerKeys.length === 0) {
      return { error: "Add at least one provider key before generating a unified key", status: 400 };
    }

    await deleteOmniKey(user.id);

    const key = await createOmniKey(user.id);
    if (!key) {
      return { error: "Failed to generate unified key", status: 500 };
    }
    return { omniKey: key };
  }

  if (intent === "regenerate") {
    const providerKeys = await getProviderKeys(user.id);
    if (providerKeys.length === 0) {
      return { error: "Add at least one provider key before regenerating a unified key", status: 400 };
    }

    await deleteOmniKey(user.id);
    const key = await createOmniKey(user.id);
    if (!key) {
      return { error: "Failed to regenerate unified key", status: 500 };
    }
    return { omniKey: key };
  }

  return { error: "Invalid intent", status: 400 };
}

export default function ProxyConfiguration() {
  return (
    <div className={styles.page}>
      <Reveal direction="none">
        <h1 className={styles.pageTitle}>Proxy Configuration</h1>
        <p className={styles.pageSubtitle}>Generate your unified API key and configure request routing</p>
      </Reveal>

      <Reveal delay={60}>
        <UnifiedKeyGenerator />
      </Reveal>
      <Reveal delay={100}>
        <EndpointConfiguration />
      </Reveal>
      <Reveal delay={140}>
        <RoutingPreferences />
      </Reveal>
      <Reveal delay={180}>
        <IntegrationGuide />
      </Reveal>
    </div>
  );
}