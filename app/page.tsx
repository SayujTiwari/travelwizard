import {
  ArrowRight,
  CalendarDays,
  Globe2,
  MapPinned,
  Route,
  Sparkles,
} from "lucide-react";
import Link from "next/link";
import { Button } from "@/components/ui/button";

export default function Home() {
  return (
    <main className="overflow-hidden bg-[#f8fbfa]">
      <section className="relative isolate">
        <div
          className="absolute inset-x-0 top-0 -z-10 h-[38rem] bg-[radial-gradient(circle_at_15%_15%,rgba(14,165,164,0.18),transparent_35%),radial-gradient(circle_at_85%_20%,rgba(37,99,235,0.14),transparent_32%)]"
          aria-hidden="true"
        />
        <div className="container mx-auto grid min-h-[42rem] items-center gap-12 px-6 py-20 lg:grid-cols-[1.05fr_0.95fr] lg:px-8">
          <div className="max-w-3xl">
            <div className="mb-6 inline-flex items-center gap-2 rounded-full border border-teal-200 bg-white/80 px-4 py-2 text-sm font-medium text-teal-800 shadow-sm backdrop-blur">
              <Sparkles className="h-4 w-4" aria-hidden="true" />
              Smarter routes. Calmer trips.
            </div>
            <h1 className="text-balance text-5xl font-black tracking-[-0.04em] text-slate-950 sm:text-6xl lg:text-7xl">
              Turn a list of places into a trip that flows.
            </h1>
            <p className="mt-7 max-w-2xl text-pretty text-lg leading-8 text-slate-600 sm:text-xl">
              Create your trip, collect every stop, see the journey on a map,
              and let Travel Wizard find a faster driving order—without moving
              your starting point or final destination.
            </p>
            <div className="mt-9 flex flex-col gap-3 sm:flex-row">
              <Button
                asChild
                size="lg"
                className="h-12 rounded-full bg-teal-600 px-7 text-base hover:bg-teal-700"
              >
                <Link href="/trips">
                  Plan a trip
                  <ArrowRight aria-hidden="true" />
                </Link>
              </Button>
              <Button
                asChild
                size="lg"
                variant="outline"
                className="h-12 rounded-full border-slate-300 bg-white/70 px-7 text-base"
              >
                <Link href="/globe">Explore your travel globe</Link>
              </Button>
            </div>
          </div>

          <div className="relative mx-auto w-full max-w-xl">
            <div className="absolute -inset-6 -z-10 rotate-2 rounded-[2.5rem] bg-gradient-to-br from-teal-200/70 to-blue-200/60 blur-2xl" />
            <div className="rounded-[2rem] border border-white/70 bg-white/90 p-6 shadow-2xl shadow-slate-900/10 backdrop-blur sm:p-8">
              <div className="flex items-center justify-between">
                <div>
                  <p className="text-sm font-medium text-slate-500">
                    Coastal escape
                  </p>
                  <h2 className="mt-1 text-2xl font-bold text-slate-900">
                    Portugal road trip
                  </h2>
                </div>
                <span className="rounded-full bg-emerald-100 px-3 py-1 text-sm font-semibold text-emerald-700">
                  22% faster
                </span>
              </div>
              <div className="mt-7 space-y-3">
                {[
                  ["Lisbon", "Start", "bg-teal-600"],
                  ["Sintra", "42 min", "bg-blue-500"],
                  ["Nazaré", "1 hr 18 min", "bg-blue-500"],
                  ["Porto", "2 hr 7 min", "bg-amber-500"],
                  ["Douro Valley", "Final stop", "bg-slate-900"],
                ].map(([place, detail, color], index) => (
                  <div
                    key={place}
                    className="relative flex items-center gap-4 rounded-xl border border-slate-100 bg-white p-3 shadow-sm"
                  >
                    {index < 4 && (
                      <span
                        className="absolute left-[1.55rem] top-10 h-5 w-px bg-slate-200"
                        aria-hidden="true"
                      />
                    )}
                    <span
                      className={`flex h-8 w-8 shrink-0 items-center justify-center rounded-full text-sm font-bold text-white ${color}`}
                    >
                      {index + 1}
                    </span>
                    <span className="font-semibold text-slate-800">
                      {place}
                    </span>
                    <span className="ml-auto text-sm text-slate-500">
                      {detail}
                    </span>
                  </div>
                ))}
              </div>
            </div>
          </div>
        </div>
      </section>

      <section className="border-y border-slate-200/80 bg-white">
        <div className="container mx-auto px-6 py-20 lg:px-8">
          <div className="max-w-2xl">
            <p className="text-sm font-bold uppercase tracking-[0.18em] text-teal-700">
              Everything in one journey
            </p>
            <h2 className="mt-3 text-3xl font-bold tracking-tight text-slate-950 sm:text-4xl">
              Plan the route, remember the adventure.
            </h2>
          </div>
          <div className="mt-10 grid gap-5 md:grid-cols-2 lg:grid-cols-4">
            {[
              {
                icon: CalendarDays,
                title: "Organize trips",
                body: "Keep dates, notes, imagery, and every destination together.",
              },
              {
                icon: MapPinned,
                title: "See every stop",
                body: "Understand your itinerary at a glance with an ordered map.",
              },
              {
                icon: Route,
                title: "Optimize the drive",
                body: "Compare your route with a faster 2-opt recommendation.",
              },
              {
                icon: Globe2,
                title: "Build your globe",
                body: "Watch your visited countries grow with every journey.",
              },
            ].map(({ icon: Icon, title, body }) => (
              <article
                key={title}
                className="rounded-2xl border border-slate-200 bg-[#fbfdfc] p-6"
              >
                <span className="flex h-11 w-11 items-center justify-center rounded-xl bg-teal-100 text-teal-700">
                  <Icon className="h-5 w-5" aria-hidden="true" />
                </span>
                <h3 className="mt-5 text-lg font-bold text-slate-900">
                  {title}
                </h3>
                <p className="mt-2 leading-7 text-slate-600">{body}</p>
              </article>
            ))}
          </div>
        </div>
      </section>

      <section className="bg-slate-950 text-white">
        <div className="container mx-auto flex flex-col items-start justify-between gap-8 px-6 py-16 sm:flex-row sm:items-center lg:px-8">
          <div>
            <h2 className="text-3xl font-bold">Your next route starts here.</h2>
            <p className="mt-2 text-slate-300">
              Create a trip and turn scattered ideas into one clear itinerary.
            </p>
          </div>
          <Button
            asChild
            size="lg"
            className="rounded-full bg-white px-7 text-slate-950 hover:bg-slate-100"
          >
            <Link href="/trips">
              Open Travel Wizard
              <ArrowRight aria-hidden="true" />
            </Link>
          </Button>
        </div>
      </section>
    </main>
  );
}
