export { default } from '../page-components/BingoGame/index_v2';
import { SideProps } from '../type';
export function getServerSideProps(context: any): { props: SideProps } {
  return {
    props: {
      uaString: context.req.headers['user-agent'],
    },
  };
}
