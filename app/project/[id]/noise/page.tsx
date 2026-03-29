"use client";

import { useState, useEffect } from "react";
import { useParams } from "next/navigation";
import { toast } from "sonner";
import { Filter, X, Plus, Trash2, Eye, Pencil, ChevronRight } from "lucide-react";
import { Spinner } from "@/components/ui/Spinner";
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Checkbox } from "@/components/ui/checkbox";
import { useAssistantContext } from "@/lib/assistant-context";
import {
  AlertDialog,
  AlertDialogAction,
  AlertDialogCancel,
  AlertDialogContent,
  AlertDialogDescription,
  AlertDialogFooter,
  AlertDialogHeader,
  AlertDialogTitle,
  AlertDialogTrigger,
} from "@/components/ui/alert-dialog";
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog";

interface NoiseFilterData {
  id: string;
  name: string;
  description: string | null;
  filterKeywords: string;
  excludeFromNps: boolean;
  isActive: boolean;
}

export default function NoisePage() {
  const params = useParams();
  const projectId = params.id as string;

  const [filters, setFilters] = useState<NoiseFilterData[]>([]);
  const [name, setName] = useState("");
  const [description, setDescription] = useState("");
  const [keywords, setKeywords] = useState("");
  const [excludeFromNps, setExcludeFromNps] = useState(true);
  const [saving, setSaving] = useState(false);
  const [matchPreview, setMatchPreview] = useState<number | null>(null);

  // Edit dialog state
  const [editDialogOpen, setEditDialogOpen] = useState(false);
  const [editFilterId, setEditFilterId] = useState<string | null>(null);
  const [editName, setEditName] = useState("");
  const [editDescription, setEditDescription] = useState("");
  const [editKeywords, setEditKeywords] = useState("");
  const [editExcludeFromNps, setEditExcludeFromNps] = useState(true);
  const [editSaving, setEditSaving] = useState(false);

  // Expand/collapse state for each filter
  const [expandedFilters, setExpandedFilters] = useState<Set<string>>(new Set());

  // Match counts per filter
  const [matchCounts, setMatchCounts] = useState<Record<string, number>>({});

  const { setPageContext } = useAssistantContext();

  useEffect(() => {
    fetchFilters();
  }, [projectId]);

  useEffect(() => {
    setPageContext({
      noiseFilters: filters.map(f => ({
        name: f.name,
        keywords: JSON.parse(f.filterKeywords || "[]"),
      })),
      excludedCount: filters.length,
    });
  }, [filters, setPageContext]);

  async function fetchFilters() {
    const res = await fetch(`/api/projects/${projectId}/noise`);
    if (res.ok) {
      const data = await res.json();
      setFilters(data);
      // Compute match counts client-side
      computeMatchCounts(data);
    }
  }

  async function computeMatchCounts(filterList: NoiseFilterData[]) {
    if (filterList.length === 0) return;
    try {
      const res = await fetch(`/api/projects/${projectId}/comments?limit=10000`);
      if (!res.ok) return;
      const data = await res.json();
      const counts: Record<string, number> = {};
      for (const f of filterList) {
        const kws: string[] = JSON.parse(f.filterKeywords || "[]");
        const lower = kws.map((k) => k.toLowerCase());
        const matches = data.comments.filter(
          (c: { commentText: string | null }) =>
            c.commentText &&
            lower.some((kw) => c.commentText!.toLowerCase().includes(kw))
        );
        counts[f.id] = matches.length;
      }
      setMatchCounts(counts);
    } catch {
      // silently fail
    }
  }

  function openEditDialog(f: NoiseFilterData) {
    setEditFilterId(f.id);
    setEditName(f.name);
    setEditDescription(f.description || "");
    const kws: string[] = JSON.parse(f.filterKeywords || "[]");
    setEditKeywords(kws.join(", "));
    setEditExcludeFromNps(f.excludeFromNps);
    setEditDialogOpen(true);
  }

  async function handleEditSave() {
    if (!editFilterId) return;
    const kws = editKeywords.split(",").map((k) => k.trim()).filter(Boolean);
    if (!editName.trim() || kws.length === 0) return;

    setEditSaving(true);
    try {
      const res = await fetch(`/api/projects/${projectId}/noise`, {
        method: "PATCH",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          filterId: editFilterId,
          name: editName.trim(),
          description: editDescription.trim() || null,
          filterKeywords: kws,
          excludeFromNps: editExcludeFromNps,
        }),
      });
      if (res.ok) {
        toast.success("Filter updated");
        setEditDialogOpen(false);
        await fetchFilters();
      } else {
        toast.error("Failed to update filter");
      }
    } catch {
      toast.error("Failed to update filter");
    } finally {
      setEditSaving(false);
    }
  }

  async function previewMatches() {
    const kws = keywords.split(",").map((k) => k.trim()).filter(Boolean);
    if (kws.length === 0) return;

    const res = await fetch(
      `/api/projects/${projectId}/comments?limit=10000`
    );
    if (res.ok) {
      const data = await res.json();
      const lower = kws.map((k) => k.toLowerCase());
      const matches = data.comments.filter(
        (c: { commentText: string | null }) =>
          c.commentText &&
          lower.some((kw) => c.commentText!.toLowerCase().includes(kw))
      );
      setMatchPreview(matches.length);
    }
  }

  async function handleCreate() {
    const kws = keywords.split(",").map((k) => k.trim()).filter(Boolean);
    if (!name.trim() || kws.length === 0) return;

    setSaving(true);
    try {
      const res = await fetch(`/api/projects/${projectId}/noise`, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          name: name.trim(),
          description: description.trim() || null,
          filterKeywords: kws,
          excludeFromNps,
        }),
      });
      if (res.ok) {
        toast.success("Filter created", {
          description: `"${name.trim()}" noise filter is now active.`,
        });
        setName("");
        setDescription("");
        setKeywords("");
        setMatchPreview(null);
        await fetchFilters();
      } else {
        toast.error("Failed to create filter");
      }
    } catch {
      toast.error("Failed to create filter", {
        description: "Could not connect to the server.",
      });
    } finally {
      setSaving(false);
    }
  }

  async function handleDelete(filterId: string, filterName: string) {
    try {
      await fetch(
        `/api/projects/${projectId}/noise?filterId=${filterId}`,
        { method: "DELETE" }
      );
      toast.success("Filter deleted", {
        description: `"${filterName}" has been removed.`,
      });
      await fetchFilters();
    } catch {
      toast.error("Failed to delete filter");
    }
  }

  return (
    <div className="max-w-3xl">
      <h1 className="text-2xl font-bold mb-2">Noise Filters</h1>
      <p className="text-muted-foreground mb-6">
        Filter out noisy comments that skew your NPS score
      </p>

      {/* Existing filters */}
      {filters.length > 0 && (
        <div className="mb-8 space-y-3">
          {filters.map((f) => {
            const kws: string[] = JSON.parse(f.filterKeywords || "[]");
            const expanded = expandedFilters.has(f.id);
            const toggleExpand = () => {
              setExpandedFilters((prev) => {
                const next = new Set(prev);
                if (next.has(f.id)) {
                  next.delete(f.id);
                } else {
                  next.add(f.id);
                }
                return next;
              });
            };
            return (
              <Card key={f.id}>
                <CardContent className="flex items-start justify-between gap-4 pt-4">
                  <div className="flex-1 space-y-2">
                    <button
                      onClick={toggleExpand}
                      className="flex items-center gap-2 w-full text-left"
                    >
                      <ChevronRight className={`size-4 text-muted-foreground transition-transform ${expanded ? "rotate-90" : ""}`} />
                      <h3 className="text-base font-semibold text-foreground">
                        {f.name}
                      </h3>
                      {matchCounts[f.id] !== undefined && (
                        <span className="text-sm text-muted-foreground">
                          {matchCounts[f.id]} matches
                        </span>
                      )}
                      {f.excludeFromNps && (
                        <Badge variant="destructive">
                          Excluded from NPS
                        </Badge>
                      )}
                    </button>
                    {expanded && (
                      <div className="mt-2">
                        {f.description && (
                          <p className="text-sm text-muted-foreground mb-2">
                            {f.description}
                          </p>
                        )}
                        <div className="flex flex-wrap gap-1.5">
                          {kws.map((kw) => (
                            <Badge key={kw} variant="secondary">
                              {kw}
                            </Badge>
                          ))}
                        </div>
                      </div>
                    )}
                  </div>
                  <div className="flex items-center gap-1">
                    <Button
                      variant="ghost"
                      size="sm"
                      onClick={() => openEditDialog(f)}
                    >
                      <Pencil className="size-4 text-muted-foreground hover:text-primary" />
                    </Button>
                  <AlertDialog>
                    <AlertDialogTrigger>
                      <Button variant="ghost" size="sm">
                        <Trash2 className="size-4 text-muted-foreground hover:text-destructive" />
                      </Button>
                    </AlertDialogTrigger>
                    <AlertDialogContent>
                      <AlertDialogHeader>
                        <AlertDialogTitle>Delete noise filter?</AlertDialogTitle>
                        <AlertDialogDescription>
                          This will permanently remove the &quot;{f.name}&quot; filter.
                          Comments previously excluded will be included in NPS
                          calculations again.
                        </AlertDialogDescription>
                      </AlertDialogHeader>
                      <AlertDialogFooter>
                        <AlertDialogCancel>Cancel</AlertDialogCancel>
                        <AlertDialogAction
                          variant="destructive"
                          onClick={() => handleDelete(f.id, f.name)}
                        >
                          Delete
                        </AlertDialogAction>
                      </AlertDialogFooter>
                    </AlertDialogContent>
                  </AlertDialog>
                  </div>
                </CardContent>
              </Card>
            );
          })}
        </div>
      )}

      {/* Edit filter dialog */}
      <Dialog open={editDialogOpen} onOpenChange={setEditDialogOpen}>
        <DialogContent>
          <DialogHeader>
            <DialogTitle>Edit Noise Filter</DialogTitle>
          </DialogHeader>
          <div className="space-y-4 pt-2">
            <div className="space-y-2">
              <Label htmlFor="edit-filter-name">Filter name</Label>
              <Input
                id="edit-filter-name"
                value={editName}
                onChange={(e) => setEditName(e.target.value)}
              />
            </div>
            <div className="space-y-2">
              <Label htmlFor="edit-filter-description">Description (optional)</Label>
              <Input
                id="edit-filter-description"
                value={editDescription}
                onChange={(e) => setEditDescription(e.target.value)}
              />
            </div>
            <div className="space-y-2">
              <Label htmlFor="edit-filter-keywords">Keywords (comma-separated)</Label>
              <Input
                id="edit-filter-keywords"
                value={editKeywords}
                onChange={(e) => setEditKeywords(e.target.value)}
              />
            </div>
            <div className="flex items-center gap-2">
              <Checkbox
                id="edit-exclude-nps"
                checked={editExcludeFromNps}
                onCheckedChange={(checked) => setEditExcludeFromNps(checked)}
              />
              <Label htmlFor="edit-exclude-nps" className="font-normal">
                Exclude matching comments from NPS score calculation
              </Label>
            </div>
            <Button
              onClick={handleEditSave}
              disabled={editSaving || !editName.trim() || !editKeywords.trim()}
            >
              {editSaving ? (
                <Spinner size="sm" label="Saving..." />
              ) : (
                "Save Changes"
              )}
            </Button>
          </div>
        </DialogContent>
      </Dialog>

      {/* Create new filter */}
      <Card>
        <CardHeader>
          <CardTitle className="flex items-center gap-2">
            <Plus className="size-4" />
            New Noise Filter
          </CardTitle>
          <CardDescription>
            Define keywords to identify and exclude noisy comments
          </CardDescription>
        </CardHeader>
        <CardContent className="space-y-4">
          <div className="space-y-2">
            <Label htmlFor="filter-name">Filter name</Label>
            <Input
              id="filter-name"
              value={name}
              onChange={(e) => setName(e.target.value)}
              placeholder="e.g., ADS/SSMS Comparisons"
            />
          </div>

          <div className="space-y-2">
            <Label htmlFor="filter-description">Description (optional)</Label>
            <Input
              id="filter-description"
              value={description}
              onChange={(e) => setDescription(e.target.value)}
              placeholder="Brief description of what this filter catches"
            />
          </div>

          <div className="space-y-2">
            <Label htmlFor="filter-keywords">Keywords (comma-separated)</Label>
            <Input
              id="filter-keywords"
              value={keywords}
              onChange={(e) => {
                setKeywords(e.target.value);
                setMatchPreview(null);
              }}
              placeholder="e.g., ADS, SSMS, Azure Data Studio"
            />
            <div className="flex items-center gap-3">
              <Button
                variant="ghost"
                size="sm"
                onClick={previewMatches}
                disabled={!keywords.trim()}
              >
                <Eye className="size-3.5" />
                Preview matches
              </Button>
              {matchPreview !== null && (
                <span className="text-xs text-muted-foreground">
                  {matchPreview} comments match
                </span>
              )}
            </div>
            {/* Keyword pills preview */}
            {keywords.trim() && (
              <div className="flex flex-wrap gap-1.5 pt-1">
                {keywords
                  .split(",")
                  .map((k) => k.trim())
                  .filter(Boolean)
                  .map((kw) => (
                    <Badge key={kw} variant="outline" className="gap-1">
                      {kw}
                      <button
                        type="button"
                        onClick={() => {
                          const updated = keywords
                            .split(",")
                            .map((k) => k.trim())
                            .filter((k) => k && k !== kw)
                            .join(", ");
                          setKeywords(updated);
                          setMatchPreview(null);
                        }}
                        className="ml-0.5 rounded-full hover:bg-muted-foreground/20"
                      >
                        <X className="size-3" />
                      </button>
                    </Badge>
                  ))}
              </div>
            )}
          </div>

          <div className="flex items-center gap-2">
            <Checkbox
              id="exclude-nps"
              checked={excludeFromNps}
              onCheckedChange={(checked) =>
                setExcludeFromNps(checked)
              }
            />
            <Label htmlFor="exclude-nps" className="font-normal">
              Exclude matching comments from NPS score calculation
            </Label>
          </div>

          {saving && (
            <div className="p-3 rounded-lg bg-muted/50 border border-border">
              <Spinner size="sm" label="Creating noise filter..." />
            </div>
          )}

          <Button
            onClick={handleCreate}
            disabled={saving || !name.trim() || !keywords.trim()}
          >
            {saving ? (
              <Spinner size="sm" label="Creating..." />
            ) : (
              <>
                <Plus className="size-4" />
                Create Filter
              </>
            )}
          </Button>
        </CardContent>
      </Card>
    </div>
  );
}
