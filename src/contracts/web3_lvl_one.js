import BN from "bn.js";
import { toast } from "react-toastify";

import * as anchor from "@project-serum/anchor";
import {
    ASSOCIATED_TOKEN_PROGRAM_ID,
    TOKEN_PROGRAM_ID,
} from "@solana/spl-token";
import { WalletNotConnectedError } from "@solana/wallet-adapter-base";
import {
    Connection,
    PublicKey,
    SystemProgram,
    SYSVAR_CLOCK_PUBKEY,
    Transaction,
} from "@solana/web3.js";

import * as Constants from "./constants_lvl_one";
import * as keys from "./keys_lvl_one";
import { STAKING_IDL } from "./staking_lvl_one";
import { NET_RPC } from "../constants/config";
import axios from "axios";

// const [startTime, setStartTime] = useState(0);
// const [endTime, setEndTime] = useState(0);
// const [buyAmount, setBuyAmount] = useState(0);
// const [totalBuyAmount, setTotalBuyAmount] = useState(0);

const connection = new Connection(NET_RPC);
let program = null;

export const getProgram = (wallet) => {
    if (program == null) {
        let provider = new anchor.AnchorProvider(
            connection,
            wallet,
            anchor.AnchorProvider.defaultOptions()
        );
        program = new anchor.Program(
            STAKING_IDL,
            Constants.PROGRAM_ID,
            provider
        );
    }
    return program;
};

export const createStakingState = async (wallet, tokenMint, id) => {
    if (wallet.publicKey === null) throw new WalletNotConnectedError();

    const program = getProgram(wallet);

    const tokenPerSecond = 1; // todo
    const state = await keys.getGlobalStateKey(id);

    let rewardVault = await keys.getAssociatedTokenAccount(state, tokenMint);

    const tx = new Transaction().add(
        await program.methods
            .createState(new BN(tokenPerSecond), id)
            .accounts({
                authority: wallet.publicKey, // token owner
                state: state, //
                rewardVault: rewardVault,
                rewardMint: tokenMint,
                systemProgram: SystemProgram.programId,
                tokenProgram: TOKEN_PROGRAM_ID,
                associatedTokenProgram: ASSOCIATED_TOKEN_PROGRAM_ID,
                clock: SYSVAR_CLOCK_PUBKEY,
            })
            .instruction()
    );
    return await sendCreateState(connection, wallet, tx, id);
};

export const createStakingPool = async (wallet, tokenMint, apy, lock_time, id) => {
    const program = getProgram(wallet);

    // Todo
    const point = new BN(1);
    const multipler = new BN(1);
    const state = await keys.getGlobalStateKey(id);
    const pool = await keys.getPoolKey(tokenMint, id);
    const stakeVault = await keys.getAssociatedTokenAccount(pool, tokenMint);
    const pools = await program.account.farmPoolAccount.all();

    const tx = new Transaction();

    tx.add(
        await program.methods
            .createPool(point, multipler, apy, lock_time, id)
            .accounts({
                pool: pool,
                state: state,
                mint: tokenMint,
                vault: stakeVault,
                authority: wallet.publicKey,
                systemProgram: SystemProgram.programId,
                tokenProgram: TOKEN_PROGRAM_ID,
                associatedTokenProgram: ASSOCIATED_TOKEN_PROGRAM_ID,
                clock: SYSVAR_CLOCK_PUBKEY,
            })
            .remainingAccounts(
                pools.map((p) => ({
                    pubkey: p.publicKey,
                    isWritable: true,
                    isSigner: false,
                }))
            )
            .instruction()
    );
    return await sendCreatePool(connection, wallet, tx, id);
};

