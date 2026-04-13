"use client";

import { useState } from "react";
import { useRouter } from "next/navigation";
import { toast } from "sonner";
import { BoardType } from "@prisma/client";

type Board = {
  id: string;
  name: string;
  shaper: string | null;
  boardType: BoardType;
  lengthStr: string | null;
  widthStr: string | null;
  thicknessStr: string | null;
  volumeL: number | null;
  purchasedAt: Date | string | null;
  notes: string | null;
};

const BOARD_TYPES: { value: BoardType; label: string }[] = [
  { value: "SHORTBOARD", label: "Shortboard" },
  { value: "FISH", label: "Fish" },
  { value: "FUNBOARD", label: "Funboard" },
  { value: "MID_LENGTH", label: "Mid-Length" },
  { value: "LONGBOARD", label: "Longboard" },
  { value: "GUN", label: "Gun" },
  { value: "FOIL", label: "Foil" },
  { value: "OTHER", label: "Other" },
];

const BOARD_TYPE_LABELS: Record<BoardType, string> = {
  SHORTBOARD: "Shortboard",
  FISH: "Fish",
  FUNBOARD: "Funboard",
  MID_LENGTH: "Mid-Length",
  LONGBOARD: "Longboard",
  GUN: "Gun",
  FOIL: "Foil",
  OTHER: "Other",
};

type FormState = {
  name: string;
  shaper: string;
  boardType: BoardType;
  lengthStr: string;
  widthStr: string;
  thicknessStr: string;
  volumeL: string;
  purchasedAt: string;
  notes: string;
};

const emptyForm = (): FormState => ({
  name: "",
  shaper: "",
  boardType: "SHORTBOARD",
  lengthStr: "",
  widthStr: "",
  thicknessStr: "",
  volumeL: "",
  purchasedAt: "",
  notes: "",
});

function boardToForm(b: Board): FormState {
  let purchasedAt = "";
  if (b.purchasedAt) {
    const d = new Date(b.purchasedAt);
    purchasedAt = d.toISOString().split("T")[0];
  }
  return {
    name: b.name,
    shaper: b.shaper ?? "",
    boardType: b.boardType,
    lengthStr: b.lengthStr ?? "",
    widthStr: b.widthStr ?? "",
    thicknessStr: b.thicknessStr ?? "",
    volumeL: b.volumeL != null ? String(b.volumeL) : "",
    purchasedAt,
    notes: b.notes ?? "",
  };
}

