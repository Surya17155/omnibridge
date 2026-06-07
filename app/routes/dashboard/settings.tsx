import { useLoaderData, useFetcher } from "react-router";
import type { ActionFunctionArgs, LoaderFunctionArgs } from "react-router";
import { AccountSettings } from "~/blocks/settings/account-settings";
import { RotationLogic } from "~/blocks/settings/rotation-logic";
import { NotificationPreferences } from "~/blocks/settings/notification-preferences";
import { SecuritySettings } from "~/blocks/settings/security-settings";
import { Reveal } from "~/components/ui/reveal";
import { requireAuth } from "~/services/session.server";
import { getUserById, updateUserProfile, updateUserPassword } from "~/services/auth.server";
import { getUserSettings, updateRotationStrategy, updateNotification } from "~/services/settings.server";
import styles from "./settings.module.css";

export async function loader({ request }: LoaderFunctionArgs) {
  const user = await requireAuth(request);
  const fullUser = await getUserById(user.id);
  const settings = await getUserSettings(user.id);
  return {
    user: {
      email: fullUser?.email ?? user.email,
      firstName: fullUser?.first_name ?? "",
      lastName: fullUser?.last_name ?? "",
    },
    settings,
  };
}

export async function action({ request }: ActionFunctionArgs) {
  const user = await requireAuth(request);
  const formData = await request.formData();
  const intent = formData.get("intent") as string;

  if (intent === "update-profile") {
    const firstName = (formData.get("firstName") as string) ?? "";
    const lastName = (formData.get("lastName") as string) ?? "";
    const email = (formData.get("email") as string) ?? "";
    if (!email || !email.includes("@")) {
      return { ok: false, intent, error: "Valid email is required" };
    }
    const ok = await updateUserProfile(user.id, { firstName, lastName, email });
    return { ok, intent, message: ok ? "Profile updated" : "Update failed" };
  }

  if (intent === "change-password") {
    const current = (formData.get("currentPassword") as string) ?? "";
    const next = (formData.get("newPassword") as string) ?? "";
    if (!current || !next) {
      return { ok: false, intent, error: "Both password fields are required" };
    }
    const result = await updateUserPassword(user.id, current, next);
    if (!result.ok) {
      return { ok: false, intent, error: result.error ?? "Password change failed" };
    }
    return { ok: true, intent, message: "Password changed successfully" };
  }

  if (intent === "update-rotation") {
    const strategy = (formData.get("strategy") as string) ?? "round-robin";
    const maxRetries = parseInt((formData.get("maxRetries") as string) || "3", 10);
    const quotaThreshold = parseInt((formData.get("quotaThreshold") as string) || "10", 10);
    const cooldownSeconds = parseInt((formData.get("cooldownSeconds") as string) || "60", 10);
    const maxLatencyMs = parseInt((formData.get("maxLatencyMs") as string) || "2000", 10);
    const ok = await updateRotationStrategy(user.id, strategy as any, {
      maxRetries,
      quotaThreshold,
      cooldownSeconds,
      maxLatencyMs,
    });
    return { ok, intent, message: ok ? "Rotation rules saved" : "Save failed" };
  }

  if (intent === "update-notifications") {
    const key = (formData.get("key") as string) ?? "";
    const channels = (formData.getAll("channels") as string[]) ?? [];
    const allowed: Array<"Email" | "In-App"> = ["Email", "In-App"];
    const filtered = channels.filter((c): c is "Email" | "In-App" => allowed.includes(c as any));
    const validKeys = ["quota-low", "quota-empty", "system-error", "maintenance", "key-added"];
    if (!validKeys.includes(key)) {
      return { ok: false, intent, error: "Invalid notification key" };
    }
    const ok = await updateNotification(user.id, key as any, filtered);
    return { ok, intent, message: ok ? "Notification preferences saved" : "Save failed" };
  }

  return { ok: false, intent, error: "Invalid intent" };
}

export default function Settings() {
  const { user, settings } = useLoaderData<typeof loader>();

  return (
    <div className={styles.page}>
      <Reveal direction="none">
        <h1 className={styles.pageTitle}>Settings</h1>
        <p className={styles.pageSubtitle}>Manage your account, rotation behavior, and security preferences</p>
      </Reveal>

      <Reveal delay={60}>
        <AccountSettings
          email={user.email}
          firstName={user.firstName ?? ""}
          lastName={user.lastName ?? ""}
        />
      </Reveal>
      <Reveal delay={100}>
        <RotationLogic
          strategy={settings.rotationStrategy}
          maxRetries={settings.maxRetries}
          quotaThreshold={settings.quotaThreshold}
          cooldownSeconds={settings.cooldownSeconds}
          maxLatencyMs={settings.maxLatencyMs}
        />
      </Reveal>
      <Reveal delay={140}>
        <NotificationPreferences notifications={settings.notifications} />
      </Reveal>
      <Reveal delay={180}>
        <SecuritySettings />
      </Reveal>
    </div>
  );
}
