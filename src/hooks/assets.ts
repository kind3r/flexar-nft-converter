"use client"

import { buildConvertMints } from "@/lib/convert";
import { getAssetsForOwner } from "@/lib/das";
import { sendAndConfirmTransactions, TransactionAndBlockHash } from "@/lib/umi";
import { DasAsset } from "@/types/das";
import { Transaction } from "@metaplex-foundation/umi";
import { createUmi } from "@metaplex-foundation/umi-bundle-defaults";
import { walletAdapterIdentity } from "@metaplex-foundation/umi-signer-wallet-adapters";
import { useConnection, WalletContextState } from "@solana/wallet-adapter-react";
import delay from "delay";
import { useCallback, useEffect, useState } from "react";

export default function useAssets(owner?: string) {
  const [loading, setLoading] = useState(false);
  const [converting, setConverting] = useState(false);
  const [convertibleAssets, setConvertibleAssets] = useState<DasAsset[]>([]);
  const [convertedAssets, setConvertedAssets] = useState<DasAsset[]>([]);

  const {connection} = useConnection();

  const updateAssets = useCallback(async (owner: string) => {
    if (typeof owner !== "undefined") {
      setLoading(true);
      const assets = await getAssetsForOwner(owner);
      if (typeof assets !== "undefined") {
        const newConvertibleAssets: DasAsset[] = [];
        const newConvertedAssets: DasAsset[] = [];
        for (const asset of assets) {
          if (asset.interface === "V1_NFT") {
            newConvertibleAssets.push(asset);
          } else if (asset.interface === "MplCoreAsset") {
            newConvertedAssets.push(asset);
          }
        }
        setConvertibleAssets(newConvertibleAssets);
        setConvertedAssets(newConvertedAssets);
      }
      setLoading(false);
    }
  }, []);

  const convertAssets = useCallback(async (wallet: WalletContextState, convertibleAssets: DasAsset[]) => {
    if (wallet.connected && wallet.publicKey !== null && convertibleAssets.length > 0) {
      setConverting(true);
      // Convert assets
      const convertibleMints = convertibleAssets.map((asset) => asset.id).slice(0, 10);
      try {
        const buildConvertResponse = await buildConvertMints(wallet.publicKey.toBase58(), convertibleMints);
        if (typeof buildConvertResponse !== "undefined" && buildConvertResponse.length > 0) {
          const umi = createUmi(connection.rpcEndpoint).use(walletAdapterIdentity(wallet));

          const transactionsToSign: Transaction[] = [];
          buildConvertResponse.forEach((transactionAndBlockHash) => {
            transactionsToSign.push(umi.transactions.deserialize(new Uint8Array(transactionAndBlockHash.transaction)));
          });

          const signedTransactions = await umi.identity.signAllTransactions(transactionsToSign);
          
          const transactionsToSubmit: TransactionAndBlockHash[] = signedTransactions.map((transaction, index) => {
            return {
              transaction: Array.from(umi.transactions.serialize(transaction)),
              blockHash: buildConvertResponse[index].blockHash
            }
          });

          const signatures = await sendAndConfirmTransactions(transactionsToSubmit);

          console.log("Signatures: ", signatures);

          await delay(5000);
        }
      } catch (error) {
        console.error(error);
      }
      setConverting(false);
      updateAssets(wallet.publicKey.toBase58());
    }
  }, [connection, updateAssets]);

  useEffect(() => {
    if (typeof owner !== "undefined") {
      updateAssets(owner);
    }

    return () => {
      setConvertibleAssets([]);
      setConvertedAssets([]);
    }
  }, [owner, updateAssets]);

  return {
    loading,
    converting,
    convertibleAssets,
    convertedAssets,
    updateAssets,
    convertAssets,
  }
}