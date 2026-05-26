import { redirect } from "next/navigation";
import { defaultAdminRoute } from "@/config/navigation";

export default function HomePage() {
  redirect(defaultAdminRoute);
}
