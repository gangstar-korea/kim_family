"use client";

import type { FormEvent } from "react";
import { useEffect, useState, useTransition } from "react";
import { useRouter } from "next/navigation";

import { PersonFormFields } from "@/components/family/person-form-fields";
import { PersonSheetShell } from "@/components/family/person-sheet-shell";
import { Button } from "@/components/ui/button";
import {
  createEmptyPersonFormValues,
  validatePersonFormValues,
} from "@/lib/family/person-write-adapter";
import { addSpouseAction } from "@/lib/family/person-write-actions";
import type { Person } from "@/lib/types";

type PersonAddSpouseSheetProps = {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  targetPerson: Person | null;
  spouseExists: boolean;
  onSuccess?: () => void;
};

const TEXT = {
  title: "배우자 추가",
  cancel: "취소",
  submit: "배우자 등록",
  spouseExists:
    "이미 배우자 관계가 등록되어 있어 이 단계에서는 추가 등록을 잠시 막아 둡니다.",
};

export function PersonAddSpouseSheet({
  open,
  onOpenChange,
  targetPerson,
  spouseExists,
  onSuccess,
}: PersonAddSpouseSheetProps) {
  const router = useRouter();
  const [isPending, startTransition] = useTransition();
  const [message, setMessage] = useState<string | null>(null);
  const [values, setValues] = useState(createEmptyPersonFormValues);

  useEffect(() => {
    if (open) {
      setValues(createEmptyPersonFormValues());
      setMessage(null);
    }
  }, [open, targetPerson?.id]);

  if (!targetPerson) {
    return null;
  }

  const currentTargetPerson = targetPerson;

  function handleChange<Key extends keyof typeof values>(field: Key, value: (typeof values)[Key]) {
    setValues((current) => ({
      ...current,
      [field]: value,
    }));
  }

  function handleSubmit(event: FormEvent<HTMLFormElement>) {
    event.preventDefault();

    if (spouseExists) {
      setMessage(TEXT.spouseExists);
      return;
    }

    const validationMessage = validatePersonFormValues(values);

    if (validationMessage) {
      setMessage(validationMessage);
      return;
    }

    startTransition(async () => {
      const result = await addSpouseAction(currentTargetPerson.id, values);

      if (!result.ok) {
        setMessage(result.message);
        return;
      }

      setMessage(null);
      onOpenChange(false);
      onSuccess?.();
      router.refresh();
    });
  }

  return (
    <PersonSheetShell
      open={open}
      onOpenChange={onOpenChange}
      title={TEXT.title}
      description={`${currentTargetPerson.full_name} 가구에 배우자를 등록합니다. generation_depth는 현재 인물과 동일하게 저장됩니다.`}
    >
      <form className="space-y-5" onSubmit={handleSubmit}>
        <PersonFormFields values={values} onChange={handleChange} />

        {message ? (
          <p className="rounded-xl border border-destructive/20 bg-destructive/5 px-3 py-2 text-sm text-destructive">
            {message}
          </p>
        ) : null}

        <div className="flex gap-2 pt-1">
          <Button
            type="button"
            variant="outline"
            className="flex-1"
            onClick={() => onOpenChange(false)}
            disabled={isPending}
          >
            {TEXT.cancel}
          </Button>
          <Button
            type="submit"
            className="flex-1"
            disabled={isPending || spouseExists}
          >
            {isPending ? "등록 중..." : TEXT.submit}
          </Button>
        </div>
      </form>
    </PersonSheetShell>
  );
}
