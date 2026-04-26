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
import { addChildAction } from "@/lib/family/person-write-actions";
import type { Person, UserProfile } from "@/lib/types";

type PersonAddChildSheetProps = {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  parentPerson: Person | null;
  currentUserProfile?: UserProfile | null;
  onSuccess?: () => void;
};

const TEXT = {
  title: "자녀 추가",
  description:
    "선택한 사람 아래 세대로 자녀를 등록합니다. generation_depth는 현재 세대보다 1단계 아래로 계산됩니다.",
  cancel: "취소",
  submit: "자녀 등록",
  pending: "등록 중...",
};

export function PersonAddChildSheet({
  open,
  onOpenChange,
  parentPerson,
  onSuccess,
}: PersonAddChildSheetProps) {
  const router = useRouter();
  const [isPending, startTransition] = useTransition();
  const [message, setMessage] = useState<string | null>(null);
  const [values, setValues] = useState(createEmptyPersonFormValues);

  useEffect(() => {
    if (open) {
      setValues(createEmptyPersonFormValues());
      setMessage(null);
    }
  }, [open, parentPerson?.id]);

  if (!parentPerson) {
    return null;
  }

  const currentParent = parentPerson;

  function handleChange<Key extends keyof typeof values>(field: Key, value: (typeof values)[Key]) {
    setValues((current) => ({
      ...current,
      [field]: value,
    }));
  }

  function handleSubmit(event: FormEvent<HTMLFormElement>) {
    event.preventDefault();
    const validationMessage = validatePersonFormValues(values, {
      requireBirthOrder: true,
    });

    if (validationMessage) {
      setMessage(validationMessage);
      return;
    }

    startTransition(async () => {
      const result = await addChildAction(currentParent.id, values);

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
      description={`${currentParent.full_name} 아래 자녀를 등록합니다. ${TEXT.description}`}
    >
      <form className="space-y-5" onSubmit={handleSubmit}>
        <PersonFormFields values={values} onChange={handleChange} showBirthOrder />

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
          <Button type="submit" className="flex-1" disabled={isPending}>
            {isPending ? TEXT.pending : TEXT.submit}
          </Button>
        </div>
      </form>
    </PersonSheetShell>
  );
}
