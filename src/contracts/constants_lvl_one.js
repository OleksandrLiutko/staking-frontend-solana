import { PublicKey } from "@solana/web3.js";
import { ACTIVE_NETWORK, DEVNET } from "../constants/config";
import { BN } from "bn.js";

export const GLOBAL_STATE_SEED = "state";
export const VAULT_SEED = "vault";

export const PROGRAM_ID = ACTIVE_NETWORK === DEVNET ? 
    new PublicKey(
        "6j8tU8k9wyUwwvpSvuj275LPTCKnLLHCY4GASs7y33gf"
    ) : new PublicKey(
        "Bux12emcFTEJZiQBuMHXfqiqqqxikEgCEXXi1WMzQ3qc"
    );

export const ADMINWALLET = ACTIVE_NETWORK === DEVNET ?
    new PublicKey(
        "Ecc7MNS6h4SMvPPQcm4Ah3B6E1Qpp6WroJKjq9XnbaoR"
    ) : new PublicKey(
        "779QiEvEE2d6bkDXc2oPmXoidns14Y6VfaYLUWUaFXfu"
    );

export const SubscriberWallet = ACTIVE_NETWORK === DEVNET ?
    new PublicKey(
        "Caz7xjbhkHZXbvNMZ9K9bQt7oZxqmJN6FTaHQmT4pCGC"
    ) : new PublicKey(
        "3ndi8KPa82RN8YfVf1PTS7cZuEKEjgMqmGdXWk6rssSV"
    );

export const SI_TOKEN = ACTIVE_NETWORK === DEVNET ? 
    new PublicKey(
        "J1LY1sevDHs6YTCMa5BTwQCJ5zeh9eGHsp1k9fQDJKNp"
    ) : new PublicKey(
        "Fxgdfsy1Z5Mvh53o69s2Ev6TGxtAJ1RQ5RJ5moCpKmQZ"
    );

export const TREASURY = ACTIVE_NETWORK === DEVNET ? 
    new PublicKey(
        "Ecc7MNS6h4SMvPPQcm4Ah3B6E1Qpp6WroJKjq9XnbaoR"
    ) : new PublicKey(
        "779QiEvEE2d6bkDXc2oPmXoidns14Y6VfaYLUWUaFXfu"
    ); 

export const REWARD_PERCENT = 15;

export const SI_DECIMALS = 9;
export const STAKING_IDS = [0,1,2];
export const STAKING = [
    {
        APY : new BN(15),
        LOCK_TIME : new BN(30 * 24 * 3600),
        LIMIT: 80000000
    },
    {
        APY : new BN(20),
        LOCK_TIME : new BN(2 * 30 * 24 * 3600),
        LIMIT: 30000000
    },
    {
        APY : new BN(25),
        LOCK_TIME : new BN(3 * 30 * 24 * 3600),
        LIMIT: 16000000
    }
]
