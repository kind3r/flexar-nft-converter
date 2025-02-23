"use server"

import { mplTokenMetadata } from "@metaplex-foundation/mpl-token-metadata";
import { BlockhashWithExpiryBlockHeight, RpcConfirmTransactionResult, Transaction, TransactionBuilder, Umi } from "@metaplex-foundation/umi";
import { createUmi } from "@metaplex-foundation/umi-bundle-defaults";
import { fromWeb3JsInstruction } from "@metaplex-foundation/umi-web3js-adapters";
import { base58 } from "@metaplex-foundation/umi/serializers";
import { ComputeBudgetProgram, Keypair, VersionedTransaction } from "@solana/web3.js";
import delay from "delay";

let defaultUmi: Umi;

export async function getDefaultUmi(): Promise<Umi> {
  if (typeof defaultUmi === "undefined") {
    try {
      defaultUmi = createUmi(process.env.RPC).use(mplTokenMetadata());
    } catch (error) {
      console.error(error);
    }
  }
  return defaultUmi;
}

/**
 * Create an empty TransactionBuilder with budget instructions
 * @returns TransactionBuilder
 */
export async function createTransactionBuilder(
  unitLimit: number = 1000000,
  unitPrice: number = 20000,
): Promise<TransactionBuilder> {
  let builder: TransactionBuilder = new TransactionBuilder();

  // Compute budget
  builder = builder.add({
    instruction: fromWeb3JsInstruction(ComputeBudgetProgram.setComputeUnitLimit({ units: unitLimit })),
    bytesCreatedOnChain: 0,
    signers: []
  }).add({
    instruction: fromWeb3JsInstruction(ComputeBudgetProgram.setComputeUnitPrice({ microLamports: unitPrice })),
    bytesCreatedOnChain: 0,
    signers: []
  });

  return builder;
}

/**
 * We have to use serialized transaction version as it flows between server and client components.
 * Serialisation produces an Uint8Array which is converted to a regular array for transmission.
 *  
 * Serialize with: Array.from(umi.transactions.serialize(transaction))
 * 
 * Deserialize with: umi.transactions.deserialize(new Uint8Array(serializedTransaction))
 */
export interface TransactionAndBlockHash {
  transaction: Array<number>;
  blockHash: BlockhashWithExpiryBlockHeight
}

/**
 * Convert a builder into a serialized transaction and blockhash
 * @param umi 
 * @param builder 
 * @param sign If we sign the transaction with the umi provided
 * @param signers If sign is true, provide the list of signers
 * @returns 
 */
export async function toTransactionAndBlockHash(
  umi: Umi,
  builder: TransactionBuilder,
  sign: boolean = true,
  signers?: Keypair[],
): Promise<TransactionAndBlockHash> {

  const blockHash = await umi.rpc.getLatestBlockhash({
    commitment: "finalized"
  });
  builder = builder.setBlockhash(blockHash.blockhash);

  let transaction: Transaction;
  if (sign === true) {
    transaction = await builder.buildAndSign(umi);
  } else {
    transaction = builder.build(umi);
  }

  let serializedTransaction = umi.transactions.serialize(transaction);

  if (typeof signers !== "undefined") {
    const webTransaction = VersionedTransaction.deserialize(serializedTransaction);
    webTransaction.sign(signers);
    serializedTransaction = webTransaction.serialize();
  }

  return {
    transaction: Array.from(serializedTransaction),
    blockHash
  };
}

function getSignersAndSignatures(
  umi: Umi,
  transaction: Transaction
): Map<string, string> {
  const signersAndSignatures = new Map<string, string>;
  for (let i = 0; i < transaction.message.header.numRequiredSignatures; i++) {
    if (umi.eddsa.verify(transaction.serializedMessage, transaction.signatures[i], transaction.message.accounts[i])) {
      signersAndSignatures.set(transaction.message.accounts[i], base58.deserialize(transaction.signatures[i])[0]);
    }
  }
  return signersAndSignatures;
}

