const app = getApp();
const util = require('../../utils/util.js');
Page({
  data: {
    list: [],
    height: [],
    widthAll: [],
    width: '',
  },
  onLoad: function (options) {
    let { status } = options
    this.getData(status)
    wx.getSystemInfo({
      success: (res) => {
        this.setData({
          width: (res.screenWidth - 10)
        })
      },
    })
  },
  onReady: function () {

  },
  // 获取数据
  getData(status) {
    wx.showLoading();
    return util.request
      .post('/koa-api/product/productByUser', { status, ownerId: JSON.parse(wx.getStorageSync('token')).userId })
      .then(data => {
        if (data.length) {
          data.forEach(item => {
            item.img_list = item.img_list && item.img_list.split(',')[0];
            item.position = 'static';
            item.top =  '';
            item.left = ''
          });
          this.setData({
            list: data,
          });
        }
        util.sleep(300);
        wx.hideLoading();
      });
  },
  load(e) {
    let height = this.data.height
    let widthAll = this.data.widthAll
    height[e.currentTarget.dataset.index] = e.detail.height
    widthAll[e.currentTarget.dataset.index] = e.detail.width
    console.log(height)
    this.setData({
      height,
      widthAll
    })
    this.showImg()
  },
  showImg() {
    let height = this.data.height
    if (height.length != this.data.list.length) {  // 保证所有图片加载完
      return
    }
    setTimeout(() => { // 异步执行
      wx.createSelectorQuery().selectAll('.good').boundingClientRect((ret) => {
        let cols = 2
        var list = this.data.list
        var widthAll = this.data.widthAll
        var heightArr = [];
        for (var i = 0; i < ret.length; i++) {
          var boxHeight = ret[i].width / widthAll[i] * height[i]
          if (i < cols) {
            heightArr.push(boxHeight + 85)
          } else {
            var minBoxHeight = Math.min.apply(null, heightArr);
            var minBoxIndex = getMinBoxIndex(minBoxHeight, heightArr);
            list[i].position = 'absolute'
            list[i].top = `${minBoxHeight}`
            list[i].left = minBoxIndex * this.data.width / 2
            list[i].left = minBoxIndex == 0 ? minBoxIndex * this.data.width / 2 : minBoxIndex * this.data.width / 2 + 5
            heightArr[minBoxIndex] += (boxHeight + 85)
          }
        }

        this.setData({
          list
        })
        wx.hideLoading()

      }).exec()
    }, 200)
  },
  onShow: function () {

  },
  onHide: function () {

  },
  onUnload: function () {

  },
  onPullDownRefresh: function () {

  },
  onReachBottom: function () {

  },
  onShareAppMessage: function () {

  }
})
function getMinBoxIndex(val, arr) {
  for (var i in arr) {
    if (val == arr[i]) {
      return i;
    }
  }
}