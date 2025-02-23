import "../loadEnv";

import { createUmi } from '@metaplex-foundation/umi-bundle-defaults';
import { burnV1, DigitalAsset, fetchDigitalAsset, findMetadataPda, mplTokenMetadata, TokenStandard } from '@metaplex-foundation/mpl-token-metadata';
import { base58 } from "@metaplex-foundation/umi-serializers-encodings";
import { createSignerFromKeypair, generateSigner, keypairIdentity, PublicKey, publicKey } from "@metaplex-foundation/umi";
import { argv } from "process";
import { CollectionV1, create, Creator, fetchCollection, ruleSet } from "@metaplex-foundation/mpl-core";

/**
 * Convert and NFT V1 to Core by buring the old NFT and minting a new one
 * with the same metadata
 */

async function doWork() {
  if (typeof process.env.TEST_COLLECTION_V1 === 'undefined' || process.env.TEST_COLLECTION_V1 === '') {
    console.error('Missing TEST_COLLECTION_V1 environment variable');
    process.exit();
  }

  const collectionV1 = publicKey(process.env.TEST_COLLECTION_V1);

  if (typeof process.env.TEST_COLLECTION_CORE === 'undefined' || process.env.TEST_COLLECTION_CORE === '') {
    console.error('Missing TEST_COLLECTION_CORE environment variable');
    process.exit();
  }

  const collectionCore = publicKey(process.env.TEST_COLLECTION_CORE);

  let mintV1: PublicKey;

  try {
    mintV1 = publicKey(argv[argv.length - 1], true);
  } catch (error) {
    console.error(error);
    console.log(`Please provide valid mint address`);
    process.exit();
  }

  const umi = createUmi(process.env.TEST_RPC || process.env.RPC).use(mplTokenMetadata());

  const testWalletKeypair = umi.eddsa.createKeypairFromSecretKey(base58.serialize(process.env.TEST_WALLET_PRIVATE_KEY));
  const testWalletSigner = createSignerFromKeypair(umi, testWalletKeypair);
  umi.use(keypairIdentity(testWalletKeypair));

  let mintAssetV1: DigitalAsset;
  let collectionCoreAsset: CollectionV1;

  try {
    // Check V1 NFT
    mintAssetV1 = await fetchDigitalAsset(umi, mintV1);
    if (mintAssetV1.metadata.collection.__option !== "Some" || mintAssetV1.metadata.collection.value.key !== collectionV1 || mintAssetV1.metadata.collection.value.verified !== true) {
      console.error(`NFT is not part of the V1 collection`);
      process.exit();
    }
    // Check collection
    collectionCoreAsset = await fetchCollection(umi, collectionCore);
  } catch (error) {
    console.error(error);
    process.exit();
  }

  console.log(JSON.stringify(mintAssetV1));

  const mintCore = generateSigner(umi);

  try {
    const creators: Creator[] = [];
    if (mintAssetV1.metadata.creators.__option === "Some") {
      mintAssetV1.metadata.creators.value.forEach(creator => {
        creators.push({
          address: creator.address,
          percentage: creator.share
        });
      });
    }

    const convertResult = await burnV1(umi, {
      mint: mintAssetV1.mint.publicKey,
      authority: testWalletSigner,
      tokenOwner: testWalletSigner.publicKey,
      collectionMetadata: findMetadataPda(umi, { mint: collectionV1 }),
      tokenStandard: TokenStandard.NonFungible
    }).add(
      create(umi, {
        asset: mintCore,
        name: mintAssetV1.metadata.name,
        uri: mintAssetV1.metadata.uri,
        collection: collectionCoreAsset,
        owner: testWalletSigner.publicKey,
        plugins: [
          {
            type: "Royalties",
            basisPoints: mintAssetV1.metadata.sellerFeeBasisPoints,
            creators: creators,
            ruleSet: ruleSet('None'),
          }
        ]
      })
    ).sendAndConfirm(umi);

    console.log(`Burned V1 NFT with address: ${mintV1}`);
    console.log(`Created Core NFT with address: ${mintCore.publicKey}`);
    console.log(`Signature: ${base58.deserialize(convertResult.signature)}`);
  } catch (error) {
    console.error(error);
  }


  process.exit();
}

doWork();