import { redirect } from "next/navigation";
import { defaultAdminRoute } from "@/config/navigation";

/** Dashboard deshabilitado temporalmente; redirige al módulo inicial. */
export default function DashboardPage() {
  redirect(defaultAdminRoute);
}