export function QuiverClient({ initialBoards }: { initialBoards: Board[] }) {
  const router = useRouter();
  const [boards, setBoards] = useState<Board[]>(initialBoards);
  const [showForm, setShowForm] = useState(false);
  const [editingId, setEditingId] = useState<string | null>(null);
  const [form, setForm] = useState<FormState>(emptyForm());
  const [saving, setSaving] = useState(false);

  function openAdd() {
    setEditingId(null);
    setForm(emptyForm());
    setShowForm(true);
  }

  function openEdit(board: Board) {
    setEditingId(board.id);
    setForm(boardToForm(board));
    setShowForm(true);
  }

  function cancel() {
    setShowForm(false);
    setEditingId(null);
  }

  function set(field: keyof FormState, value: string) {
    setForm((f) => ({ ...f, [field]: value }));
  }

  async function handleSubmit(e: React.FormEvent) {
    e.preventDefault();
    if (!form.name.trim()) { toast.error("Board name is required"); return; }

    setSaving(true);
    const payload = {
      ...form,
      volumeL: form.volumeL ? parseFloat(form.volumeL) : null,
      purchasedAt: form.purchasedAt || null,
    };

    const url = editingId ? `/api/boards/${editingId}` : "/api/boards";
    const method = editingId ? "PATCH" : "POST";

    const res = await fetch(url, {
      method,
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify(payload),
    });
    setSaving(false);

    if (!res.ok) {
      const err = await res.json();
      toast.error(err.error ?? "Save failed");
      return;
    }

    const saved: Board = await res.json();
    if (editingId) {
      setBoards((prev) => prev.map((b) => (b.id === editingId ? saved : b)));
      toast.success("Board updated");
    } else {
      setBoards((prev) => [saved, ...prev]);
      toast.success("Board added");
    }
    setShowForm(false);
    setEditingId(null);
    router.refresh();
  }

  async function handleDelete(id: string) {
    const res = await fetch(`/api/boards/${id}`, { method: "DELETE" });
    if (res.ok) {
      setBoards((prev) => prev.filter((b) => b.id !== id));
      toast.success("Board removed");
      router.refresh();
    } else {
      toast.error("Delete failed");
    }
  }

  const inputClass =
    "w-full bg-transparent border-0 border-b border-border px-0 py-1.5 text-xs uppercase tracking-wide focus:outline-none focus:border-foreground/50 text-foreground placeholder:text-muted-foreground/30 transition-colors";
  const labelClass =
    "block text-[9px] tracking-widest uppercase text-muted-foreground text-center mb-1";

  return (
    <div className="flex flex-col h-full">
      {/* Page header */}
      <div className="border-b border-border px-6 py-3 flex items-center justify-between">
        <div>
          <p className="text-[10px] tracking-widest uppercase text-muted-foreground">Equipment</p>
          <h1 className="text-sm uppercase tracking-wide font-medium">// My Quiver</h1>
        </div>
        {!showForm && (
          <button
            onClick={openAdd}
            className="bg-foreground text-background border border-foreground px-4 py-1.5 text-[10px] tracking-widest uppercase font-medium hover:opacity-90 transition-opacity"
          >
            + Add Board
          </button>
        )}
      </div>

      <div className="flex-1 overflow-auto">
        {/* Inline form */}
        {showForm && (
          <form onSubmit={handleSubmit} className="border-b border-border">
            <div className="px-6 py-6 space-y-5">
              {/* Board name */}
              <div>
                <label className={labelClass}>Board Name *</label>
                <input
                  type="text"
                  value={form.name}
                  onChange={(e) => set("name", e.target.value)}
                  className={inputClass}
                  placeholder="e.g. Love Machine FM 8'1"
                  autoFocus
                />
              </div>

              {/* Shaper + Type */}
              <div className="grid grid-cols-2 gap-6">
                <div>
                  <label className={labelClass}>Shaper</label>
                  <input
                    type="text"
                    value={form.shaper}
                    onChange={(e) => set("shaper", e.target.value)}
                    className={inputClass}
                    placeholder="e.g. Ryan Lovelace"
                  />
                </div>
                <div>
                  <label className={labelClass}>Type</label>
                  <select
                    value={form.boardType}
                    onChange={(e) => set("boardType", e.target.value)}
                    className={`${inputClass} cursor-pointer`}
                  >
                    {BOARD_TYPES.map((t) => (
                      <option key={t.value} value={t.value}>{t.label.toUpperCase()}</option>
                    ))}
                  </select>
                </div>
              </div>

              {/* Length + Width + Thickness */}
              <div className="grid grid-cols-3 gap-6">
                <div>
                  <label className={labelClass}>Length</label>
                  <input
                    type="text"
                    value={form.lengthStr}
                    onChange={(e) => set("lengthStr", e.target.value)}
                    className={inputClass}
                    placeholder={`8'1"`}
                  />
                </div>
                <div>
                  <label className={labelClass}>Width</label>
                  <input
                    type="text"
                    value={form.widthStr}
                    onChange={(e) => set("widthStr", e.target.value)}
                    className={inputClass}
                    placeholder={`21-5/8"`}
                  />
                </div>
                <div>
                  <label className={labelClass}>Thickness</label>
                  <input
                    type="text"
                    value={form.thicknessStr}
                    onChange={(e) => set("thicknessStr", e.target.value)}
                    className={inputClass}
                    placeholder={`3-1/8"`}
                  />
                </div>
              </div>

              {/* Volume + Purchase date */}
              <div className="grid grid-cols-2 gap-6">
                <div>
                  <label className={labelClass}>Volume (L)</label>
                  <input
                    type="number"
                    step="0.01"
                    value={form.volumeL}
                    onChange={(e) => set("volumeL", e.target.value)}
                    className={inputClass}
                    placeholder="58.25"
                  />
                </div>
                <div>
                  <label className={labelClass}>Purchase Date</label>
                  <input
                    type="date"
                    value={form.purchasedAt}
                    onChange={(e) => set("purchasedAt", e.target.value)}
                    className={inputClass}
                  />
                </div>
              </div>

              {/* Actions */}
              <div className="flex items-center gap-3 pt-2">
                <button
                  type="submit"
                  disabled={saving}
                  className="bg-foreground text-background px-5 py-2.5 text-[10px] tracking-widest uppercase font-medium hover:opacity-90 transition-opacity disabled:opacity-50"
                >
                  {saving ? "Saving…" : editingId ? "Update Board" : "Add Board"}
                </button>
                <button
                  type="button"
                  onClick={cancel}
                  className="border border-border px-5 py-2.5 text-[10px] tracking-widest uppercase hover:bg-muted transition-colors"
                >
                  Cancel
                </button>
              </div>
            </div>
          </form>
        )}

        {/* Board list */}
        {boards.length === 0 && !showForm ? (
          <div className="p-12 text-center">
            <p className="text-xs text-muted-foreground tracking-widest uppercase mb-3">No boards in your quiver.</p>
            <button
              onClick={openAdd}
              className="text-[10px] tracking-widest uppercase hover:underline"
            >
              Add your first board →
            </button>
          </div>
        ) : (
          <div className="divide-y divide-border">
            {boards.map((board) => {
              const dims = [board.lengthStr, board.widthStr, board.thicknessStr]
                .filter(Boolean)
                .join(`" X `);
              const dimStr = dims ? `${dims}"` : null;
              const vol = board.volumeL != null ? `${board.volumeL}L` : null;
              const purchasedStr = board.purchasedAt
                ? `Purchased ${new Date(board.purchasedAt).toLocaleDateString("en-AU", { month: "short", year: "numeric" }).toUpperCase()}`
                : null;
              const meta = [dimStr, vol, purchasedStr].filter(Boolean).join(" · ");

              return (
                <div key={board.id} className="px-6 py-5 flex items-center justify-between gap-4">
                  <div className="min-w-0">
                    <div className="flex items-center gap-3 mb-1 flex-wrap">
                      <p className="text-sm uppercase tracking-wide font-medium">{board.name}</p>
                      <span className="text-[9px] tracking-widest uppercase border border-border px-1.5 py-0.5 text-muted-foreground flex-shrink-0">
                        {BOARD_TYPE_LABELS[board.boardType]}
                      </span>
                    </div>
                    {board.shaper && (
                      <p className="text-[10px] tracking-widest uppercase text-muted-foreground mb-1">{board.shaper}</p>
                    )}
                    {meta && (
                      <p className="text-[10px] tracking-widest uppercase text-muted-foreground/60">{meta}</p>
                    )}
                  </div>
                  <div className="flex items-center gap-2 flex-shrink-0">
                    <button
                      onClick={() => openEdit(board)}
                      className="border border-border px-3 py-1.5 text-[9px] tracking-widest uppercase hover:bg-muted transition-colors"
                    >
                      Edit
                    </button>
                    <button
                      onClick={() => handleDelete(board.id)}
                      className="border border-border/50 px-3 py-1.5 text-[9px] tracking-widest uppercase text-muted-foreground hover:border-destructive/50 hover:text-destructive transition-colors"
                    >
                      Delete
                    </button>
                  </div>
                </div>
              );
            })}
          </div>
        )}
      </div>
    </div>
  );
}
