import "./loadEnv";
import { argv } from "process";
import { checkMintConfig } from "./utils";
import fs from "fs/promises";
import mime from "mime";
import { createUmi } from "@metaplex-foundation/umi-bundle-defaults";
import { JsonMetadata, mplTokenMetadata } from "@metaplex-foundation/mpl-token-metadata";
import { base58 } from "@metaplex-foundation/umi/serializers";
import { createGenericFile, generateSigner, keypairIdentity, publicKey } from "@metaplex-foundation/umi";
import { irysUploader } from "@metaplex-foundation/umi-uploader-irys";
import colors from 'colors';
import inquirer from 'inquirer';
import { createCollection, CreateCollectionArgs, ruleSet } from "@metaplex-foundation/mpl-core";

/**
 * Generate a new Core collection using an image and user input
 */

async function doWork() {
  // check args
  if (argv.length < 3) {
    console.log("");
    console.log(`Usage: npm run generateCoreCollection <image file>`);
    console.log("");
    process.exit(1);
  }
  const { royaltiesBps, royaltiesCreators } = checkMintConfig();

  const localImageFile = argv[argv.length - 1];
  try {
    await fs.access(localImageFile, fs.constants.R_OK);
  } catch (error) {
    console.error(error);
    console.error(`Invalid image file`);
    process.exit(1);
  }

  const localImageMime = mime.getType(localImageFile);

  if (localImageMime === null || !localImageMime.startsWith("image/")) {
    console.error(`Invalid image file type`);
    process.exit(1);
  }

  const { COLLECTION_NAME, COLLECTION_SYMBOL, COLLECTION_DESCRIPTION, COLLECTION_URL } = await inquirer.prompt([
    {
      type: 'input',
      name: 'COLLECTION_NAME',
      message: colors.magenta('Name of the collection:'),
    },
    {
      type: 'input',
      name: 'COLLECTION_SYMBOL',
      message: colors.magenta('Symbol of the collection (can be empty):'),
    },
    {
      type: 'input',
      name: 'COLLECTION_DESCRIPTION',
      message: colors.magenta('Description of the collection:'),
    },
    {
      type: 'input',
      name: 'COLLECTION_URL',
      message: colors.magenta('Website URL of the collection (can be empty):'),
    }
  ]);

  const umi = createUmi(process.env.RPC).use(mplTokenMetadata());
  const coreAuthority = umi.eddsa.createKeypairFromSecretKey(base58.serialize(process.env.CORE_AUTHORITY));
  umi.use(keypairIdentity(coreAuthority));
  umi.use(irysUploader());

  let imageUri: string | undefined;
  try {
    console.log(`Uploading image...`);
    const imageFileContents = await fs.readFile(localImageFile);
    const imageFile = createGenericFile(imageFileContents, "", { contentType: localImageMime });
    const uploadResults = await umi.uploader.upload([imageFile]);
    imageUri = uploadResults[0];
  } catch (error) {
    console.error(error);
    console.error(`Failed to upload image`);
    process.exit(1);
  }

  let metadataUri: string | undefined;
  try {
    console.log(`Uploading metadata file...`);
    const metadataFileContents: JsonMetadata = {
      name: COLLECTION_NAME,
      description: COLLECTION_DESCRIPTION,
      image: imageUri,
      properties: {
        files: [
          {
            uri: imageUri,
            type: localImageMime
          }
        ]
      }
    }
    if (typeof COLLECTION_SYMBOL !== "undefined" && COLLECTION_SYMBOL !== "") {
      metadataFileContents.symbol = COLLECTION_SYMBOL;
    }
    if (typeof COLLECTION_URL !== "undefined" && COLLECTION_URL !== "") {
      metadataFileContents.external_url = COLLECTION_URL;
    }
    metadataUri = await umi.uploader.uploadJson(metadataFileContents);
  } catch (error) {
    console.error(error);
    console.error(`Unable to upload metadata file`);
    process.exit(1);
  }

  const collectionMint = generateSigner(umi);

  try {
    const mintOptions: CreateCollectionArgs = {
      collection: collectionMint,
      name: COLLECTION_NAME,
      uri: metadataUri,
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