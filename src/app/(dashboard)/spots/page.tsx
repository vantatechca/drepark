"use client";

import { useEffect, useState, useCallback } from "react";
import { useRouter } from "next/navigation";
import Link from "next/link";
import {
  useReactTable,
  getCoreRowModel,
  flexRender,
  createColumnHelper,
} from "@tanstack/react-table";
import {
  Coffee,
  IceCream,
  UtensilsCrossed,
  ChefHat,
  Wine,
  Scissors,
  Flame,
  Dumbbell,
  Car,
  MapPin,
  Plus,
  Search,
} from "lucide-react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from "@/components/ui/table";
import { Card } from "@/components/ui/card";
import { ScoreBadge } from "@/components/spots/score-badge";
import { SpotStatusBadge } from "@/components/spots/spot-status-badge";
import { SPOT_TYPES, SPOT_STATUSES } from "@/lib/constants";
import { ZONES } from "@/lib/zones";
import type { Spot } from "@/types";

const SPOT_ICONS: Record<string, React.ReactNode> = {
  cafe: <Coffee className="h-4 w-4" />,
  ice_cream: <IceCream className="h-4 w-4" />,
  brunch: <UtensilsCrossed className="h-4 w-4" />,
  restaurant: <ChefHat className="h-4 w-4" />,
  wine_bar: <Wine className="h-4 w-4" />,
  barber: <Scissors className="h-4 w-4" />,
  cigar_lounge: <Flame className="h-4 w-4" />,
  gym: <Dumbbell className="h-4 w-4" />,
  car_meet: <Car className="h-4 w-4" />,
  other: <MapPin className="h-4 w-4" />,
};

const columnHelper = createColumnHelper<Spot>();

