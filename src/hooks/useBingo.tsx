import React, { useEffect, useRef, useState } from 'react';
import { DIDWalletInfo, did } from '@portkey/did-ui-react';
import { ChainInfo } from '@portkey/services';
import { getContractBasic, ContractBasic } from '@portkey/contracts';
import AElf from 'aelf-sdk';
import { Toast } from 'antd-mobile';

import { useDelay } from './common';

import { bingoAddress, CHAIN_ID } from '../constants/network';

export enum StepStatus {
  INIT,
  LOCK,
  LOGIN,
  PLAY,
  CUTDOWN,
  BINGO,
  END,
}

export enum SettingPage {
  NULL,
  ACCOUNT,
  BALANCE,
  LOGOUT,
}

export enum ButtonType {
  BLUE,
  ORIANGE,
}

export const KEY_NAME = 'BINGO_GAME';
const { sha256 } = AElf.utils;

const BIG = [129, 256];
const SMALL = [0, 128];

const useBingo = () => {
  const [step, setStep] = useState(StepStatus.INIT);
  const [settingPage, setSettingPage] = useState(SettingPage.NULL);
  const [isLogin, setIsLogin] = useState(false);
  const [showQrCode, setShowQrCode] = useState(false);
  const [isWin, setIsWin] = useState(false);
  const [enablePlay, setEnablePlay] = useState(false);

  const [passwordValue, setPasswordValue] = useState('ls123456');

  const [balanceValue, setBalanceValue] = useState('0');
  const [balanceInputValue, setBalanceInputValue] = useState('0');
  const [difference, setDifference] = useState(0);
  const [result, setResult] = useState(Infinity);
  const [hasFinishBet, setHasFinishBet] = useState(false);

  const [isWalletExist, setIsWalletExist] = useState(false);
  const [loading, setLoading] = useState(false);
  const [caAddress, setCaAddress] = useState('');
  const [time, setTime] = useState(30);

  const walletRef = useRef<DIDWalletInfo>();
  const chainInfoRef = useRef<ChainInfo>();
  const caContractRef = useRef<ContractBasic>();
  const multiTokenContractRef = useRef<ContractBasic>();
  const aelfRef = useRef<any>();
  const txIdRef = useRef('');
  const smallOrBigRef = useRef(false); // true: big, false: small;
  const tokenContractAddressRef = useRef('');

  const accountAddress = `ELF_${caAddress}_${chainInfoRef.current?.chainId}`;

  /**
   *  logic function
   */
  const delay = useDelay();
  const handleCopyToken = () => {
    navigator.clipboard.writeText(accountAddress);
    Toast.show({
      content: 'Copied!',
    });
  };

  // get a inter  between 1 and 128
  const getRandom = (from: number, to: number) => {
    return Math.floor(Math.random() * (to - from)) + from;
  };

  const init = async () => {
    const chainsInfo = await did.services.getChainsInfo();
    console.log('chainsInfo--', chainsInfo);

    const chainInfo = chainsInfo.find((chain) => chain.chainId === CHAIN_ID);
    if (!chainInfo) {
      Toast.show({
        content: 'chain is not running',
      });
      return;
    }
    chainInfoRef.current = chainInfo;

    const aelf = new AElf(new AElf.providers.HttpProvider(chainInfo.endPoint));
    aelfRef.current = aelf;
    if (!aelf.isConnected()) {
      Toast.show({
        content: 'Blockchain Node is not running.',
      });
      return;
    }
    console.log('init success', aelf, chainInfo);
  };

  const login = () => {
    setIsLogin(true);
  };

  const getBalance = async () => {
    const multiTokenContract = multiTokenContractRef.current;
    const wallet = walletRef.current;
    if (!multiTokenContract || !wallet) return 0;

    // setBalanceValue('loading...');
    await delay();
    const result = await multiTokenContract.callViewMethod('GetBalance', {
      symbol: 'ELF',
      owner: wallet.caInfo.caAddress,
    });

    console.log('getBalance: result', result);
    const balance = result.data.balance / 10 ** 8;
    const differenceValue = balance - Number(balanceValue);
    setBalanceValue(balance.toString());
    return differenceValue;
  };

  const approve = async () => {
    const wallet = walletRef.current;
    const caContract = caContractRef.current;
    const multiTokenContract = multiTokenContractRef.current;
    if (!caContract || !wallet || !multiTokenContract) return;
    console.log('wallet--', wallet);

    const approve = await caContract.callSendMethod('ManagerForwardCall', wallet.walletInfo.wallet.address, {
      caHash: wallet.caInfo.caHash,
      contractAddress: multiTokenContract.address,
      methodName: 'Approve',
      args: {
        symbol: 'ELF',
        spender: bingoAddress,
        amount: '100000000000000000000',
      },
    });
    console.log('approve: result', approve);
    getBalance();
    console.log('Congratulations on your successful approve');
  };

  const register = async () => {
    const caContract = caContractRef.current;
    const wallet = walletRef.current;
    if (!wallet || !caContract) return;
    const registerResult = await caContract.callSendMethod('ManagerForwardCall', wallet.walletInfo.wallet.address, {
      caHash: wallet.caInfo.caHash,
      contractAddress: bingoAddress,
      methodName: 'Register',
      args: null,
    });
    console.log('register: result', registerResult);
    await delay();
    console.log('Congratulations on your successful registration！Please approve');
    getBalance();
  };

  // cutdown function
  const cutDown = async () => {
    await new Promise<void>((resolve) => {
      let count = 30;
      setTime(count);
      const timer = setInterval(() => {
        setTime(--count);
        if (count <= 0) {
          clearInterval(timer);
          resolve();
        }
      }, 1000);
    });
  };

  const unLock = async () => {
    const wallet = await did.load(passwordValue, KEY_NAME);
    if (!wallet.didWallet.accountInfo.loginAccount) {
      //   setIsErrorTipShow(true);
      return;
    }
    walletRef.current = {
      caInfo: { ...wallet.didWallet.caInfo[CHAIN_ID] },
      pin: '',
      chainId: CHAIN_ID,
      walletInfo: wallet.didWallet.managementAccount,
    };
    initContract();
  };

  const initContract = async () => {
    const chainInfo = chainInfoRef.current;
    const aelf = aelfRef.current;
    const wallet = walletRef.current;

    if (!aelfRef.current || !chainInfo || !wallet) return;
    console.log('init go on');

    // if (loadingRef.current) return;
    setLoading(true);

    try {
      caContractRef.current = await getContractBasic({
        contractAddress: chainInfo?.caContractAddress,
        account: wallet.walletInfo.wallet,
        rpcUrl: chainInfo?.endPoint,
      });
      const chainStatus = await aelf.chain.getChainStatus();
      const zeroC = await getContractBasic({
        contractAddress: chainStatus.GenesisContractAddress,
        account: wallet.walletInfo.wallet,
        rpcUrl: chainInfo?.endPoint,
      });
      const tokenContractAddress = await zeroC.callViewMethod(
        'GetContractAddressByName',
        sha256('AElf.ContractNames.Token'),
      );

      tokenContractAddressRef.current = tokenContractAddress.data;

      const multiTokenContract = await getContractBasic({
        contractAddress: tokenContractAddress.data,
        account: wallet.walletInfo.wallet,
        rpcUrl: chainInfo?.endPoint,
      });
      multiTokenContractRef.current = multiTokenContract;

      await delay();
      await register();
      await approve();
      setStep(StepStatus.PLAY);
      console.log('initContract success');
    } catch (error) {
      console.log('initContract: error', error);
    }

    setLoading(false);
    setCaAddress(wallet.caInfo.caAddress);
  };

  const setWallet = (wallet: any) => {
    walletRef.current = wallet;
  };

  const onPlay = async (smallOrBig: boolean) => {
    const caContract = caContractRef.current;
    const wallet = walletRef.current;
    if (!caContract || !wallet) return;

    const reg = /^[1-9]\d*$/;
    const value = parseInt(balanceInputValue, 10);

    if (value < 1) {
      return Toast.show('A minimum bet of 1 ELFs!');
    }
    if (!reg.test(value.toString())) {
      Toast.show('Please enter a positive integer greater than 0!');
      return;
    }

    if (value > Number(balanceValue)) {
      Toast.show('Please enter a number less than the number of ELFs you own!');
      return;
    }
    if (value > 100) {
      Toast.show('Please enter a number less than 100 ELFs!');
      return;
    }
    setLoading(true);

    try {
      const playResult = await caContract.callSendMethod('ManagerForwardCall', wallet.walletInfo.wallet.address, {
        caHash: wallet.caInfo.caHash,
        contractAddress: bingoAddress,
        methodName: 'Play',
        args: {
          amount: value * 10 ** 8,
          type: smallOrBig,
        },
      });

      console.log('Play result: ', playResult);
      txIdRef.current = playResult.data.TransactionId || '';
      smallOrBigRef.current = smallOrBig;
      setLoading(false);
      setStep(StepStatus.CUTDOWN);
      await cutDown();
      setStep(StepStatus.BINGO);
    } catch (err) {
      console.log(err);
      setLoading(false);
    }
  };

  const onBingo = async () => {
    const caContract = caContractRef.current;
    const wallet = walletRef.current;
    const txId = txIdRef.current;
    if (!caContract || !wallet || !txId) return;
    setLoading(true);

    try {
      const bingoResult = await caContract.callSendMethod('ManagerForwardCall', wallet.walletInfo.wallet.address, {
        caHash: wallet.caInfo.caHash,
        contractAddress: bingoAddress,
        methodName: 'Bingo',
        args: txId,
      });

      console.log('Bingo: result', bingoResult);
      const difference = await getBalance();
      const isWin = difference > 0;
      const isBig = isWin ? smallOrBigRef.current : !smallOrBigRef.current;
      const [from, to] = isBig ? BIG : SMALL;
      const result = getRandom(from, to);
      setResult(result);

      console.log('difference', difference);
      setIsWin(isWin);
      setDifference(difference);
      setHasFinishBet(true);
      setLoading(false);
    } catch (err) {
      console.log(err);
    }
  };

  const onBet = () => {
    setHasFinishBet(false);
    setStep(StepStatus.PLAY);
  };

  const logOut = () => {
    window.localStorage.removeItem(KEY_NAME);
    setStep(StepStatus.LOGIN);
    setSettingPage(SettingPage.NULL);
  };

  const lock = async () => {
    setPasswordValue('');
    setStep(StepStatus.LOCK);
    setSettingPage(SettingPage.NULL);
  };

  useEffect(() => {
    setLoading(true);
    init();
    // if (typeof window !== undefined && window.localStorage.getItem(KEY_NAME)) {
    //   setIsWalletExist(true);
    //   //   walletRef.current = JSON.parse(window.localStorage.getItem('testWallet') || '{}' as any);
    //   //   setTimeout(() => {
    //   //     unLock()
    //   //   }, 2000);
    //   //   setIsLogoutShow(true);
    //   setStep(StepStatus.LOCK);
    // } else {
    //   setEnablePlay(true);
    //   setStep(StepStatus.LOGIN);
    // }
    setEnablePlay(true);
    setStep(StepStatus.LOGIN);
    setLoading(false);
  }, []);

  return {
    onBet,
    onBingo,
    onPlay,
    unLock,
    login,
    handleCopyToken,
    logOut,
    lock,
    setSettingPage,
    setBalanceInputValue,
    setCaAddress,
    caAddress,
    balanceValue,
    setBalanceValue,
    balanceInputValue,
    step,
    initContract,
    setLoading,
    loading,
    settingPage,
    isLogin,
    setIsLogin,
    showQrCode,
    isWin,
    enablePlay,
    setShowQrCode,
    difference,
    result,
    hasFinishBet,
    isWalletExist,
    time,
    setWallet,
    accountAddress,
    tokenContractAddress: tokenContractAddressRef.current,
  };
};
export default useBingo;
