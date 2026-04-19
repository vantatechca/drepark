"use client";

import { useEffect, useState, useCallback } from "react";
import {
  Plus,
  Phone,
  AtSign,
  Mail,
  CreditCard,
  Users,
  TrendingUp,
  Clock,
  CheckSquare,
  Filter,
  UserCircle2,
} from "lucide-react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Textarea } from "@/components/ui/textarea";
import { Badge } from "@/components/ui/badge";
import { Card, CardContent } from "@/components/ui/card";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
  DialogFooter,
} from "@/components/ui/dialog";
import { Switch } from "@/components/ui/switch";
import { Separator } from "@/components/ui/separator";
import type { Spot } from "@/types";

interface ContactRow {
  id: string;
  visitId: string | null;
  spotId: string | null;
  spotName: string | null;
  name: string;
  contactType: string;
  contactValue: string | null;
  gender: string | null;
  context: string | null;
  potential: string | null;
  followedUp: boolean | null;
  notes: string | null;
  metAt: string;
}

interface AddContactForm {
  name: string;
  contactType: string;
  contactValue: string;
  gender: string;
  context: string;
  potential: string;
  followedUp: boolean;
  notes: string;
  spotId: string;
  visitId: string;
}

const DEFAULT_FORM: AddContactForm = {
  name: "",
  contactType: "phone",
  contactValue: "",
  gender: "",
  context: "",
  potential: "medium",
  followedUp: false,
  notes: "",
  spotId: "",
  visitId: "",
};

const POTENTIAL_BADGES: Record<string, { label: string; className: string }> = {
  high: { label: "High", className: "bg-green-500/20 text-green-400 border-green-500/30" },
  medium: { label: "Medium", className: "bg-yellow-500/20 text-yellow-400 border-yellow-500/30" },
  low: { label: "Low", className: "bg-gray-500/20 text-gray-400 border-gray-500/30" },
  social_only: { label: "Social Only", className: "bg-blue-500/20 text-blue-400 border-blue-500/30" },
};

const CONTACT_TYPE_ICONS: Record<string, React.ReactNode> = {
  phone: <Phone className="h-3.5 w-3.5" />,
  instagram: <AtSign className="h-3.5 w-3.5" />,
  email: <Mail className="h-3.5 w-3.5" />,
  business_card: <CreditCard className="h-3.5 w-3.5" />,
  other: <UserCircle2 className="h-3.5 w-3.5" />,
};

function formatRelativeDate(dateStr: string) {
  const date = new Date(dateStr);
  const now = new Date();
  const diffMs = now.getTime() - date.getTime();
  const diffDays = Math.floor(diffMs / (1000 * 60 * 60 * 24));

  if (diffDays === 0) return "Today";
  if (diffDays === 1) return "Yesterday";
  if (diffDays < 7) return `${diffDays}d ago`;
  if (diffDays < 30) return `${Math.floor(diffDays / 7)}w ago`;
  if (diffDays < 365) return `${Math.floor(diffDays / 30)}mo ago`;
  return `${Math.floor(diffDays / 365)}y ago`;
}

