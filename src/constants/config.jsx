
export const MAINNET = 1;
export const DEVNET = 2;

export const ACTIVE_NETWORK = MAINNET;

export const NET_RPC = ACTIVE_NETWORK == DEVNET ? 
            "https://api.devnet.solana.com/" : 
            "https://fluent-side-isle.solana-mainnet.quiknode.pro/19a27fc1fa07c0a0aff254ef753b1ba030360b39/"