export { default } from '../page-components/BingoGame';

import { SideProps } from '../type';

export function getServerSideProps(context: any): { props: SideProps } {
  return {
    props: {
      uaString: context.req.headers['user-agent'],
    },
  };
}
