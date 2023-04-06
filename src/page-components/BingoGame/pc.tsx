import React from 'react';

import useBingo, { SettingPage, StepStatus, KEY_NAME } from '../../hooks/useBingo';

import { SignIn, did, PortkeyLoading } from '@portkey/did-ui-react';
import { CenterPopup, Input } from 'antd-mobile';

import { Button, ButtonType } from './index_v2';
import { QRCode } from 'react-qrcode-logo';
import { CHAIN_ID } from '../../constants/network';

import styles from './style_pc.module.css';

const PCBingoGame = () => {
  const {
    onBet,
    onBingo,
    onPlay,
    unLock,
    login,
    logOut,
    lock,
    step,
    settingPage,
    balanceValue,
    balanceInputValue,
    setBalanceInputValue,
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

  const renderDefault = () => {
    return (
      <div className={styles.defaultWrapper}>
        <img className={styles.logo} src={require('../../../public/bingo.png').default.src} />
        <Button className={styles.defaultBtn} type={ButtonType.BLUE} onClick={login}>
          <p className={styles.artWord}>PLAY NOW</p>
        </Button>
        {/* {step === StepStatus.LOCK && (
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
        )} */}
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
      <div>
        {/* <div style={{ fontSize: '96px' }} className={[styles.boardWrapper, styles.artWord].join(' ')}>
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
        </div> */}
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
                  <img src={require('../../../public/lose.png').default.src} />
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
        tokenContractAddress: tokenContractAddress,
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
                <button className={[styles.settingBtn__copy, styles.button].join(' ')}></button>
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
    // if (settingPage !== SettingPage.NULL) {
    //   return renderSettingPage();
    // }

    return renderPlay();

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
      <div className={styles.settingHeader}>
        <div className={styles.setting__balance}>
          <span>Balance</span>
          <span>{balanceValue} ELF</span>
          <button>reLoad</button>
        </div>
        <div className={styles.setting__account}></div>
      </div>
      {renderSence()}

      <SignIn
        open={isLogin}
        sandboxId="portkey-ui-sandbox"
        defaultChainId={CHAIN_ID}
        onFinish={(wallet) => {
          setLoading(true);
          setIsLogin(false);
          setWallet(wallet);
          //   walletRef.current = wallet;
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
export default PCBingoGame;
