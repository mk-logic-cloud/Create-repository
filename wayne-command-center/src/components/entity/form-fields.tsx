import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { NativeSelect } from "@/components/ui/native-select";
import { Textarea } from "@/components/ui/textarea";
import { cn } from "@/lib/utils";
import type { FieldDef, FormValues } from "./types";

function toInputValue(v: FormValues[string]): string {
  if (v === null || v === undefined) return "";
  if (Array.isArray(v)) return v.join(", ");
  return String(v);
}

export function FormFields({
  fields,
  values,
  errors,
}: {
  fields: FieldDef[];
  values?: FormValues;
  errors?: Record<string, string[] | undefined>;
}) {
  return (
    <div className="grid gap-4 sm:grid-cols-2">
      {fields.map((f) => {
        const id = `field-${f.name}`;
        const err = errors?.[f.name]?.[0];
        const describedBy = err ? `${id}-error` : f.hint ? `${id}-hint` : undefined;
        const common = {
          id,
          name: f.name,
          required: f.required,
          "aria-invalid": err ? true : undefined,
          "aria-describedby": describedBy,
          defaultValue: toInputValue(values?.[f.name]),
        } as const;
        const wide = f.full || f.type === "textarea";

        return (
          <div key={f.name} className={cn("grid gap-1.5", wide && "sm:col-span-2")}>
            <Label htmlFor={id}>
              {f.label}
              {f.required && <span className="text-primary" aria-hidden>*</span>}
            </Label>
            {f.type === "textarea" ? (
              <Textarea {...common} rows={f.rows ?? 3} maxLength={f.maxLength} placeholder={f.placeholder} />
            ) : f.type === "select" ? (
              <NativeSelect {...common}>
                {f.emptyOption !== undefined && <option value="">{f.emptyOption}</option>}
                {f.options?.map((o) => (
                  <option key={o.value} value={o.value}>{o.label}</option>
                ))}
              </NativeSelect>
            ) : (
              <Input
                {...common}
                type={f.type === "tags" ? "text" : f.type}
                inputMode={f.type === "number" ? "numeric" : f.type === "url" ? "url" : undefined}
                maxLength={f.maxLength}
                min={f.min}
                max={f.max}
                placeholder={f.placeholder}
              />
            )}
            {err ? (
              <p id={`${id}-error`} className="text-xs text-destructive">{err}</p>
            ) : f.hint ? (
              <p id={`${id}-hint`} className="text-xs text-muted-foreground">{f.hint}</p>
            ) : null}
          </div>
        );
      })}
    </div>
  );
}
