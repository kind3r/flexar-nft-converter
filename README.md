# Flexar NFT converter

Convert Solana Metaplex V1 NFTs that use token metadata to the newer Metaplex Core standard.

---
**Use cases:**
- Fine grained control for your collection 
- Enforce royalties
- New use cases provided by Core plugins
- De-rug old project/collection

---
The [Metaplex Core](https://developers.metaplex.com/core) standard has several advantages over existing standards like V1, pNFT and cNFT:
- Uses only one resizable account for storing NFT data including ownership (unlike V1 which uses one account for metadata and a standard token account for each owner)
  - Users no longer have to pay rent for ATA accounts and close them afterwards
- Utility plugins can be attached at collection or NFT level such as:
  - Royalties with whitelist/blacklist program rules
  - Attributes (that can be stored on-chain)
  - Transfer/Freeze/Burn allowing creators more control over the items in the collection
  - Oracle plugin that can control lifecycle events from an external program (such as a staking platform)
- Cheaper transactions with less overhead
  - All data is stored on-chain
  - Unlike cNFTs does not require proofs, complex cryptography and special indexing

This dAPP is built as a proof of concept for converting Solana NFTs from V1 to Core by burning the old V1 NFT and minting a new Core version with the same metadata. The app is build with Next.js 15.x and utilizes the Metaplex Umi SDK 1.x for generating the burn and mint instructions. The code logic is fairly well separated from the UI so that it can be easily customized to fit a project's visual aspect. The app can be easily deployed on Vercel.

A demo deployment on devnet can be accessed at [https://flexar-nft-converter.vercel.app/](https://flexar-nft-converter.vercel.app/).

> There are currently two issues with Next + Umi so the Umi requires a couple of patches.

> First issue is that the Umi's `createUmi` triggers an [error](https://github.com/metaplex-foundation/umi/blob/5103ef6f820145f6f76ec29091afad5a6595aec3/packages/umi/src/Signer.ts#L130) when used on the backend side. I'm not exactly sure why creating an Error object causes it to automatically throw, but it can be easily patched by creating the Error object itself where it's actually thrown.

> Second issue is the dependency of umi-eddsa-web3js on an older solana lib that includes node:fs and cannot work in the browser environment. There is already a [pull request](https://github.com/metaplex-foundation/umi/pull/163/files) so this should be fixed in a future release.

## Features

- Convert V1 NFTs to Core
- Configure Core collection Royalties and delegates (Transfer/Freeze/Burn)
- Easy to customize layout (dev involvement required)
- Does not expose RPC to public
- Batches transactions, less friction for users providing a better user experience

## Initial setup and configuration

First of all, [fork this repo](https://docs.github.com/en/pull-requests/collaborating-with-pull-requests/working-with-forks/fork-a-repo) onto your own GitHub account and clone it locally as you will need to commit the configuration file that holds the hashlist for the NFT V1 collection that you want to convert. You will also need the last commit to be authored by your user in order to be able to deploy on Vercel.

Next, you will need a **RPC that supports DAS API** such as [Helius](https://www.helius.dev/) or [EXTRnode](https://extrnode.com/).

Third optional requirement is a **Vercel account** that you can deploy the app onto. You can also deploy on your preferred hosting provider but it's not covered in this documentation.

### 0. Development environment setup
You will require the following software packages on your machine:
- [Node.js 18.18](https://nodejs.org/) or later (**20.18** or later recommended).
- [Git](https://git-scm.com/)

You also need a [GitHub](https://github.com/) account and [set up Git](https://docs.github.com/en/get-started/getting-started-with-git/set-up-git) with your github credentials (I personally prefer [connecting with ssh](https://docs.github.com/en/authentication/connecting-to-github-with-ssh/about-ssh)).

Fork this repo, clone the fork you made, switch to the folder you cloned in and then install dependencies:
```sh
git clone git@github.com:[YOUR_GITHUB_USERNAME]/flexar-nft-converter.git
npm install
```

### 1. Define hashlist of old collection

The [./src/config/hashlist.ts](./src/config/hashlist.ts) file is a simple array of **token addresses** (also known as **mint address** or **mint**) bundled into a Set for more efficient operation. Only NFTs who's address is in this list are eligible for conversion by the app.

```js
export const HASHLIST: HashList = new Set<string>([ 
  // Add hashlist here of all V1 NFTs you want to convert
  "ErRxoLFqEKZdjKgPk7iY3j8y6A6HMcPbJkTUP2ESPqXp",
  "4sqWgDjAnq16nKvt86a2daD4MapVdFCBHuuPBvRrJCop",
  "GSQCMthTAGBETpssg8Vam8za1f3vPS5NxCcfTuuGeNqW",
  // add more mints here
]);
```

You might already have a hashlist for your collection if it's listed on MagicEden, in case you don't here are a few tools to help you get it:
- [Smithii Tools](https://tools.smithii.io/hashlist/solana)
- [FFF Snapshot](https://famousfoxes.com/snapshot)

After you're finished modifying the hashlist you should commit it to the cloned repo:
```sh
git add src/config/hashlist.ts
git commit -m "Update hashlist"
git push
```

### 2. Configuration options

Create an empty file named `.env` in the root of the project. This will hold your configuration variables, one per line in the format **`SETTING`=*`VALUE`***. You can later copy paste it's content into Vercel. The order of the variables in the file is not important.

- **`RPC`**

Our first configuration variable is the RPC address. You will need a **RPC** that supports DAS API such as [Helius](https://www.helius.dev/) or [EXTRnode](https://extrnode.com/) with enough requests per second available to ensure it does not restrict users accessing the dAPP. The lowest paid plan is generally good enough. In some cases the free plan might also be sufficient. The RPC mainnet address will be stored in the `RPC` configuration variable inside `.env`.

Your `.env` file should now look something like this:

```sh
RPC=https://your.rpc.address.com/some_api_key
```

- **`CORE_AUTHORITY`**

Next we need to generate an **authority keypair**. The **authority** is responsible for minting the Core Collection NFT and adding the converted NFTs to this collection. You can also use the **authority** to update your Core items or collection in the future, add additional plugins, change royalties etc.

```sh
npm run generateKeypair
```

The script will output the public and private keys of the newly generated keypair. 

Copy the private key and store it in the `CORE_AUTHORITY` configuration variable inside `.env`. Your `.env` file should now look something like this:

```sh
RPC=https://your.rpc.address.com/some_api_key
CORE_AUTHORITY=abcd1234abcd1234abcd1234abcd1234abcd1234abcd1234abcd1234
```

You will need about 0.004 SOL in the authority account for minting the Core collection NFT so go ahead and **transfer SOL** to the public key that was generated.

> IMPORTANT: Keep your **authority keypair** safe and secure as it is the only way to manage your Core collection and NFTs in the future should you wish to make any changes. Don't share it with others !

- **`CORE_ROYALTIES_BPS`** and **`CORE_ROYALTIES_CREATORS`**

Collection royalties setup is the next step of the configuration. `CORE_ROYALTIES_BPS` holds the royalties percentage in basispoints that creators stored in `CORE_ROYALTIES_CREATORS` receive from secondary sales on various marketplaces. So for example 500 means 5%, 1000 means 10% and so on.

`CORE_ROYALTIES_CREATORS` stores the creators and their percentage of the royalties. The format is `CREATOR_1_ADDRESS|PERCENTAGE1,CREATOR_2_ADDRESS|PERCENTAGE2,etc.`. **The sum of creator percentages needs to be 100%**.

So for example if you want to have 5% royalties on secondary sales and you have 2 creators that get 20% and 80% your `.env` file should look now like this:

```sh
RPC=https://your.rpc.address.com/some_api_key
CORE_AUTHORITY=abcd1234abcd1234abcd1234abcd1234abcd1234abcd1234abcd1234
CORE_ROYALTIES_BPS=500
CORE_ROYALTIES_CREATORS=efgh5678efgh5678efgh5678efgh5678|20,ijkl9012ijkl9012ijkl9012ijkl9012|80
```

- **`CORE_PERMANENT_TRANSFER_DELEGATE`**, **`CORE_PERMANENT_FREEZE_DELEGATE`**, **`CORE_PERMANENT_BURN_DELEGATE`**

You can optionally set public key collection level delegates that will always be able to perform specific actions on all the Core NFTs in the collection. Please see the Metaplex documentation for those plugins should you intend to use them:
- [Permanent Transfer Plugin](https://developers.metaplex.com/core/plugins/permanent-transfer-delegate)
- [Permanent Freeze Delegate](https://developers.metaplex.com/core/plugins/permanent-freeze-delegate)
- [Permanent Burn Delegate](https://developers.metaplex.com/core/plugins/permanent-burn-delegate)

You can always add them later to the collection, but this is out of the scope of our dAPP.

- **`FEE_LAMPORTS`** and **`FEE_WALLET`**

You can optionally set a user fee for each conversion performed. Set the `FEE_LAMPORTS` to the amount in lamports (1000000000 Lamports = 1 SOL) and the public key of the wallet collecting the fees in `FEE_WALLET`.

### 3. Minting the Core collection NFT

Now that we have the RPC, authority and royalty information we need to mint the Core collection. You will need about 0.004 SOL in the authority wallet for minting the Core collection NFT so go ahead and fund it. You will need some more SOL if you don't already have a V1 collection, see below.

If you **already have a V1 collection**, we can use its metadata to mint the Core collection:

```sh
npm run mintCoreCollection <V1 collection address>
```

If you **do not have a V1 collection**, we need to configure one. For this we need to upload a **collection image** and its **json metadata** via [Irys](https://irys.xyz/). You will need to pay for the storage fees so make sure you have enough SOL in the authority wallet before proceeding (fees are very small so 0.0001 SOL should be enough).

```sh
npm run generateCoreCollection <image file>
```

The script will prompt you for the following:
- Name (the name of your collection)
- Symbol (optional, something short similar to token names)
- Description
- Url (optional, website of your project)

If successful both scripts will output the public key of the collection that you need to store in the `CORE_COLLECTION` configuration variable in the `.env` file. Your `.env` file is now complete and should now look something like this:

```sh
RPC=https://your.rpc.address.com/some_api_key
CORE_AUTHORITY=abcd1234abcd1234abcd1234abcd1234abcd1234abcd1234abcd1234
CORE_ROYALTIES_BPS=500
CORE_ROYALTIES_CREATORS=efgh5678efgh5678efgh5678efgh5678|20,ijkl9012ijkl9012ijkl9012ijkl9012|80
CORE_COLLECTION=dcba4321dcba4321dcba4321dcba4321
```

### 4. Customization

The app consists of a [homepage](./src/app/page.tsx) that explains a bit about the project and the [convert](./src/app/convert/page.tsx) page that performs the actual conversion. All the UI components are located in the [src/components](./src/components/) folder. The project uses bootstrap for building a simple layout. 
All the asset detection and conversion logic is wrapped inside the [useAssets](./src/hooks/assets.ts) hook so that it can be easily reused. The hook makes use of server side functions located in the [src/lib](./src/lib/) folder.

Feel free to customize the UI to your liking or even rewrite from scratch, make sure to keep the logic provided by the [useAssets](./src/hooks/assets.ts) hook as exemplified in the [convert](./src/app/convert/page.tsx) page.

### 5. Deploy on Vercel

> TODO: Vercel project, link GitHub, paste env


## TODO
- Queue transaction sending and configure concurrency limit
- Config check script
- Cleanup


---
---
---
Default Next.js Readme
---
---
---

This is a [Next.js](https://nextjs.org) project bootstrapped with [`create-next-app`](https://nextjs.org/docs/app/api-reference/cli/create-next-app).

## Getting Started

First, run the development server:

```bash
npm run dev
# or
yarn dev
# or
pnpm dev
# or
bun dev
```

Open [http://localhost:3000](http://localhost:3000) with your browser to see the result.

You can start editing the page by modifying `app/page.tsx`. The page auto-updates as you edit the file.

This project uses [`next/font`](https://nextjs.org/docs/app/building-your-application/optimizing/fonts) to automatically optimize and load [Geist](https://vercel.com/font), a new font family for Vercel.

## Learn More

To learn more about Next.js, take a look at the following resources:

- [Next.js Documentation](https://nextjs.org/docs) - learn about Next.js features and API.
- [Learn Next.js](https://nextjs.org/learn) - an interactive Next.js tutorial.

You can check out [the Next.js GitHub repository](https://github.com/vercel/next.js) - your feedback and contributions are welcome!

## Deploy on Vercel

The easiest way to deploy your Next.js app is to use the [Vercel Platform](https://vercel.com/new?utm_medium=default-template&filter=next.js&utm_source=create-next-app&utm_campaign=create-next-app-readme) from the creators of Next.js.

Check out our [Next.js deployment documentation](https://nextjs.org/docs/app/building-your-application/deploying) for more details.
