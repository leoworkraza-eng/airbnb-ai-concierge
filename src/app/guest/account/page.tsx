import { redirect } from "next/navigation";

export const dynamic = "force-dynamic";

/** Old account link kept as a redirect so every existing bookmark still works. */
export default function GuestAccountPage() {
  redirect("/guest/login");
}