export const stake = async (wallet, amount, tokenMint, referral, id) => {
    if (wallet.publicKey === null || wallet.publicKey === undefined) {
        showToast("Connect Wallet!", 5000, 1);
        return null;
    }

    if (parseFloat(amount) <= 0 || amount === "") {
        showToast("Enter Correct Amount!", 5000, 1);
        return null;
    }

    // getIsAdmin(wallet)

    const program = getProgram(wallet);
    const tx = new Transaction();

    const state = await keys.getGlobalStateKey(id);
    const pool = await keys.getPoolKey(tokenMint, id);
    // console.log("++++++++++++>", pool.toString());
    // const poolVault = await keys.getAssociatedTokenAccount(pool, tokenMint);
    // console.log("===========>", poolVault.toString());
    const user = await keys.getUserKey(pool, wallet.publicKey, id);
    const userVault = await keys.getAssociatedTokenAccount(
        wallet.publicKey,
        tokenMint
    );

    // console.log("----------->", userVault.toString());

    const stakingAmount = convertToDecimal(amount);

    const poolVault = await keys.getAssociatedTokenAccount(pool, tokenMint);
    const rewardVault = await keys.getAssociatedTokenAccount(state, tokenMint);

    let referralKey = new PublicKey(referral);
    const referralUser = await keys.getUserKey(pool, referralKey, id);
    let r = await keys.getUserKey(pool, referralKey, id);
    if (referralUser == user.toBase58()) {
        referralKey = Constants.TREASURY;
        r = await keys.getUserKey(pool, Constants.TREASURY);
        // console.log("referralKey: ", referralKey.toString());
    }

    // Check if user exists
    const userInfo = await connection.getAccountInfo(user);
    if (!userInfo) {
        tx.add(
            await program.methods
                .createUser(id)
                .accounts({
                    user: user,
                    state: state,
                    pool: pool,
                    // referral: referralKey,
                    // referralUser: r,
                    authority: wallet.publicKey,
                    systemProgram: SystemProgram.programId,
                    tokenProgram: TOKEN_PROGRAM_ID,
                })
                .instruction()
        );

    } else {
        tx.add(
            await program.methods
                .harvest(id)
                .accounts({
                    user: user,
                    state: state,
                    pool: pool,
                    authority: wallet.publicKey,
                    mint: tokenMint,
                    rewardVault: rewardVault,
                    userVault: userVault,
                    systemProgram: SystemProgram.programId,
                    tokenProgram: TOKEN_PROGRAM_ID,
                    clock: SYSVAR_CLOCK_PUBKEY,
                })
                .instruction()
        );
    }

    tx.add(
        await program.methods
            .stake(stakingAmount, id)
            .accounts({
                user: user,
                state: state,
                pool: pool,
                authority: wallet.publicKey,
                mint: tokenMint,
                poolVault: poolVault,
                userVault: userVault,
                // referral: referralKey,
                // referralUser: r,
                systemProgram: SystemProgram.programId,
                tokenProgram: TOKEN_PROGRAM_ID,
                clock: SYSVAR_CLOCK_PUBKEY,
            })
            .instruction()
    );

    return await send(connection, wallet, tx);
};

export const unstake = async (wallet, amount, tokenMint, referral, id) => {
    if (wallet.publicKey === null || wallet.publicKey === undefined) {
        showToast("Connect Wallet!", 5000, 1);
        return null;
    }

    if (parseFloat(amount) <= 0 || amount === "") {
        showToast("Enter Correct Amount!", 5000, 1);
        return null;
    }

    const program = getProgram(wallet);
    const tx = new Transaction();

    const state = await keys.getGlobalStateKey(id);
    const pool = await keys.getPoolKey(tokenMint, id);
    const poolVault = await keys.getAssociatedTokenAccount(pool, tokenMint);
    const user = await keys.getUserKey(pool, wallet.publicKey, id);
    const userVault = await keys.getAssociatedTokenAccount(
        wallet.publicKey,
        tokenMint
    );
    const unstakingAmount = convertToDecimal(amount);

    let referralKey = new PublicKey(referral);
    const referralUser = await keys.getUserKey(pool, referralKey, id);
    let r = await keys.getUserKey(pool, referralKey, id);
    if (referralUser == user.toBase58()) {
        referralKey = Constants.TREASURY;
        r = await keys.getUserKey(pool, Constants.TREASURY);
    }

    tx.add(
        await program.methods
            .unstake(unstakingAmount, id)
            .accounts({
                user: user,
                state: state,
                pool: pool,
                authority: wallet.publicKey,
                mint: tokenMint,
                poolVault: poolVault,
                userVault: userVault,
                // referral: referralKey,
                // referralUser: r,
                systemProgram: SystemProgram.programId,
                tokenProgram: TOKEN_PROGRAM_ID,
                clock: SYSVAR_CLOCK_PUBKEY,
            })
            .instruction()
    );
    return await send(connection, wallet, tx);
};

