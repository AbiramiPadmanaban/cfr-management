"use client";

import { useEffect, useId, useMemo, useRef, useState } from "react";
import { CalendarDays, ChevronDown, ChevronLeft, ChevronRight } from "lucide-react";
import { fieldClass } from "./cfr-ui";

const WEEKDAY_LABELS = ["M", "T", "W", "T", "F", "S", "S"] as const;
const MONTH_LABELS = [
  "January",
  "February",
  "March",
  "April",
  "May",
  "June",
  "July",
  "August",
  "September",
  "October",
  "November",
  "December",
] as const;
const SHORT_MONTHS = [
  "Jan",
  "Feb",
  "Mar",
  "Apr",
  "May",
  "Jun",
  "Jul",
  "Aug",
  "Sep",
  "Oct",
  "Nov",
  "Dec",
] as const;

export interface CfrDateRangePickerProps {
  dateFrom: string;
  dateTo: string;
  onChange: (dateFrom: string, dateTo: string) => void;
}

function toIsoDate(date: Date): string {
  const year = date.getFullYear();
  const month = String(date.getMonth() + 1).padStart(2, "0");
  const day = String(date.getDate()).padStart(2, "0");
  return `${year}-${month}-${day}`;
}

function parseIsoDate(value: string): Date | null {
  if (!/^\d{4}-\d{2}-\d{2}$/.test(value)) {
    return null;
  }
  const parsed = new Date(`${value}T00:00:00`);
  return Number.isNaN(parsed.getTime()) ? null : parsed;
}

function formatDisplayDate(value: string): string {
  const date = parseIsoDate(value);
  if (!date) {
    return value;
  }
  const day = String(date.getDate()).padStart(2, "0");
  return `${day}-${SHORT_MONTHS[date.getMonth()]}-${date.getFullYear()}`;
}

function startOfMonth(date: Date): Date {
  return new Date(date.getFullYear(), date.getMonth(), 1);
}

function addMonths(date: Date, amount: number): Date {
  return new Date(date.getFullYear(), date.getMonth() + amount, 1);
}

function isSameDay(a: Date, b: Date): boolean {
  return (
    a.getFullYear() === b.getFullYear() &&
    a.getMonth() === b.getMonth() &&
    a.getDate() === b.getDate()
  );
}

function isBeforeDay(a: Date, b: Date): boolean {
  return toIsoDate(a) < toIsoDate(b);
}

function isInRange(day: Date, from: Date | null, to: Date | null): boolean {
  if (!from || !to) {
    return false;
  }
  const value = toIsoDate(day);
  return value > toIsoDate(from) && value < toIsoDate(to);
}

function buildCalendarDays(month: Date): Date[] {
  const first = startOfMonth(month);
  // Monday-based week index (Mon=0 ... Sun=6)
  const mondayIndex = (first.getDay() + 6) % 7;
  const gridStart = new Date(first);
  gridStart.setDate(first.getDate() - mondayIndex);

  return Array.from({ length: 42 }, (_, index) => {
    const day = new Date(gridStart);
    day.setDate(gridStart.getDate() + index);
    return day;
  });
}

