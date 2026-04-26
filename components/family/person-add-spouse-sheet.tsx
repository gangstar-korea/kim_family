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
  title: "\uBC30\uC6B0\uC790 \uCD94\uAC00",
  cancel: "\uCDE8\uC18C",
  submit: "\uBC30\uC6B0\uC790 \uB4F1\uB85D",
  spouseExists:
    "\uC774\uBBF8 \uBC30\uC6B0\uC790 \uAD00\uACC4\uAC00 \uB4F1\uB85D\uB418\uC5B4 \uC788\uC5B4 \uC774 \uB2E8\uACC4\uC5D0\uC11C\uB294 \uCD94\uAC00 \uB4F1\uB85D\uC744 \uC7A0\uC2DC \uB9C9\uC544 \uB461\uB2C8\uB2E4.",
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
      description={`${currentTargetPerson.full_name} \uAC00\uAD6C\uC5D0 \uBC30\uC6B0\uC790\uB97C \uB4F1\uB85D\uD569\uB2C8\uB2E4. generation_depth\uB294 \uD604\uC7AC \uC778\uBB3C\uACFC \uB3D9\uC77C\uD558\uAC8C \uC800\uC7A5\uB429\uB2C8\uB2E4.`}
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
            {isPending ? "\uB4F1\uB85D \uC911..." : TEXT.submit}
          </Button>
        </div>
      </form>
    </PersonSheetShell>
  );
}
