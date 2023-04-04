// module.exports = [{ source: '/api/:path*', destination: 'https://did-portkey-test.portkey.finance/api/:path*' }];
// module.exports = [
//   { source: '/api/:path*', destination: 'http://192.168.66.240:15577/api/:path*' },
//   {
//     source: '/AElfIndexer_DApp/:path*',
//     destination: 'http://192.168.67.172:8083/AElfIndexer_DApp/:path*',
//   },
// ];

module.exports = [
  { source: '/api/:path*', destination: 'https://did-portkey-test.portkey.finance/api/:path*' },
  {
    source: '/AElfIndexer_DApp/:path*',
    destination: 'https://dapp-portkey-test.portkey.finance/AElfIndexer_DApp/:path*',
  },
];