export default function SpotsPage() {
  const router = useRouter();
  const [spots, setSpots] = useState<Spot[]>([]);
  const [loading, setLoading] = useState(true);
  const [search, setSearch] = useState("");
  const [spotType, setSpotType] = useState("all");
  const [zone, setZone] = useState("all");
  const [status, setStatus] = useState("all");

  const fetchSpots = useCallback(async () => {
    setLoading(true);
    try {
      const params = new URLSearchParams();
      if (search) params.set("search", search);
      if (spotType !== "all") params.set("spotType", spotType);
      if (zone !== "all") params.set("zone", zone);
      if (status !== "all") params.set("status", status);

      const res = await fetch(`/api/spots?${params.toString()}`);
      const data = await res.json();
      setSpots(Array.isArray(data) ? data : []);
    } catch {
      setSpots([]);
    } finally {
      setLoading(false);
    }
  }, [search, spotType, zone, status]);

  useEffect(() => {
    const timer = setTimeout(fetchSpots, 300);
    return () => clearTimeout(timer);
  }, [fetchSpots]);

  const columns = [
    columnHelper.accessor("name", {
      header: "Name",
      cell: (info) => (
        <div className="flex items-center gap-2">
          <span className="text-amber-400">
            {SPOT_ICONS[info.row.original.spotType] ?? <MapPin className="h-4 w-4" />}
          </span>
          <span className="font-semibold text-foreground">{info.getValue()}</span>
        </div>
      ),
    }),
    columnHelper.accessor("city", {
      header: "City",
      cell: (info) => (
        <span className="text-muted-foreground">{info.getValue()}</span>
      ),
    }),
    columnHelper.accessor("zone", {
      header: "Zone",
      cell: (info) => {
        const zoneKey = info.getValue() as keyof typeof ZONES;
        return (
          <span className="text-muted-foreground text-sm">
            {ZONES[zoneKey]?.label ?? info.getValue()}
          </span>
        );
      },
    }),
    columnHelper.accessor("spotType", {
      header: "Type",
      cell: (info) => {
        const key = info.getValue() as keyof typeof SPOT_TYPES;
        return (
          <span className="text-muted-foreground text-sm">
            {SPOT_TYPES[key]?.label ?? info.getValue()}
          </span>
        );
      },
    }),
    columnHelper.accessor("scoreOverall", {
      header: "Score",
      cell: (info) => {
        const score = parseFloat(String(info.getValue() ?? "0"));
        return <ScoreBadge score={score} size="sm" />;
      },
    }),
    columnHelper.accessor("status", {
      header: "Status",
      cell: (info) => <SpotStatusBadge status={info.getValue() ?? "suggested"} />,
    }),
    columnHelper.accessor("lastVisitedAt", {
      header: "Last Visited",
      cell: (info) => {
        const val = info.getValue();
        if (!val) return <span className="text-muted-foreground text-sm">—</span>;
        return (
          <span className="text-muted-foreground text-sm">
            {new Date(val).toLocaleDateString()}
          </span>
        );
      },
    }),
  ];

  const table = useReactTable({
    data: spots,
    columns,
    getCoreRowModel: getCoreRowModel(),
  });

  return (
    <div className="space-y-6 p-6">
      {/* Header */}
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-2xl font-bold text-foreground">My Spots</h1>
          <p className="text-muted-foreground text-sm mt-1">
            {spots.length} spot{spots.length !== 1 ? "s" : ""} in your intelligence database
          </p>
        </div>
        <Link href="/spots/new">
          <Button className="bg-amber-500 hover:bg-amber-400 text-black font-semibold">
            <Plus className="h-4 w-4 mr-2" />
            Add Spot
          </Button>
        </Link>
      </div>

      {/* Filters */}
      <Card className="p-4 border-border/50 bg-card/50">
        <div className="flex flex-wrap gap-3">
          <div className="relative flex-1 min-w-[200px]">
            <Search className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-muted-foreground" />
            <Input
              placeholder="Search spots..."
              value={search}
              onChange={(e) => setSearch(e.target.value)}
              className="pl-9 bg-background border-border/50"
            />
          </div>

          <Select value={spotType} onValueChange={(v) => setSpotType(v ?? "all")}>
            <SelectTrigger className="w-[160px] bg-background border-border/50">
              <SelectValue placeholder="Spot Type" />
            </SelectTrigger>
            <SelectContent>
              <SelectItem value="all">All Types</SelectItem>
              {Object.entries(SPOT_TYPES).map(([key, val]) => (
                <SelectItem key={key} value={key}>
                  {val.label}
                </SelectItem>
              ))}
            </SelectContent>
          </Select>

          <Select value={zone} onValueChange={(v) => setZone(v ?? "all")}>
            <SelectTrigger className="w-[200px] bg-background border-border/50">
              <SelectValue placeholder="Zone" />
            </SelectTrigger>
            <SelectContent>
              <SelectItem value="all">All Zones</SelectItem>
              {Object.entries(ZONES).map(([key, val]) => (
                <SelectItem key={key} value={key}>
                  {val.label}
                </SelectItem>
              ))}
            </SelectContent>
          </Select>

          <Select value={status} onValueChange={(v) => setStatus(v ?? "all")}>
            <SelectTrigger className="w-[150px] bg-background border-border/50">
              <SelectValue placeholder="Status" />
            </SelectTrigger>
            <SelectContent>
              <SelectItem value="all">All Statuses</SelectItem>
              {Object.entries(SPOT_STATUSES).map(([key, val]) => (
                <SelectItem key={key} value={key}>
                  {val.label}
                </SelectItem>
              ))}
            </SelectContent>
          </Select>
        </div>
      </Card>

      {/* Table */}
      <Card className="border-border/50 bg-card/50 overflow-hidden">
        {loading ? (
          <div className="flex items-center justify-center h-48 text-muted-foreground">
            Loading spots...
          </div>
        ) : spots.length === 0 ? (
          <div className="flex flex-col items-center justify-center h-48 gap-3">
            <MapPin className="h-10 w-10 text-muted-foreground/40" />
            <p className="text-muted-foreground font-medium">No spots yet. Start by adding your first spot.</p>
            <Link href="/spots/new">
              <Button
                variant="outline"
                className="border-amber-500/50 text-amber-400 hover:bg-amber-500/10"
              >
                <Plus className="h-4 w-4 mr-2" />
                Add Your First Spot
              </Button>
            </Link>
          </div>
        ) : (
          <Table>
            <TableHeader>
              {table.getHeaderGroups().map((headerGroup) => (
                <TableRow key={headerGroup.id} className="border-border/50 hover:bg-transparent">
                  {headerGroup.headers.map((header) => (
                    <TableHead
                      key={header.id}
                      className="text-muted-foreground font-medium"
                    >
                      {flexRender(header.column.columnDef.header, header.getContext())}
                    </TableHead>
                  ))}
                </TableRow>
              ))}
            </TableHeader>
            <TableBody>
              {table.getRowModel().rows.map((row) => (
                <TableRow
                  key={row.id}
                  onClick={() => router.push(`/spots/${row.original.id}`)}
                  className="border-border/50 cursor-pointer hover:bg-amber-500/5 transition-colors"
                >
                  {row.getVisibleCells().map((cell) => (
                    <TableCell key={cell.id}>
                      {flexRender(cell.column.columnDef.cell, cell.getContext())}
                    </TableCell>
                  ))}
                </TableRow>
              ))}
            </TableBody>
          </Table>
        )}
      </Card>
    </div>
  );
}
