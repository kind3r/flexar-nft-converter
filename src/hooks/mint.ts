"use client"

import { buildTestMintV1 } from "@/lib/tests/mintV1";
import delay from "delay";
import { useCallback, useEffect, useState } from "react";

export default function useMint(owner?: string, updateAssets?: (owner: string) => Promise<void>) {
  const [minting, setMinting] = useState<boolean>(false);
  const [canMint, setCanMint] = useState<boolean>(false);

  const mintTestNFT = useCallback(async (owner: string) => {
    if (canMint === true && typeof owner !== "undefined") {
      setMinting(true);
      // Mint test NFT
      const signature = await buildTestMintV1(owner);
      console.log(signature);
      if (typeof signature !== "undefined") {
        await delay(5000);
      }
      setMinting(false);
      if (typeof updateAssets === "function") {
        updateAssets(owner);
      }
    }
  }, [canMint, updateAssets]);

  useEffect(() => {
    // Check if we are on devnet and can mint
    if (process.env.NEXT_PUBLIC_TEST_MINT_ENABLED === "true" && typeof owner !== "undefined") {
      // TODO: Also check server side if all required env vars are set
      setCanMint(true);
    } else {
      setCanMint(false);
    }
  }, [owner]);

  return {
    minting,
    canMint,
    mintTestNFT
  }
}