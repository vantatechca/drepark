"use client";

import { useEffect, useState } from "react";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Separator } from "@/components/ui/separator";
import {
  Settings,
  Database,
  Map,
  Sparkles,
  CheckCircle2,
  XCircle,
  Code2,
  Info,
  Layers,
} from "lucide-react";
import type { SettingsStatus } from "@/app/api/settings/route";

const EMPTY: SettingsStatus = {
  hasDatabase: false,
  hasGoogleMaps: false,
  hasAnthropic: false,
};

const ENV_EXAMPLE = `# Database — Neon, Supabase, or any Postgres
DATABASE_URL=postgresql://user:password@host/database

# Google Maps — for place search & Street View
GOOGLE_MAPS_API_KEY=AIza...

# Anthropic — for AI recommendations
ANTHROPIC_API_KEY=sk-ant-...`;

const TECH_STACK = [
  { name: "Next.js 14", role: "Framework (App Router)", color: "text-white" },
  { name: "TypeScript", role: "Language", color: "text-blue-400" },
  { name: "Drizzle ORM", role: "Database ORM", color: "text-emerald-400" },
  { name: "PostgreSQL", role: "Database", color: "text-sky-400" },
  { name: "Tailwind CSS", role: "Styling", color: "text-cyan-400" },
  { name: "shadcn/ui", role: "UI Components", color: "text-purple-400" },
  { name: "Recharts", role: "Charts & Analytics", color: "text-amber-400" },
  { name: "Anthropic Claude", role: "AI Recommendations", color: "text-orange-400" },
  { name: "Google Maps API", role: "Places & Geocoding", color: "text-red-400" },
];

interface StatusRowProps {
  icon: React.ReactNode;
  label: string;
  description: string;
  envKey: string;
  active: boolean;
}

function StatusRow({ icon, label, description, envKey, active }: StatusRowProps) {
  return (
    <div className="flex items-start gap-4 py-4">
      <div className="w-9 h-9 rounded-lg bg-zinc-800 flex items-center justify-center flex-shrink-0 text-zinc-400">
        {icon}
      </div>
      <div className="flex-1 min-w-0">
        <div className="flex items-center gap-2">
          <p className="text-sm font-semibold text-white">{label}</p>
          {active ? (
            <Badge className="bg-emerald-500/20 text-emerald-400 border-emerald-500/30 text-xs h-5">
              <CheckCircle2 className="w-3 h-3 mr-1" />
              Connected
            </Badge>
          ) : (
            <Badge className="bg-red-500/20 text-red-400 border-red-500/30 text-xs h-5">
              <XCircle className="w-3 h-3 mr-1" />
              Not configured
            </Badge>
          )}
        </div>
        <p className="text-xs text-zinc-500 mt-0.5">{description}</p>
        <code className="text-[11px] text-zinc-600 mt-1 block">
          {envKey}
        </code>
      </div>
    </div>
  );
}

