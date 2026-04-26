"use client";

import type { ReactNode } from "react";

import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import type { PersonFormValues } from "@/lib/types";
import { cn } from "@/lib/utils";

type PersonFormFieldsProps = {
  values: PersonFormValues;
  onChange: <Key extends keyof PersonFormValues>(field: Key, value: PersonFormValues[Key]) => void;
  showBirthOrder?: boolean;
};

const GENDER_OPTIONS = [
  { value: "__empty__", label: "\uC120\uD0DD \uC548 \uD568" },
  { value: "male", label: "\uB0A8\uC131" },
  { value: "female", label: "\uC5EC\uC131" },
  { value: "unknown", label: "\uBBF8\uC9C0\uC815" },
] as const;

export function PersonFormFields({
  values,
  onChange,
  showBirthOrder = false,
}: PersonFormFieldsProps) {
  return (
    <div className="space-y-4">
      <FormField label="\uC774\uB984" required htmlFor="full_name">
        <Input
          id="full_name"
          value={values.full_name}
          onChange={(event) => onChange("full_name", event.target.value)}
          placeholder="\uC774\uB984\uC744 \uC785\uB825\uD574 \uC8FC\uC138\uC694"
        />
      </FormField>

      <div className="grid gap-4 sm:grid-cols-2">
        <FormField label="\uC131\uBCC4" htmlFor="gender">
          <Select
            value={values.gender || "__empty__"}
            onValueChange={(value) =>
              onChange(
                "gender",
                value === "__empty__" ? "" : (value as PersonFormValues["gender"]),
              )
            }
          >
            <SelectTrigger id="gender">
              <SelectValue placeholder="\uC131\uBCC4 \uC120\uD0DD" />
            </SelectTrigger>
            <SelectContent>
              {GENDER_OPTIONS.map((option) => (
                <SelectItem key={option.value} value={option.value}>
                  {option.label}
                </SelectItem>
              ))}
            </SelectContent>
          </Select>
        </FormField>

        <FormField label="\uC0DD\uB144\uC6D4\uC77C" htmlFor="birth_date">
          <Input
            id="birth_date"
            type="date"
            value={values.birth_date}
            onChange={(event) => onChange("birth_date", event.target.value)}
          />
        </FormField>
      </div>

      {showBirthOrder ? (
        <FormField label="\uCD9C\uC0DD \uC21C\uC11C" htmlFor="birth_order">
          <Input
            id="birth_order"
            type="number"
            min={1}
            step={1}
            value={values.birth_order}
            onChange={(event) => onChange("birth_order", event.target.value)}
            placeholder="\uC608: 1"
          />
        </FormField>
      ) : null}

      <label className="flex items-center gap-3 rounded-xl border border-border bg-muted/30 px-3 py-3 text-sm font-medium text-foreground">
        <input
          type="checkbox"
          checked={values.is_alive}
          onChange={(event) => onChange("is_alive", event.target.checked)}
          className="h-4 w-4 rounded border-border text-primary focus:ring-ring"
        />
        <span>\uC0DD\uC874\uC790</span>
      </label>

      {!values.is_alive ? (
        <FormField label="\uBCC4\uC138\uC77C" htmlFor="deceased_date">
          <Input
            id="deceased_date"
            type="date"
            value={values.deceased_date}
            onChange={(event) => onChange("deceased_date", event.target.value)}
          />
        </FormField>
      ) : null}

      <FormField label="\uC5F0\uB77D\uCC98" htmlFor="phone">
        <Input
          id="phone"
          inputMode="tel"
          value={values.phone}
          onChange={(event) => onChange("phone", event.target.value)}
          placeholder="010-0000-0000"
        />
      </FormField>

      <FormField label="\uC8FC\uC18C" htmlFor="address">
        <Input
          id="address"
          value={values.address}
          onChange={(event) => onChange("address", event.target.value)}
          placeholder="\uC8FC\uC18C\uB97C \uC785\uB825\uD574 \uC8FC\uC138\uC694"
        />
      </FormField>

      <FormField label="\uC9C0\uC5ED" htmlFor="region">
        <Input
          id="region"
          value={values.region}
          onChange={(event) => onChange("region", event.target.value)}
          placeholder="\uC9C0\uC5ED \uC815\uBCF4(\uC120\uD0DD)"
        />
      </FormField>

      <FormField label="\uBA54\uBAA8" htmlFor="memo">
        <textarea
          id="memo"
          rows={4}
          value={values.memo}
          onChange={(event) => onChange("memo", event.target.value)}
          placeholder="\uAC00\uC871 \uBA54\uBAA8\uB97C \uB0A8\uACA8 \uC8FC\uC138\uC694"
          className={cn(
            "flex min-h-28 w-full rounded-md border border-input bg-card px-3 py-3 text-sm outline-none transition-colors placeholder:text-muted-foreground focus-visible:ring-2 focus-visible:ring-ring",
          )}
        />
      </FormField>
    </div>
  );
}

function FormField({
  label,
  htmlFor,
  required = false,
  children,
}: {
  label: string;
  htmlFor: string;
  required?: boolean;
  children: ReactNode;
}) {
  return (
    <div className="space-y-2">
      <Label htmlFor={htmlFor}>
        {label}
        {required ? <span className="ml-1 text-primary">*</span> : null}
      </Label>
      {children}
    </div>
  );
}
