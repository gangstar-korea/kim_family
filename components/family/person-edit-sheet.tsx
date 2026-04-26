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
  title: "\uAC00\uC871 \uC815\uBCF4 \uC218\uC815",
  description:
    "\uD604\uC7AC \uAC00\uC871 \uC815\uBCF4\uB97C \uBC14\uB85C \uC218\uC815\uD569\uB2C8\uB2E4. \uBD84\uD30C, \uC138\uB300, \uB0B4\uBD80 \uCF54\uB4DC\uB294 \uC774 \uB2E8\uACC4\uC5D0\uC11C \uBC14\uAFB8\uC9C0 \uC54A\uC2B5\uB2C8\uB2E4.",
  cancel: "\uCDE8\uC18C",
  submit: "\uC218\uC815 \uC800\uC7A5",
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
      description={`${currentPerson.full_name} \uC815\uBCF4\uB97C \uC218\uC815\uD569\uB2C8\uB2E4. ${TEXT.description}`}
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
            {isPending ? "\uC800\uC7A5 \uC911..." : TEXT.submit}
          </Button>
        </div>
      </form>
    </PersonSheetShell>
  );
}
