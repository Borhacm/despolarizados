import { HistoriaShareOptions } from "@/components/HistoriaShareOptions";

type Props = {
  historiaId: string;
  title: string;
  url: string;
};

export function HistoriaShareBar({ historiaId, title, url }: Props) {
  return (
    <div className="flex flex-col gap-3 rounded-2xl border border-zinc-200/90 bg-zinc-50/80 px-4 py-3 dark:border-zinc-800 dark:bg-zinc-900/40 sm:flex-row sm:items-start sm:justify-between sm:gap-6">
      <div className="min-w-0 sm:max-w-[min(100%,14rem)] sm:pr-2">
        <p className="text-xs font-semibold uppercase tracking-[0.18em] text-zinc-500 dark:text-zinc-400">
          Compartir
        </p>
        <p className="mt-1.5 text-[11px] leading-snug text-zinc-500 dark:text-zinc-400">
          Al compartir el enlace, la vista previa (Open Graph) incluye portada y
          barra de cobertura. Instagram tiene opciones aparte.
        </p>
      </div>
      <div className="flex w-full min-w-0 justify-end sm:flex-1">
        <HistoriaShareOptions
          variant="bar"
          historiaId={historiaId}
          title={title}
          url={url}
        />
      </div>
    </div>
  );
}
