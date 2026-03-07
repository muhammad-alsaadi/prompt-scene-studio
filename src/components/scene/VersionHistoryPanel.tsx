import { useSceneStore } from "@/store/scene-store";
import { Button } from "@/components/ui/button";
import { RotateCcw, Copy, Clock, Image as ImageIcon } from "lucide-react";

export function VersionHistoryPanel() {
  const { versions, loadVersion } = useSceneStore();

  return (
    <div className="flex flex-col h-full">
      <div className="px-3 py-2 border-b">
        <h3 className="font-display font-semibold text-[10px] uppercase tracking-wider text-muted-foreground flex items-center gap-1.5">
          <Clock className="h-3 w-3" /> Versions
        </h3>
      </div>

      <div className="flex-1 overflow-y-auto">
        {versions.length === 0 ? (
          <div className="text-center py-8 text-muted-foreground">
            <Clock className="h-6 w-6 mx-auto mb-1.5 opacity-30" />
            <p className="text-[11px]">No versions yet</p>
            <p className="text-[10px] mt-0.5">Generate an image to save a version</p>
          </div>
        ) : (
          <div className="p-2 space-y-2">
            {versions.map((v, i) => (
              <div key={v.id} className="rounded-lg border bg-secondary/20 overflow-hidden">
                {v.image_url ? (
                  <img src={v.image_url} alt="Version" className="w-full h-24 object-cover" />
                ) : (
                  <div className="w-full h-16 bg-muted flex items-center justify-center">
                    <ImageIcon className="h-4 w-4 text-muted-foreground/30" />
                  </div>
                )}
                <div className="p-2">
                  <div className="flex items-center justify-between mb-0.5">
                    <span className="text-[10px] font-display font-semibold">
                      {v.version_label || `v${versions.length - i}`}
                    </span>
                    <span className="text-[10px] text-muted-foreground">
                      {new Date(v.created_at).toLocaleTimeString([], { hour: "2-digit", minute: "2-digit" })}
                    </span>
                  </div>
                  <p className="text-[10px] text-muted-foreground truncate mb-1.5">
                    {v.generated_prompt}
                  </p>
                  <div className="flex gap-1">
                    <Button variant="outline" size="sm" className="h-5 text-[10px] flex-1 px-1" onClick={() => loadVersion(v)}>
                      <RotateCcw className="h-2.5 w-2.5 mr-0.5" /> Load
                    </Button>
                    <Button variant="outline" size="sm" className="h-5 text-[10px] flex-1 px-1" onClick={() => {
                      const copy = { ...v, id: crypto.randomUUID(), created_at: new Date().toISOString(), version_label: `${v.version_label || "v" + (versions.length - i)} copy` };
                      loadVersion(copy);
                    }}>
                      <Copy className="h-2.5 w-2.5 mr-0.5" /> Dup
                    </Button>
                  </div>
                </div>
              </div>
            ))}
          </div>
        )}
      </div>
    </div>
  );
}
