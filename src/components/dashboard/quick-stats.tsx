"use client";

import { useEffect, useState } from "react";
import { Card, CardContent } from "@/components/ui/card";
import { MapPin, CalendarDays, MessageSquare, Users, Star } from "lucide-react";
import type { SummaryData } from "@/app/api/analytics/summary/route";

const EMPTY: SummaryData = {
  verifiedSpotsCount: 0,
  visitsThisMonth: 0,
  conversationsThisMonth: 0,
  contactsThisMonth: 0,
  avgNetworkingRating: 0,
};

interface MiniStatProps {
  icon: React.ReactNode;
  label: string;
  value: string | number;
  highlight?: boolean;
}

function MiniStat({ icon, label, value, highlight }: MiniStatProps) {
  return (
    <Card className="bg-zinc-900 border-zinc-800 flex-1 min-w-0">
      <CardContent className="p-4">
        <div className="flex items-center gap-2 mb-2">
          <div className={highlight ? "text-amber-400" : "text-zinc-500"}>
            {icon}
          </div>
          <span className="text-[10px] uppercase tracking-wider text-zinc-500 font-medium truncate">
            {label}
          </span>
        </div>
        <p className="text-2xl font-bold text-white">{value}</p>
      </CardContent>
    </Card>
  );
}

export function QuickStats() {
  const [data, setData] = useState<SummaryData>(EMPTY);

  useEffect(() => {
    fetch("/api/analytics/summary")
      .then((r) => r.json())
      .then(setData)
      .catch(() => setData(EMPTY));
  }, []);

  return (
    <div className="flex gap-3 overflow-x-auto pb-1">
      <MiniStat
        icon={<MapPin className="w-4 h-4" />}
        label="Verified Spots"
        value={data.verifiedSpotsCount}
        highlight
      />
      <MiniStat
        icon={<CalendarDays className="w-4 h-4" />}
        label="Visits / Month"
        value={data.visitsThisMonth}
      />
      <MiniStat
        icon={<MessageSquare className="w-4 h-4" />}
        label="Conversations"
        value={data.conversationsThisMonth}
      />
      <MiniStat
        icon={<Users className="w-4 h-4" />}
        label="Contacts"
        value={data.contactsThisMonth}
      />
      <MiniStat
        icon={<Star className="w-4 h-4" />}
        label="Avg Rating"
        value={
          data.avgNetworkingRating > 0
            ? `${data.avgNetworkingRating.toFixed(1)}/5`
            : "—"
        }
      />
    </div>
  );
}
