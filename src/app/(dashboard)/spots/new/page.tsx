"use client";

import Link from "next/link";
import { ChevronLeft } from "lucide-react";
import { SpotForm } from "@/components/spots/spot-form";

export default function NewSpotPage() {
  return (
    <div className="max-w-3xl mx-auto space-y-6 p-6">
      {/* Breadcrumb */}
      <div className="flex items-center gap-2">
        <Link
          href="/spots"
          className="flex items-center gap-1 text-sm text-muted-foreground hover:text-foreground transition-colors"
        >
          <ChevronLeft className="h-4 w-4" />
          My Spots
        </Link>
      </div>

      <div>
        <h1 className="text-2xl font-bold text-foreground">Add New Spot</h1>
        <p className="text-muted-foreground text-sm mt-1">
          Log a new parking intelligence spot to your database
        </p>
      </div>

      <SpotForm mode="create" />
    </div>
  );
}
