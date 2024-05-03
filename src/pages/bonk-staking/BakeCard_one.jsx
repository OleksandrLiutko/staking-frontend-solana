import React, { useCallback, useEffect, useState } from 'react'

import axios from 'axios'
import { useSearchParams } from 'react-router-dom'

import Box from '@mui/material/Box'
import Button from '@mui/material/Button'
import Card from '@mui/material/Card'
/* eslint-disable react-hooks/exhaustive-deps */
import CardContent from '@mui/material/CardContent'
import Divider from '@mui/material/Divider'
import Grid from '@mui/material/Grid'
import Stack from '@mui/material/Stack'
import Typography from '@mui/material/Typography'
import { styled } from '@mui/system'
import * as anchor from '@project-serum/anchor'
import * as token from '@solana/spl-token'
import { useWallet } from '@solana/wallet-adapter-react'
import LoadingButton from '@mui/lab/LoadingButton'

import {
    claim_staking,
    createStakingPool,
    createStakingState,
    fundStakingReward,
    getAdminKey,
    getMyStakedAndReward,
    getSubscriberKey,
    getTokenFromType,
    showToast,
    stake,
    unstake,
    withdraw_staking,
    getPoolAmount,
} from '../../contracts/web3_lvl_one'
import { config } from './config'
import PriceInput from './PriceInput'
import { STAKING_IDS, STAKING } from '../../contracts/constants_lvl_one'

const CardWrapper = styled(Card)({
    background: 'transparent',
    marginBottom: 24,
    border: '1px solid #555',
})

const ButtonContainer = styled(Grid)(({ theme }) => ({
    [theme.breakpoints.down('sm')]: {
        flexDirection: 'column',
        '> div': {
            marginLeft: 0,
            marginRight: 0,
        },
    },
}))

const UnderlinedGrid = styled(Grid)(() => ({
    borderBottom: '1px solid #d3d3d3',
}))

