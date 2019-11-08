//index.js
//获取应用实例
const app = getApp();
const util = require('../../utils/util.js');
Page({
  /**
   * 页面的初始数据
   */
  data: {
    loaded: false,
    allType: [],
    list: [],
    cateIndex: 0,
    inputValue: '',
    hasLogined: false,
    page: 1,
    pageSize: 10,
    totalCount: 0,
    title: '',
    cate_id: '',
    windowWidth: 0, //页面视图宽度
    windowHeight: 0,
    imgMargin: 6, //图片边距: 单位px
    imgWidth: 0,  //图片宽度: 单位px
    topArr: [0, 0], //存储每列的累积top
  },

  /**
   * 生命周期函数--监听页面加载
   */
  onLoad: async function (options) {
    app.userInfoReadyCallback = res => {
      this.setData({
        hasLogined: true,
      });
    };
    wx.getSystemInfo({
      success: (res) => {
        let windowWidth = res.windowWidth
        let windowHeight = res.windowHeight
        let imgMargin = this.data.imgMargin;
        let imgWidth = (windowWidth - imgMargin * 3) / 2;
        this.setData({
          windowWidth: windowWidth,
          windowHeight: windowHeight,
          imgWidth: imgWidth,
        })
      },
    })
    // 获取商品列表数据
    const product = await this.getData();

    // 获取分类数据
    const allType = await util.request.post('/koa-api/product/allType');


    this.setData({
      list: product.list,
      totalCount: product.totalCount,
      allType: allType,
      loaded: true,
    });

    wx.hideLoading();
  },

  /**
   * 生命周期函数--监听页面初次渲染完成
   */
  onReady: function () { },

  load: function (e) {
    var index = e.currentTarget.dataset.index; //图片所在索引
    var imgW = e.detail.width, imgH = e.detail.height; //图片实际宽度和高度
    var imgWidth = this.data.imgWidth; //图片宽度
    var imgScaleH = imgWidth / imgW * imgH; //计算图片应该显示的高度

    var list = this.data.list;
    var margin = this.data.imgMargin;  //图片间距
    //第一列的累积top，和第二列的累积top
    var firtColH = this.data.topArr[0], secondColH = this.data.topArr[1];
    var obj = list[index];

    obj.height = imgScaleH + 100;

    if (firtColH < secondColH) { //表示新图片应该放到第一列
      obj.left = margin;
      obj.top = firtColH + margin;
      firtColH += margin + obj.height;
    }
    else { //放到第二列
      obj.left = margin * 2 + imgWidth;
      obj.top = secondColH + margin;
      secondColH += margin + obj.height;
    }
    this.setData({
      list,
      topArr: [firtColH, secondColH],
    });
    console.log(this.data.list)
  },
  /**
   * 生命周期函数--监听页面显示
   */
  onShow: function () {
    if (app.globalData.hasLogined) {
      this.setData({
        hasLogined: app.globalData.hasLogined,
      });
    }

  },

  /**
   * 生命周期函数--监听页面隐藏
   */
  onHide: function () { },

  /**
   * 生命周期函数--监听页面卸载
   */
  onUnload: function () { },

  /**
   * 页面相关事件处理函数--监听用户下拉动作
   */
  onPullDownRefresh: function () { },

  /**
   * 页面上拉触底事件的处理函数
   */
  onReachBottom: async function () {
    // 当前页数
    let currentPageIndex = this.data.page;
    // 总页数
    let totalPage = Math.ceil(this.data.totalCount / this.data.pageSize);

    currentPageIndex += 1;
    // 当前页数大于等于总页数，则不进行加载
    if (currentPageIndex > totalPage) return;

    wx.showLoading({
      mask: true,
      title: '加载中...'
    });

    this.setData({
      page: currentPageIndex,
    });

    const { cate_id, title, pageSize, page } = this.data;
    const params = {
      cate_id,
      title,
      pageSize,
      page,
    };

    const product = await this.getData(params);
    const list = this.data.list.concat(product.list);



    this.setData({
      list: list,
    });
    await util.sleep(500);
    wx.hideLoading();
  },

  /**
   * 用户点击右上角分享
   */
  onShareAppMessage: function () { },
  bindKeyInput: function (e) {
    this.setData({ inputValue: e.detail.value });
  },
  jump: function (e) {
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

  // 搜索
  search: async function (e) {
    const cate_id = e.currentTarget.dataset.cateId || '';
    const title = e.currentTarget.dataset.title || '';

    this.setData({
      cateIndex: cate_id || 0,
      cate_id: cate_id || '',
      title: title,
      page: 1,
    });

    const params = {
      cate_id,
      title,
    };

    wx.showLoading({
      mask: true,
      title: '加载中...'
    });

    const product = await this.getData(params);

    await util.sleep(500);
    this.setData({
      list: product.list,
      totalCount: product.totalCount,
      topArr: [0, 0],
    });

    wx.hideLoading();
  },

  // 获取数据
  getData: function (params = {}, cb) {
    return util.request.post('/koa-api/product/list', params).then(data => {
      data.list.forEach(item => {
        item.img_list = item.img_list && item.img_list.split(',')[0];
        item.update_time = util.converTime(item.update_time) + '发布';
      });
      data.list.sort((a, b) => Math.random() > 0.5 ? -1 : 1);
      return data
    });
  },
});

function getMinBoxIndex(val, arr) {
  for (var i in arr) {
    if (val == arr[i]) {
      return i;
    }
  }
}