import type { UserConfigExport } from '@tarojs/cli';
export default {
  mini: {},
  h5: {
    // 子域名模式: loancalc.guluwater.com → 资源路径从根开始
    publicPath: '/',
  },
  defineConstants: {
    // 子域名模式下 API 同域，基址为空
    'process.env.TARO_APP_API_BASE': JSON.stringify(''),
  },
} satisfies UserConfigExport<'webpack5'>;