export default function BakeCardLvlOne() {
    const [TVL, setTVL] = useState(0)
    const [tvlPrice, setTVLPrice] = useState(0)
    const [tokenPrice, setTokenPrice] = useState(0)
    const [rewardDepositAmount, setRewardDepositAmount] = useState(0)
    const [rewardWithdrawAmount, setRewardWithdrawAmount] = useState(0)
    const [poolWithdrawAmount, setPoolWithdrawAmount] = useState(0)
    const [searchParams, setSearchParams] = useSearchParams()
    const [stakeAmount, setStakeAmount] = useState(0)
    const [stakedAmount, setStakedAmount] = useState(0)
    const [unStakeAmount, setUnStakeAmount] = useState(0)
    const [rewards, setRewards] = useState(0)
    const [walletBalance, setWalletBalance] = useState(0)
    const [dataUpdate, setDataUpdate] = useState(false)

    const [staking, setStaking] = useState(false)
    const [unstaking, setUnStaking] = useState(false)
    const [claimReward, setClaimReward] = useState(false)
    const connection = new anchor.web3.Connection(config.NET_RPC)
    const createStatus = localStorage.getItem('createdStatus10') === 'created' ? true : false
    const createStatusPool = localStorage.getItem('createdPool10') === 'created'? true: false
    const wallet = useWallet()

    const tokenMint = getTokenFromType('SI_TOKEN')
    const isAdminConnected = () => {
        if (wallet && wallet.publicKey) {
            return wallet.publicKey.toString() == getAdminKey()
        }
        return false
    }

    const isSubscriberConnected = () => {
        if (wallet && wallet.publicKey) {
            return wallet.publicKey.toString() == getSubscriberKey()
        }
        return false
    }

    const onAddStakingPool = async () => {
        try {
            let txHash = await createStakingPool(
                wallet,
                tokenMint,
                STAKING[0].APY,
                STAKING[0].LOCK_TIME,
                STAKING_IDS[0]
            )
            console.log(txHash)
        } catch (e) {
            console.error(e)
        }
    }

    const onCreateStakingState = async () => {

        try {
            let txHash = await createStakingState(wallet, tokenMint, STAKING_IDS[0])
            console.log(txHash)
        } catch (e) {
            console.error(e)
        }
    }

    const onDepositStakingReward = async () => {
        try {
            let txHash = await fundStakingReward(
                wallet,
                rewardDepositAmount,
                tokenMint,
                STAKING_IDS[0]
            )
            console.log(txHash)
        } catch (e) {
            console.error(e)
        }
    }

    // const onWithdrawStakingReward = async () => {
    //     try {
    //         let txHash = await refundStakingReward(
    //             wallet,
    //             rewardWithdrawAmount,
    //             tokenMint
    //         );
    //         console.log(txHash);
    //     } catch (e) {
    //         console.error(e);
    //     }
    // };

    const getReward = async () => {
        try {
            const [amount, reward_amount] = await getMyStakedAndReward(
                wallet,
                tokenMint,
                STAKING_IDS[0]
            )
            // const vault = await getVaultAmount(
            //     wallet,
            //     config.REWARD_TOKEN_ADDR
            // );
            // setEstimatedAward(vault);
            setStakedAmount(amount)
            setRewards(reward_amount)
        } catch (error) {
            console.log(error)
        }
    }

    const roundBigUnit = (number, digits = 2) => {
        let unitNum = 0
        const unitName = ['', 'K', 'M', 'B']
        while (number >= 1000) {
            unitNum++
            number /= 1000

            if (unitNum > 2) {
                break
            }
        }

        return `${roundDecimal(number, digits)} ${unitName[unitNum]}`
    }

    const roundDecimal = (number, digits = 5) => {
        return number.toLocaleString('en-US', {
            maximumFractionDigits: digits,
        })
    }

    const getTokenPrice = async () => {
        try {
            const url = `https://price.jup.ag/v4/price?ids=${tokenMint.toString()}&vsToken=Es9vMFrzaCERmJfrF4H2FYD4KCoNkY11McCe8BenwNYB`
            const { data } = await axios.get(url)

            if (data && data.data && data.data[tokenMint.toString()]) {
                setTokenPrice(data.data[tokenMint.toString()].price);
            }
        } catch (error) {
            console.log(error)
        }
    }

    useEffect(() => {
        const intervalId = setInterval(() => {
            // Your function logic here
            getTokenPrice()
            getReward()
            fetchBalance()
        }, 2000) // Change the interval time as needed (in milliseconds)

        getTokenPrice()
        getReward()
        fetchBalance()

        return () => {
            clearInterval(intervalId) // Clean up the interval when the component unmounts
        }
    }, [wallet]) // Dependencies array to ensure the effect only runs once

    const fetchBalance = useCallback(async () => {
        try {
            const mint = tokenMint

            const userAta = await token.getOrCreateAssociatedTokenAccount(
                connection,
                wallet,
                mint,
                wallet.publicKey,
                false
            )
            const userAta_balance =
                parseInt(userAta.amount) / 10 ** config.REWARD_TOKEN_DECIMAL
            setWalletBalance(userAta_balance)
        } catch (error) {
            console.error('Error fetching balance:', error)
        }
    }, [connection, wallet])

    useEffect(() => {
        const updateTVL = async () => {
            const tvl = await getPoolAmount(wallet, tokenMint, STAKING_IDS[0]);
            console.log("TVL : ", tvl);
            setTVL(tvl); 
            const tvlPrice = tvl * tokenPrice;
            setTVLPrice(tvlPrice.toFixed(3))
        }
        updateTVL();
    }, [dataUpdate])

    useEffect(() => {
        setTimeout(() => {
            toggleDataUpdate();
        }, 10000);
    }, [dataUpdate]);

    const toggleDataUpdate = () => {
        console.log("update data");
        setDataUpdate(!dataUpdate);
    }

    const onStake = async () => {
        let referral = getRef()
        if (referral === null) referral = wallet.publicKey.toString()
        // console.log("123123123123123");

        if (stakeAmount > walletBalance) {
            showToast('Change Stake Value! this is too large than Max', 3000, 1)
            return
        }
        if (TVL + Number(stakeAmount) > STAKING[0].LIMIT) {
            showToast('Stake Amount Overflow', 3000, 1)
            return
        }

        try {
            setStaking(true)
            let txHash = await stake(
                wallet,
                stakeAmount,
                tokenMint,
                referral,
                STAKING_IDS[0]
            )
            console.log('txHash:', txHash)
        } catch (e) {
            console.error(e)
        } finally {
            setStaking(false)
        }
    }

    const onUnstake = async () => {
        let referral = getRef()
        if (referral === null) referral = wallet.publicKey.toString()
        try {
            setUnStaking(true)
            await unstake(wallet, unStakeAmount, tokenMint, referral, STAKING_IDS[0])
        } catch (e) {
            showToast('Transaction failed', 2000, 1)
            console.error(e)
        } finally {
            setUnStaking(false)
        }
    }

    const onClaim = async () => {
        try {
            setClaimReward(true)
            await claim_staking(wallet, tokenMint, STAKING_IDS[0])
        } catch (e) {
            showToast('Transaction failed', 2000, 1)
            console.error(e)
        } finally {
            setClaimReward(false)
        }
    }

    const onWithdraw = async () => {
        try {
            
            await withdraw_staking(
                wallet,
                tokenMint,
                rewardWithdrawAmount,
                poolWithdrawAmount,
                STAKING_IDS[0]
            )
        } catch (e) {
            console.error(e)
        }
        
    }

    const getRef = () => {
        const ref = searchParams.get('ref')
        return ref
    }

    return (
        <CardWrapper>
            <CardContent className="fact">
                <UnderlinedGrid
                    container
                    justifyContent="space-between"
                    alignItems="center"
                    mt={3}
                >
                    <Typography
                        variant="body1"
                        sx={{ color: 'black' }}
                        fontWeight="bolder"
                        style={{ fontFamily: 'Montserrat' }}
                    >
                        TVL
                    </Typography>
                    <Typography
                        variant="h5"
                        sx={{ color: 'black' }}
                        style={{ fontFamily: 'Montserrat' }}
                    >
                        $&nbsp;{tvlPrice}
                    </Typography>
                </UnderlinedGrid>
                <UnderlinedGrid
                    container
                    justifyContent="space-between"
                    alignItems="center"
                    mt={3}
                >
                    <Typography
                        variant="body1"
                        sx={{ color: 'black' }}
                        fontWeight="bolder"
                        style={{ fontFamily: 'Montserrat' }}
                    >
                        APY
                    </Typography>
                    <Typography
                        variant="h5"
                        sx={{ color: 'black' }}
                        style={{ fontFamily: 'Montserrat' }}
                    >
                        15%
                    </Typography>
                </UnderlinedGrid>
                <UnderlinedGrid
                    container
                    justifyContent="space-between"
                    alignItems="center"
                    mt={3}
                >
                    <Typography
                        variant="body1"
                        sx={{ color: 'black' }}
                        fontWeight="bolder"
                        style={{ fontFamily: 'Montserrat' }}
                    >
                        Lock Time
                    </Typography>
                    <Typography
                        variant="h5"
                        sx={{ color: 'black' }}
                        style={{ fontFamily: 'Montserrat' }}
                    >
                        {config.LEVEL_ONE_LOCK_TIME} month
                    </Typography>
                </UnderlinedGrid>
                <UnderlinedGrid
                    container
                    justifyContent="space-between"
                    alignItems="center"
                    mt={3}
                >
                    <Typography
                        variant="body1"
                        fontWeight="bolder"
                        sx={{ color: 'black' }}
                        style={{ fontFamily: 'Montserrat' }}
                    >
                        Wallet
                    </Typography>
                    <Typography
                        variant="h5"
                        sx={{ color: 'black' }}
                        style={{ fontFamily: 'Montserrat' }}
                    >
                        {walletBalance} {config.REWARD_TOKEN_SYMBOL}
                    </Typography>
                </UnderlinedGrid>
                <Box paddingTop={3}>
                    {/** admin zone begin */}
                    {isAdminConnected() ? (
                        <Box bgcolor="gray" padding={3} borderRadius={2}>
                            {/* <Box> */}

                            <Typography
                                variant="h5"
                                sx={{
                                    color: 'white',
                                    paddingBottom: '10px',
                                    textAlign: 'center',
                                }}
                                style={{ fontFamily: 'Montserrat' }}
                            >
                                ADMIN Panel
                            </Typography>
                            <Box marginBottom={3}>
                                <Button
                                    variant="contained"
                                    fullWidth
                                    onClick={onCreateStakingState}
                                    // hidden={isInitialized}
                                    disabled={createStatus}
                                    className="custom-button"
                                    style={{ fontFamily: 'Montserrat' }}
                                >
                                    Create State
                                </Button>
                            </Box>
                            <Box>
                                <Button
                                    variant="contained"
                                    disableElevation
                                    fullWidth
                                    onClick={onAddStakingPool}
                                    // hidden={!canShowSettings}
                                    className="custom-button"
                                    disabled={createStatusPool}
                                    style={{ fontFamily: 'Montserrat' }}
                                >
                                    Create Pool
                                </Button>
                            </Box>
                            <Box
                                display="flex"
                                flexDirection="column"
                                alignItems="flex-end"
                                marginBottom={3}
                            >
                                <span
                                    style={{
                                        color: 'white',
                                        fontFamily: 'Montserrat',
                                    }}
                                >
                                    max : {walletBalance}
                                </span>
                                <Stack flex={1} width="100%" spacing={1} direction="row">
                                    <PriceInput
                                        max={+walletBalance}
                                        value={rewardDepositAmount}
                                        onChange={(value) => {
                                            setRewardDepositAmount(value)
                                        }}
                                    />
                                    <Button
                                        variant="contained"
                                        onClick={() => {
                                            setRewardDepositAmount(walletBalance)
                                        }}
                                        style={{ fontFamily: 'Montserrat' }}
                                    >
                                        MAX
                                    </Button>
                                </Stack>
                            </Box>
                            <Box>
                                <Button
                                    variant="contained"
                                    disableElevation
                                    fullWidth
                                    onClick={onDepositStakingReward}
                                    // hidden={!canShowSettings}
                                    className="custom-button"
                                    style={{ fontFamily: 'Montserrat' }}
                                >
                                    Deposit
                                </Button>
                            </Box>
                        </Box>
                    ) : (
                        <></>
                    )}

                    {isSubscriberConnected() ? (
                        <Box bgcolor="gray" padding={3} borderRadius={2}>
                            <Typography
                                variant="h5"
                                sx={{
                                    color: 'white',
                                    paddingBottom: '10px',
                                    textAlign: 'center',
                                }}
                                style={{ fontFamily: 'Montserrat' }}
                            >
                                Subscriber Panel
                            </Typography>

                            <Box
                                display="flex"
                                flexDirection="column"
                                alignItems="flex-end"
                                marginBottom={3}
                            >
                                <Stack flex={1} width="100%" spacing={1} direction="row">
                                    <PriceInput
                                        value={rewardWithdrawAmount}
                                        onChange={(value) => {
                                            setRewardWithdrawAmount(value)
                                        }}
                                    />
                                </Stack>
                            </Box>
                            <Box
                                display="flex"
                                flexDirection="column"
                                alignItems="flex-end"
                                marginBottom={3}
                            >
                                <Stack flex={1} width="100%" spacing={1} direction="row">
                                    <PriceInput
                                        value={poolWithdrawAmount}
                                        onChange={(value) => {
                                            setPoolWithdrawAmount(value)
                                        }}
                                    />
                                </Stack>
                            </Box>
                            <Box marginBottom={3}>
                                <Button
                                    variant="contained"
                                    fullWidth
                                    onClick={onWithdraw}
                                    // hidden={!canShowSettings}
                                    className="custom-button"
                                >
                                    Withdraw
                                </Button>
                            </Box>
                        </Box>
                    ) : (
                        <></>
                    )}

                    <Box>
                        <Box display="flex" flexDirection="column" alignItems="flex-end">
                            <span style={{ fontFamily: 'Montserrat' }}>
                                max : {walletBalance}
                            </span>
                            <Stack flex={1} width="100%" spacing={1} direction="row">
                                <PriceInput
                                    max={walletBalance}
                                    value={stakeAmount}
                                    onChange={(value) => {
                                        setStakeAmount(value)
                                    }}
                                />
                                <Button
                                    variant="contained"
                                    onClick={() => {
                                        setStakeAmount(walletBalance)
                                    }}
                                    style={{ fontFamily: 'Montserrat' }}
                                >
                                    MAX
                                </Button>
                            </Stack>
                        </Box>

                        <Box marginTop={3}>
                            <LoadingButton
                                variant="contained"
                                fullWidth
                                disabled={stakeAmount === 0}
                                loading={staking}
                                loadingPosition="start"
                                onClick={onStake}
                                className="custom-button"
                                style={{ fontFamily: 'Montserrat' }}
                            >
                                Stake
                            </LoadingButton>
                        </Box>
                        <Box paddingTop={1}>
                            <Box
                                display="flex"
                                flexDirection="column"
                                alignItems="flex-end"
                                paddingTop={3}
                            >
                                <span style={{ fontFamily: 'Montserrat' }}>
                                    max : {stakedAmount}
                                </span>
                                <Stack flex={1} width="100%" spacing={1} direction="row">
                                    <PriceInput
                                        max={+stakedAmount}
                                        value={unStakeAmount}
                                        onChange={(value) => {
                                            setUnStakeAmount(value)
                                        }}
                                    />
                                    <Button
                                        variant="contained"
                                        onClick={() => {
                                            setUnStakeAmount(stakedAmount)
                                        }}
                                        style={{ fontFamily: 'Montserrat' }}
                                    >
                                        MAX
                                    </Button>
                                </Stack>
                            </Box>

                            <Box marginTop={3} marginBottom={3}>
                                <LoadingButton
                                    variant="contained"
                                    fullWidth
                                    disabled={unStakeAmount === 0}
                                    onClick={onUnstake}
                                    loading={unstaking}
                                    loadingPosition="start"
                                    className="custom-button"
                                    style={{ fontFamily: 'Montserrat' }}
                                >
                                    Unstake
                                </LoadingButton>
                            </Box>
                            <Divider />
                            <Grid
                                container
                                justifyContent="space-between"
                                alignItems="center"
                                mt={3}
                            >
                                <Typography
                                    variant="body1"
                                    sx={{ color: 'black' }}
                                    fontWeight="bolder"
                                    style={{ fontFamily: 'Montserrat' }}
                                >
                                    Your Rewards
                                </Typography>
                                <Typography
                                    variant="h5"
                                    sx={{ color: 'black' }}
                                    fontWeight="bolder"
                                    style={{ fontFamily: 'Montserrat' }}
                                >
                                    {rewards} {config.REWARD_TOKEN_SYMBOL}
                                </Typography>
                            </Grid>
                            <ButtonContainer container>
                                <Grid item flexGrow={1} marginLeft={1} marginTop={3}>
                                    <LoadingButton
                                        variant="contained"
                                        color="secondary"
                                        fullWidth
                                        disabled={rewards === 0}
                                        onClick={onClaim}
                                        loading={claimReward}
                                        loadingPosition="start"
                                        className="custom-button"
                                        style={{ fontFamily: 'Montserrat' }}
                                    >
                                        CLAIM REWARDS
                                    </LoadingButton>
                                </Grid>
                            </ButtonContainer>
                        </Box>
                    </Box>

                    {/** admin zone end */}
                </Box>
            </CardContent>
        </CardWrapper>
    )
}
