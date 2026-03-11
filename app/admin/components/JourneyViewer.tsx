import { JourneyStep } from "@/lib/types";

export function JourneyViewer({ journey }: { journey: JourneyStep[] | null }) {
    if (!journey || journey.length === 0) {
        return (
            <div className="flex flex-col items-center justify-center py-12 text-muted">
                <div className="w-12 h-12 rounded-full bg-white/5 flex items-center justify-center mb-4">
                    <span className="text-xl italic">?</span>
                </div>
                <p className="text-sm italic">Nenhum dado de jornada capturado para este utilizador.</p>
            </div>
        );
    }

    return (
        <div className="relative pl-8 space-y-8 before:absolute before:left-[11px] before:top-2 before:bottom-2 before:w-[2px] before:bg-white/10">
            {journey.map((step, idx) => (
                <div key={idx} className="relative group">
                    {/* Dot */}
                    <div className="absolute -left-[35px] top-1.5 w-4 h-4 rounded-full border-2 border-brand bg-bg z-10 transition-transform group-hover:scale-125 group-hover:shadow-[0_0_8px_rgba(0,255,136,0.6)]" />

                    <div className="space-y-1">
                        <div className="flex items-center justify-between">
                            <h5 className="text-sm font-bold text-ink">{step.page}</h5>
                            <span className="text-[10px] text-muted font-mono whitespace-nowrap">
                                {new Date(step.timestamp).toLocaleTimeString([], { hour: '2-digit', minute: '2-digit', second: '2-digit' })}
                            </span>
                        </div>
                        <p className="text-[10px] text-zinc-500 font-mono italic truncate" title={step.url}>{step.url}</p>

                        {step.duration !== undefined && (
                            <div className="inline-flex items-center gap-1.5 mt-2 px-2 py-0.5 rounded-full bg-brand/10 border border-brand/20 text-[9px] font-bold text-brand uppercase tracking-tighter">
                                Tempo de permanência: {step.duration}s
                            </div>
                        )}
                    </div>
                </div>
            ))}

            {/* End point marker */}
            <div className="absolute -left-[33px] bottom-0 w-3 h-px bg-white/10" />
        </div>
    );
}
