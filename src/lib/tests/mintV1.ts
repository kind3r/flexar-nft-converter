"use server"

import { Keypair } from "@solana/web3.js";
import { createTransactionBuilder, getDefaultUmi, sendAndConfirmTransaction, toTransactionAndBlockHash } from "@/lib/umi";
import { base58 } from "@metaplex-foundation/umi/serializers";
import { createSignerFromKeypair, generateSigner, percentAmount, publicKey, signerIdentity, some } from "@metaplex-foundation/umi";
import { createNft, findMetadataPda, verifyCollectionV1 } from "@metaplex-foundation/mpl-token-metadata";
import { fromWeb3JsKeypair } from "@metaplex-foundation/umi-web3js-adapters";

export async function buildTestMintV1(
  owner: string,
): Promise<string | undefined> {
  if (typeof process.env.NEXT_PUBLIC_TEST_MINT_ENABLED === 'undefined' || process.env.NEXT_PUBLIC_TEST_MINT_ENABLED !== 'true') {
    throw new Error(`Test minting is not enabled`);
  }
  if (typeof process.env.TEST_WALLET_PRIVATE_KEY === 'undefined' || process.env.TEST_WALLET_PRIVATE_KEY === '') {
    throw new Error(`Missing TEST_WALLET_PRIVATE_KEY environment variable`);
  }
  if (typeof process.env.TEST_COLLECTION_V1 === 'undefined' || process.env.TEST_COLLECTION_V1 === '') {
    throw new Error(`Missing TEST_COLLECTION_V1 environment variable`);
  }

  const umi = await getDefaultUmi();
  const testWalletKeypair = Keypair.fromSecretKey(base58.serialize(process.env.TEST_WALLET_PRIVATE_KEY));
  const testWalletSigner = createSignerFromKeypair(umi, fromWeb3JsKeypair(testWalletKeypair));
  umi.use(signerIdentity(testWalletSigner));
  const collection = publicKey(process.env.TEST_COLLECTION_V1);
  const mint = generateSigner(umi);
  const metadata = findMetadataPda(umi, {
    mint: mint.publicKey
  });
  const onwerPublickey = publicKey(owner);
  // umi.use(signerIdentity(createNoopSigner(onwerPublickey)));
  let builder = await createTransactionBuilder();

  try {
    builder = builder.add(
      createNft(umi, {
        mint,
        name: 'Flexar Test NFT',
        uri: 'https://scalp-metadata.s3.eu-central-1.amazonaws.com/collab-pass.json',
        sellerFeeBasisPoints: percentAmount(99),
        collection: some({
          key: collection,
          verified: false,
        }),
        tokenOwner: onwerPublickey,
      })
    );

    builder = builder.add(
      verifyCollectionV1(umi, {
        metadata,
        collectionMint: collection,
        authority: testWalletSigner,
      })
    );
    
    const transactionAndBlockHash = await toTransactionAndBlockHash(umi, builder, true, [testWalletKeypair]);

    const signature = await sendAndConfirmTransaction(transactionAndBlockHash);

    return signature;
  } catch (error) {
    console.error(error);
  }
}