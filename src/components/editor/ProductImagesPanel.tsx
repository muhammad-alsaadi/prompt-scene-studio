// Product Images panel for Ad Composition mode
import React, { useState, useEffect, useRef } from "react";
import { useSceneStore } from "@/store/scene-store";
import { supabase } from "@/integrations/supabase/client";
import { useAuth } from "@/contexts/AuthContext";
import { toast } from "sonner";
import { Button } from "@/components/ui/button";
import { Plus, Trash2, Image as ImageIcon, Upload, Loader2 } from "lucide-react";

interface ProductImage {
  id: string;
  url: string;
  name: string;
}

export function ProductImagesPanel({ projectId }: { projectId?: string | null }) {
  const { user } = useAuth();
  const { setUploadedAssetRefs, uploadedAssetRefs, addObject } = useSceneStore();
  const [images, setImages] = useState<ProductImage[]>([]);
  const [uploading, setUploading] = useState(false);
  const fileRef = useRef<HTMLInputElement>(null);

  // Sync from store
  useEffect(() => {
    setImages(uploadedAssetRefs.map(r => ({ id: r.assetId, url: r.url, name: r.role })));
  }, []);

  const handleUpload = async (files: FileList | null) => {
    if (!files || !user) return;
    setUploading(true);

    const newImages: ProductImage[] = [];
    for (const file of Array.from(files).filter(f => f.type.startsWith("image/"))) {
      try {
        const ext = file.name.split(".").pop() || "png";
        const fileName = `${user.id}/products/${Date.now()}-${Math.random().toString(36).slice(2)}.${ext}`;

        const { error } = await supabase.storage
          .from("generated-images")
          .upload(fileName, file, { contentType: file.type });
        if (error) throw error;

        const { data: urlData } = supabase.storage
          .from("generated-images")
          .getPublicUrl(fileName);

        const img: ProductImage = {
          id: crypto.randomUUID(),
          url: urlData.publicUrl,
          name: file.name.replace(/\.[^.]+$/, ""),
        };
        newImages.push(img);
      } catch (err: any) {
        toast.error(`Failed to upload ${file.name}`);
      }
    }

    const all = [...images, ...newImages];
    setImages(all);
    setUploadedAssetRefs(all.map(i => ({ assetId: i.id, url: i.url, role: "product" })));
    setUploading(false);
    if (newImages.length > 0) toast.success(`${newImages.length} product image(s) added`);
  };

  const removeImage = (id: string) => {
    const filtered = images.filter(i => i.id !== id);
    setImages(filtered);
    setUploadedAssetRefs(filtered.map(i => ({ assetId: i.id, url: i.url, role: "product" })));
  };

  const addToCanvas = (img: ProductImage) => {
    addObject({
      type: "uploaded_image",
      objectType: "uploaded_image",
      name: img.name,
      asset_url: img.url,
      x: 100 + Math.random() * 200,
      y: 100 + Math.random() * 200,
      width: 200,
      height: 200,
      importance: "high",
    });
    toast.success(`"${img.name}" added to canvas`);
  };

  return (
    <div className="border-b">
      <div className="flex items-center justify-between px-3 py-2 border-b">
        <span className="text-[10px] font-display font-semibold uppercase tracking-wider text-muted-foreground flex items-center gap-1">
          <ImageIcon className="h-3 w-3" />
          Product Images
          <span className="text-[9px] font-normal ml-1 tabular-nums">({images.length})</span>
        </span>
        <Button
          size="sm"
          variant="ghost"
          className="h-5 w-5 p-0"
          onClick={() => fileRef.current?.click()}
          disabled={uploading}
        >
          {uploading ? <Loader2 className="h-3 w-3 animate-spin" /> : <Plus className="h-3 w-3" />}
        </Button>
      </div>

      <input
        ref={fileRef}
        type="file"
        accept="image/*"
        multiple
        className="hidden"
        onChange={(e) => handleUpload(e.target.files)}
      />

      <div className="px-2 py-2 space-y-1.5">
        {images.length === 0 ? (
          <button
            className="w-full border-2 border-dashed border-border/60 rounded-lg py-4 flex flex-col items-center gap-1.5 text-muted-foreground hover:border-primary/40 hover:text-primary transition-colors"
            onClick={() => fileRef.current?.click()}
          >
            <Upload className="h-5 w-5 opacity-50" />
            <span className="text-[10px]">Upload product images</span>
            <span className="text-[9px] opacity-60">These will be used in generation</span>
          </button>
        ) : (
          <>
            <div className="grid grid-cols-2 gap-1.5">
              {images.map(img => (
                <div
                  key={img.id}
                  className="group relative rounded-md border overflow-hidden bg-muted/30 aspect-square cursor-pointer hover:ring-1 hover:ring-primary/40 transition-all"
                  onClick={() => addToCanvas(img)}
                >
                  <img src={img.url} alt={img.name} className="w-full h-full object-cover" />
                  <div className="absolute inset-0 bg-black/0 group-hover:bg-black/30 transition-colors flex items-center justify-center">
                    <Plus className="h-4 w-4 text-white opacity-0 group-hover:opacity-100 transition-opacity" />
                  </div>
                  <button
                    className="absolute top-0.5 right-0.5 p-0.5 rounded bg-black/50 text-white opacity-0 group-hover:opacity-100 transition-opacity"
                    onClick={(e) => { e.stopPropagation(); removeImage(img.id); }}
                  >
                    <Trash2 className="h-2.5 w-2.5" />
                  </button>
                  <span className="absolute bottom-0 left-0 right-0 bg-black/50 text-white text-[8px] px-1 py-0.5 truncate">
                    {img.name}
                  </span>
                </div>
              ))}
            </div>
            <Button
              variant="outline"
              size="sm"
              className="w-full h-6 text-[10px]"
              onClick={() => fileRef.current?.click()}
            >
              <Upload className="h-3 w-3 mr-1" /> Add More
            </Button>
          </>
        )}
      </div>
    </div>
  );
}
