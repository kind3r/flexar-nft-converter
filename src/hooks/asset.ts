"use client"

import { useEffect, useState } from "react";
import { DasAsset } from "@/types/das";

const PLACEHOLDER_IMAGE = "https://via.placeholder.com/300";

export default function useAsset(asset: DasAsset) {
  const [image, setImage] = useState<string>(PLACEHOLDER_IMAGE);
  const [name, setName] = useState<string>("");

  useEffect(() => {
    if (typeof asset.content !== "undefined" && typeof asset.content.files !== "undefined" && asset.content.files.length > 0) {
      setImage(asset.content.files[0].cdn_uri || PLACEHOLDER_IMAGE);
    }
    setName(asset.content?.metadata.name || "");
  }, [asset]);

  return {
    image,
    name
  }
}