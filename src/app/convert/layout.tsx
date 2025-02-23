import type { Metadata } from "next";
import WalletContext from "@/components/WalletContext";
import SessionCheck from "@/components/SessionCheck";
import NavigationCreator from "@/components/NavigationCreator";

export const metadata: Metadata = {
  title: "Convert NFTs",
};

export default function ConvertLayout({
  children,
}: Readonly<{
  children: React.ReactNode;
}>) {

  return (
    <>
      <WalletContext>
        <NavigationCreator />
        <div className="" style={{minHeight: "70vh"}}>
          <SessionCheck>
            <div className="container-xl">
              {children}
            </div>
          </SessionCheck>
        </div>

      </WalletContext>
    </>
  );
}
