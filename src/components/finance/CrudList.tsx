import { useState, type ReactNode } from "react";
import { Pencil, Plus, Trash2 } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Empty, Field, Modal } from "./ui";

export interface FieldDef { key: string; label: string; type?: "text" | "number" | "date" | "select" | "textarea"; options?: { v: string; l: string }[]; full?: boolean }

/** Generic list + add/edit modal for simple registries. */
export function CrudList<T extends { id: string }>({
  items, fields, blank, onSave, onDelete, render, addLabel, newId,
}: {
  items: T[]; fields: FieldDef[]; blank: () => T; onSave: (t: T) => void; onDelete: (id: string) => void;
  render: (t: T) => ReactNode; addLabel: string; newId: () => string;
}) {
  const [edit, setEdit] = useState<T | null>(null);
  const rec = edit as unknown as Record<string, unknown>;
  return (
    <>
      <div className="mb-4 flex justify-end"><Button onClick={() => setEdit({ ...blank(), id: "" })}><Plus /> {addLabel}</Button></div>
      {items.length === 0 ? <Empty>Nada cadastrado ainda.</Empty> : (
        <div className="grid gap-3 md:grid-cols-2">
          {items.map((it) => (
            <div key={it.id} className="card-soft flex items-start gap-3 p-4">
              <div className="min-w-0 flex-1">{render(it)}</div>
              <button aria-label="Editar" onClick={() => setEdit(it)} className="rounded p-1.5 hover:bg-accent"><Pencil className="size-4" /></button>
              <button aria-label="Excluir" onClick={() => confirm("Excluir este cadastro?") && onDelete(it.id)} className="rounded p-1.5 text-muted-foreground hover:bg-destructive/10 hover:text-destructive"><Trash2 className="size-4" /></button>
            </div>
          ))}
        </div>
      )}
      <Modal open={!!edit} onOpenChange={(o) => !o && setEdit(null)} title={edit?.id ? "Editar" : addLabel}>
        {edit && (
          <form className="grid gap-3 sm:grid-cols-2" onSubmit={(e) => { e.preventDefault(); onSave({ ...edit, id: edit.id || newId() }); setEdit(null); }}>
            {fields.map((f) => {
              const v = rec[f.key] as string | number | undefined;
              const set = (val: string) => setEdit({ ...edit, [f.key]: f.type === "number" ? Number(val.replace(",", ".")) || 0 : val } as T);
              return (
                <Field key={f.key} label={f.label} className={f.full || f.type === "textarea" ? "sm:col-span-2" : ""}>
                  {f.type === "select" ? (
                    <select className="field" value={String(v ?? "")} onChange={(e) => set(e.target.value)}>{f.options!.map((o) => <option key={o.v} value={o.v}>{o.l}</option>)}</select>
                  ) : f.type === "textarea" ? (
                    <textarea className="field h-20 py-2" value={String(v ?? "")} onChange={(e) => set(e.target.value)} />
                  ) : (
                    <input className="field" type={f.type === "date" ? "date" : "text"} inputMode={f.type === "number" ? "decimal" : undefined} value={String(v ?? "")} onChange={(e) => set(e.target.value)} required={f.key === "name"} />
                  )}
                </Field>
              );
            })}
            <div className="flex justify-end gap-2 sm:col-span-2"><Button type="button" variant="ghost" onClick={() => setEdit(null)}>Cancelar</Button><Button type="submit">Salvar</Button></div>
          </form>
        )}
      </Modal>
    </>
  );
}
