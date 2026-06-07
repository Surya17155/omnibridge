import { useState } from "react";
import type { ActionFunctionArgs } from "react-router";
import { Form, useActionData, useNavigation, redirect } from "react-router";
import { IconBolt, IconMail, IconLock, IconEye, IconEyeOff } from "@tabler/icons-react";
import { createUser, getUserByEmail, verifyPassword, createSession } from "~/services/auth.server";
import styles from "./auth.module.css";

export async function action({ request }: ActionFunctionArgs) {
  const formData = await request.formData();
  const intent = formData.get("intent") as string;
  const email = formData.get("email") as string;
  const password = formData.get("password") as string;
  const firstName = formData.get("firstName") as string;
  const lastName = formData.get("lastName") as string;

  if (!email || !password) {
    return { error: "Email and password are required" };
  }

  if (intent === "signup") {
    const existing = await getUserByEmail(email);
    if (existing) {
      return { error: "Email already registered" };
    }
    const user = await createUser(email, password, firstName, lastName);
    if (!user) {
      return { error: "Failed to create account" };
    }
    const sessionId = await createSession(user.id);
    return redirect("/dashboard", {
      headers: {
        "Set-Cookie": `omnibridge-session=${sessionId}; Path=/; HttpOnly; SameSite=Lax; Max-Age=${7 * 24 * 60 * 60}`,
      },
    });
  }

  if (intent === "signin") {
    const user = await getUserByEmail(email);
    if (!user || !verifyPassword(password, user.password_hash)) {
      return { error: "Invalid email or password" };
    }
    const sessionId = await createSession(user.id);
    return redirect("/dashboard", {
      headers: {
        "Set-Cookie": `omnibridge-session=${sessionId}; Path=/; HttpOnly; SameSite=Lax; Max-Age=${7 * 24 * 60 * 60}`,
      },
    });
  }

  return { error: "Invalid intent" };
}

export default function AuthPage() {
  const actionData = useActionData<typeof action>();
  const navigation = useNavigation();
  const [mode, setMode] = useState<"signin" | "signup">("signin");
  const [showPassword, setShowPassword] = useState(false);
  const loading = navigation.state === "submitting";

  return (
    <div className={styles.page}>
      <div className={styles.card}>
        <div className={styles.logo}>
          <IconBolt size={28} />
          OmniBridge
        </div>
        <h1 className={styles.title}>
          {mode === "signin" ? "Welcome back" : "Create your account"}
        </h1>

        {actionData?.error && <p className={styles.error}>{actionData.error}</p>}

        <Form className={styles.form} method="post">
          <input type="hidden" name="intent" value={mode} />

          {mode === "signup" && (
            <div className={styles.row}>
              <div className={styles.group}>
                <label className={styles.label}>First Name</label>
                <input className={styles.input} type="text" name="firstName" placeholder="Alex" />
              </div>
              <div className={styles.group}>
                <label className={styles.label}>Last Name</label>
                <input className={styles.input} type="text" name="lastName" placeholder="Chen" />
              </div>
            </div>
          )}

          <div className={styles.group}>
            <label className={styles.label}>Email</label>
            <div className={styles.inputWrap}>
              <IconMail size={16} />
              <input
                className={styles.input}
                type="email"
                name="email"
                placeholder="you@example.com"
                required
              />
            </div>
          </div>

          <div className={styles.group}>
            <label className={styles.label}>Password</label>
            <div className={styles.inputWrap}>
              <IconLock size={16} />
              <input
                className={styles.input}
                type={showPassword ? "text" : "password"}
                name="password"
                placeholder="••••••••"
                required
              />
              <button
                type="button"
                className={styles.eyeBtn}
                onClick={() => setShowPassword((p) => !p)}
              >
                {showPassword ? <IconEyeOff size={16} /> : <IconEye size={16} />}
              </button>
            </div>
          </div>

          <button type="submit" className={styles.submitBtn} disabled={loading}>
            {loading ? "Please wait..." : mode === "signin" ? "Sign In" : "Create Account"}
          </button>
        </Form>

        <p className={styles.switch}>
          {mode === "signin" ? (
            <>
              Don't have an account?{" "}
              <button className={styles.linkBtn} onClick={() => setMode("signup")}>
                Sign up
              </button>
            </>
          ) : (
            <>
              Already have an account?{" "}
              <button className={styles.linkBtn} onClick={() => setMode("signin")}>
                Sign in
              </button>
            </>
          )}
        </p>
      </div>
    </div>
  );
}