export function CfrDateRangePicker({ dateFrom, dateTo, onChange }: CfrDateRangePickerProps) {
  const rootRef = useRef<HTMLDivElement>(null);
  const yearListId = useId();
  const [open, setOpen] = useState(false);
  const [viewMonth, setViewMonth] = useState(() => {
    const from = parseIsoDate(dateFrom);
    return startOfMonth(from ?? new Date());
  });
  const [draftFrom, setDraftFrom] = useState<Date | null>(() => parseIsoDate(dateFrom));
  const [draftTo, setDraftTo] = useState<Date | null>(() => parseIsoDate(dateTo));
  const [yearDraft, setYearDraft] = useState(() => String((parseIsoDate(dateFrom) ?? new Date()).getFullYear()));
  const [yearFocused, setYearFocused] = useState(false);

  useEffect(() => {
    if (!open) {
      return;
    }
    const from = parseIsoDate(dateFrom);
    const to = parseIsoDate(dateTo);
    const nextMonth = startOfMonth(from ?? to ?? new Date());
    setDraftFrom(from);
    setDraftTo(to);
    setViewMonth(nextMonth);
    if (!yearFocused) {
      setYearDraft(String(nextMonth.getFullYear()));
    }
  }, [open, dateFrom, dateTo, yearFocused]);

  useEffect(() => {
    if (!yearFocused) {
      setYearDraft(String(viewMonth.getFullYear()));
    }
  }, [viewMonth, yearFocused]);

  useEffect(() => {
    if (!open) {
      return;
    }

    const onPointerDown = (event: MouseEvent) => {
      if (!rootRef.current?.contains(event.target as Node)) {
        setOpen(false);
      }
    };
    const onKeyDown = (event: KeyboardEvent) => {
      if (event.key === "Escape") {
        setOpen(false);
      }
    };

    document.addEventListener("mousedown", onPointerDown);
    document.addEventListener("keydown", onKeyDown);
    return () => {
      document.removeEventListener("mousedown", onPointerDown);
      document.removeEventListener("keydown", onKeyDown);
    };
  }, [open]);

  const days = useMemo(() => buildCalendarDays(viewMonth), [viewMonth]);
  const currentYear = new Date().getFullYear();
  const yearOptions = useMemo(() => {
    const years: number[] = [];
    for (let year = currentYear - 15; year <= currentYear + 5; year += 1) {
      years.push(year);
    }
    const viewYear = viewMonth.getFullYear();
    if (!years.includes(viewYear)) {
      years.push(viewYear);
      years.sort((a, b) => a - b);
    }
    return years;
  }, [currentYear, viewMonth]);

  const label =
    dateFrom && dateTo
      ? `${formatDisplayDate(dateFrom)} to ${formatDisplayDate(dateTo)}`
      : dateFrom
        ? `${formatDisplayDate(dateFrom)} to …`
        : "Select date range";

  const setViewMonthValue = (monthIndex: number) => {
    setViewMonth(new Date(viewMonth.getFullYear(), monthIndex, 1));
  };

  const setViewYearValue = (year: number) => {
    if (!Number.isFinite(year)) {
      return;
    }
    setViewMonth(new Date(year, viewMonth.getMonth(), 1));
  };

  const handleDayClick = (day: Date) => {
    if (!draftFrom || (draftFrom && draftTo)) {
      setDraftFrom(day);
      setDraftTo(null);
      return;
    }

    let nextFrom = draftFrom;
    let nextTo = day;
    if (isBeforeDay(day, draftFrom)) {
      nextFrom = day;
      nextTo = draftFrom;
    }

    setDraftFrom(nextFrom);
    setDraftTo(nextTo);
    onChange(toIsoDate(nextFrom), toIsoDate(nextTo));
    setOpen(false);
  };

  const clearRange = () => {
    setDraftFrom(null);
    setDraftTo(null);
    onChange("", "");
    setOpen(false);
  };

  return (
    <div ref={rootRef} className="relative min-w-0">
      <button
        type="button"
        onClick={() => setOpen((prev) => !prev)}
        className={`${fieldClass()} flex items-center gap-2 text-left`}
        aria-label="Date range"
        aria-expanded={open}
        aria-haspopup="dialog"
      >
        <CalendarDays className="h-4 w-4 shrink-0 text-zinc-400" aria-hidden="true" />
        <span
          className={`min-w-0 flex-1 truncate ${
            dateFrom || dateTo ? "text-ink" : "text-zinc-400"
          }`}
        >
          {label}
        </span>
        <ChevronDown className="h-4 w-4 shrink-0 text-zinc-400" aria-hidden="true" />
      </button>

      {open && (
        <div
          role="dialog"
          aria-label="Choose date range"
          className="absolute top-[calc(100%+6px)] right-0 z-40 w-[300px] rounded-xl border border-line bg-white p-3 shadow-[0_12px_32px_rgba(24,24,27,0.12)]"
        >
          <div className="mb-3 flex items-center justify-between gap-1 px-1">
            <button
              type="button"
              onClick={() => setViewMonth((month) => addMonths(month, -1))}
              className="inline-flex h-8 w-8 shrink-0 items-center justify-center rounded-lg text-muted transition-colors hover:bg-zinc-50 hover:text-ink"
              aria-label="Previous month"
            >
              <ChevronLeft className="h-4 w-4" aria-hidden="true" />
            </button>

            <div className="flex min-w-0 flex-1 items-center justify-center gap-1.5">
              <select
                value={viewMonth.getMonth()}
                onChange={(e) => setViewMonthValue(Number(e.target.value))}
                className="h-8 max-w-[7.5rem] cursor-pointer rounded-lg border border-line bg-white px-2 text-sm font-semibold text-ink outline-none transition-colors hover:bg-zinc-50 focus:border-accent focus:ring-2 focus:ring-accent/15"
                aria-label="Month"
              >
                {MONTH_LABELS.map((monthLabel, index) => (
                  <option key={monthLabel} value={index}>
                    {monthLabel}
                  </option>
                ))}
              </select>

              <input
                type="number"
                value={yearDraft}
                min={1900}
                max={2100}
                onFocus={() => setYearFocused(true)}
                onChange={(e) => {
                  const nextValue = e.target.value;
                  setYearDraft(nextValue);
                  const nextYear = Number.parseInt(nextValue, 10);
                  if (Number.isFinite(nextYear) && nextYear >= 1900 && nextYear <= 2100) {
                    setViewYearValue(nextYear);
                  }
                }}
                onBlur={() => {
                  setYearFocused(false);
                  const nextYear = Number.parseInt(yearDraft, 10);
                  if (!Number.isFinite(nextYear) || nextYear < 1900 || nextYear > 2100) {
                    setYearDraft(String(viewMonth.getFullYear()));
                    return;
                  }
                  setViewYearValue(nextYear);
                  setYearDraft(String(nextYear));
                }}
                list={yearListId}
                className="h-8 w-[4.5rem] rounded-lg border border-line bg-white px-2 text-center text-sm font-semibold text-ink outline-none transition-colors hover:bg-zinc-50 focus:border-accent focus:ring-2 focus:ring-accent/15 [appearance:textfield] [&::-webkit-inner-spin-button]:appearance-none [&::-webkit-outer-spin-button]:appearance-none"
                aria-label="Year"
              />
              <datalist id={yearListId}>
                {yearOptions.map((year) => (
                  <option key={year} value={year} />
                ))}
              </datalist>
            </div>

            <button
              type="button"
              onClick={() => setViewMonth((month) => addMonths(month, 1))}
              className="inline-flex h-8 w-8 shrink-0 items-center justify-center rounded-lg text-muted transition-colors hover:bg-zinc-50 hover:text-ink"
              aria-label="Next month"
            >
              <ChevronRight className="h-4 w-4" aria-hidden="true" />
            </button>
          </div>

          <div className="mb-1 grid grid-cols-7 gap-1">
            {WEEKDAY_LABELS.map((labelText, index) => (
              <div
                key={`${labelText}-${index}`}
                className="flex h-8 items-center justify-center text-[11px] font-medium text-muted"
              >
                {labelText}
              </div>
            ))}
          </div>

          <div className="grid grid-cols-7 gap-1">
            {days.map((day) => {
              const inCurrentMonth = day.getMonth() === viewMonth.getMonth();
              const isStart = draftFrom ? isSameDay(day, draftFrom) : false;
              const isEnd = draftTo ? isSameDay(day, draftTo) : false;
              const inRange = isInRange(day, draftFrom, draftTo);
              const isEndpoint = isStart || isEnd;

              return (
                <button
                  key={toIsoDate(day)}
                  type="button"
                  onClick={() => handleDayClick(day)}
                  className={`flex h-9 items-center justify-center rounded-lg text-sm transition-colors ${
                    isEndpoint
                      ? "border border-accent bg-accent-soft font-semibold text-accent"
                      : inRange
                        ? "bg-accent-soft/70 text-ink"
                        : inCurrentMonth
                          ? "text-ink hover:bg-zinc-50"
                          : "text-zinc-300 hover:bg-zinc-50"
                  }`}
                >
                  {day.getDate()}
                </button>
              );
            })}
          </div>

          <div className="mt-3 flex items-center justify-between border-t border-line pt-2">
            <p className="text-[11px] text-muted">
              {draftFrom && !draftTo ? "Select end date" : "Select start and end dates"}
            </p>
            <button
              type="button"
              onClick={clearRange}
              className="rounded-lg px-2 py-1 text-xs font-medium text-muted transition-colors hover:bg-zinc-50 hover:text-ink"
            >
              Clear
            </button>
          </div>
        </div>
      )}
    </div>
  );
}
