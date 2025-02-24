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
- Batches transactions, less friction for users

## Initial setup and configuration

First of all, fork this repo onto your own GitHub account as you will need to commit the configuration file that holds the hashlist for the NFT V1 collection that you want to convert. You will also need the last commit to be authored by your user in order to be able to deploy on Vercel.

Next, you will need a RPC that supports **DAS API** such as [Helius](https://www.helius.dev/) or [EXTRnode](https://extrnode.com/).

Third optional requirement is a Vercel account that you can deploy the app onto. You can also deploy on your preferred hosting provider but it's not covered in this documentation.

**1. Define hashlist of old collection**
- Tools to dump (collection id / verified creator)
- Configuration file + git commit

**2. Configure and mint the Core Collection NFT**
- Authority wallet
- Royalties
- Plugins/additional authorities
- RPC setup
- Mint Core Collection NFT

**3. Deploy on Vercel**
- Vercel project, link GitHub, paste env


## TODO
- Setup initial Core collection
- Optional conversion fee
- Config check
- Scripts for fetching hashlist for collection id and verified creator
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