export const claim_staking = async (wallet, tokenMint, id) => {
    if (wallet.publicKey === null || wallet.publicKey === undefined) {
        showToast("Connect Wallet!", 5000, 1);
        return null;
    }

    const program = getProgram(wallet);

    const state = await keys.getGlobalStateKey(id);
    const pool = await keys.getPoolKey(tokenMint, id);
    const user = await keys.getUserKey(pool, wallet.publicKey, id);
    const userVault = await keys.getAssociatedTokenAccount(
        wallet.publicKey,
        tokenMint
    );
    const rewardVault = await keys.getAssociatedTokenAccount(state, tokenMint);
    console.log("Reward vault: ", rewardVault);
    const tx = new Transaction();

    tx.add(
        await program.methods
            .harvest(id)
            .accounts({
                user: user,
                state: state,
                pool: pool,
                authority: wallet.publicKey,
                mint: tokenMint,
                rewardVault: rewardVault,
                userVault: userVault,
                systemProgram: SystemProgram.programId,
                tokenProgram: TOKEN_PROGRAM_ID,
                clock: SYSVAR_CLOCK_PUBKEY,
            })
            .instruction()
    );

    return await send(connection, wallet, tx);
};

export const withdraw_staking = async (wallet, tokenMint, reward_amount, pool_amount, id) => {
    if (wallet.publicKey === null || wallet.publicKey === undefined) {
        showToast("Connect Wallet!", 5000, 1);
        return null;
    }

    const program = getProgram(wallet);

    const state = await keys.getGlobalStateKey(id);
    const pool = await keys.getPoolKey(tokenMint, id);
    const userVault = await keys.getAssociatedTokenAccount(
        wallet.publicKey,
        tokenMint
    );
    const rewardVault = await keys.getAssociatedTokenAccount(state, tokenMint);
    const poolVault = await keys.getAssociatedTokenAccount(pool, tokenMint);

    const rewardAmount = convertToDecimal(reward_amount);
    const poolAmount = convertToDecimal(pool_amount);
    const tx = new Transaction();

    tx.add(
        await program.methods
            .withdraw(rewardAmount, poolAmount, id)
            .accounts({
                state: state,
                pool: pool,
                authority: wallet.publicKey,
                mint: tokenMint,
                rewardVault: rewardVault,
                userVault: userVault,
                poolVault: poolVault,
                systemProgram: SystemProgram.programId,
                tokenProgram: TOKEN_PROGRAM_ID,
                clock: SYSVAR_CLOCK_PUBKEY,
                ASSOCIATED_TOKEN_PROGRAM_ID,
            })
            .instruction()
    );

    return await send(connection, wallet, tx);
};

export const fundStakingReward = async (wallet, amount, tokenMint, id) => {
    if (wallet.publicKey === null || wallet.publicKey === undefined) {
        showToast("Connect Wallet!", 5000, 1);
        return null;
    }

    if (parseFloat(amount) <= 0 || amount === "") {
        showToast("Enter Correct Amount!", 5000, 1);
        return null;
    }

    const program = getProgram(wallet);

    const state = await keys.getGlobalStateKey(id);
    // console.log(">>>>>>>>>>>>>>>", state.toString());
    const userVault = await keys.getAssociatedTokenAccount(
        wallet.publicKey,
        tokenMint
    );
    const rewardVault = await keys.getAssociatedTokenAccount(state, tokenMint);

    const fundAmount = convertToDecimal(amount);

    const tx = new Transaction().add(
        await program.methods
            .fundRewardToken(fundAmount, id)
            .accounts({
                state: state,
                authority: wallet.publicKey,
                rewardVault: rewardVault,
                userVault: userVault,
                tokenProgram: TOKEN_PROGRAM_ID,
            })
            .instruction()
    );

    return await send(connection, wallet, tx);
};

// export const refundStakingReward = async (wallet, amount, tokenMint) => {
//     if (wallet.publicKey === null || wallet.publicKey === undefined) {
//         showToast("Connect Wallet!", 5000, 1);
//         return null;
//     }

//     if (parseFloat(amount) <= 0 || amount === "") {
//         showToast("Enter Correct Amount!", 5000, 1);
//         return null;
//     }

//     console.log("11111111111111");
//     const program = getProgram(wallet);

//     const state = await keys.getGlobalStateKey();
//     const rewardVault = await keys.getAssociatedTokenAccount(state, tokenMint);

//     console.log("222222222222222");
//     const pool = await keys.getPoolKey(tokenMint);
//     const fundAmount = convertToDecimal(amount);
//     const userVault = await keys.getAssociatedTokenAccount(
//         wallet.publicKey,
//         tokenMint
//     );
//     const vaultKey = await keys.getRewardAccount(
//         wallet.publicKey,
//         Constants.SI_TOKEN
//     );

