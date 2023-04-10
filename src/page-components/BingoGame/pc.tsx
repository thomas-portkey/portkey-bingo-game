import React, { useEffect, useRef, useState } from 'react';

import useBingo, { SettingPage, StepStatus, KEY_NAME } from '../../hooks/useBingo';

import { SignIn, did, PortkeyLoading } from '@portkey/did-ui-react';
import { InputNumber, message, Popover } from 'antd';

import { Button, ButtonType } from '.';
import { QRCode } from 'react-qrcode-logo';
import { CHAIN_ID } from '../../constants/network';
import Clipboard from 'clipboard';

import styles from './style_pc.module.css';
import { shrinkSendQrData } from '../../utils/common';

const PCBingoGame = () => {
  const [inputValue, setInputValue] = useState('1');
  const copyBtnRef = useRef(null);
  const copyBoard = useRef(null);
  const {
    onBet,
    onBingo,
    onPlay,
    unLock,
    login,
    logOut,
    chainId,
    lock,
    step,
    balanceValue,
    balanceInputValue,
    setBalanceInputValue,
    getBalance,
    isLogin,
    showQrCode,
    isWin,
    setShowQrCode,
    difference,
    result,
    hasFinishBet,
    setSettingPage,
    caAddress,
    setCaAddress,
    setLoading,
    initContract,
    setIsLogin,
    loading,
    time,
    setWallet,
    tokenContractAddress,
    accountAddress,
  } = useBingo();

  useEffect(() => {
    if (copyBtnRef.current && !copyBoard.current) {
      const clipboard = new Clipboard(copyBtnRef.current, {
        text: () => {
          return accountAddress;
        },
      });
      clipboard.on('success', () => {
        message.success('Copied!');
      });
      clipboard.on('error', () => {
        message.error('Copied!');
      });
      copyBoard.current = clipboard;
    }
  });

  const getQrInfo = () => {
    const info = shrinkSendQrData({
      type: 'send',
      netWorkType: 'TESTNET',
      chainType: 'aelf',
      toInfo: {
        address: accountAddress,
        name: '',
      },
      assetInfo: {
        symbol: 'ELF',
        chainId: chainId,
        tokenContractAddress: tokenContractAddress,
        decimals: '8',
      },
      address: accountAddress,
    });
    return info;
  };

  const renderDefault = () => {
    return (
      <div>
        <div className={styles.defaultWrapper}>
          <img className={styles.logo} src={require('../../../public/bingo.png').default.src} />
          <Button className={styles.defaultBtn} type={ButtonType.ORIANGE} onClick={login}>
            <p className={styles.artWord}>PLAY NOW</p>
          </Button>
          <div className={styles.initTip}>
            <img src={require('../../../public/warn.svg').default.src} />
            <span>This is a demo on the Testnet.</span>
          </div>
        </div>
      </div>
    );
  };

  const renderPlay = () => {
    return (
      <div>
        <div className={styles.contentWrapper}>
          <div className={styles.content__bg}>
            <div className={styles.content__wrapper}>
              <img src={require('../../../public/question.png').default.src} />
              <div className={styles.content__right}>
                <div className={styles.content__inputWrapper}>
                  <InputNumber
                    value={inputValue}
                    bordered={false}
                    precision={2}
                    min={'0'}
                    max={'100'}
                    className={styles.content__input}
                    onChange={(val) => {
                      setBalanceInputValue(val);
                      setInputValue(val);
                    }}
                    controls={false}></InputNumber>
                  <span>BET ELF</span>
                </div>
                <div className={styles.playContent__btnGroups}>
                  <button
                    onClick={() => {
                      setBalanceInputValue('1');
                      setInputValue('1');
                    }}
                    className={[styles.playContent__btn, styles.button].join(' ')}>
                    MIN
                  </button>
                  <button
                    onClick={() => {
                      try {
                        const balance = Math.min(Number(balanceValue), 100);
                        setBalanceInputValue(`${Math.floor(balance)}`);
                        setInputValue(`${Math.floor(balance)}`);
                      } catch (error) {
                        console.log('error', error);
                      }
                    }}
                    className={[styles.playContent__btn, styles.button].join(' ')}>
                    MAX
                    <span style={{ fontSize: '16px', paddingLeft: '4px' }}>(100)</span>
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
                      <p>(128 - 255)</p>
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
                      <p>(0 - 127)</p>
                    </span>
                  </Button>
                </div>
              </div>
            </div>
          </div>
        </div>
      </div>
    );
  };

  const renderCutDown = () => {
    return (
      <div className={styles.cutDownWrapper}>
        <div className={styles.cutDown__bg} />
        <div className={styles.cutDown}>
          <p>{time} s</p>
        </div>
        <span className={styles.cutDown__tip}>Getting on-chain data to generate random numbers...</span>
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
      <div style={{ display: 'flex', justifyContent: 'center' }}>
        {hasFinishBet ? (
          <div className={styles.bingoContentWrapper}>
            <div className={styles.bingoLogo}>
              <div style={{ fontSize: '180px' }} className={[styles.artWord].join(' ')}>
                {result === Infinity ? '?' : result}
              </div>
            </div>
            <div className={styles.bingoContent__bg}>
              <div className={styles.bingoContent__wrapper}>
                <>
                  <div className={styles.bingoTips}>
                    {isWin ? (
                      <img src={require('../../../public/congratulations_pc.png').default.src} />
                    ) : (
                      <img src={require('../../../public/lose_pc.png').default.src} />
                    )}
                    <div className={styles.bingoText}>
                      <span>{text}</span>
                      <span style={style}>{Math.abs(difference).toFixed(2)} ELF</span>
                    </div>
                  </div>
                  <Button
                    className={styles.bingoContent__betBtn}
                    type={ButtonType.ORIANGE}
                    onClick={() => {
                      onBet();
                      setBalanceInputValue('1');
                      setInputValue('1');
                    }}>
                    <span className={styles.playContent__betBtn_p}>
                      <p style={{ fontSize: '48px', fontWeight: 900 }} className={styles.artWord}>
                        BET
                      </p>
                    </span>
                  </Button>
                </>
              </div>
            </div>
          </div>
        ) : (
          <div className={styles.contentWrapper}>
            <div className={styles.content__bg}>
              <div className={styles.contentBingoInit__wrapper}>
                <div className={styles.initBingoLogo}>
                  <div style={{ fontSize: '180px' }} className={[styles.artWord].join(' ')}>
                    {result === Infinity ? '?' : result}
                  </div>
                </div>
                <Button className={styles.bingoBtn} type={ButtonType.ORIANGE} onClick={onBingo}>
                  <p className={styles.artWord}>BINGO</p>
                </Button>
              </div>
            </div>
          </div>
        )}
      </div>
    );
  };

  const renderSence = () => {
    switch (step) {
      case StepStatus.INIT:
      case StepStatus.LOCK:
      case StepStatus.LOGIN:
        return renderDefault();
      case StepStatus.CUTDOWN:
      case StepStatus.PLAY:
        return renderPlay();
      case StepStatus.BINGO:
        return renderBingo();
      default:
        break;
    }
  };

  return (
    <div className={styles.background}>
      <div className={styles.bodyWrapper}>
        <PortkeyLoading loading={loading} />
        {![StepStatus.INIT, StepStatus.LOCK, StepStatus.LOGIN, StepStatus.END].includes(step) && (
          <div className={styles.settingHeader}>
            <div className={styles.setting__balance}>
              <div className={styles.setting__balance__content}>
                <div>Balance</div>
                <div style={{ width: '158px' }}>{Number(balanceValue).toFixed(4)} ELF</div>
                <button
                  className={styles.btn}
                  onClick={() => {
                    getBalance();
                  }}
                />
              </div>
            </div>
            <div className={styles.setting__account}>
              <div className={styles.setting__account__content}>
                <div>Account</div>
                <div style={{ width: '400px', overflow: 'hidden' }}>
                  {accountAddress.length > 30
                    ? `${accountAddress.slice(0, 15)}...${accountAddress.slice(
                        accountAddress.length - 10,
                        accountAddress.length,
                      )}`
                    : accountAddress}
                </div>
                <button
                  ref={(ref) => {
                    copyBtnRef.current = ref;
                  }}
                  className={styles.setting__account__content__copy}
                />

                <Popover
                  content={() => (
                    <QRCode
                      value={JSON.stringify(getQrInfo())}
                      size={200}
                      quietZone={0}
                      qrStyle={'squares'}
                      eyeRadius={{ outer: 7, inner: 4 }}
                      ecLevel={'L'}
                    />
                  )}>
                  <div className={styles.setting__account__content__qrcode} />
                </Popover>
              </div>
            </div>
            <button className={styles.setting__logout} onClick={logOut}>
              Logout
            </button>
          </div>
        )}
        {renderSence()}
        {step === StepStatus.CUTDOWN && renderCutDown()}

        <SignIn
          open={isLogin}
          sandboxId="portkey-ui-sandbox"
          defaultChainId={CHAIN_ID}
          isShowScan
          onFinish={async (wallet) => {
            if (wallet.chainId !== CHAIN_ID) {
              const caInfo = await did.didWallet.getHolderInfoByContract({
                caHash: wallet.caInfo.caHash,
                chainId: CHAIN_ID,
              });
              wallet.caInfo = {
                caAddress: caInfo.caAddress,
                caHash: caInfo.caHash,
              };
            }
            setLoading(true);
            setIsLogin(false);
            setWallet(wallet);
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
    </div>
  );
};
export default PCBingoGame;
