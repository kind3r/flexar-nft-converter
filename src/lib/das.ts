"use server"

import { HASHLIST } from "@/config/hashlist";
import { Connection } from "@solana/web3.js";
import { DAS, Interface, RpcClient } from "helius-sdk";

const solanaConnection = new Connection(process.env.RPC);
const rpc = new RpcClient(solanaConnection, "flexar");

function assetIsInCollection(
  asset: DAS.GetAssetResponse, 
  collection: string
): boolean {
  if (asset.grouping && asset.grouping.length > 0) {
    for (const grouping of asset.grouping) {
      if (grouping.group_key === "collection" && grouping.group_value === collection) {
        return true;
      }
    }
  }
  return false;
}

function assetIsValidV1(
  asset: DAS.GetAssetResponse
): boolean {
  return asset.interface === Interface.V1NFT && (HASHLIST.has(asset.id) || assetIsInCollection(asset, process.env.TEST_COLLECTION_V1));
}

function assetIsValidCore(
  asset: DAS.GetAssetResponse
): boolean {
  return asset.interface === Interface.MPL_CORE_ASSET && assetIsInCollection(asset, process.env.CORE_COLLECTION);
}

export async function getAssetsForOwner(
  owner: string,
): Promise<DAS.GetAssetResponse[] | undefined> {
  const query: DAS.AssetsByOwnerRequest = {
    page: 1,
    limit: 1000,
    ownerAddress: owner,
    displayOptions: {
      showFungible: false,
      showZeroBalance: false,
      showClosedAccounts: false,
      showNativeBalance: true,
    }
  }

  try {
    const ownerAssets = await rpc.getAssetsByOwner(query);
    const filteredAssets: DAS.GetAssetResponse[] = ownerAssets.items.filter((asset) => assetIsValidV1(asset) || assetIsValidCore(asset));
    return filteredAssets;
  } catch (error) {
    console.error(error);
  }
}

export async function getAssetsV1(
  mints: string[],
): Promise<DAS.GetAssetResponse[] | undefined> {
  const query: DAS.GetAssetBatchRequest = {
    ids: mints,
    displayOptions: {
      showSystemMetadata: true,
      showCollectionMetadata: true,
      showUnverifiedCollections: false,
    }
  }

  try {
    const assets = await rpc.getAssetBatch(query);
    const filteredAssets: DAS.GetAssetResponse[] = assets.filter((asset) => assetIsValidV1(asset));
    return filteredAssets;
  } catch (error) {
    console.error(error);
  }
}