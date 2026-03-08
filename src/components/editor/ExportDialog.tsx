// Export dialog with format/quality settings
import React, { useState, useRef } from "react";
import { Dialog, DialogContent, DialogHeader, DialogTitle } from "@/components/ui/dialog";
import { Button } from "@/components/ui/button";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Slider } from "@/components/ui/slider";
import { Label } from "@/components/ui/label";
import { Input } from "@/components/ui/input";
import { Switch } from "@/components/ui/switch";
import { Download, Loader2 } from "lucide-react";
import { toast } from "sonner";

interface ExportDialogProps {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  artboardWidth: number;
  artboardHeight: number;
  generatedImageUrl?: string | null;
}

export function ExportDialog({ open, onOpenChange, artboardWidth, artboardHeight, generatedImageUrl }: ExportDialogProps) {
  const [format, setFormat] = useState<"png" | "jpeg" | "webp" | "svg">("png");
  const [quality, setQuality] = useState(90);
  const [scale, setScale] = useState(1);
  const [includeBackground, setIncludeBackground] = useState(true);
  const [fileName, setFileName] = useState("export");
  const [exporting, setExporting] = useState(false);

  const exportWidth = Math.round(artboardWidth * scale);
  const exportHeight = Math.round(artboardHeight * scale);

  const handleExport = async () => {
    setExporting(true);
    try {
      // Create a canvas to composite the export
      const canvas = document.createElement("canvas");
      canvas.width = exportWidth;
      canvas.height = exportHeight;
      const ctx = canvas.getContext("2d");
      if (!ctx) throw new Error("Could not create canvas context");

      // Background
      if (includeBackground) {
        ctx.fillStyle = "#ffffff";
        ctx.fillRect(0, 0, exportWidth, exportHeight);
      }

      // Draw generated image if exists
      if (generatedImageUrl) {
        const img = new Image();
        img.crossOrigin = "anonymous";
        await new Promise<void>((resolve, reject) => {
          img.onload = () => resolve();
          img.onerror = () => reject(new Error("Failed to load image"));
          img.src = generatedImageUrl;
        });
        ctx.drawImage(img, 0, 0, exportWidth, exportHeight);
      }

      // Draw scene objects from the artboard DOM
      const artboardEl = document.querySelector('[data-artboard="true"]');
      if (artboardEl) {
        const objectEls = artboardEl.querySelectorAll('[data-scene-object]');
        for (const objEl of Array.from(objectEls)) {
          const imgEl = objEl.querySelector('img');
          if (imgEl && imgEl.src) {
            try {
              const img = new Image();
              img.crossOrigin = "anonymous";
              await new Promise<void>((resolve) => {
                img.onload = () => resolve();
                img.onerror = () => resolve();
                img.src = imgEl.src;
              });
              const style = window.getComputedStyle(objEl as HTMLElement);
              const el = objEl as HTMLElement;
              const left = parseFloat(el.style.left || "0") * scale;
              const top = parseFloat(el.style.top || "0") * scale;
              const width = parseFloat(el.style.width || "0") * scale;
              const height = parseFloat(el.style.height || "0") * scale;
              ctx.globalAlpha = parseFloat(style.opacity || "1");
              ctx.drawImage(img, left, top, width, height);
              ctx.globalAlpha = 1;
            } catch {}
          }
        }
      }

      // Convert to blob
      let mimeType = "image/png";
      if (format === "jpeg") mimeType = "image/jpeg";
      if (format === "webp") mimeType = "image/webp";

      const blob = await new Promise<Blob>((resolve, reject) => {
        canvas.toBlob(
          (b) => b ? resolve(b) : reject(new Error("Export failed")),
          mimeType,
          format === "png" ? undefined : quality / 100
        );
      });

      // Download
      const url = URL.createObjectURL(blob);
      const a = document.createElement("a");
      a.href = url;
      a.download = `${fileName}.${format}`;
      document.body.appendChild(a);
      a.click();
      document.body.removeChild(a);
      URL.revokeObjectURL(url);

      toast.success(`Exported as ${fileName}.${format} (${exportWidth}×${exportHeight})`);
      onOpenChange(false);
    } catch (err: any) {
      console.error("Export error:", err);
      toast.error(err.message || "Export failed");
    } finally {
      setExporting(false);
    }
  };

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="max-w-sm">
        <DialogHeader>
          <DialogTitle className="font-display">Export</DialogTitle>
        </DialogHeader>
        <div className="space-y-4 pt-2">
          <div>
            <Label className="text-xs text-muted-foreground">File Name</Label>
            <Input value={fileName} onChange={(e) => setFileName(e.target.value)} className="h-8 text-xs mt-0.5" />
          </div>

          <div>
            <Label className="text-xs text-muted-foreground">Format</Label>
            <Select value={format} onValueChange={(v) => setFormat(v as any)}>
              <SelectTrigger className="h-8 text-xs mt-0.5"><SelectValue /></SelectTrigger>
              <SelectContent>
                <SelectItem value="png">PNG (lossless)</SelectItem>
                <SelectItem value="jpeg">JPEG (lossy)</SelectItem>
                <SelectItem value="webp">WebP (modern)</SelectItem>
              </SelectContent>
            </Select>
          </div>

          {format !== "png" && (
            <div>
              <Label className="text-xs text-muted-foreground">Quality: {quality}%</Label>
              <Slider
                value={[quality]}
                onValueChange={([v]) => setQuality(v)}
                min={10}
                max={100}
                step={5}
                className="mt-1"
              />
            </div>
          )}

          <div>
            <Label className="text-xs text-muted-foreground">Scale: {scale}x</Label>
            <Select value={String(scale)} onValueChange={(v) => setScale(Number(v))}>
              <SelectTrigger className="h-8 text-xs mt-0.5"><SelectValue /></SelectTrigger>
              <SelectContent>
                <SelectItem value="0.5">0.5x</SelectItem>
                <SelectItem value="1">1x</SelectItem>
                <SelectItem value="2">2x</SelectItem>
                <SelectItem value="3">3x</SelectItem>
                <SelectItem value="4">4x</SelectItem>
              </SelectContent>
            </Select>
            <p className="text-[10px] text-muted-foreground mt-0.5">{exportWidth} × {exportHeight} px</p>
          </div>

          <div className="flex items-center justify-between">
            <Label className="text-xs">Include background</Label>
            <Switch checked={includeBackground} onCheckedChange={setIncludeBackground} />
          </div>

          <Button
            className="w-full gradient-primary text-primary-foreground text-xs"
            onClick={handleExport}
            disabled={exporting}
          >
            {exporting ? <Loader2 className="h-3.5 w-3.5 animate-spin mr-1" /> : <Download className="h-3.5 w-3.5 mr-1" />}
            {exporting ? "Exporting..." : `Export as ${format.toUpperCase()}`}
          </Button>
        </div>
      </DialogContent>
    </Dialog>
  );
}
