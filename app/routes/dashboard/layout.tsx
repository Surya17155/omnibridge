import { Outlet, useLoaderData } from "react-router";
import type { LoaderFunctionArgs } from "react-router";
import { NavigationBar } from "~/blocks/__global/navigation-bar";
import { Footer } from "~/blocks/__global/footer";
import { requireAuth } from "~/services/session.server";
import type { AuthUser } from "~/services/session.server";

export async function loader({ request }: LoaderFunctionArgs) {
  const user = await requireAuth(request);
  return { user };
}

interface LoaderData {
  user: AuthUser;
}

export default function DashboardLayout() {
  const { user } = useLoaderData<LoaderData>();

  return (
    <>
      <NavigationBar user={user} />
      <Outlet />
      <Footer />
    </>
  );
}
