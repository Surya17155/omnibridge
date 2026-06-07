import { useNavigation } from "react-router";
import { Loader } from "~/components/ui/loader";
import styles from "./route-loading-indicator.module.css";

/**
 * Shows a small floating gradient loader while the router transitions
 * between pages.
 */
export function RouteLoadingIndicator() {
  const navigation = useNavigation();
  if (navigation.state === "idle") return null;

  return (
    <div className={styles.wrap} role="status" aria-live="polite">
      <Loader size={64} text="••••••" />
    </div>
  );
}
