"use client"

import AssetCard from "@/app/convert/AssetCard";
import useAssets from "@/hooks/assets";
import useMint from "@/hooks/mint";
import { useWallet } from "@solana/wallet-adapter-react";

export default function ConvertPage() {

  const wallet = useWallet();

  const {
    loading,
    converting,
    convertibleAssets,
    convertedAssets,
    updateAssets,
    convertAssets,
  } = useAssets(wallet.publicKey?.toBase58());

  // For testing purposes only
  const {
    minting,
    canMint,
    mintTestNFT
  } = useMint(wallet.publicKey?.toBase58(), updateAssets);

  return (
    <>
      <h1 className="my-5 text-center">Convert NFT Tool</h1>
      <div className="my-5 position-relative">
        {loading === true && (
          <div className="position-absolute top-0 start-0 end-0 bottom-0" style={{ zIndex: 1000 }}>
            <div className="h-100 w-100 d-flex justify-content-center align-items-center" style={{ backgroundColor: "rgba(0, 0, 0, 0.5)" }}>
              <div className="spinner-border text-info" role="status">
                <span className="visually-hidden">Loading...</span>
              </div>
            </div>
          </div>
        )}
        <div className="row">
          <div className="col-12 col-lg-5 rounded" style={{ minHeight: "60vh", backgroundColor: "rgba(0, 0, 0, 0.5)" }}>
            <h2 className="mb-3 text-center">Convertible Assets <span className="badge rounded-pill bg-primary">{convertibleAssets.length}</span></h2>
            <hr />
            <div className="row row-cols-2 row-cols-md-3 row-cols-lg-3 g-4 d-flex justify-content-center">
              {convertibleAssets.map((asset, index) => (
                <div className="col" key={index}>
                  <AssetCard asset={asset} />
                </div>
              ))}
            </div>
            {canMint === true ? (
              <>
                <hr />
                <div>
                  <button className="btn btn-primary"
                    onClick={() => {
                      if (wallet.publicKey !== null) {
                        mintTestNFT(wallet.publicKey.toBase58());
                      }
                    }}
                    disabled={wallet.publicKey === null || loading || converting || minting}
                  >
                    Mint Test NFT
                    {minting === true ? (
                      <div className="spinner-border spinner-border-sm text-light ms-2" role="status">
                        <span className="visually-hidden">Loading...</span>
                      </div>
                    ) : ""}
                  </button>
                </div>
              </>
            ) : ""}
          </div>
          <div className="col-12 col-lg-2 d-flex justify-content-center align-items-center">
            <button className="btn btn-success"
              onClick={() => {
                if (wallet.publicKey !== null) {
                  convertAssets(wallet, convertibleAssets);
                }
              }}
              disabled={wallet.publicKey === null || convertibleAssets.length === 0 || loading || converting || minting}
            >
              Convert
              {convertibleAssets.length > 0 ? (
                <span className="badge rounded-pill bg-danger ms-2">
                  {convertibleAssets.length}
                </span>
              ) : ""}
              {converting === true ? (
                <div className="spinner-border spinner-border-sm text-light ms-2" role="status">
                  <span className="visually-hidden">Loading...</span>
                </div>
              ) : ""}
            </button>
          </div>
          <div className="col-12 col-lg-5 rounded" style={{ backgroundColor: "rgba(0, 0, 0, 0.5)" }}>
            <h2 className="mb-3 text-center">Converted Assets <span className="badge rounded-pill bg-primary">{convertedAssets.length}</span></h2>
            <hr />
            <div className="row row-cols-2 row-cols-md-3 row-cols-lg-3 g-4 d-flex justify-content-center">
              {convertedAssets.map((asset, index) => (
                <div className="col" key={index}>
                  <AssetCard asset={asset} />
                </div>
              ))}
            </div>
          </div>
        </div>
      </div>
    </>
  )
}