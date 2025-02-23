"use client"

import { useWallet } from "@solana/wallet-adapter-react";
import WalletButton from "@/components/WalletButton";

export default function SessionCheck({ children }: { children: React.ReactNode }) {

  const wallet = useWallet();

  return (
    <>
      {wallet.connected === true ? (
        <>
          {children}
        </>
      ) : (
        <>
        <div className="container-md py-5 my-5" style={{ minHeight: "60vh" }}>
          <div className="py-5 my-5 row justify-content-center">
            <div className="col-12 col-lg-6 text-center">
              <h3 className="mb-3">Connect Solana wallet</h3>
              <WalletButton />
            </div>
          </div>
        </div>
      </>
      )}
    </>
  )
}