export default function SettingsPage() {
  const [status, setStatus] = useState<SettingsStatus>(EMPTY);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    fetch("/api/settings")
      .then((r) => r.json())
      .then(setStatus)
      .catch(() => setStatus(EMPTY))
      .finally(() => setLoading(false));
  }, []);

  const configuredCount = [
    status.hasDatabase,
    status.hasGoogleMaps,
    status.hasAnthropic,
  ].filter(Boolean).length;

  return (
    <div className="p-6 space-y-6 max-w-3xl mx-auto">
      {/* Header */}
      <div>
        <h1 className="text-2xl font-bold text-white flex items-center gap-2">
          <Settings className="w-6 h-6 text-amber-400" />
          Settings
        </h1>
        <p className="text-zinc-500 mt-1 text-sm">
          API keys, configuration, and app info
        </p>
      </div>

      {/* API Key Status */}
      <Card className="bg-zinc-900 border-zinc-800">
        <CardHeader className="pb-2">
          <div className="flex items-center justify-between">
            <CardTitle className="text-base font-semibold text-white flex items-center gap-2">
              <Database className="w-4 h-4 text-amber-400" />
              API Key Status
            </CardTitle>
            {!loading && (
              <span className="text-xs text-zinc-500">
                {configuredCount}/3 configured
              </span>
            )}
          </div>
        </CardHeader>
        <CardContent className="divide-y divide-zinc-800">
          {loading ? (
            <div className="space-y-4 py-4">
              {[1, 2, 3].map((i) => (
                <div key={i} className="h-14 rounded bg-zinc-800 animate-pulse" />
              ))}
            </div>
          ) : (
            <>
              <StatusRow
                icon={<Database className="w-4 h-4" />}
                label="PostgreSQL Database"
                description="Required for storing spots, visits, contacts, and analytics data"
                envKey="DATABASE_URL"
                active={status.hasDatabase}
              />
              <StatusRow
                icon={<Map className="w-4 h-4" />}
                label="Google Maps API"
                description="Used for place search, Street View images, and geocoding"
                envKey="GOOGLE_MAPS_API_KEY"
                active={status.hasGoogleMaps}
              />
              <StatusRow
                icon={<Sparkles className="w-4 h-4" />}
                label="Anthropic Claude AI"
                description="Powers the AI recommendation engine and spot assessments"
                envKey="ANTHROPIC_API_KEY"
                active={status.hasAnthropic}
              />
            </>
          )}
        </CardContent>
      </Card>

      {/* .env.example */}
      <Card className="bg-zinc-900 border-zinc-800">
        <CardHeader className="pb-2">
          <CardTitle className="text-base font-semibold text-white flex items-center gap-2">
            <Code2 className="w-4 h-4 text-amber-400" />
            Environment Configuration
          </CardTitle>
        </CardHeader>
        <CardContent>
          <p className="text-xs text-zinc-500 mb-3">
            Add these to your{" "}
            <code className="bg-zinc-800 px-1.5 py-0.5 rounded text-zinc-300">
              .env.local
            </code>{" "}
            file:
          </p>
          <div className="rounded-lg bg-zinc-950 border border-zinc-800 p-4 overflow-x-auto">
            <pre className="text-xs text-zinc-300 font-mono whitespace-pre leading-relaxed">
              {ENV_EXAMPLE}
            </pre>
          </div>
          <div className="mt-3 flex items-start gap-2 p-3 rounded-lg bg-zinc-800/50 border border-zinc-700/50">
            <Info className="w-3.5 h-3.5 text-zinc-500 flex-shrink-0 mt-0.5" />
            <p className="text-xs text-zinc-500">
              The app runs in read-only demo mode without a DATABASE_URL. AI
              recommendations require ANTHROPIC_API_KEY. Place search requires
              GOOGLE_MAPS_API_KEY.
            </p>
          </div>
        </CardContent>
      </Card>

      {/* App Info */}
      <Card className="bg-zinc-900 border-zinc-800">
        <CardHeader className="pb-2">
          <CardTitle className="text-base font-semibold text-white flex items-center gap-2">
            <Layers className="w-4 h-4 text-amber-400" />
            App Info
          </CardTitle>
        </CardHeader>
        <CardContent className="space-y-4">
          <div className="flex items-center justify-between">
            <span className="text-sm text-zinc-400">Version</span>
            <Badge
              variant="outline"
              className="border-zinc-700 text-zinc-400 font-mono text-xs"
            >
              v0.1.0
            </Badge>
          </div>
          <Separator className="bg-zinc-800" />
          <div>
            <p className="text-xs text-zinc-500 mb-3 uppercase tracking-wider font-medium">
              Tech Stack
            </p>
            <div className="grid grid-cols-1 sm:grid-cols-2 gap-2">
              {TECH_STACK.map((t) => (
                <div
                  key={t.name}
                  className="flex items-center justify-between px-3 py-2 rounded-lg bg-zinc-800 border border-zinc-700/50"
                >
                  <span className={`text-sm font-medium ${t.color}`}>
                    {t.name}
                  </span>
                  <span className="text-xs text-zinc-500">{t.role}</span>
                </div>
              ))}
            </div>
          </div>
          <Separator className="bg-zinc-800" />
          <div className="flex items-center justify-between">
            <span className="text-sm text-zinc-500">
              Built for the C63 AMG lifestyle
            </span>
            <span className="text-xs text-zinc-600">DrePark © 2024</span>
          </div>
        </CardContent>
      </Card>
    </div>
  );
}
