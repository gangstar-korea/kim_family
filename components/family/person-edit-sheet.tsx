"use client";

import type { FormEvent } from "react";
import { useEffect, useState, useTransition } from "react";
import { useRouter } from "next/navigation";

import { PersonFormFields } from "@/components/family/person-form-fields";
import { PersonSheetShell } from "@/components/family/person-sheet-shell";
import { Button } from "@/components/ui/button";
import {
  createEmptyPersonFormValues,
  createPersonFormValuesFromPerson,
  validatePersonFormValues,
} from "@/lib/family/person-write-adapter";
import { updatePersonAction } from "@/lib/family/person-write-actions";
import type { Person } from "@/lib/types";

type PersonEditSheetProps = {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  person: Person | null;
  onSuccess?: () => void;
};

const TEXT = {
  title: "가족 정보 수정",
  description:
    "현재 가족 정보를 바로 수정합니다. 분파, 세대, 내부 코드는 이 단계에서 바꾸지 않습니다.",
  cancel: "취소",
  submit: "수정 저장",
};

export function PersonEditSheet({
  open,
  onOpenChange,
  person,
  onSuccess,
}: PersonEditSheetProps) {
  const router = useRouter();
  const [isPending, startTransition] = useTransition();
  const [message, setMessage] = useState<string | null>(null);
  const [values, setValues] = useState(() =>
    person ? createPersonFormValuesFromPerson(person) : createEmptyPersonFormValues(),
  );

  useEffect(() => {
    if (person && open) {
      setValues(createPersonFormValuesFromPerson(person));
      setMessage(null);
    }
  }, [open, person]);

  if (!person) {
    return null;
  }

  const currentPerson = person;

  function handleChange<Key extends keyof typeof values>(field: Key, value: (typeof values)[Key]) {
    setValues((current) => ({
      ...current,
      [field]: value,
    }));
  }

  function handleSubmit(event: FormEvent<HTMLFormElement>) {
    event.preventDefault();
    const validationMessage = validatePersonFormValues(values);

    if (validationMessage) {
      setMessage(validationMessage);
      return;
    }

    startTransition(async () => {
      const result = await updatePersonAction(currentPerson.id, values);

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
      description={`${currentPerson.full_name} 정보를 수정합니다. ${TEXT.description}`}
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
          <Button type="submit" className="flex-1" disabled={isPending}>
            {isPending ? "저장 중..." : TEXT.submit}
          </Button>
        </div>
      </form>
    </PersonSheetShell>
  );
}
