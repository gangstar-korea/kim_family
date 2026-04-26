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
  { value: "__empty__", label: "선택 안 함" },
  { value: "male", label: "남성" },
  { value: "female", label: "여성" },
  { value: "unknown", label: "미지정" },
] as const;

export function PersonFormFields({
  values,
  onChange,
  showBirthOrder = false,
}: PersonFormFieldsProps) {
  return (
    <div className="space-y-4">
      <FormField label="이름" required htmlFor="full_name">
        <Input
          id="full_name"
          value={values.full_name}
          onChange={(event) => onChange("full_name", event.target.value)}
          placeholder="이름을 입력해 주세요"
        />
      </FormField>

      <div className="grid gap-4 sm:grid-cols-2">
        <FormField label="성별" htmlFor="gender">
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
              <SelectValue placeholder="성별 선택" />
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

        <FormField label="생년월일" htmlFor="birth_date">
          <Input
            id="birth_date"
            type="date"
            value={values.birth_date}
            onChange={(event) => onChange("birth_date", event.target.value)}
          />
        </FormField>
      </div>

      {showBirthOrder ? (
        <FormField label="출생 순서" htmlFor="birth_order">
          <Input
            id="birth_order"
            type="number"
            min={1}
            step={1}
            value={values.birth_order}
            onChange={(event) => onChange("birth_order", event.target.value)}
            placeholder="예: 1"
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
        <span>생존자</span>
      </label>

      {!values.is_alive ? (
        <FormField label="별세일" htmlFor="deceased_date">
          <Input
            id="deceased_date"
            type="date"
            value={values.deceased_date}
            onChange={(event) => onChange("deceased_date", event.target.value)}
          />
        </FormField>
      ) : null}

      <FormField label="연락처" htmlFor="phone">
        <Input
          id="phone"
          inputMode="tel"
          value={values.phone}
          onChange={(event) => onChange("phone", event.target.value)}
          placeholder="010-0000-0000"
        />
      </FormField>

      <FormField label="주소" htmlFor="address">
        <Input
          id="address"
          value={values.address}
          onChange={(event) => onChange("address", event.target.value)}
          placeholder="주소를 입력해 주세요"
        />
      </FormField>

      <FormField label="지역" htmlFor="region">
        <Input
          id="region"
          value={values.region}
          onChange={(event) => onChange("region", event.target.value)}
          placeholder="지역 정보(선택)"
        />
      </FormField>

      <FormField label="메모" htmlFor="memo">
        <textarea
          id="memo"
          rows={4}
          value={values.memo}
          onChange={(event) => onChange("memo", event.target.value)}
          placeholder="가족 메모를 남겨 주세요"
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
