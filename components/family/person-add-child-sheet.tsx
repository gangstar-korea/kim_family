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
import type { Person } from "@/lib/types";

type PersonAddChildSheetProps = {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  parentPerson: Person | null;
  onSuccess?: () => void;
};

const TEXT = {
  title: "\uC790\uB140 \uCD94\uAC00",
  cancel: "\uCDE8\uC18C",
  submit: "\uC790\uB140 \uB4F1\uB85D",
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
      const result = await addChildAction(parentPerson.id, values);

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
      description={`${parentPerson.full_name} \uC544\uB798 \uC138\uB300\uB85C \uC790\uB140\uB97C \uB4F1\uB85D\uD569\uB2C8\uB2E4. generation_depth\uB294 \uD604\uC7AC \uC778\uBB3C\uBCF4\uB2E4 1 \uB2E8\uACC4 \uC544\uB798\uB85C \uACC4\uC0B0\uB429\uB2C8\uB2E4.`}
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
            {isPending ? "\uB4F1\uB85D \uC911..." : TEXT.submit}
          </Button>
        </div>
      </form>
    </PersonSheetShell>
  );
}