export default function ContactsPage() {
  const [contacts, setContacts] = useState<ContactRow[]>([]);
  const [spots, setSpots] = useState<Spot[]>([]);
  const [loading, setLoading] = useState(true);
  const [potentialFilter, setPotentialFilter] = useState("all");
  const [spotFilter, setSpotFilter] = useState("all");
  const [dialogOpen, setDialogOpen] = useState(false);
  const [form, setForm] = useState<AddContactForm>(DEFAULT_FORM);
  const [submitting, setSubmitting] = useState(false);
  const [formError, setFormError] = useState<string | null>(null);

  const fetchContacts = useCallback(async () => {
    setLoading(true);
    try {
      const params = new URLSearchParams();
      if (potentialFilter !== "all") params.set("potential", potentialFilter);
      if (spotFilter !== "all") params.set("spotId", spotFilter);

      const res = await fetch(`/api/contacts?${params.toString()}`);
      const data = await res.json();
      setContacts(Array.isArray(data) ? data : []);
    } catch {
      setContacts([]);
    } finally {
      setLoading(false);
    }
  }, [potentialFilter, spotFilter]);

  useEffect(() => {
    fetchContacts();
  }, [fetchContacts]);

  useEffect(() => {
    fetch("/api/spots")
      .then((r) => r.json())
      .then((d) => setSpots(Array.isArray(d) ? d : []))
      .catch(() => setSpots([]));
  }, []);

  function setField<K extends keyof AddContactForm>(key: K, value: AddContactForm[K]) {
    setForm((prev) => ({ ...prev, [key]: value }));
  }

  async function handleToggleFollowedUp(contact: ContactRow) {
    try {
      await fetch(`/api/contacts/${contact.id}`, {
        method: "PUT",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ followedUp: !contact.followedUp }),
      });
      setContacts((prev) =>
        prev.map((c) =>
          c.id === contact.id ? { ...c, followedUp: !c.followedUp } : c
        )
      );
    } catch {
      // silent
    }
  }

  async function handleAddContact() {
    setSubmitting(true);
    setFormError(null);
    try {
      const payload = {
        ...form,
        spotId: form.spotId || null,
        visitId: form.visitId || null,
        gender: form.gender || null,
        contactValue: form.contactValue || null,
        context: form.context || null,
        notes: form.notes || null,
      };

      const res = await fetch("/api/contacts", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(payload),
      });

      if (!res.ok) {
        const data = await res.json();
        throw new Error(data.error ?? "Failed to add contact");
      }

      setDialogOpen(false);
      setForm(DEFAULT_FORM);
      fetchContacts();
    } catch (err) {
      setFormError(err instanceof Error ? err.message : "Something went wrong");
    } finally {
      setSubmitting(false);
    }
  }

  // Stats
  const totalContacts = contacts.length;
  const highPotentialCount = contacts.filter((c) => c.potential === "high").length;
  const followUpPendingCount = contacts.filter(
    (c) => !c.followedUp && c.potential !== "social_only"
  ).length;

  return (
    <div className="space-y-6 p-6">
      {/* Header */}
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-2xl font-bold text-foreground">Contacts</h1>
          <p className="text-muted-foreground text-sm mt-1">
            Your networking intelligence network
          </p>
        </div>
        <Button
          onClick={() => setDialogOpen(true)}
          className="bg-amber-500 hover:bg-amber-400 text-black font-semibold"
        >
          <Plus className="h-4 w-4 mr-2" />
          Add Contact
        </Button>
      </div>

      {/* Stats */}
      <div className="grid grid-cols-3 gap-4">
        <Card className="border-border/50 bg-card/50">
          <CardContent className="p-4 flex items-center gap-3">
            <div className="h-9 w-9 rounded-lg bg-blue-500/10 flex items-center justify-center">
              <Users className="h-4.5 w-4.5 text-blue-400" />
            </div>
            <div>
              <p className="text-2xl font-bold text-foreground">{totalContacts}</p>
              <p className="text-xs text-muted-foreground">Total Contacts</p>
            </div>
          </CardContent>
        </Card>
        <Card className="border-border/50 bg-card/50">
          <CardContent className="p-4 flex items-center gap-3">
            <div className="h-9 w-9 rounded-lg bg-green-500/10 flex items-center justify-center">
              <TrendingUp className="h-4.5 w-4.5 text-green-400" />
            </div>
            <div>
              <p className="text-2xl font-bold text-foreground">{highPotentialCount}</p>
              <p className="text-xs text-muted-foreground">High Potential</p>
            </div>
          </CardContent>
        </Card>
        <Card className="border-border/50 bg-card/50">
          <CardContent className="p-4 flex items-center gap-3">
            <div className="h-9 w-9 rounded-lg bg-amber-500/10 flex items-center justify-center">
              <Clock className="h-4.5 w-4.5 text-amber-400" />
            </div>
            <div>
              <p className="text-2xl font-bold text-foreground">{followUpPendingCount}</p>
              <p className="text-xs text-muted-foreground">Follow-up Pending</p>
            </div>
          </CardContent>
        </Card>
      </div>

      {/* Filters */}
      <Card className="p-4 border-border/50 bg-card/50">
        <div className="flex flex-wrap gap-3 items-center">
          <div className="flex items-center gap-2 text-muted-foreground text-sm">
            <Filter className="h-4 w-4" />
            <span>Filter:</span>
          </div>

          <Select value={potentialFilter} onValueChange={(v) => setPotentialFilter(v ?? "all")}>
            <SelectTrigger className="w-[160px] bg-background border-border/50">
              <SelectValue placeholder="Potential" />
            </SelectTrigger>
            <SelectContent>
              <SelectItem value="all">All Potential</SelectItem>
              {Object.entries(POTENTIAL_BADGES).map(([key, val]) => (
                <SelectItem key={key} value={key}>
                  {val.label}
                </SelectItem>
              ))}
            </SelectContent>
          </Select>

          <Select value={spotFilter} onValueChange={(v) => setSpotFilter(v ?? "all")}>
            <SelectTrigger className="w-[200px] bg-background border-border/50">
              <SelectValue placeholder="All Spots" />
            </SelectTrigger>
            <SelectContent>
              <SelectItem value="all">All Spots</SelectItem>
              {spots.map((spot) => (
                <SelectItem key={spot.id} value={spot.id}>
                  {spot.name}
                </SelectItem>
              ))}
            </SelectContent>
          </Select>

          {(potentialFilter !== "all" || spotFilter !== "all") && (
            <Button
              variant="ghost"
              size="sm"
              onClick={() => {
                setPotentialFilter("all");
                setSpotFilter("all");
              }}
              className="text-muted-foreground hover:text-foreground"
            >
              Clear
            </Button>
          )}
        </div>
      </Card>

      {/* Contact List */}
      {loading ? (
        <div className="flex items-center justify-center h-48 text-muted-foreground">
          Loading contacts...
        </div>
      ) : contacts.length === 0 ? (
        <div className="flex flex-col items-center justify-center h-64 gap-4">
          <Users className="h-14 w-14 text-muted-foreground/30" />
          <div className="text-center">
            <p className="text-foreground font-medium">No contacts yet</p>
            <p className="text-muted-foreground text-sm mt-1">
              Start adding contacts you meet at your spots.
            </p>
          </div>
          <Button
            variant="outline"
            onClick={() => setDialogOpen(true)}
            className="border-amber-500/50 text-amber-400 hover:bg-amber-500/10"
          >
            <Plus className="h-4 w-4 mr-2" />
            Add Your First Contact
          </Button>
        </div>
      ) : (
        <div className="space-y-2">
          {contacts.map((contact) => {
            const potentialInfo = contact.potential
              ? POTENTIAL_BADGES[contact.potential]
              : null;
            const typeIcon = CONTACT_TYPE_ICONS[contact.contactType] ?? (
              <UserCircle2 className="h-3.5 w-3.5" />
            );

            return (
              <Card
                key={contact.id}
                className="border-border/50 bg-card/50 hover:border-amber-500/20 transition-colors"
              >
                <CardContent className="p-4">
                  <div className="flex items-start gap-3">
                    {/* Avatar placeholder */}
                    <div className="h-9 w-9 rounded-full bg-amber-500/10 border border-amber-500/20 flex items-center justify-center flex-shrink-0 text-amber-400 font-semibold text-sm">
                      {contact.name.charAt(0).toUpperCase()}
                    </div>

                    {/* Main content */}
                    <div className="flex-1 min-w-0 space-y-1">
                      <div className="flex items-center gap-2 flex-wrap">
                        <span className="font-semibold text-foreground">{contact.name}</span>

                        {/* Contact type icon + value */}
                        <span className="flex items-center gap-1 text-muted-foreground text-xs">
                          {typeIcon}
                          {contact.contactValue && (
                            <span className="text-muted-foreground">{contact.contactValue}</span>
                          )}
                        </span>

                        {potentialInfo && (
                          <Badge
                            className={`${potentialInfo.className} border text-xs px-1.5 py-0`}
                          >
                            {potentialInfo.label}
                          </Badge>
                        )}
                      </div>

                      {contact.context && (
                        <p className="text-sm text-muted-foreground line-clamp-1">
                          {contact.context}
                        </p>
                      )}

                      <div className="flex items-center gap-3 text-xs text-muted-foreground/60 flex-wrap">
                        {contact.spotName && (
                          <span className="flex items-center gap-1">
                            <span className="text-amber-500/60">@</span>
                            {contact.spotName}
                          </span>
                        )}
                        <span>{formatRelativeDate(contact.metAt)}</span>
                      </div>
                    </div>

                    {/* Follow-up toggle */}
                    <div className="flex items-center gap-2 flex-shrink-0">
                      <button
                        onClick={() => handleToggleFollowedUp(contact)}
                        title={contact.followedUp ? "Followed up" : "Mark as followed up"}
                        className={`h-7 w-7 rounded-md border flex items-center justify-center transition-all ${
                          contact.followedUp
                            ? "border-green-500/50 bg-green-500/10 text-green-400"
                            : "border-border/50 text-muted-foreground/40 hover:border-amber-500/30 hover:text-amber-400/60"
                        }`}
                      >
                        <CheckSquare className="h-3.5 w-3.5" />
                      </button>
                    </div>
                  </div>
                </CardContent>
              </Card>
            );
          })}
        </div>
      )}

      {/* Add Contact Dialog */}
      <Dialog open={dialogOpen} onOpenChange={setDialogOpen}>
        <DialogContent className="max-w-md border-border/50 bg-card max-h-[90vh] overflow-y-auto">
          <DialogHeader>
            <DialogTitle className="text-foreground">Add Contact</DialogTitle>
          </DialogHeader>

          <div className="space-y-4 py-2">
            {formError && (
              <div className="rounded-md bg-red-500/10 border border-red-500/30 px-3 py-2 text-red-400 text-sm">
                {formError}
              </div>
            )}

            <div className="space-y-1.5">
              <Label>Name *</Label>
              <Input
                value={form.name}
                onChange={(e) => setField("name", e.target.value)}
                placeholder="e.g. Alex"
                className="bg-background border-border/50"
              />
            </div>

            <div className="grid grid-cols-2 gap-3">
              <div className="space-y-1.5">
                <Label>Contact Type *</Label>
                <Select value={form.contactType} onValueChange={(v) => v && setField("contactType", v as AddContactForm["contactType"])}>
                  <SelectTrigger className="bg-background border-border/50">
                    <SelectValue />
                  </SelectTrigger>
                  <SelectContent>
                    <SelectItem value="phone">Phone</SelectItem>
                    <SelectItem value="instagram">Instagram</SelectItem>
                    <SelectItem value="email">Email</SelectItem>
                    <SelectItem value="business_card">Business Card</SelectItem>
                    <SelectItem value="other">Other</SelectItem>
                  </SelectContent>
                </Select>
              </div>
              <div className="space-y-1.5">
                <Label>Contact Value</Label>
                <Input
                  value={form.contactValue}
                  onChange={(e) => setField("contactValue", e.target.value)}
                  placeholder="@handle / number..."
                  className="bg-background border-border/50"
                />
              </div>
            </div>

            <div className="grid grid-cols-2 gap-3">
              <div className="space-y-1.5">
                <Label>Gender</Label>
                <Select value={form.gender} onValueChange={(v) => v && setField("gender", v as AddContactForm["gender"])}>
                  <SelectTrigger className="bg-background border-border/50">
                    <SelectValue placeholder="Select..." />
                  </SelectTrigger>
                  <SelectContent>
                    <SelectItem value="male">Male</SelectItem>
                    <SelectItem value="female">Female</SelectItem>
                    <SelectItem value="other">Other</SelectItem>
                  </SelectContent>
                </Select>
              </div>
              <div className="space-y-1.5">
                <Label>Potential</Label>
                <Select value={form.potential} onValueChange={(v) => v && setField("potential", v as AddContactForm["potential"])}>
                  <SelectTrigger className="bg-background border-border/50">
                    <SelectValue />
                  </SelectTrigger>
                  <SelectContent>
                    <SelectItem value="high">High</SelectItem>
                    <SelectItem value="medium">Medium</SelectItem>
                    <SelectItem value="low">Low</SelectItem>
                    <SelectItem value="social_only">Social Only</SelectItem>
                  </SelectContent>
                </Select>
              </div>
            </div>

            <div className="space-y-1.5">
              <Label>Context</Label>
              <Input
                value={form.context}
                onChange={(e) => setField("context", e.target.value)}
                placeholder="e.g. Talked about cars, works in real estate..."
                className="bg-background border-border/50"
              />
            </div>

            <Separator className="bg-border/50" />

            <div className="space-y-1.5">
              <Label>Where We Met</Label>
              <Select value={form.spotId} onValueChange={(v) => setField("spotId", v ?? "")}>
                <SelectTrigger className="bg-background border-border/50">
                  <SelectValue placeholder="Select spot (optional)..." />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="">No spot</SelectItem>
                  {spots.map((spot) => (
                    <SelectItem key={spot.id} value={spot.id}>
                      {spot.name}
                    </SelectItem>
                  ))}
                </SelectContent>
              </Select>
            </div>

            <div className="space-y-1.5">
              <Label>Notes</Label>
              <Textarea
                value={form.notes}
                onChange={(e) => setField("notes", e.target.value)}
                placeholder="Additional context..."
                className="bg-background border-border/50 min-h-[80px] resize-none"
              />
            </div>

            <div className="flex items-center gap-3">
              <Switch
                checked={form.followedUp}
                onCheckedChange={(v) => setField("followedUp", v)}
              />
              <Label className="text-sm">Already followed up</Label>
            </div>
          </div>

          <DialogFooter className="gap-2">
            <Button
              variant="outline"
              onClick={() => {
                setDialogOpen(false);
                setForm(DEFAULT_FORM);
                setFormError(null);
              }}
              className="border-border/50"
            >
              Cancel
            </Button>
            <Button
              onClick={handleAddContact}
              disabled={submitting || !form.name || !form.contactType}
              className="bg-amber-500 hover:bg-amber-400 text-black font-semibold"
            >
              {submitting ? "Adding..." : "Add Contact"}
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>
    </div>
  );
}
