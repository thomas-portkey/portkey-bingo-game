import React from 'react';

import { isMobile } from '../../utils/common';
import { SideProps } from '../../type';

import MobileComP from './mobile';
import PCBingoGame from './pc';

const BingoGame = (props: SideProps) => {
  const isMobileBrowser = isMobile(props.uaString);
  return isMobileBrowser ? <MobileComP /> : <PCBingoGame />;
};

export default BingoGame;
