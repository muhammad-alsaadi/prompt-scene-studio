import { useSceneStore } from "@/store/scene-store";
import { Button } from "@/components/ui/button";
import { RotateCcw, Copy, Clock } from "lucide-react";

export function VersionHistoryPanel() {
  const { versions, loadVersion } = useSceneStore();

  return (
    <div className="p-4">
      <h3 className="font-display font-semibold text-sm flex items-center gap-2 mb-4">
        <Clock className="h-4 w-4 text-primary" /> Version History
      </h3>

      {versions.length === 0 ? (
        <div className="text-center py-8 text-muted-foreground text-sm">
          <Clock className="h-8 w-8 mx-auto mb-2 opacity-30" />
          <p>No versions saved yet</p>
          <p className="text-xs mt-1">Generate an image to create a version</p>
        </div>
      ) : (
        <div className="space-y-3">
          {versions.map((v, i) => (
            <div key={v.id} className="rounded-xl border bg-secondary/30 overflow-hidden">
              {v.image_url && (
                <img src={v.image_url} alt="Version" className="w-full h-28 object-cover" />
              )}
              <div className="p-3">
                <div className="flex items-center justify-between mb-1">
                  <span className="text-xs font-display font-semibold">v{versions.length - i}</span>
                  <span className="text-xs text-muted-foreground">
                    {new Date(v.created_at).toLocaleTimeString()}
                  </span>
                </div>
                <p className="text-xs text-muted-foreground truncate mb-2">
                  {v.generated_prompt}
                </p>
                <div className="flex gap-1">
                  <Button variant="outline" size="sm" className="h-6 text-xs flex-1" onClick={() => loadVersion(v)}>
                    <RotateCcw className="h-3 w-3 mr-1" /> Load
                  </Button>
                  <Button variant="outline" size="sm" className="h-6 text-xs flex-1" onClick={() => {
                    const copy = { ...v, id: crypto.randomUUID(), created_at: new Date().toISOString() };
                    loadVersion(copy);
                  }}>
                    <Copy className="h-3 w-3 mr-1" /> Duplicate
                  </Button>
                </div>
              </div>
            </div>
          ))}
        </div>
      )}
    </div>
  );
}
