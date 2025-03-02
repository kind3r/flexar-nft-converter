import { Creator } from "@metaplex-foundation/mpl-core";
import { publicKey, PublicKey } from "@metaplex-foundation/umi";

export function checkMintConfig(): { royaltiesBps: number | undefined, royaltiesCreators: Creator[] | undefined } {
  // Check configuration variables
  if (typeof process.env.RPC === 'undefined' || process.env.RPC === '' || !process.env.RPC.startsWith('http')) {
    console.error(`Missing RPC environment variable`);
    process.exit(1);
  }
  if (typeof process.env.CORE_AUTHORITY === 'undefined' || process.env.CORE_AUTHORITY === '') {
    console.error(`Missing CORE_AUTHORITY environment variable`);
    process.exit(1);
  }
  if (typeof process.env.CORE_COLLECTION !== 'undefined') {
    console.error(`CORE_COLLECTION environment variable is already set`);
    process.exit(1);
  }

  let royaltiesBps: number | undefined;
  let royaltiesCreators: Creator[] | undefined;

  if (typeof process.env.CORE_ROYALTIES_BPS !== 'undefined' && process.env.CORE_ROYALTIES_BPS !== '') {
    royaltiesBps = parseInt(process.env.CORE_ROYALTIES_BPS);
    if (!isNaN(royaltiesBps) && royaltiesBps > 0 && royaltiesBps <= 10000) {
      royaltiesCreators = [];
      if (typeof process.env.CORE_ROYALTIES_CREATORS !== 'undefined' && process.env.CORE_ROYALTIES_CREATORS !== '') {
        const royaltiesAddressPercentage = process.env.CORE_ROYALTIES_CREATORS.split(',');
        for (const rAP of royaltiesAddressPercentage) {
          const [addressStr, percentageStr] = rAP.split('|');
          if (typeof addressStr !== "undefined" && addressStr !== "" && typeof percentageStr !== "undefined" && percentageStr !== "") {
            const percentage = parseInt(percentageStr);
            if (!isNaN(percentage) && percentage > 0 && percentage <= 100) {
              let address: PublicKey;
              try {
                address = publicKey(addressStr);
              } catch (error) {
                console.error(error);
                console.error(`Invalid address (${addressStr}) in CORE_ROYALTIES_CREATORS environment variable`);
                process.exit(1);
              }
              royaltiesCreators.push({
                address: address,
                percentage: percentage
              });
            } else {
              console.error(`Invalid percentage (${percentageStr}) in CORE_ROYALTIES_CREATORS environment variable`);
              process.exit(1);
            }
          }
        }
        const totalCreatorRoyalties = royaltiesCreators.reduce((acc, creator) => acc + creator.percentage, 0);
        if (totalCreatorRoyalties !== 100) {
          console.error(`Total creator royalties does not sum to 100 (${totalCreatorRoyalties})`);
          process.exit(1);
        }
      } else {
        console.error(`Missing CORE_ROYALTIES_CREATORS environment variable`);
        process.exit(1);
      }
    } else {
      console.error(`Invalid CORE_ROYALTIES_BPS environment variable`);
      process.exit(1);
    }
  }

  return { 
    royaltiesBps, 
    royaltiesCreators 
  };
}