import React, { MouseEventHandler, useCallback, useEffect, useMemo, useRef, useState } from 'react';
import { ConfigProvider, SignIn, DIDWalletInfo, did, PortkeyLoading } from '@portkey/did-ui-react';
import { ChainInfo } from '@portkey/services';
import { getContractBasic, ContractBasic } from '@portkey/contracts';
import AElf from 'aelf-sdk';
import { CenterPopup, Toast, Input } from 'antd-mobile';
import { QRCode } from 'react-qrcode-logo';

import { useDelay } from '../../hooks/common';
import { Store } from '../../utils/store';

import { bingoAddress, CHAIN_ID } from '../../constants/network';

import styles from './style_v2.module.css';

enum StepStatus {
  INIT,
  LOCK,
  LOGIN,
  PLAY,
  CUTDOWN,
  BINGO,
  END,
}

enum SettingPage {
  NULL,
  ACCOUNT,
  BALANCE,
  LOGOUT,
}

enum ButtonType {
  BLUE,
  ORIANGE,
}

const KEY_NAME = 'BINGO_GAME';
const { sha256 } = AElf.utils;

const BIG = [129, 256];
const SMALL = [0, 128];

const Button = (props: {
  children: any;
  enable?: boolean;
  type: ButtonType;
  className?: string;
  onClick?: MouseEventHandler<HTMLButtonElement>;
}) => {
  const { children, type, className, onClick, enable = true } = props;
  return (
    <button
      disabled={!enable}
      onClick={onClick}
      className={[className, styles.btn, type === ButtonType.BLUE ? styles.blueBtn : styles.oriangeBtn].join(' ')}>
      {children}
    </button>
  );
};

