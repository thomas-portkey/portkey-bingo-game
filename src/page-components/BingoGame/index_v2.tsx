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
  return (
    <button
      disabled={!enable}
      onClick={onClick}
      className={[type === ButtonType.BLUE ? styles.blueBtn : styles.oriangeBtn, styles.btn, className].join(' ')}>
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
  }, []);

  const isMobileBrowser = isMobile(props.uaString);
  return isMobileBrowser ? <MBingoGame /> : <PCBingoGame />;
};

export default BingoGame;
