import { useState } from "react";
import { useLoaderData } from "react-router";
import type { ActionFunctionArgs, LoaderFunctionArgs } from "react-router";
import { ProviderSelection } from "~/blocks/key-management/provider-selection";
import { AddKeyForm } from "~/blocks/key-management/add-key-form";
import { KeysList } from "~/blocks/key-management/keys-list";
import { BulkActions } from "~/blocks/key-management/bulk-actions";
import { Reveal } from "~/components/ui/reveal";
import { type Provider } from "~/data/mock-data";
import { requireAuth } from "~/services/session.server";
import { getProviderKeys, addProviderKey, deleteProviderKey, type ProviderKey } from "~/services/auth.server";
import styles from "./key-management.module.css";

export async function loader({ request }: LoaderFunctionArgs) {
  const user = await requireAuth(request);
  const keys = await getProviderKeys(user.id);
  return { keys };
}

export async function action({ request }: ActionFunctionArgs) {
  const user = await requireAuth(request);
  const formData = await request.formData();
  const intent = formData.get("intent") as string;

  if (intent === "add") {
    const provider = formData.get("provider") as string;
    const label = formData.get("label") as string;
    const keyValue = formData.get("apiKey") as string;
    const quotaTotal = parseInt(formData.get("quotaTotal") as string || "1000", 10);

    if (!provider || !keyValue) {
      return { error: "Provider and API key are required", status: 400 };
    }

    const key = await addProviderKey(user.id, provider, label || `${provider} Key`, keyValue, quotaTotal);
    if (!key) {
      return { error: "Failed to add key", status: 500 };
    }
    return { key };
  }

  if (intent === "delete") {
    const keyId = parseInt(formData.get("keyId") as string, 10);
    if (!keyId) {
      return { error: "Key ID required", status: 400 };
    }
    const deleted = await deleteProviderKey(keyId, user.id);
    if (!deleted) {
      return { error: "Failed to delete key", status: 500 };
    }
    return { success: true };
  }

  return { error: "Invalid intent", status: 400 };
}

export default function KeyManagement() {
  const { keys } = useLoaderData<{ keys: ProviderKey[] }>();
  const [selectedProvider, setSelectedProvider] = useState<Provider | "All">("All");

  return (
    <div className={styles.page}>
      <Reveal direction="none">
        <h1 className={styles.pageTitle}>Key Management</h1>
        <p className={styles.pageSubtitle}>Add, organize, and monitor API keys from all your AI providers</p>
      </Reveal>

      <Reveal delay={60}>
        <ProviderSelection selected={selectedProvider} onChange={setSelectedProvider} keys={keys} />
      </Reveal>
      <Reveal delay={100}>
        <AddKeyForm provider={selectedProvider} />
      </Reveal>
      <Reveal delay={140}>
        <KeysList provider={selectedProvider} />
      </Reveal>
      <Reveal delay={180}>
        <BulkActions />
      </Reveal>
    </div>
  );
}