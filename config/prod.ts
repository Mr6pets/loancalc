import type { UserConfigExport } from '@tarojs/cli';
export default {
  mini: {},
  h5: {
    publicPath: '/loancalc/',
  },
  defineConstants: {
    'process.env.TARO_APP_API_BASE': JSON.stringify('/loancalc'),
  },
} satisfies UserConfigExport<'webpack5'>;
