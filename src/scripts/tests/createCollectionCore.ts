import "../loadEnv";
import { createUmi } from "@metaplex-foundation/umi-bundle-defaults";
import { mplTokenMetadata } from "@metaplex-foundation/mpl-token-metadata";
import { generateSigner, keypairIdentity } from "@metaplex-foundation/umi";
import { base58 } from "@metaplex-foundation/umi/serializers";
import { createCollection, ruleSet } from "@metaplex-foundation/mpl-core";

async function doWork() {
  const umi = createUmi(process.env.TEST_RPC || process.env.RPC).use(mplTokenMetadata());

  const testWalletKeypair = umi.eddsa.createKeypairFromSecretKey(base58.serialize(process.env.TEST_WALLET_PRIVATE_KEY));
  // const testWalletSigner = createSignerFromKeypair(umi, testWalletKeypair);
  umi.use(keypairIdentity(testWalletKeypair));

  const collectionMint = generateSigner(umi);

  try {
    const mintResult = await createCollection(umi, {
      collection: collectionMint,
      name: "Flexar Test Core Collection",
      uri: "https://scalp-metadata.s3.eu-central-1.amazonaws.com/collab-pass.json",
      plugins: [
        {
          type: "Royalties",
          basisPoints: 10000,
          creators: [
            {
              address: umi.identity.publicKey,
              percentage: 100
            }
          ],
          ruleSet: ruleSet('None')
        },
        {
          type: "PermanentBurnDelegate",
          authority: {
            type: "Address",
            address: umi.identity.publicKey
          }
        },
        {
          type: "PermanentTransferDelegate",
          authority: {
            type: "Address",
            address: umi.identity.publicKey
          }
        },
        {
          type: "PermanentFreezeDelegate",
          frozen: true,
          authority: {
            type: "Address",
            address: umi.identity.publicKey
          }
        }
      ]
    }).sendAndConfirm(umi);

    console.log(`Created collection with address: ${collectionMint.publicKey}`);
    console.log(`Signature: ${base58.deserialize(mintResult.signature)}`);
    
  } catch (error) {
    console.error(error);
  }

  process.exit();
}

doWork();