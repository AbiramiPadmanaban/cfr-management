"use client";

import { useEffect, useState } from "react";
import { useRouter } from "next/navigation";
import { setActionNeededAction } from "../server-actions/cfr-actions";

export function formatCfrDate(value: Date | string | null | undefined): string {
  if (!value) {
    return "—";
  }
  return new Date(value).toLocaleDateString("en-GB", {
    day: "2-digit",
    month: "2-digit",
    year: "numeric",
  });
}

export interface CfrActionNeededMarksProps {
  cfrId: number;
  received: boolean;
  actionNeeded: boolean | null;
}

export function CfrActionNeededMarks({
  cfrId,
  received,
  actionNeeded,
}: CfrActionNeededMarksProps) {
  const router = useRouter();
  const [value, setValue] = useState<boolean | null>(actionNeeded);
  const [isSaving, setIsSaving] = useState(false);

  useEffect(() => {
    setValue(actionNeeded);
  }, [actionNeeded]);

  if (!received) {
    return <span className="text-slate-300">—</span>;
  }

  const select = async (needed: boolean) => {
    if (isSaving) {
      return;
    }
    const previous = value;
    setValue(needed);
    setIsSaving(true);
    try {
      await setActionNeededAction(cfrId, needed);
      router.refresh();
    } catch {
      setValue(previous);
    } finally {
      setIsSaving(false);
    }
  };

  const TickIcon = () => (
    <svg className="h-6 w-6" viewBox="0 0 24 24" fill="none" aria-hidden="true">
      <circle cx="12" cy="12" r="10" fill="#16a34a" />
      <path
        d="M7.5 12.5l3 3 6-6.5"
        stroke="white"
        strokeWidth="2.2"
        strokeLinecap="round"
        strokeLinejoin="round"
      />
    </svg>
  );

  const WrongIcon = () => (
    <svg className="h-6 w-6" viewBox="0 0 24 24" fill="none" aria-hidden="true">
      <circle cx="12" cy="12" r="10" fill="#dc2626" />
      <path d="M8 8l8 8M16 8l-8 8" stroke="white" strokeWidth="2.2" strokeLinecap="round" />
    </svg>
  );

  return (
    <span className="inline-flex items-center gap-2">
      {value !== false && (
        <button
          type="button"
          onClick={() => select(true)}
          disabled={isSaving}
          className="inline-flex h-7 w-7 items-center justify-center rounded-full"
          title="Action needs to be taken: Yes"
        >
          <TickIcon />
        </button>
      )}
      {value !== true && (
        <button
          type="button"
          onClick={() => select(false)}
          disabled={isSaving}
          className="inline-flex h-7 w-7 items-center justify-center rounded-full"
          title="Action needs to be taken: No"
        >
          <WrongIcon />
        </button>
      )}
    </span>
  );
}
