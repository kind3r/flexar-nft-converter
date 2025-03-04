import NavigationHome from "@/components/NavigationHome"

export default function Home() {
  return (
    <>
      <NavigationHome />
      <div className="pb-5 mb-5">
        <h1 className="my-5 text-center">Convert NFT Tool</h1>
        <div className="container">
          <p>Convert Solana Metaplex V1 NFTs that use token metadata to the newer Metaplex Core standard.</p>
          <p><strong>Use cases:</strong></p>
          <ul>
            <li>Convert your collection to the new standard</li>
            <li>Enforce royalties</li>
            <li>Use new features provided by Core plugins</li>
            <li>De-rug old projects</li>
          </ul>
          <div className="alert alert-warning">
            This demo app deployment runs on <strong>Solana devnet</strong>
          </div>
          <p>
            Full source code is available on <a className="link" href="https://github.com/kind3r/flexar-nft-converter">GitHub</a>
          </p>
        </div>
        <div className="my-5 text-center">
          <a href="/convert" className="btn btn-primary">Start app</a>
        </div>
      </div>
    </>
  );
}
