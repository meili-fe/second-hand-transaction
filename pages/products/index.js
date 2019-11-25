const app = getApp();
const util = require('../../utils/util.js');
Page({
  data: {
    list: [],
    height: [],
    widthAll: [],
    width: '',
    status: ''
  },
  onLoad: function (options) {
    let { status } = options
    if (status == 'favorites') {
      this.getFavorites()
    } else {
      this.getData(status)
    }
    
    this.setData({
      status
    })

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
    const showInfoObj = util.getShowInfo()
    const { userId } = showInfoObj
    return util.request
      .post('/koa-api/product/productByUser', { status, ownerId: userId })
      .then(data => {
        if (data.length) {
          data.forEach(item => {
            item.img_list = item.img_list && item.img_list.split(',')[0];
            item.position = 'static';
            item.top =  '';
            item.left = '';
            item.update_time = util.converTime(item.update_time) + '发布';
          });
          this.setData({
            list: data,
          });
        } else {
          wx.hideLoading()
        }
      });
  },
  load(e) {
    let height = this.data.height
    let widthAll = this.data.widthAll
    height[e.currentTarget.dataset.index] = e.detail.height
    widthAll[e.currentTarget.dataset.index] = e.detail.width
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
            heightArr.push(boxHeight + 108)
          } else {
            var minBoxHeight = Math.min.apply(null, heightArr);
            var minBoxIndex = getMinBoxIndex(minBoxHeight, heightArr);
            list[i].position = 'absolute'
            list[i].top = `${minBoxHeight}`
            list[i].left = minBoxIndex * this.data.width / 2  + 10;
            heightArr[minBoxIndex] += (boxHeight + 95)
          }
        }

        this.setData({
          list
        })
        wx.hideLoading()

      }).exec()
    }, 200)
  },
  // 获取收藏夹
  getFavorites() {
    wx.showLoading({
      title: '加载中...',
    })
    const showInfoObj = util.getShowInfo()
    util.request.post('/koa-api/relation/listByUser', { userId: showInfoObj.userId }).then(data => {
      if (data.length) {
        this.setData({
          list: data.map(item => {
            item.img_list = item.img_list && item.img_list.split(',')[0];
            item.position = 'static';
            item.top = '';
            item.left = '';
            item.update_time = util.converTime(item.update_time) + '发布';
            return item
          })
        })
      } else {
        wx.hideLoading()
      }
    })
  },
  jump(e) {
    const id = e.currentTarget.dataset.id;

    /**
     * 有id则跳转至详情页
     * 无id则跳转至发布页
     */
    if (id) {
      wx.navigateTo({
        url: `/pages/detail/detail?id=${id}`,
      });
    } else {
      wx.navigateTo({
        url: `/pages/publish/publish`,
      });
    }
  },
})
function getMinBoxIndex(val, arr) {
  for (var i in arr) {
    if (val == arr[i]) {
      return i;
    }
  }
}