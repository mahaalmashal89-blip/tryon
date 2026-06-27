"use client";

import { useRef, useState } from "react";
import type { OutfitSource, ClothingType } from "@/lib/types";
import { tryonSession, type GarmentDraft } from "@/lib/tryonSession";
import { compressImage, ImageTooLargeError } from "@/lib/compressImage";

export function useOutfitStore() {
  // Initialise from session so state survives back-navigation
  const [items, setItems] = useState<GarmentDraft[]>(() => tryonSession.getGarments());

  const [source,    setSource]    = useState<OutfitSource>("image");
  const [draftType, setDraftType] = useState<ClothingType | null>(null);
  const [draftUrl,  setDraftUrl]  = useState("");
  const [draftFile, setDraftFile] = useState<File | null>(null);
  const [draftPreview, setDraftPreview] = useState("");
  const [fileError,    setFileError]    = useState("");
  const [compressing,  setCompressing]  = useState(false);

  const fileInputRef = useRef<HTMLInputElement | null>(null);

  async function handleFileSelect(file: File | null) {
    if (!file) return;
    if (draftPreview) URL.revokeObjectURL(draftPreview);
    setFileError("");
    setCompressing(true);
    try {
      const compressed = await compressImage(file);
      const preview = URL.createObjectURL(compressed);
      setDraftFile(compressed);
      setDraftPreview(preview);
    } catch (err) {
      setFileError(
        err instanceof ImageTooLargeError
          ? err.message
          : "Could not process image. Please try another."
      );
    } finally {
      setCompressing(false);
    }
  }

  function syncToSession(next: GarmentDraft[]) {
    setItems(next);
    tryonSession.setGarments(next);
  }

  function addItem() {
    if (!draftType) return;

    const isUrl   = source === "url";
    const isImage = source === "image";

    if (isUrl && !draftUrl.trim()) return;
    if (isImage && !draftFile)     return;

    const newItem: GarmentDraft = {
      id:         Date.now(),
      type:       draftType,
      source:     isUrl ? "url" : "image",
      url:        isUrl ? draftUrl.trim() : "",
      file:       isImage ? draftFile : null,
      previewUrl: isImage ? draftPreview : "",
    };

    syncToSession([...items, newItem]);
    setDraftType(null);
    setDraftUrl("");
    setDraftFile(null);
    setDraftPreview("");
  }

  function removeItem(id: number) {
    const removed = items.find((i) => i.id === id);
    if (removed?.previewUrl) URL.revokeObjectURL(removed.previewUrl);
    syncToSession(items.filter((i) => i.id !== id));
  }

  return {
    items,
    source,
    setSource,
    draftType,
    setDraftType,
    draftUrl,
    setDraftUrl,
    draftFile,
    draftPreview,
    fileError,
    compressing,
    fileInputRef,
    handleFileSelect,
    addItem,
    removeItem,
  };
}
