namespace NodeJS {
  interface ProcessEnv {
    /** 
     * DAS enabled RPC url 
     */
    RPC: string;
    /** 
     * ID of the new Metaplex Core collection, base58 encoded public key
     */
    CORE_COLLECTION: string;
    /**
     * Base58 encoded private key of the authority of the Metaplex Core collection
     * The authority can be used to update the collection and all NFTs in it
     */
    CORE_AUTHORITY: string;
    /**
     * The percentage in basispoints you wish creators from the creators array to receieve in royalties on secondary sales
     * Ex. 500 = 5%
     */
    CORE_ROYALTIES_BPS: string;
    /**
     * A comma separated list of creators and their percentages of royalties on secondary sales
     * The format is CREATOR_1_ADDRESS|PERCENTAGE1,CREATOR_2_ADDRESS|PERCENTAGE2,...
     */
    CORE_ROYALTIES_CREATORS: string;
    /**
     * Add collection level Permanent Transfer Delegate Plugin
     * @see https://developers.metaplex.com/core/plugins/permanent-transfer-delegate
     * Can be empty, or set to a base58 encoded public key
     */
    CORE_PERMANENT_TRANSFER_DELEGATE: string;
    /**
     * Add collection level Permanent Freeze Delegate Plugin
     * @see https://developers.metaplex.com/core/plugins/permanent-freeze-delegate
     * Can be empty, or set to a base58 encoded public key
     */
    CORE_PERMANENT_FREEZE_DELEGATE: string;
    /**
     * Add collection level Permanent Burn Delegate Plugin
     * @see https://developers.metaplex.com/core/plugins/permanent-burn-delegate
     * Can be empty, or set to a base58 encoded public key
     */
    CORE_PERMANENT_BURN_DELEGATE: string;
    /**
     * Optional conversion fee in lamports. Must also set FEE_WALLET for fees to apply
     * 1000000000 = 1 SOL
     *  100000000 = 0.1 SOL
     *   10000000 = 0.01 SOL
     *    1000000 = 0.001 SOL
     */
    FEE_LAMPORTS: string;
    /**
     * Optional wallet public key for collection conversion fees
     */
    FEE_WALLET: string;

    /** 
     * DAS enabled RPC url used for tests only 
     */
    TEST_RPC: string;
    /** 
     * Private key of the wallet to be used for testing, base58 encoded 
     */
    TEST_WALLET_PRIVATE_KEY: string;
    /** 
     * V1 Collection ID used for minting test NFTs. 
     * Mint a new collection with `npm run tests/createCollectionV1` 
     */
    TEST_COLLECTION_V1: string;
    /** 
     * Core Collection ID used for minting Core test NTFs. 
     * Mint a new collection with npm run tests/createCollectionCore 
     */
    TEST_COLLECTION_CORE: string;
    /**
     * Enable minting of test NFTs
     * Set to "true" to enable minting of test NFTs
     * Need to have TEST_WALLET_PRIVATE_KEY and TEST_COLLECTION_V1 set
     */
    NEXT_PUBLIC_TEST_MINT_ENABLED: string;
  }
}