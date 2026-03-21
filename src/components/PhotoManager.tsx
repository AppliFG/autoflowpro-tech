import { useState, useRef } from "react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Plus, X, Star, GripVertical, Link, Upload } from "lucide-react";

export interface ManagedPhoto {
  url: string;
  isPrimary: boolean;
  file?: File;
}

interface Props {
  photos: ManagedPhoto[];
  onChange: (photos: ManagedPhoto[]) => void;
  maxPhotos?: number;
}

export default function PhotoManager({ photos, onChange, maxPhotos = 10 }: Props) {
  const fileRef = useRef<HTMLInputElement>(null);
  const [urlInput, setUrlInput] = useState("");
  const [showUrlInput, setShowUrlInput] = useState(false);
  const [dragIndex, setDragIndex] = useState<number | null>(null);

  const addFiles = (e: React.ChangeEvent<HTMLInputElement>) => {
    const files = Array.from(e.target.files || []);
    if (photos.length + files.length > maxPhotos) return;
    const newPhotos: ManagedPhoto[] = files.map((f) => ({
      url: URL.createObjectURL(f),
      isPrimary: false,
      file: f,
    }));
    const updated = [...photos, ...newPhotos];
    if (updated.length > 0 && !updated.some((p) => p.isPrimary)) updated[0].isPrimary = true;
    onChange(updated);
    if (fileRef.current) fileRef.current.value = "";
  };

  const addUrl = () => {
    if (!urlInput.trim() || photos.length >= maxPhotos) return;
    const updated = [...photos, { url: urlInput.trim(), isPrimary: photos.length === 0 }];
    onChange(updated);
    setUrlInput("");
    setShowUrlInput(false);
  };

  const remove = (index: number) => {
    const updated = photos.filter((_, i) => i !== index);
    if (updated.length > 0 && !updated.some((p) => p.isPrimary)) updated[0].isPrimary = true;
    onChange(updated);
  };

  const setPrimary = (index: number) => {
    const updated = photos.map((p, i) => ({ ...p, isPrimary: i === index }));
    onChange(updated);
  };

  const handleDragStart = (index: number) => setDragIndex(index);
  const handleDragOver = (e: React.DragEvent, index: number) => {
    e.preventDefault();
    if (dragIndex === null || dragIndex === index) return;
    const updated = [...photos];
    const [moved] = updated.splice(dragIndex, 1);
    updated.splice(index, 0, moved);
    setDragIndex(index);
    onChange(updated);
  };
  const handleDragEnd = () => setDragIndex(null);

  return (
    <div>
      <div className="flex items-center justify-between mb-2">
        <span className="text-sm font-medium text-card-foreground">
          Photos <span className="text-muted-foreground font-normal">({photos.length}/{maxPhotos})</span>
        </span>
        <div className="flex gap-1">
          <Button type="button" variant="outline" size="sm" onClick={() => setShowUrlInput(!showUrlInput)}>
            <Link className="h-3.5 w-3.5 mr-1" />URL
          </Button>
          <Button type="button" variant="outline" size="sm" onClick={() => fileRef.current?.click()} disabled={photos.length >= maxPhotos}>
            <Upload className="h-3.5 w-3.5 mr-1" />Fichier
          </Button>
        </div>
      </div>

      {showUrlInput && (
        <div className="flex gap-2 mb-3">
          <Input value={urlInput} onChange={(e) => setUrlInput(e.target.value)} placeholder="https://..." className="flex-1" onKeyDown={(e) => e.key === "Enter" && (e.preventDefault(), addUrl())} />
          <Button type="button" size="sm" onClick={addUrl}>Ajouter</Button>
        </div>
      )}

      <div className="grid grid-cols-3 sm:grid-cols-4 md:grid-cols-5 gap-2">
        {photos.map((photo, i) => (
          <div
            key={i}
            draggable
            onDragStart={() => handleDragStart(i)}
            onDragOver={(e) => handleDragOver(e, i)}
            onDragEnd={handleDragEnd}
            className={`relative group rounded-lg border-2 overflow-hidden aspect-[4/3] ${photo.isPrimary ? "border-primary" : "border-border"} ${dragIndex === i ? "opacity-50" : ""}`}
          >
            <img src={photo.url} alt="" className="w-full h-full object-cover" />
            <div className="absolute inset-0 bg-foreground/0 group-hover:bg-foreground/30 transition-colors" />
            <div className="absolute top-1 left-1 cursor-grab">
              <GripVertical className="h-4 w-4 text-background/80 drop-shadow" />
            </div>
            <button type="button" onClick={() => setPrimary(i)} className="absolute bottom-1 left-1">
              <Star className={`h-4 w-4 drop-shadow ${photo.isPrimary ? "text-yellow-400 fill-yellow-400" : "text-background/60"}`} />
            </button>
            <button type="button" onClick={() => remove(i)} className="absolute top-1 right-1 bg-destructive text-destructive-foreground rounded-full p-0.5 opacity-0 group-hover:opacity-100 transition-opacity">
              <X className="h-3 w-3" />
            </button>
            {photo.isPrimary && (
              <span className="absolute bottom-1 right-1 bg-primary text-primary-foreground text-[8px] px-1 rounded font-medium">★</span>
            )}
          </div>
        ))}
        {photos.length < maxPhotos && (
          <button
            type="button"
            onClick={() => fileRef.current?.click()}
            className="rounded-lg border-2 border-dashed border-border aspect-[4/3] flex flex-col items-center justify-center gap-1 text-muted-foreground hover:border-primary hover:text-primary transition-colors"
          >
            <Plus className="h-5 w-5" />
            <span className="text-[10px]">Ajouter</span>
          </button>
        )}
      </div>
      <input ref={fileRef} type="file" accept="image/*" multiple className="hidden" onChange={addFiles} />
    </div>
  );
}
