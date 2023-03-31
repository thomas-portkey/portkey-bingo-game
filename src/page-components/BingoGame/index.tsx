import React, { useCallback, useEffect, useMemo, useRef, useState } from 'react';
import styles from './style.module.css';
import AElf from 'aelf-sdk';
// import { ConfigProvider, SignIn } from '@portkey/did-ui-react';
import { ConfigProvider, SignIn, DIDWalletInfo, did, PortkeyLoading } from '@portkey/did-ui-react';

// import { did } from '@portkey/did-ui-react/src/utils/did';
import Image from 'next/image';

import { getContractBasic, ContractBasic } from '@portkey/contracts';
// import { DIDWalletInfo } from '@portkey/did-ui-react/src/components/types';
import { ChainInfo } from '@portkey/services';
import { useDelay } from '../../hooks/common';
import { bingoAddress, CHAIN_ID } from '../../constants/network';
import { Modal, Input, Button } from 'antd';
import { Store } from '../../utils/store';
import { copy } from '../../utils/common';
const { sha256 } = AElf.utils;

enum StepStatus {
  INIT,
  LOGIN,
  PLAY,
  BINGO,
}

const KEY_NAME = 'BINGO_GAME';

export default function Home() {
  const aelfRef = useRef<any>();
  const chainInfoRef = useRef<ChainInfo>();
  const caContractRef = useRef<ContractBasic>();
  const multiTokenContractRef = useRef<ContractBasic>();
  const walletRef = useRef<DIDWalletInfo>();
  const txIdRef = useRef('');

  const loadingRef = useRef(false);
  const [isLoaderShow, setIsLoaderShow] = useState(false);
  const [balanceValue, setBalanceValue] = useState('loading...');
  const [balanceInputValue, setBalanceInputValue] = useState('');
  const [isSignInShow, setIsSignInShow] = useState<boolean>();
  const [count, setCount] = useState(0);
  const [caAddress, setCaAddress] = useState('');
  const delay = useDelay();
  const [stepStatus, setStepStatus] = useState<StepStatus>(StepStatus.INIT);
  const [isUnlockShow, setIsUnlockShow] = useState(false);
  const [passwordValue, setPasswordValue] = useState('');
  const [isWalletExist, setIsWalletExist] = useState(false);
  const [isErrorTipShow, setIsErrorTipShow] = useState(false);
  const [isLogoutShow, setIsLogoutShow] = useState(false);

  const setLoading = useCallback((value: boolean) => {
    loadingRef.current = value;
    setIsLoaderShow(value);
  }, []);

  const getBalance = useCallback(async () => {
    const multiTokenContract = multiTokenContractRef.current;
    const wallet = walletRef.current;
    if (!multiTokenContract || !wallet) return 0;

    setBalanceValue('loading...');
    await delay();
    const result = await multiTokenContract.callViewMethod('GetBalance', {
      symbol: 'ELF',
      owner: wallet.caInfo.caAddress,
    });

    console.log('getBalance: result', result);
    const balance = result.data.balance / 10 ** 8;
    const difference = balance - Number(balanceValue);
    setBalanceValue(balance.toString());
    return difference;
  }, [balanceValue, delay]);

  // bingo game register
  const register = useCallback(async () => {
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
  }, [delay, getBalance]);

  const approve = useCallback(async () => {
    const wallet = walletRef.current;
    const caContract = caContractRef.current;
    const multiTokenContract = multiTokenContractRef.current;
    if (!caContract || !wallet || !multiTokenContract) return;

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
  }, [getBalance]);

  const initContract = useCallback(async () => {
    const chainInfo = chainInfoRef.current;
    const aelf = aelfRef.current;
    const wallet = walletRef.current;
    if (!aelfRef.current || !chainInfo || !wallet) return;
    if (loadingRef.current) return;
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
      // aelf  token
      const tokenContractAddress = await zeroC.callViewMethod(
        'GetContractAddressByName',
        sha256('AElf.ContractNames.Token'),
      );
      const multiTokenContract = await getContractBasic({
        contractAddress: tokenContractAddress.data,
        account: wallet.walletInfo.wallet,
        rpcUrl: chainInfo?.endPoint,
      });
      multiTokenContractRef.current = multiTokenContract;

      //
      await delay();
      await register();
      await approve();
      setStepStatus(StepStatus.PLAY);
      console.log('initContract');
    } catch (error) {
      console.log('initContract: error', error);
    }

    setLoading(false);
    setCaAddress(wallet.caInfo.caAddress);
  }, [approve, delay, register, setLoading]);

  const init = useCallback(async () => {
    ConfigProvider.setGlobalConfig({
      storageMethod: new Store(),
    });
    const chainsInfo = await did.services.getChainsInfo();
    const chainInfo = chainsInfo.find((chain) => chain.chainId === CHAIN_ID);
    if (!chainInfo) {
      alert('chain is not running');
      return;
    }
    chainInfoRef.current = chainInfo;

    const aelf = new AElf(new AElf.providers.HttpProvider(chainInfo.endPoint));
    aelfRef.current = aelf;
    if (!aelf.isConnected()) {
      alert('Blockchain Node is not running.');
      return;
    }

    setStepStatus(StepStatus.LOGIN);
  }, []);

  useEffect(() => {
    if (typeof window !== undefined && window.localStorage.getItem(KEY_NAME)) {
      setIsWalletExist(true);
      setIsLogoutShow(true);
    }
    init();
  }, []);

  const unlock = useCallback(async () => {
    const wallet = await did.load(passwordValue, KEY_NAME);
    console.log('wallet', wallet);
    if (!wallet.didWallet.accountInfo.loginAccount) {
      setIsErrorTipShow(true);
      return;
    }
    walletRef.current = {
      caInfo: { ...wallet.didWallet.caInfo[CHAIN_ID] },
      pin: '',
      walletInfo: wallet.didWallet.managementAccount,
    };
    setIsUnlockShow(false);
    initContract();
  }, [initContract, passwordValue]);

  const onUnlockClick = useCallback(() => {
    setPasswordValue('');
    setIsUnlockShow(true);
  }, []);

  const onPlay = useCallback(async () => {
    const caContract = caContractRef.current;
    const wallet = walletRef.current;
    if (!caContract || !wallet) return;

    const reg = /^[1-9]\d*$/;
    const value = parseInt(balanceInputValue, 10);
    if (value < 1) {
      return alert('A minimum bet of 1 ELFs!');
    }
    if (!reg.test(value.toString())) {
      alert('Please enter a positive integer greater than 0!');
      return;
    }
    if (value > Number(balanceValue)) {
      alert('Please enter a number less than the number of ELFs you own!');
      return;
    }

    if (loadingRef.current) return;
    setLoading(true);

    try {
      const playResult = await caContract.callSendMethod('ManagerForwardCall', wallet.walletInfo.wallet.address, {
        caHash: wallet.caInfo.caHash,
        contractAddress: bingoAddress,
        methodName: 'Play',
        args: {
          value: `${value * 10 ** 8}`,
        },
      });

      console.log('Play result: ', playResult);
      txIdRef.current = playResult.data.TransactionId || '';
      await new Promise<void>((resolve) => {
        let count = 30;
        setCount(count);
        const timer = setInterval(() => {
          setCount(--count);
          if (count <= 0) {
            clearInterval(timer);
            resolve();
          }
        }, 1000);
      });
      setStepStatus(StepStatus.BINGO);
    } catch (err) {
      console.log(err);
    }
    setLoading(false);
  }, [balanceInputValue, balanceValue, setLoading]);

  const onBingo = useCallback(async () => {
    const caContract = caContractRef.current;
    const wallet = walletRef.current;
    const txId = txIdRef.current;
    if (!caContract || !wallet || !txId) return;
    if (loadingRef.current) return;
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
      setStepStatus(StepStatus.PLAY);
      if (!difference) {
        alert('You got nothing');
      } else if (difference > 0) {
        alert(`Congratulations！！ You got ${difference} ELF`);
      } else if (difference < 0) {
        alert(`It’s a pity. You lost ${-difference} ELF`);
      }
    } catch (err) {
      console.log(err);
    }
    setLoading(false);
  }, [getBalance, setLoading]);

  const isLoginShow = useMemo(() => [StepStatus.INIT, StepStatus.LOGIN].includes(stepStatus), [stepStatus]);

  return (
    <>
      <div className={styles.body}>
        <div className={styles.siteHeader}>
          <div className={styles.siteTitle}>Bingo Game</div>

          {caAddress && (
            <div className={styles.caAddressWrap}>
              <span className={styles.label}>Your Accout:</span>
              <span className={styles.caAddressLabel}>{caAddress}</span>{' '}
              <button
                className={styles.button}
                onClick={() => {
                  copy(caAddress);
                  alert('Copy successfully');
                }}>
                copy
              </button>
            </div>
          )}
          {isLoginShow && (
            <>
              {isWalletExist ? (
                <button className={styles.register} onClick={onUnlockClick}>
                  {isLoaderShow ? 'Loading' : 'Unlock'}
                </button>
              ) : (
                <button className={styles.register} onClick={() => setIsSignInShow(true)}>
                  {isLoaderShow ? 'Loading' : 'Login'}
                </button>
              )}
              <br />
              {isLogoutShow && (
                <button
                  className={styles.register}
                  onClick={() => {
                    window.localStorage.removeItem(KEY_NAME);
                    history.go(0);
                  }}>
                  Logout
                </button>
              )}
            </>
          )}
        </div>

        {!isLoginShow && (
          <div className={styles.siteBody}>
            <div className={styles.balance}>
              Your CARD: <span>{balanceValue}</span> ELF （Refresh page to restart）
            </div>
            <div className={styles.inputBox}>
              <input
                type="text"
                className={styles.inputWrap}
                value={balanceInputValue}
                placeholder="Please input amount"
                onChange={(e) => {
                  setBalanceInputValue(e.target.value);
                }}
              />
              <span className={[styles.inputBorder, styles.bottom].join(' ')} />
              <span className={[styles.inputBorder, styles.right].join(' ')} />
              <span className={[styles.inputBorder, styles.top].join(' ')} />
              <span className={[styles.inputBorder, styles.left].join(' ')} />
              <button className={styles.button} onClick={getBalance}>
                Get balance manually
              </button>
            </div>
            <div className={styles.buttonBox}>
              <button
                className={styles.button}
                onClick={() => {
                  setBalanceInputValue('30');
                }}>
                30
              </button>
              <button
                className={styles.button}
                onClick={() => {
                  setBalanceInputValue('50');
                }}>
                50
              </button>
              <button
                type="button"
                className={styles.button}
                onClick={() => {
                  setBalanceInputValue(`${parseInt((Number(balanceValue) / 2).toString(), 10)}`);
                }}>
                Half
              </button>
              <button
                type="button"
                className={styles.button}
                onClick={() => {
                  setBalanceInputValue(`${parseInt(balanceValue, 10)}`);
                }}>
                All-In
              </button>
            </div>
            <div>
              {stepStatus === StepStatus.PLAY && (
                <button className={styles.play} type="button" onClick={onPlay}>
                  {count || 'Play'}
                </button>
              )}
            </div>
            <div>
              {stepStatus === StepStatus.BINGO && (
                <button className={styles.play} type="button" onClick={onBingo}>
                  Bingo
                </button>
              )}
            </div>
          </div>
        )}

        {isLoaderShow && (
          <div className={styles.loader}>
            <div className={styles.outer}></div>
            <div className={styles.middle}></div>
            <div className={styles.inner}></div>
          </div>
        )}

        <SignIn
          open={isSignInShow}
          sandboxId="portkey-ui-sandbox"
          chainId={CHAIN_ID}
          onFinish={(wallet) => {
            setIsSignInShow(false);
            walletRef.current = wallet;
            did.save(wallet.pin, KEY_NAME);
            initContract();
          }}
          onError={(err) => {
            console.error(err, 'onError==');
          }}
          onCancel={() => {
            setIsSignInShow(false);
          }}
        />

        <Modal
          open={isUnlockShow}
          closable={false}
          centered
          title={null}
          footer={null}
          maskStyle={{ backgroundColor: 'rgba(0, 0, 0, 0.3)' }}
          width={430}
          className="portkey-ui-base-modal"
          onCancel={() => {
            setIsUnlockShow(false);
          }}>
          <div className={styles.unlockBody}>
            <Image src="./portkey.svg" alt="" width={88} height={88} />
            <h1>Welcome back!</h1>
            <div className={styles.passwordWrap}>
              <span className={styles.passwordLabel}>Enter Pin</span>
              <Input.Password
                value={passwordValue}
                placeholder="Enter Pin"
                className={styles.passwordInput}
                maxLength={16}
                onChange={(e) => {
                  setIsErrorTipShow(false);
                  setPasswordValue(e.target.value);
                }}
              />
              <div className={styles.errorTips}>{isErrorTipShow ? 'Incorrect pin' : ''}</div>
            </div>

            <Button disabled={passwordValue.length < 6} className={styles.submitBtn} type="primary" onClick={unlock}>
              Unlock
            </Button>
          </div>
        </Modal>
      </div>
    </>
  );
}
