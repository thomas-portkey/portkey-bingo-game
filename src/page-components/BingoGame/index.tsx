import React, { MouseEventHandler, useEffect } from 'react';
import { isMobile } from '../../utils/common';
import { SideProps } from '../../type';

import { ConfigProvider } from '@portkey/did-ui-react';
import { Store } from '../../utils/store';

import MBingoGame from './mobile';
import PCBingoGame from './pc';

import styles from './style_btn.module.css';

export enum ButtonType {
  BLUE,
  ORIANGE,
}

export const Button = (props: {
  children: any;
  enable?: boolean;
  type: ButtonType;
  className?: string;
  onClick?: MouseEventHandler<HTMLButtonElement>;
}) => {
  const { children, type, className, onClick, enable = true } = props;
  let styleClass = type === ButtonType.BLUE ? 'blueBtn' : 'oriangeBtn';
  if (isMobile) {
    styleClass = `${styleClass}__pc`;
  }
  return (
    <button disabled={!enable} onClick={onClick} className={[styles[styleClass], styles.btn, className].join(' ')}>
      {children}
    </button>
  );
};

ConfigProvider.setGlobalConfig({
  storageMethod: new Store(),
  graphQLUrl: '/AElfIndexer_DApp/PortKeyIndexerCASchema/graphql',
  network: {
    defaultNetwork: 'TESTNET',
    networkList: [
      {
        name: 'aelf Testnet',
        walletType: 'aelf',
        networkType: 'TESTNET',
        isActive: true,
        apiUrl: '',
        graphQLUrl: '/AElfIndexer_DApp/PortKeyIndexerCASchema/graphql',
        connectUrl: '',
      },
    ],
  },
});

const BingoGame = (props: SideProps) => {
  const isMobileBrowser = isMobile(props.uaString);

  useEffect(() => {
    if (process.env.NEXT_PUBLIC_APP_ENV === 'development') {
      const script = document.createElement('script');
      script.type = 'text/javascript';
      script.src = 'https://unpkg.com/vconsole@latest/dist/vconsole.min.js';
      document.body.appendChild(script);
      script.onload = () => {
        setTimeout(() => {
          new window.VConsole();
        }, 0);
      };
    }

    if (!isMobileBrowser) {
      const style = document.createElement('style');
      style.setAttribute('type', 'text/css');
      style.textContent =
        'body{ @media screen and (max-width: 1280px) {zoom: 0.6; }  @media screen and (min-width: 1280px) and (max-width: 1920px) {zoom: 0.6;} }  @media screen and (min-width: 1920) {zoom: 1;}';
      document.head.appendChild(style);
    }
  }, []);

  return isMobileBrowser ? <MBingoGame /> : <PCBingoGame />;
};

export default BingoGame;
