"use client";

import { login, logout } from "@/lib/auth-actions";
import Link from "next/link";
import Image from "next/image";
import type { Session } from "next-auth";
import { Globe2, LogIn, LogOut, Map } from "lucide-react";

export default function Navbar({
  session,
  authConfigured,
}: {
  session: Session | null;
  authConfigured: boolean;
}) {
  return (
    <nav className="sticky top-0 z-50 border-b border-slate-200/80 bg-white/90 backdrop-blur">
      <div className="container mx-auto flex h-16 items-center justify-between px-4 sm:px-6 lg:px-8">
        <Link
          href="/"
          className="flex items-center gap-2 rounded-lg focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-teal-500"
        >
          <Image
            src="/travelWizlogo.png"
            alt=""
            width={40}
            height={40}
            className="h-10 w-10 object-contain"
          />
          <span className="text-lg font-black tracking-tight text-slate-900 sm:text-xl">
            Travel Wizard
          </span>
        </Link>

        <div className="flex items-center gap-1 sm:gap-2">
          {session ? (
            <>
              <Link
                href="/trips"
                className="inline-flex h-9 items-center gap-2 rounded-md px-3 text-sm font-medium text-slate-700 transition-colors hover:bg-slate-100 hover:text-slate-950"
              >
                <Map className="h-4 w-4" aria-hidden="true" />
                <span className="hidden sm:inline">My Trips</span>
              </Link>
              <Link
                href="/globe"
                className="inline-flex h-9 items-center gap-2 rounded-md px-3 text-sm font-medium text-slate-700 transition-colors hover:bg-slate-100 hover:text-slate-950"
              >
                <Globe2 className="h-4 w-4" aria-hidden="true" />
                <span className="hidden sm:inline">Globe</span>
              </Link>
              <button
                type="button"
                className="inline-flex h-9 items-center gap-2 rounded-md bg-slate-900 px-3 text-sm font-medium text-white transition-colors hover:bg-slate-800"
                onClick={() => logout()}
              >
                <LogOut className="h-4 w-4" aria-hidden="true" />
                <span className="hidden sm:inline">Sign out</span>
              </button>
            </>
          ) : authConfigured ? (
            <button
              type="button"
              className="inline-flex h-9 items-center gap-2 rounded-md bg-slate-900 px-4 text-sm font-medium text-white transition-colors hover:bg-slate-800"
              onClick={() => login()}
            >
              <LogIn className="h-4 w-4" aria-hidden="true" />
              Sign in
            </button>
          ) : (
            <span
              className="rounded-md bg-amber-50 px-3 py-2 text-xs font-semibold text-amber-800 sm:text-sm"
              title="Add the required values from .env.example to enable sign-in"
            >
              Setup required
            </span>
          )}
        </div>
      </div>
    </nav>
  );
}
