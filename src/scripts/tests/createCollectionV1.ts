import "../loadEnv";

import { createUmi } from '@metaplex-foundation/umi-bundle-defaults';
import { createNft, mplTokenMetadata } from '@metaplex-foundation/mpl-token-metadata';
import { base58 } from "@metaplex-foundation/umi-serializers-encodings";
import { createSignerFromKeypair, generateSigner, keypairIdentity, percentAmount } from "@metaplex-foundation/umi";

/**
 * Create a V1 collection NFT for our future V1 NFTs
 */

async function doWork() {
  const umi = createUmi(process.env.TEST_RPC || process.env.RPC).use(mplTokenMetadata());

  const testWalletKeypair = umi.eddsa.createKeypairFromSecretKey(base58.serialize(process.env.TEST_WALLET_PRIVATE_KEY));
  const testWalletSigner = createSignerFromKeypair(umi, testWalletKeypair);
  umi.use(keypairIdentity(testWalletKeypair));

  const collectionMint = generateSigner(umi);

  try {
    const mintResult = await createNft(umi, {
      mint: collectionMint,
      authority: testWalletSigner,
      name: 'Flexar Test Collection',
      uri: 'https://scalp-metadata.s3.eu-central-1.amazonaws.com/collab-pass.json',
      sellerFeeBasisPoints: percentAmount(99),
      isCollection: true,
    }).sendAndConfirm(umi);

    console.log(`Created collection with address: ${collectionMint.publicKey}`);
    console.log(`Signature: ${base58.deserialize(mintResult.signature)}`);
  } catch (error) {
    console.error(error);
  }

  process.exit();
}

doWork();