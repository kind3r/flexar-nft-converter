"use server"

import { getAssetsV1 } from "@/lib/das";
import { createTransactionBuilder, getDefaultUmi, toTransactionAndBlockHash, TransactionAndBlockHash } from "@/lib/umi";
import { CollectionV1, create, CreateArgs, fetchCollection } from "@metaplex-foundation/mpl-core";
import { burnV1, BurnV1InstructionAccounts, BurnV1InstructionArgs, findMetadataPda, TokenStandard } from "@metaplex-foundation/mpl-token-metadata";
import { createNoopSigner, createSignerFromKeypair, generateSigner, publicKey, Signer, signerIdentity, TransactionBuilder, Umi } from "@metaplex-foundation/umi";
import { fromWeb3JsKeypair } from "@metaplex-foundation/umi-web3js-adapters";
import { base58 } from "@metaplex-foundation/umi/serializers";
import { Keypair } from "@solana/web3.js";
import { DAS } from "helius-sdk";

function buildConvertAsset(
  umi: Umi,
  owner: string,
  asset: DAS.GetAssetResponse,
  collection: CollectionV1,
  authority: Signer,
): TransactionBuilder {
  // Check metadata
  if (typeof asset.content === "undefined" || asset.content.$schema !== "https://schema.metaplex.com/nft1.0.json") {
    throw new Error("Invalid asset content");
  }

  const burnParams: BurnV1InstructionAccounts & BurnV1InstructionArgs = {
    mint: publicKey(asset.id),
    tokenOwner: publicKey(owner),
    tokenStandard: TokenStandard.NonFungible
  }

  // add collection id
  if (asset.grouping && asset.grouping.length > 0 && asset.grouping[0].group_key === "collection") {
    burnParams.collectionMetadata = findMetadataPda(umi, { mint: publicKey(asset.grouping[0].group_value) });
  }

  const mintParams: CreateArgs = {
    asset: generateSigner(umi),
    name: asset.content.metadata.name,
    uri: asset.content.json_uri,
    collection: collection,
    authority: authority,
    owner: publicKey(owner),
    // plugins: []
  }

  let builder = burnV1(umi, burnParams);
  builder = builder.add(create(umi, mintParams));

  return builder;
}

let collectionCoreAsset: CollectionV1;

export async function buildConvertMints(
  owner: string,
  mints: string[]
): Promise<TransactionAndBlockHash[] | undefined> {

  if (typeof process.env.CORE_COLLECTION === 'undefined' || process.env.CORE_COLLECTION === '') {
    throw new Error(`Missing CORE_COLLECTION environment variable`);
  }

  if (typeof process.env.CORE_AUTHORITY === 'undefined' || process.env.CORE_AUTHORITY === '') {
    throw new Error(`Missing CORE_AUTHORITY environment variable`);
  }

  const authorityKeypair = Keypair.fromSecretKey(base58.serialize(process.env.CORE_AUTHORITY));

  // check mints and owner, add as assets to be converted
  // create one transaction for each 2 mints
  // return transaction array

  mints = mints.slice(0, 10); // ensure max 10 mints
  const assets = await getAssetsV1(mints);

  if (typeof assets !== "undefined" && assets.length > 0) {
    console.log(JSON.stringify(assets));

    const umi = await getDefaultUmi();
    umi.use(signerIdentity(createNoopSigner(publicKey(owner))));
    const authoritySigner =  createSignerFromKeypair(umi, fromWeb3JsKeypair(authorityKeypair));

    if (typeof collectionCoreAsset === "undefined") {
      collectionCoreAsset = await fetchCollection(umi, publicKey(process.env.CORE_COLLECTION));
    }

    const transactions: TransactionAndBlockHash[] = [];

    let offset = 0;
    const limit = 1; // unfortunately we can't fit 2 mints in one transaction

    do {
      const assetSlice = assets.slice(offset, offset + limit);

      let builder = await createTransactionBuilder();

      for (const asset of assetSlice) {
        builder = builder.add(buildConvertAsset(umi, owner, asset, collectionCoreAsset, authoritySigner));
      }

      const transactionAndBlockHash = await toTransactionAndBlockHash(umi, builder, true, [authorityKeypair]);
      transactions.push(transactionAndBlockHash);

      offset += limit;
    } while (offset < assets.length);

    return transactions;
  }
}
