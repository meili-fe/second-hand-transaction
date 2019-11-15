Component({
  data: {
    selected: 0,
    color: '#7A7E83',
    selectedColor: '#f64349',
    list: [
      {
        pagePath: '/pages/index/index',
        iconPath: '../images/index.png',
        selectedIconPath: '../images/index_selected.png',
        text: '首页',
      },
      {
        pagePath: '/pages/list/list',
        iconPath: '../images/list.png',
        selectedIconPath: '../images/list_selected.png',
        text: '排行榜',
      },
      {
        pagePath: "/pages/purchase/purchase",
        iconPath: "../images/myself.png",
        selectedIconPath: "../images/myself_selected.png",
        text: "求购"
      },
      {
        pagePath: '/pages/myself/myself',
        iconPath: '../images/myself.png',
        selectedIconPath: '../images/myself_selected.png',
        text: '我的',
      },
    ],
  },
  attached() {},
  methods: {
    switchTab(e) {
      const data = e.currentTarget.dataset;
      const url = data.path;
      wx.switchTab({ url });

      this.setData({
        selected: data.index,
      });
    },
    jump(e) {
      wx.navigateTo({
        url: `/pages/publish/publish`,
      });
    },
  },
});
