export default function Stat({ label, value }) {
  return (
    <div className="rounded-lg bg-secondary/40 border border-border px-3 py-2.5">
      <div className="text-[10px] uppercase tracking-wide text-muted-foreground">{label}</div>
      <div className="text-base font-semibold mt-0.5 truncate">{value}</div>
    </div>
  );
}