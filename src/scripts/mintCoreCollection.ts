import "./loadEnv";
import { createUmi } from "@metaplex-foundation/umi-bundle-defaults";
import { DigitalAsset, fetchDigitalAsset, mplTokenMetadata } from "@metaplex-foundation/mpl-token-metadata";
import { createCollection, CreateCollectionArgs, ruleSet } from "@metaplex-foundation/mpl-core";
import { generateSigner, keypairIdentity, PublicKey, publicKey } from "@metaplex-foundation/umi";
import { argv } from "process";
import { base58 } from "@metaplex-foundation/umi/serializers";
import { checkMintConfig } from "./utils";

/**
 * Mint a new Core collection from V1 collection
 */

async function doWork() {
  // check args
  if (argv.length < 3) {
    console.log("");
    console.log(`Usage: npm run mintCoreCollection <V1 collection address>`);
    console.log("");
    process.exit(1);
  }
  
  // Check params
  const { royaltiesBps, royaltiesCreators } = checkMintConfig();

  let oldCollectionId: PublicKey | undefined;
  try {
    oldCollectionId = publicKey(argv[argv.length - 1]);
  } catch (error) {
    console.error(error);
    console.error(`Invalid V1 collection address`);
    process.exit(1);
  }

  const umi = createUmi(process.env.RPC).use(mplTokenMetadata());
  const coreAuthority = umi.eddsa.createKeypairFromSecretKey(base58.serialize(process.env.CORE_AUTHORITY));
  umi.use(keypairIdentity(coreAuthority));
  const collectionMint = generateSigner(umi);

  // Fetch old collection information
  let oldCollection: DigitalAsset | undefined;
  try {
    oldCollection = await fetchDigitalAsset(umi, oldCollectionId);
  } catch (error) {
    console.error(error);
    console.error(`Failed to fetch V1 collection information`);
    process.exit(1);
  }

  try {
    const mintOptions: CreateCollectionArgs = {
      collection: collectionMint,
      name: oldCollection.metadata.name,
      uri: oldCollection.metadata.uri,
    };

    // Royalties plugin
    if (typeof royaltiesBps !== 'undefined' && typeof royaltiesCreators !== 'undefined') {
      if (typeof mintOptions.plugins === 'undefined') {
        mintOptions.plugins = [];
      }
      mintOptions.plugins.push({
        type: "Royalties",
        basisPoints: royaltiesBps,
        creators: royaltiesCreators,
        ruleSet: ruleSet('None')
      });
    }

    // Permanent Transfer Delegate plugin
    if (typeof process.env.CORE_PERMANENT_TRANSFER_DELEGATE !== "undefined" && process.env.CORE_PERMANENT_TRANSFER_DELEGATE !== "") {
      if (typeof mintOptions.plugins === 'undefined') {
        mintOptions.plugins = [];
      }
      mintOptions.plugins.push({
        type: "PermanentTransferDelegate",
        authority: {
          type: "Address",
          address: publicKey(process.env.CORE_PERMANENT_TRANSFER_DELEGATE)
        }
      });
    }

    // Permanent Freeze Delegate plugin
    if (typeof process.env.CORE_PERMANENT_FREEZE_DELEGATE !== "undefined" && process.env.CORE_PERMANENT_FREEZE_DELEGATE !== "") {
      if (typeof mintOptions.plugins === 'undefined') {
        mintOptions.plugins = [];
      }
      mintOptions.plugins.push({
        type: "PermanentFreezeDelegate",
        frozen: true,
        authority: {
          type: "Address",
          address: publicKey(process.env.CORE_PERMANENT_FREEZE_DELEGATE)
        }
      });
    }

    // Permanent Burn Delegate plugin
    if (typeof process.env.CORE_PERMANENT_BURN_DELEGATE !== "undefined" && process.env.CORE_PERMANENT_BURN_DELEGATE !== "") {
      if (typeof mintOptions.plugins === 'undefined') {
        mintOptions.plugins = [];
      }
      mintOptions.plugins.push({
        type: "PermanentBurnDelegate",
        authority: {
          type: "Address",
          address: publicKey(process.env.CORE_PERMANENT_BURN_DELEGATE)
        }
      });
    }

    const mintResult = await createCollection(umi, mintOptions).sendAndConfirm(umi);

    console.log(`Created collection with address: ${collectionMint.publicKey}`);
    console.log(`Signature: ${base58.deserialize(mintResult.signature)}`);
  } catch (error) {
    console.error(error);
    console.error(`Failed to mint Core collection`);
  }

  process.exit();
}

doWork();