import { useEffect } from "react";
import { useFetcher } from "react-router";
import { useForm } from "react-hook-form";
import { IconDeviceFloppy, IconTrash, IconKey } from "@tabler/icons-react";
import styles from "./account-settings.module.css";

type Props = {
  email: string;
  firstName: string;
  lastName: string;
};

interface ProfileForm {
  firstName: string;
  lastName: string;
  email: string;
}

interface PasswordForm {
  currentPassword: string;
  newPassword: string;
}

export function AccountSettings({ email, firstName, lastName }: Props) {
  const profileFetcher = useFetcher<{ ok: boolean; intent?: string; error?: string; message?: string }>();
  const passwordFetcher = useFetcher<{ ok: boolean; intent?: string; error?: string; message?: string }>();

  const profile = useForm<ProfileForm>({
    defaultValues: { firstName, lastName, email },
  });
  const password = useForm<PasswordForm>({
    defaultValues: { currentPassword: "", newPassword: "" },
  });

  useEffect(() => {
    profile.reset({ firstName, lastName, email });
  }, [firstName, lastName, email, profile]);

  const profileStatus = profileFetcher.data?.intent === "update-profile" ? profileFetcher.data : null;
  const passwordStatus = passwordFetcher.data?.intent === "change-password" ? passwordFetcher.data : null;

  return (
    <div className={styles.section}>
      <h3 className={styles.title}>Account Settings</h3>

      <profileFetcher.Form method="post" className={styles.form} onSubmit={profile.handleSubmit((data) => {
        profileFetcher.submit(
          { intent: "update-profile", firstName: data.firstName, lastName: data.lastName, email: data.email },
          { method: "post" }
        );
      })}>
        <input type="hidden" name="intent" value="update-profile" />
        <div className={styles.row}>
          <div className={styles.group}>
            <label className={styles.label}>First Name</label>
            <input className={styles.input} {...profile.register("firstName")} />
          </div>
          <div className={styles.group}>
            <label className={styles.label}>Last Name</label>
            <input className={styles.input} {...profile.register("lastName")} />
          </div>
        </div>
        <div className={styles.group}>
          <label className={styles.label}>Email Address</label>
          <input className={styles.input} type="email" {...profile.register("email")} />
        </div>
        <div className={styles.actions}>
          <button type="submit" className={styles.saveBtn} disabled={profileFetcher.state !== "idle"}>
            <IconDeviceFloppy size={15} />
            {profileFetcher.state !== "idle" ? "Saving..." : "Save Profile"}
          </button>
        </div>
        {profileStatus && (
          <p className={profileStatus.ok ? styles.success : styles.error}>
            {profileStatus.ok ? profileStatus.message : profileStatus.error}
          </p>
        )}
      </profileFetcher.Form>

      <hr className={styles.divider} />

      <passwordFetcher.Form method="post" className={styles.form} onSubmit={password.handleSubmit((data) => {
        passwordFetcher.submit(
          { intent: "change-password", currentPassword: data.currentPassword, newPassword: data.newPassword },
          { method: "post" }
        );
        password.reset();
      })}>
        <input type="hidden" name="intent" value="change-password" />
        <h4 className={styles.subhead}>
          <IconKey size={16} />
          Change Password
        </h4>
        <div className={styles.group}>
          <label className={styles.label}>Current Password</label>
          <input className={styles.input} type="password" placeholder="••••••••" {...password.register("currentPassword")} />
        </div>
        <div className={styles.group}>
          <label className={styles.label}>New Password</label>
          <input className={styles.input} type="password" placeholder="At least 8 characters" {...password.register("newPassword")} />
        </div>
        <div className={styles.actions}>
          <button type="submit" className={styles.saveBtn} disabled={passwordFetcher.state !== "idle"}>
            <IconDeviceFloppy size={15} />
            {passwordFetcher.state !== "idle" ? "Changing..." : "Change Password"}
          </button>
        </div>
        {passwordStatus && (
          <p className={passwordStatus.ok ? styles.success : styles.error}>
            {passwordStatus.ok ? passwordStatus.message : passwordStatus.error}
          </p>
        )}
      </passwordFetcher.Form>

      <hr className={styles.divider} />

      <div className={styles.dangerZone}>
        <div>
          <div className={styles.dangerTitle}>Delete Account</div>
          <div className={styles.dangerDesc}>Permanently delete your account and all associated data. This action cannot be undone.</div>
        </div>
        <button className={styles.deleteBtn} onClick={() => confirm("Are you sure? This cannot be undone.") && alert("Account deletion requested — contact support to complete.")}>
          <IconTrash size={15} />
          Delete Account
        </button>
      </div>
    </div>
  );
}
