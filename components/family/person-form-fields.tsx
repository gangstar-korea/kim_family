"use client";

import type { ReactNode } from "react";
import { useState } from "react";
import Script from "next/script";

import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import type { PersonFormValues } from "@/lib/types";
import { cn } from "@/lib/utils";

type PersonFormFieldsProps = {
  values: PersonFormValues;
  onChange: <Key extends keyof PersonFormValues>(
    field: Key,
    value: PersonFormValues[Key],
  ) => void;
  showBirthOrder?: boolean;
};

type PostcodeResult = {
  address: string;
  roadAddress: string;
  jibunAddress: string;
  userSelectedType: "R" | "J";
  bname: string;
  buildingName: string;
  apartment: "Y" | "N";
};

declare global {
  interface Window {
    kakao?: {
      Postcode: new (options: {
        oncomplete: (data: PostcodeResult) => void;
      }) => {
        open: () => void;
      };
    };
  }
}

const GENDER_OPTIONS = [
  { value: "__empty__", label: "선택 안 함" },
  { value: "male", label: "남성" },
  { value: "female", label: "여성" },
  { value: "unknown", label: "미지정" },
] as const;

const CALENDAR_OPTIONS = [
  { value: "solar", label: "양력" },
  { value: "lunar", label: "음력" },
] as const;

export function PersonFormFields({
  values,
  onChange,
  showBirthOrder = false,
}: PersonFormFieldsProps) {
  const [isPostcodeReady, setIsPostcodeReady] = useState(false);

  function openAddressSearch() {
    if (!window.kakao?.Postcode) {
      return;
    }

    new window.kakao.Postcode({
      oncomplete: (data) => {
        const baseAddress =
          data.userSelectedType === "R"
            ? data.roadAddress || data.address
            : data.jibunAddress || data.address;
        const extraAddress = buildExtraAddress(data);
        const fullBaseAddress = extraAddress
          ? `${baseAddress} ${extraAddress}`.trim()
          : baseAddress;

        onChange("address_base", fullBaseAddress);
      },
    }).open();
  }

  return (
    <>
      <Script
        src="https://t1.kakaocdn.net/mapjsapi/bundle/postcode/prod/postcode.v2.js"
        strategy="afterInteractive"
        onLoad={() => setIsPostcodeReady(true)}
      />

      <div className="space-y-4">
      <FormField label="이름" required htmlFor="full_name">
        <Input
          id="full_name"
            value={values.full_name}
            onChange={(event) => onChange("full_name", event.target.value)}
            placeholder="이름을 입력해 주세요"
          />
      </FormField>

      <div className="grid gap-4 md:grid-cols-[minmax(0,7.5rem)_minmax(0,8.5rem)_minmax(0,1fr)]">
        <FormField label="성별" htmlFor="gender">
          <select
            id="gender"
            value={values.gender || "__empty__"}
            onChange={(event) =>
              onChange(
                "gender",
                event.target.value === "__empty__"
                  ? ""
                  : (event.target.value as PersonFormValues["gender"]),
              )
            }
            className={cn(
              "flex h-12 w-full rounded-md border border-input bg-card px-3 py-2 text-sm outline-none transition-colors focus-visible:ring-2 focus-visible:ring-ring",
            )}
          >
            {GENDER_OPTIONS.map((option) => (
              <option key={option.value} value={option.value}>
                {option.label}
              </option>
            ))}
          </select>
        </FormField>

        <FormField label="달력 구분" htmlFor="birth_calendar_type">
          <select
            id="birth_calendar_type"
            value={values.birth_calendar_type}
            onChange={(event) =>
              onChange(
                "birth_calendar_type",
                event.target.value as PersonFormValues["birth_calendar_type"],
              )
            }
            className={cn(
              "flex h-12 w-full rounded-md border border-input bg-card px-3 py-2 text-sm outline-none transition-colors focus-visible:ring-2 focus-visible:ring-ring",
            )}
          >
            {CALENDAR_OPTIONS.map((option) => (
              <option key={option.value} value={option.value}>
                {option.label}
              </option>
            ))}
          </select>
        </FormField>

        <FormField label="생년월일" htmlFor="birth_year">
          <div className="grid grid-cols-[1.5fr_1fr_1fr] gap-2">
            <Input
              id="birth_year"
              inputMode="numeric"
              maxLength={4}
              value={values.birth_year}
              onChange={(event) => onChange("birth_year", event.target.value)}
              placeholder="연도"
            />
              <Input
                inputMode="numeric"
                maxLength={2}
                value={values.birth_month}
                onChange={(event) => onChange("birth_month", event.target.value)}
                placeholder="월"
              />
              <Input
                inputMode="numeric"
                maxLength={2}
                value={values.birth_day}
                onChange={(event) => onChange("birth_day", event.target.value)}
                placeholder="일"
              />
            </div>
          </FormField>
        </div>

        {values.birth_calendar_type === "lunar" ? (
          <label className="flex items-center gap-3 rounded-xl border border-border bg-muted/30 px-3 py-3 text-sm font-medium text-foreground">
            <input
              type="checkbox"
              checked={values.is_lunar_leap_month}
              onChange={(event) =>
                onChange("is_lunar_leap_month", event.target.checked)
              }
              className="h-4 w-4 rounded border-border text-primary focus:ring-ring"
            />
            <span>윤달</span>
          </label>
        ) : null}

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

        <FormField label="주소" htmlFor="address_base">
          <div className="space-y-2">
            <div className="flex gap-2">
              <Input
                id="address_base"
                value={values.address_base}
                onChange={(event) => onChange("address_base", event.target.value)}
                placeholder="주소 검색 또는 직접 입력"
              />
              <Button
                type="button"
                variant="outline"
                className="shrink-0"
                onClick={openAddressSearch}
                disabled={!isPostcodeReady}
              >
                주소 검색
              </Button>
            </div>
            <Input
              value={values.address_detail}
              onChange={(event) => onChange("address_detail", event.target.value)}
              placeholder="상세주소"
            />
            <p className="text-xs text-muted-foreground">
              검색으로 기본 주소를 넣고, 아래 칸에 동·호수 같은 상세주소를 적어 주세요.
            </p>
          </div>
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
    </>
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

function buildExtraAddress(data: PostcodeResult) {
  if (data.userSelectedType !== "R") {
    return "";
  }

  let extraAddress = "";

  if (data.bname && /[동로가]$/u.test(data.bname)) {
    extraAddress += data.bname;
  }

  if (data.buildingName && data.apartment === "Y") {
    extraAddress += extraAddress ? `, ${data.buildingName}` : data.buildingName;
  }

  return extraAddress ? `(${extraAddress})` : "";
}
