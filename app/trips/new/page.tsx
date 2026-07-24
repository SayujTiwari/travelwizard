import { auth } from "@/auth";
import NewTripForm from "@/components/new-trip-form";
import { redirect } from "next/navigation";
import { isAuthConfigured } from "@/lib/config";

export default async function NewTripPage() {
  if (!isAuthConfigured()) {
    redirect("/trips");
  }

  const session = await auth();

  if (!session?.user?.id) {
    redirect("/");
  }

  return (
    <main className="min-h-[calc(100vh-5rem)] bg-slate-50">
      <NewTripForm />
    </main>
  );
}
