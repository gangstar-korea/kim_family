import type { Person } from "@/lib/types";

const TEXT = {
  title: "이달의 생일",
  empty: "이번 달에 확인된 생일자가 없습니다.",
  solarGroup: "양력 생일",
  lunarGroup: "음력 생일",
  lunarLabel: "음력",
};

type MonthlyBirthdayBannerProps = {
  persons: Person[];
};

type BirthdayItem = {
  id: string;
  fullName: string;
  dateText: string;
  isLunar: boolean;
};

export function MonthlyBirthdayBanner({ persons }: MonthlyBirthdayBannerProps) {
  const month = new Date().getMonth() + 1;
  const livingVisiblePersons = persons.filter((person) => person.is_visible && person.is_alive);
  const solarBirthdays = livingVisiblePersons
    .filter((person) => person.birth_calendar_type !== "lunar")
    .map((person) => {
      const date = person.birth_date_solar ?? person.birth_date;
      return buildBirthdayItem(person, date, false);
    })
    .filter((item): item is BirthdayItem => Boolean(item))
    .filter((item) => getMonth(item.dateText) === month)
    .sort(sortBirthdayItems);
  const lunarBirthdays = livingVisiblePersons
    .filter((person) => person.birth_calendar_type === "lunar")
    .map((person) => buildBirthdayItem(person, person.birth_date_lunar ?? person.birth_date, true))
    .filter((item): item is BirthdayItem => Boolean(item))
    .filter((item) => getMonth(item.dateText) === month)
    .sort(sortBirthdayItems);

  if (solarBirthdays.length === 0 && lunarBirthdays.length === 0) {
    return (
      <section className="rounded-lg border border-border bg-card p-4 shadow-sm md:p-5">
        <div className="space-y-2">
          <h3 className="text-lg font-bold">{TEXT.title}</h3>
          <p className="text-sm leading-6 text-muted-foreground">{TEXT.empty}</p>
        </div>
      </section>
    );
  }

  return (
    <section className="rounded-lg border border-border bg-card p-4 shadow-sm md:p-5">
      <div className="space-y-4">
        <div className="space-y-1">
          <h3 className="text-lg font-bold">{TEXT.title}</h3>
          <p className="text-sm leading-6 text-muted-foreground">
            음력 생일자는 자동 양력 변환 없이 음력 기준 날짜로 함께 표시합니다.
          </p>
        </div>

        {solarBirthdays.length > 0 ? (
          <BirthdayGroup title={TEXT.solarGroup} items={solarBirthdays} />
        ) : null}

        {lunarBirthdays.length > 0 ? (
          <BirthdayGroup title={TEXT.lunarGroup} items={lunarBirthdays} />
        ) : null}
      </div>
    </section>
  );
}

function BirthdayGroup({
  title,
  items,
}: {
  title: string;
  items: BirthdayItem[];
}) {
  return (
    <div className="space-y-2">
      <p className="text-xs font-semibold text-muted-foreground">{title}</p>
      <div className="flex flex-wrap gap-2">
        {items.map((item) => (
          <div
            key={item.id}
            className="inline-flex items-center gap-2 rounded-full border border-border/70 bg-muted/30 px-3 py-2 text-sm"
          >
            <span className="font-semibold text-foreground">{item.fullName}</span>
            <span className="text-muted-foreground">{formatMonthDay(item.dateText)}</span>
            {item.isLunar ? (
              <span className="rounded-full bg-primary/10 px-2 py-0.5 text-[11px] font-semibold text-primary">
                {TEXT.lunarLabel}
              </span>
            ) : null}
          </div>
        ))}
      </div>
    </div>
  );
}

function buildBirthdayItem(person: Person, date: string | null, isLunar: boolean) {
  if (!date || !/^\d{4}-\d{2}-\d{2}$/.test(date)) {
    return null;
  }

  return {
    id: person.id,
    fullName: person.full_name,
    dateText: date,
    isLunar,
  };
}

function getMonth(dateText: string) {
  return Number(dateText.slice(5, 7));
}

function getDay(dateText: string) {
  return Number(dateText.slice(8, 10));
}

function formatMonthDay(dateText: string) {
  return `${Number(dateText.slice(5, 7))}월 ${Number(dateText.slice(8, 10))}일`;
}

function sortBirthdayItems(left: BirthdayItem, right: BirthdayItem) {
  const monthDiff = getMonth(left.dateText) - getMonth(right.dateText);
  if (monthDiff !== 0) {
    return monthDiff;
  }

  const dayDiff = getDay(left.dateText) - getDay(right.dateText);
  if (dayDiff !== 0) {
    return dayDiff;
  }

  return left.fullName.localeCompare(right.fullName, "ko-KR");
}
