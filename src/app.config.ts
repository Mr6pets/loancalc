export default defineAppConfig({
  pages: [
    'pages/index/index',
    'pages/bills/index',
    'pages/records/index',
    'pages/mine/index',
    'pages/result/index',
    'pages/detail/index'
  ],
  window: {
    backgroundTextStyle: 'light',
    navigationBarBackgroundColor: '#312e81',
    navigationBarTitleText: '贷款利率核算',
    navigationBarTextStyle: 'white'
  },
  tabBar: {
    custom: true,
    color: '#9ca3af',
    selectedColor: '#4f46e5',
    backgroundColor: '#FFFFFF',
    borderStyle: 'white',
    list: [
      {
        pagePath: 'pages/index/index',
        text: '计算器'
      },
      {
        pagePath: 'pages/bills/index',
        text: '账单分析'
      },
      {
        pagePath: 'pages/records/index',
        text: '历史记录'
      },
      {
        pagePath: 'pages/mine/index',
        text: '我的'
      }
    ]
  }
})
