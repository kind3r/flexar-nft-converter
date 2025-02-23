"use client"

import useAsset from "@/hooks/asset";
import { DasAsset } from "@/types/das";

type AssetCardProps = {
  asset: DasAsset;
}

export default function AssetCard({ asset }: AssetCardProps) {

  const {name, image} = useAsset(asset);

  return (
    <>
      <div className="card mb-3">
        <img src={image} className="card-img-top" alt={`${name} Image`} />
        <div className="card-body">
          <h5 className="card-title">{name}</h5>
        </div>
      </div>
    </>
  )
}