const OUR_SIGNERS = new Set<string>();
if (typeof process.env.CORE_AUTHORITY !== "undefined" && process.env.CORE_AUTHORITY !== "") {
  try {
    const keypair = Keypair.fromSecretKey(base58.serialize(process.env.CORE_AUTHORITY));
    OUR_SIGNERS.add(keypair.publicKey.toBase58());
  } catch (error) {
    console.error(error);
  }
}
if (typeof process.env.TEST_WALLET_PRIVATE_KEY !== "undefined" && process.env.TEST_WALLET_PRIVATE_KEY !== "") {
  try {
    const keypair = Keypair.fromSecretKey(base58.serialize(process.env.TEST_WALLET_PRIVATE_KEY));
    OUR_SIGNERS.add(keypair.publicKey.toBase58());
  } catch (error) {
    console.error(error);
  }
}
if (OUR_SIGNERS.size === 0) {
  throw new Error(`No signers found`);
}

/**
 * Send a signed transaction to the network, retry until confirmation fails
 * @param transactionAndBlockHash 
 * @returns 
 */
export async function sendAndConfirmTransaction(
  transactionAndBlockHash: TransactionAndBlockHash,
): Promise<string | undefined> {
  const umi = await getDefaultUmi();
  const transaction = umi.transactions.deserialize(new Uint8Array(transactionAndBlockHash.transaction));
  const blockhash = transactionAndBlockHash.blockHash;

  // we only send transactions signed by one of our wallets
  const signersAndSignatures = getSignersAndSignatures(umi, transaction);
  if (signersAndSignatures.size === 0) {
    throw new Error(`No transaction signatures`);
  }
  let ourSigner: string | undefined;
  for (const signer of signersAndSignatures.keys()) {
    if (OUR_SIGNERS.has(signer)) {
      ourSigner = signer;
      break;
    }
  }
  if (typeof ourSigner === "undefined") {
    throw new Error(`Missing authority signature`);
  }

  let resendInterval: NodeJS.Timeout | undefined;
  try {
    const bSignature = await umi.rpc.sendTransaction(transaction, {
      commitment: "confirmed",
      maxRetries: 3,
    });
    const signature = base58.deserialize(bSignature)[0];

    let retryCount = 0;

    resendInterval = setInterval(async () => {
      if (typeof umi !== "undefined") {
        try {
          retryCount++;
          await umi.rpc.sendTransaction(transaction, {
            commitment: "confirmed",
            skipPreflight: true,
          });
        } catch (error) {
          if (error instanceof Error) {
            if ('message' in error) {
              if (error.message.indexOf("Transaction simulation failed") !== -1 || error.message.indexOf("This transaction has already been processed") !== -1) {
                clearInterval(resendInterval);
              } else {
                console.error(error.message);
              }
            } else {
              console.error(error);
            }
          }
        }
      }
    }, 500);

    let confirmResult: RpcConfirmTransactionResult | undefined = undefined;
    try {
      confirmResult = await umi.rpc.confirmTransaction(bSignature, {
        strategy: {
          type: "blockhash",
          blockhash: blockhash.blockhash,
          lastValidBlockHeight: blockhash.lastValidBlockHeight
        }
      });
    } catch (error) {
      console.error('confirmTransaction', error);
    }

    if (typeof resendInterval !== "undefined") clearInterval(resendInterval);

    let success: boolean = false;
    if (typeof confirmResult === "undefined") {
      // double check
      await delay(500);
      const onChainTransaction = await umi.rpc.getTransaction(bSignature, { commitment: "confirmed" });
      if (onChainTransaction !== null) {
        success = true;
      }
    } else if (typeof confirmResult.value !== "undefined" && typeof confirmResult.value.err !== "undefined" && confirmResult.value.err === null) {
      // check confirmResult.err, just in case (it should fail during first send simulation, but does not hurt to double check)
      // mark logged transaction as successful
      success = true;
    }

    if (success === true) {
      console.log(retryCount);
      return signature;
    }
  } catch (error) {
    // TODO: detect SendTransactionError: failed to send transaction: Transaction simulation failed: Blockhash not found
    if (typeof resendInterval !== "undefined") clearInterval(resendInterval);
    console.error(error);
  }
}

export async function sendAndConfirmTransactions(
  transactionAndBlockHashes: TransactionAndBlockHash[],
): Promise<string[] | undefined> {
  const signatures: string[] = [];
  for (const transactionAndBlockHash of transactionAndBlockHashes) {
    const signature = await sendAndConfirmTransaction(transactionAndBlockHash);
    if (typeof signature !== "undefined") {
      signatures.push(signature);
    }
  }
  return signatures;
}