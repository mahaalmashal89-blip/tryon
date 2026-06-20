"use client";

import { useState } from "react";
import type { OutfitItem, OutfitSource, ClothingType } from "@/lib/types";

export function useOutfitStore() {
  const [items, setItems] = useState<OutfitItem[]>([
    { id: 1, name: "Beige blazer",    type: "Jacket",     source: "Link" },
    { id: 2, name: "White inner top", type: "Top / Shirt", source: "Link" },
  ]);
  const [source, setSource] = useState<OutfitSource>("url");
  const [draftType, setDraftType] = useState<ClothingType | null>(null);

  function addItem() {
    if (!draftType) return;
    setItems((prev) => [
      ...prev,
      {
        id: Date.now(),
        name: draftType,
        type: draftType,
        source: source === "url" ? "Link" : "Image",
      },
    ]);
    setDraftType(null);
  }

  function removeItem(id: number) {
    setItems((prev) => prev.filter((it) => it.id !== id));
  }

  return { items, source, setSource, draftType, setDraftType, addItem, removeItem };
}