//     console.log("3333333333333333333", pool, fundAmount);
//     const tx = new Transaction().add(
//         await program.methods
//             .withdrawRewardToken(fundAmount)
//             .accounts({
//                 state: state,
//                 authority: vaultKey.publicKey,
//                 rewardVault: rewardVault,
//                 userVault: userVault,
//                 tokenProgram: TOKEN_PROGRAM_ID,
//             })
//             .instruction()
//     );

//     return await send(connection, wallet, tx);
// };

export const getPoolPoint = async (wallet, tokenMint, id) => {
    try {
        const program = getProgram(wallet);
        const poolKey = await keys.getPoolKey(new PublicKey(tokenMint), id);

        const pool = await program.account.farmPoolAccount.fetch(poolKey);
        return pool.point.toNumber();
    } catch (e) {
        return 0;
    }
};

export const getPoolAmount = async (wallet, tokenMint, id) => {
    try {
        // const program = getProgram(wallet);
        const poolKey = await keys.getPoolKey(new PublicKey(tokenMint), id);

        const poolVault = await keys.getAssociatedTokenAccount(poolKey, tokenMint);
        console.log("Pool Value", poolVault.toString());

        const state = await keys.getGlobalStateKey(id);
        const rewardVault = await keys.getAssociatedTokenAccount(state, tokenMint);
        console.log("Reward vault: ", rewardVault.toString());

        const pool = await program.account.farmPoolAccount.fetch(poolKey);
        // const pool = await axios.get("https://api2.infura.pro/pool?level=" + id);
        return convertFromDecimal(new BN(pool.amount.toString()));
    } catch (e) {
        return 0;
    }
};

async function getTokenBalanceWeb3(vault) {
    try {
        const info = await connection.getTokenAccountBalance(vault);

        if (!info.value.uiAmount) throw new Error("No balance found");
        return info.value.uiAmount;
    } catch (e) {
        console.log(e);
        return 0;
    }
}

export const getVaultAmount = async (wallet, id) => {
    const state = await keys.getGlobalStateKey(id);
    const rewardVault = await keys.getAssociatedTokenAccount(
        state,
        Constants.SI_TOKEN
    );
    return await getTokenBalanceWeb3(rewardVault);
};

export async function getTotalSuplyToken(tokenMint) {
    const total_supply_token = await connection.getTokenSupply(tokenMint);
    return total_supply_token.value.uiAmount;
}

export async function getTotalStaked(tokenMint, id) {
    const pool = await keys.getPoolKey(tokenMint, id);

    const poolVault = await keys.getAssociatedTokenAccount(pool, tokenMint);
    return await getTokenBalanceWeb3(poolVault);
}

export async function getMyStakedAndReward(wallet, tokenMint, id) {
    try {
        const program = getProgram(wallet);
        const pool = await keys.getPoolKey(tokenMint, id);
        const user = await keys.getUserKey(pool, wallet.publicKey, id);
        const userAccount = await program.account.farmPoolUserAccount.fetch(
            user
        );
        console.log("User Account : ", userAccount);
        const currentTime = new Date();
        const unixTimestamp = Math.floor(currentTime.getTime() / 1000);
        const reward_amount_t =
            convertFromDecimal(new BN(userAccount.extraReward.toString())) +
            convertFromDecimal(new BN(userAccount.amount.toNumber())) *
            ((unixTimestamp - userAccount.lastStakeTime) /
                (365 * 24 * 3600)) *
            (Constants.REWARD_PERCENT / 100);
        const amount = convertFromDecimal(new BN(userAccount.amount.toString()));
        const reward_amount = (reward_amount_t);
        let fixedNumber = reward_amount.toFixed(Constants.SI_DECIMALS);
        return [amount, fixedNumber];
    } catch (e) {
        return [0, 0];
    }
}

export async function send(connection, wallet, transaction) {
    const txHash = await sendTransaction(connection, wallet, transaction);
    if (txHash != null) {
        let confirming_id = showToast("Confirming Transaction ...", 4000, 2);
        let res = await connection.confirmTransaction(txHash);
        toast.dismiss(confirming_id);
        if (res.value.err) showToast("Transaction Failed", 2000, 1);
        else showToast("Transaction Confirmed", 2000);
    } else {
        showToast("Transaction Failed", 2000, 1);
    }
    return txHash;
}
export async function sendCreateState(connection, wallet, transaction, id) {
    const txHash = await sendTransaction(connection, wallet, transaction);
    if (txHash != null) {
        let confirming_id = showToast("Confirming Transaction ...", 4000, 2);
        let res = await connection.confirmTransaction(txHash);
        toast.dismiss(confirming_id);
        if (res.value.err) {
            showToast("Transaction Failed", 2000, 1);
        } else {
            localStorage.setItem(`createdStatus${id}`, 'created');
            showToast("Transaction Confirmed", 2000);
        }
    } else {
        showToast("Transaction Failed", 2000, 1);
    }
    return txHash;
}
export async function sendCreatePool(connection, wallet, transaction, id) {
    const txHash = await sendTransaction(connection, wallet, transaction);
    if (txHash != null) {
        let confirming_id = showToast("Confirming Transaction ...", 4000, 2);
        let res = await connection.confirmTransaction(txHash);
        toast.dismiss(confirming_id);
        if (res.value.err) {
            showToast("Transaction Failed", 2000, 1);
        } else {
            localStorage.setItem(`createdPool${id}`, 'created');
            showToast("Transaction Confirmed", 2000);
        }
    } else {
        showToast("Transaction Failed", 2000, 1);
    }
    return txHash;
}

