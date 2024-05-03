import {
    ASSOCIATED_TOKEN_PROGRAM_ID,
    TOKEN_PROGRAM_ID,
} from "@solana/spl-token";
import { PublicKey } from "@solana/web3.js";

import { GLOBAL_STATE_SEED, PROGRAM_ID, VAULT_SEED } from "./constants_lvl_one";

export const getGlobalStateKey = async (id) => {
    const [globalStateKey] = await asyncGetPda(
        [Buffer.from(GLOBAL_STATE_SEED), new Uint8Array([id])],
        PROGRAM_ID
    );
    return globalStateKey;
};

export const getPoolKey = async (mintKey, id) => {
    const [poolKey] = await asyncGetPda(
        [mintKey.toBuffer(), new Uint8Array([id])], // mint address
        PROGRAM_ID
    );
    return poolKey;
};

export const getVaultKey = async (id) => {
    const [vaultKey] = await asyncGetPda(
        [Buffer.from(VAULT_SEED), new Uint8Array([id])], 
        PROGRAM_ID
    );
    return vaultKey;
};

export const getUserKey = async (pool, authority, id) => {
    const [userKey] = await asyncGetPda(
        [pool.toBuffer(), authority.toBuffer(), new Uint8Array([id])],
        PROGRAM_ID
    );
    return userKey;
};

export const getRewardAccount = async (ownerPubkey, mintPk) => {
    const [vaultKey] = await asyncGetPda(
        [
            ownerPubkey.toBuffer(),
            TOKEN_PROGRAM_ID.toBuffer(),
            mintPk.toBuffer(), // mint address
        ],
        ASSOCIATED_TOKEN_PROGRAM_ID
    );
    return vaultKey;
};

export const getAssociatedTokenAccount = async (ownerPubkey, mintPk) => {
    let associatedTokenAccountPubkey = (
        await PublicKey.findProgramAddress(
            [
                ownerPubkey.toBuffer(),
                TOKEN_PROGRAM_ID.toBuffer(),
                mintPk.toBuffer(), // mint address
            ],
            ASSOCIATED_TOKEN_PROGRAM_ID
        )
    )[0];
    return associatedTokenAccountPubkey;
};

const asyncGetPda = async (seeds, programId) => {
    const [pubKey, bump] = await PublicKey.findProgramAddress(seeds, programId);
    return [pubKey, bump];
};
