import "../loadEnv";

import { createUmi } from '@metaplex-foundation/umi-bundle-defaults';
import { createNft, findMetadataPda, mplTokenMetadata, verifyCollectionV1 } from '@metaplex-foundation/mpl-token-metadata';
import { base58 } from "@metaplex-foundation/umi-serializers-encodings";
import { createSignerFromKeypair, generateSigner, keypairIdentity, percentAmount, publicKey, some } from "@metaplex-foundation/umi";

/**
 * Mint a V1 NFT and add it to existing collection
 */

async function doWork() {
  if (typeof process.env.TEST_COLLECTION_V1 === 'undefined' || process.env.TEST_COLLECTION_V1 === '') {
    console.error('Missing TEST_COLLECTION_V1 environment variable');
    process.exit();
  }

  const umi = createUmi(process.env.TEST_RPC || process.env.RPC).use(mplTokenMetadata());

  const testWalletKeypair = umi.eddsa.createKeypairFromSecretKey(base58.serialize(process.env.TEST_WALLET_PRIVATE_KEY));
  const testWalletSigner = createSignerFromKeypair(umi, testWalletKeypair);
  umi.use(keypairIdentity(testWalletKeypair));

  const collection = publicKey(process.env.TEST_COLLECTION_V1);

  const mint = generateSigner(umi);
  const metadata = findMetadataPda(umi, { 
    mint: mint.publicKey
  });

  try {
    const mintResult = await createNft(umi, {
      mint,
      name: 'Flexar Test NFT',
      uri: 'https://scalp-metadata.s3.eu-central-1.amazonaws.com/collab-pass.json',
      sellerFeeBasisPoints: percentAmount(99),
      collection: some({
        key: collection,
        verified: false,
      }),
    })
    .add(verifyCollectionV1(umi, {
      metadata,
      collectionMint: collection,
      authority: testWalletSigner,
    }))
    .sendAndConfirm(umi);

    console.log(`Created NFT with address: ${mint.publicKey}`);
    console.log(`Signature: ${base58.deserialize(mintResult.signature)}`);

    // await delay(5000);

    

    // const collectionResult = await verifyCollectionV1(umi, {
    //   metadata,
    //   collectionMint: collection,
    //   authority: testWalletSigner,
    // }).sendAndConfirm(umi);

    // console.log(`Verified collection with address: ${collection}`);
    // console.log(`Signature: ${base58.deserialize(collectionResult.signature)}`);

  } catch (error) {
    console.error(error);
  }


  process.exit();
}

doWork();