export function cfrStatusBadgeClass(status: string): string {
  switch (status) {
    case "SUBMITTED":
      return "bg-emerald-50 text-emerald-700 ring-1 ring-emerald-100";
    case "SENT":
      return "bg-violet-50 text-violet-700 ring-1 ring-violet-100";
    default:
      return "bg-amber-50 text-amber-800 ring-1 ring-amber-100";
  }
}

export function cfrStatusLabel(status: string): string {
  switch (status) {
    case "SUBMITTED":
      return "Submitted";
    case "SENT":
      return "Sent";
    case "DRAFT":
      return "Draft";
    default:
      return status;
  }
}

export function CfrStatusBadge({ status }: { status: string }) {
  return (
    <span
      className={`inline-flex items-center rounded-full px-2.5 py-1 text-[11px] font-semibold tracking-wide ${cfrStatusBadgeClass(
        status
      )}`}
    >
      {cfrStatusLabel(status)}
    </span>
  );
}