const MBingoGame = () => {
  const [step, setStep] = useState(StepStatus.INIT);
  const [settingPage, setSettingPage] = useState(SettingPage.NULL);
  const [isLogin, setIsLogin] = useState(false);
  const [showQrCode, setShowQrCode] = useState(false);
  const [isWin, setIsWin] = useState(false);
  const [enablePlay, setEnablePlay] = useState(false);

  const [passwordValue, setPasswordValue] = useState('ls123456');

  const [balanceValue, setBalanceValue] = useState('0');
  const [balanceInputValue, setBalanceInputValue] = useState('0');
  const [difference, setDifference] = useState<number>(0);
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

  const getRandom = (from: number, to: number) => {
    return Math.floor(Math.random() * (to - from)) + from;
  };

  const init = async () => {
    ConfigProvider.setGlobalConfig({
      storageMethod: new Store(),
    });
    const chainsInfo = await did.services.getChainsInfo();

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
      await caContract.callSendMethod('ManagerForwardCall', wallet.walletInfo.wallet.address, {
        caHash: wallet.caInfo.caHash,
        contractAddress: bingoAddress,
        methodName: 'Bingo',
        args: txId,
      });

      const difference = await getBalance();
      const isWin = difference > 0;
      const isBig = isWin ? smallOrBigRef.current : !smallOrBigRef.current;
      const [from, to] = isBig ? BIG : SMALL;
      const result = getRandom(from, to);
      setResult(result);

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
    setResult(Infinity);
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
    if (typeof window !== undefined && window.localStorage.getItem(KEY_NAME)) {
      setIsWalletExist(true);
      //   walletRef.current = JSON.parse(window.localStorage.getItem('testWallet') || '{}' as any);
      //   setTimeout(() => {
      //     unLock()
      //   }, 2000);
      //   setIsLogoutShow(true);
      setStep(StepStatus.LOCK);
    } else {
      setEnablePlay(true);
      setStep(StepStatus.LOGIN);
    }
    setLoading(false);
  }, []);

  /**
   *  render function
   */
  const renderDefault = () => {
    return (
      <div className={styles.defaultWrapper}>
        <img className={styles.logo} src={require('../../../public/bingo.png').default.src} />
        {step === StepStatus.LOCK && (
          <Button
            className={styles.defaultBtn}
            type={ButtonType.BLUE}
            onClick={() => {
              unLock();
            }}>
            <p className={styles.artWord}>UNLOCK</p>
          </Button>
        )}

        {step === StepStatus.LOGIN && (
          <Button className={styles.defaultBtn} type={ButtonType.BLUE} onClick={login}>
            <p className={styles.artWord}>PLAY NOW</p>
          </Button>
        )}
      </div>
    );
  };

  const PlayWrapper = (props: any) => {
    const { children, show = true } = props;
    return (
      <CenterPopup visible={show} className={styles.centerPopup}>
        <div className={styles.playWrapper}>
          <div className={styles.playContent}>{children}</div>
        </div>
        <div className={styles.settingBtnGroups}>
          <button
            onClick={() => {
              setSettingPage(SettingPage.ACCOUNT);
            }}
            className={[styles.settingBtn, styles.button].join(' ')}></button>
          <button
            onClick={() => {
              setSettingPage(SettingPage.BALANCE);
            }}
            className={[styles.settingBtn, styles.button].join(' ')}></button>
          <button
            onClick={() => {
              setSettingPage(SettingPage.LOGOUT);
            }}
            className={[styles.settingBtn, styles.button].join(' ')}></button>
        </div>
      </CenterPopup>
    );
  };

  const renderPlay = () => {
    return (
      <PlayWrapper>
        <div style={{ fontSize: '96px' }} className={[styles.boardWrapper, styles.artWord].join(' ')}>
          ?
        </div>
        <div className={styles.playContent__input}>
          <Input
            placeholder="0"
            value={balanceInputValue}
            style={{ fontSize: '24px' }}
            type="number"
            max={100}
            min={1}
            onChange={(val) => {
              setBalanceInputValue(val);
            }}
          />
          <span style={{ paddingRight: '8px' }}>BET</span>
          <span>ELF</span>
        </div>
        <div className={styles.playContent__btnGroups}>
          <button
            onClick={() => {
              setBalanceInputValue('1');
            }}
            className={[styles.playContent__btn, styles.button].join(' ')}>
            MIN
          </button>
          <button
            onClick={() => {
              try {
                const balance = Math.min(Number(balanceValue), 100);
                setBalanceInputValue(`${Math.floor(balance)}`);
              } catch (error) {
                console.log('error', error);
              }
            }}
            className={[styles.playContent__btn, styles.button].join(' ')}>
            MAX
          </button>
        </div>
        <div className={styles.playContent__betBtnGroups}>
          <Button
            className={styles.playContent__betBtn}
            type={ButtonType.ORIANGE}
            onClick={async () => {
              onPlay(true);
            }}>
            <span className={styles.playContent__betBtn_p}>
              <p className={styles.artWord}>BIG</p>
              <p>(129 - 256)</p>
            </span>
          </Button>
          <Button
            className={styles.playContent__betBtn}
            type={ButtonType.BLUE}
            onClick={() => {
              onPlay(false);
            }}>
            <span className={styles.playContent__betBtn_p}>
              <p className={styles.artWord}>SMALL</p>
              <p>(0 - 128)</p>
            </span>
          </Button>
        </div>
      </PlayWrapper>
    );
  };

  const renderCutDown = () => {
    return (
      <div className={styles.cutDownWrapper}>
        <div className={styles.cutDown__bg} />
        <div className={styles.cutDown}>
          <p>{time} s</p>
        </div>
      </div>
    );
  };

  const renderBingo = () => {
    const text = isWin ? 'You Win' : 'You Lose';
    const style = isWin
      ? {
          color: '#2E6BC7',
          background: '#C5DFFF',
        }
      : {
          color: '#D63333',
          background: '#FFCB9B',
        };
    return (
      <PlayWrapper>
        <div className={styles.bingoContent}>
          <div style={{ fontSize: '96px' }} className={[styles.boardWrapper, styles.artWord].join(' ')}>
            {result === Infinity ? '?' : result}
          </div>
          {hasFinishBet ? (
            <>
              <div className={styles.bingoTips}>
                {isWin ? (
                  <img src={require('../../../public/congratulation.png').default.src} />
                ) : (
                  <img src={require('../../../public/pity.png').default.src} />
                )}
                <div className={styles.bingoText}>
                  <span>{text}</span>
                  <span style={style}>{Math.abs(difference).toFixed(8)} ELF</span>
                </div>
              </div>
              <Button className={styles.playContent__betBtn} type={ButtonType.ORIANGE} onClick={onBet}>
                <span className={styles.playContent__betBtn_p}>
                  <p style={{ fontSize: '24px' }} className={styles.artWord}>
                    BET
                  </p>
                </span>
              </Button>
            </>
          ) : (
            <Button className={styles.playContent__betBtn} type={ButtonType.ORIANGE} onClick={onBingo}>
              <span className={styles.playContent__betBtn_p}>
                <p style={{ fontSize: '24px' }} className={styles.artWord}>
                  BINGO
                </p>
              </span>
            </Button>
          )}
        </div>
      </PlayWrapper>
    );
  };

  const renderSettingPage = () => {
    const info = {
      type: 'send',
      sendType: 'token',
      netWorkType: 'TESTNET',
      chainType: 'tDVV',
      toInfo: {
        address: caAddress,
        name: '',
      },
      assetInfo: {
        symbol: 'ELF',
        chainId: 'tDVV',
        imageUrl: '',
        tokenContractAddress: tokenContractAddressRef.current,
        decimals: '8',
      },
      address: caAddress,
    };

    return (
      <PlayWrapper>
        <div className={styles.settingContent}>
          {settingPage === SettingPage.ACCOUNT && (
            <div className={styles.settingContent__account}>
              <h1>Account</h1>
              {!showQrCode ? (
                <p className={styles.settingContent__account__text}>{accountAddress}</p>
              ) : (
                <QRCode
                  value={JSON.stringify(info)}
                  size={200}
                  quietZone={0}
                  qrStyle={'squares'}
                  eyeRadius={{ outer: 7, inner: 4 }}
                  ecLevel={'L'}
                />
              )}
              <div>
                <button
                  onClick={handleCopyToken}
                  className={[styles.settingBtn__copy, styles.button].join(' ')}></button>
                <button
                  onClick={() => {
                    setShowQrCode(true);
                  }}
                  className={[styles.settingBtn__qrcode, styles.button].join(' ')}></button>
              </div>
            </div>
          )}
          {settingPage === SettingPage.BALANCE && (
            <div className={styles.settingContent__balance}>
              <h1>Balance</h1>
              <div className={styles.settingContent__balance__text}>{balanceValue} ELF</div>
            </div>
          )}
          {settingPage === SettingPage.LOGOUT && (
            <div className={styles.settingContent__logout}>
              <div>
                <Button className={styles.settingContent__logout__btn} type={ButtonType.BLUE} onClick={logOut}>
                  <p className={styles.artWord}>Logout</p>
                </Button>
                <Button className={styles.settingContent__logout__btn} type={ButtonType.BLUE} onClick={lock}>
                  <img src={require('../../../public/lock.svg').default.src} />
                </Button>
              </div>
            </div>
          )}

          <Button
            className={styles.playContent__betBtn}
            type={ButtonType.ORIANGE}
            onClick={() => {
              setSettingPage(SettingPage.NULL);
              setShowQrCode(false);
            }}>
            <span className={styles.playContent__betBtn_p}>
              <p style={{ fontSize: '24px' }} className={styles.artWord}>
                CLOSE
              </p>
            </span>
          </Button>
        </div>
      </PlayWrapper>
    );
  };

  const renderSence = () => {
    if (settingPage !== SettingPage.NULL) {
      return renderSettingPage();
    }

    switch (step) {
      case StepStatus.INIT:
      case StepStatus.LOCK:
      case StepStatus.LOGIN:
        return renderDefault();
      case StepStatus.PLAY:
        return renderPlay();
      case StepStatus.CUTDOWN:
        return renderCutDown();
      case StepStatus.BINGO:
        return renderBingo();
      default:
        break;
    }
  };

  return (
    <div className={styles.background}>
      <PortkeyLoading loading={loading} />
      {renderSence()}
      <SignIn
        open={isLogin}
        sandboxId="portkey-ui-sandbox"
        chainId={CHAIN_ID}
        onFinish={(wallet) => {
          setLoading(true);
          setIsLogin(false);
          walletRef.current = wallet;
          localStorage.setItem('testWallet', JSON.stringify(wallet));
          did.save(wallet.pin, KEY_NAME);
          initContract();
        }}
        onError={(err) => {
          console.error(err, 'onError==');
        }}
        onCancel={() => {
          setIsLogin(false);
        }}
      />
    </div>
  );
};
export default MBingoGame;
