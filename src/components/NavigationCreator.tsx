"use client"

import Link from "next/link";
import WalletButton from "@/components/WalletButton";

export default function NavigationCreator() {

  return (
    <>
      <nav className="navbar bg-secondary-subtle">
        <div className="container-fluid">
          <Link className="navbar-brand" href={`/`}>
            <img className="d-inline-block" src="/FlexarInvertedLogo.svg" alt="Flexar" height="36" />
            <div className="d-none d-md-inline-block text-flexar align-bottom ms-1 font-blackops fs-4 mt-3 lh-1">Convert</div>
          </Link>
          <WalletButton />
        </div>
      </nav>
    </>
  )
}