export async function sendTransaction(connection, wallet, transaction) {
    if (wallet.publicKey === null || wallet.signTransaction === undefined)
        return null;
    try {
        transaction.recentBlockhash = (
            await connection.getLatestBlockhash()
        ).blockhash;
        transaction.feePayer = wallet.publicKey;
        const signedTransaction = await wallet.signTransaction(transaction);
        const rawTransaction = signedTransaction.serialize();

        showToast("Sending Transaction ...", 500);
        // notify({
        //   message: "Transaction",
        //   description: "Sending Transaction ...",
        //   duration: 0.5,
        // });

        const txid = await connection.sendRawTransaction(rawTransaction, {
            skipPreflight: true,
            preflightCommitment: "processed",
        });
        return txid;
    } catch (e) {
        return null;
    }
}

export const showToast = (txt, duration = 5000, ty = 0) => {
    let type = toast.TYPE.SUCCESS;
    if (ty === 1) type = toast.TYPE.ERROR;
    if (ty === 2) type = toast.TYPE.INFO;

    let autoClose = duration;
    if (duration < 0) {
        autoClose = false;
    }
    return toast.error(txt, {
        position: "bottom-right",
        autoClose,
        hideProgressBar: false,
        closeOnClick: false,
        pauseOnHover: false,
        draggable: true,
        progress: undefined,
        type,
        theme: "colored",
    });
};

export const getStateInitialized = async (id) => {
    try {
        const state = await keys.getGlobalStateKey(id);
        const accInfo = await connection.getAccountInfo(state);

        if (accInfo) {
            return true;
        }
        return false;
    } catch (e) {
        return false;
    }
};

export const getAdminKey = () => {
    return Constants.ADMINWALLET.toString();
};

export const getSubscriberKey = () => {
    return Constants.SubscriberWallet.toString();
};

export const getIsAdmin = async (wallet, id) => {
    try {
        const program = getProgram(wallet);
        const states = await program.account.stateAccount.all();
        const state = states.filter((state) => (state.id === id));
        const acc = state.account.authority;

        if (wallet.publicKey.toString() === acc.toString()) {
            return true;
        }
    } catch (e) {
        return false;
    }
    return false;
};

export const getIsPoolInitialized = async (tokenMint, id) => {
    try {
        const pool = await keys.getPoolKey(tokenMint, id);
        if (await connection.getAccountInfo(pool)) {
            return true;
        }
        return false;
    } catch (e) {
        return false;
    }
};

export const getTokenFromType = (heading) => {
    switch (heading) {
        case "SI_TOKEN":
            return Constants.SI_TOKEN;
        default:
            return null;
    }
};

export const convertToDecimal = (amount) => {
    const integerStringValue = (
        parseFloat(amount) *
        10 ** Constants.SI_DECIMALS
    ).toFixed(0);
    const stakingAmount = new BN(integerStringValue);
    return stakingAmount;
};

export const convertFromDecimal = (amount) => {
    return amount / 10 ** Constants.SI_DECIMALS;
};
//////////////////////////////   //////////////////////////////////////
/////////////////////////////   //////////////////////////////////////
///////////////////////    PreSale   ////////////////////////////////
///////////////////////////   //////////////////////////////////////
//////////////////////////   //////////////////////////////////////
// const rTokenMint = Constants.SI_TOKEN;
// const pTokenMint = Constants.pFRENS;

export const getAdmin = async (wallet) => {
    try {
        // console.log("wallet:", wallet.publicKey.toString());
        if (wallet.publicKey.toString() === Constants.ADMINWALLET.toString()) {
            return true;
        }
    } catch (e) {
        return false;
    }
    return false;
};
