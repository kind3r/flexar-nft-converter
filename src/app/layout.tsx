import type { Metadata } from "next";
import "@/styles/custom.scss";
import "@/styles/wallet.css";
import BootstrapClient from "@/components/BootstrapClient";
import { Toaster } from "react-hot-toast";

export const metadata: Metadata = {
  title: "Flexar NFT converter",
  description: "Convert Solana Metaplex NFT V1 to Core",
};

export default function RootLayout({
  children,
}: Readonly<{
  children: React.ReactNode;
}>) {
  return (
    <html lang="en">
      <body data-bs-theme="dark">
        <BootstrapClient />
        <div><Toaster position="bottom-left" /></div>
        {children}
      </body>
    </html>
  );
}
