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
  },

  /**
   * 生命周期函数--监听页面加载
   */
  onLoad: function(options) {
    app.userInfoReadyCallback = res => {
      this.setData({
        hasLogined: true,
      });
    };
    // 获取商品列表数据
    const product = this.getData();

    // 获取分类数据
    const category = util.request.post('/koa-api/product/allType').then(data => {
      this.setData({
        allType: data,
      });
    });

    Promise.all([product, category]).then(() => {
      this.setData({ loaded: true });
      wx.hideLoading();
    });
  },

  /**
   * 生命周期函数--监听页面初次渲染完成
   */
  onReady: function() {},

  /**
   * 生命周期函数--监听页面显示
   */
  onShow: function() {
    if (app.globalData.hasLogined) {
      this.setData({
        hasLogined: app.globalData.hasLogined,
      });
    }
  },

  /**
   * 生命周期函数--监听页面隐藏
   */
  onHide: function() {},

  /**
   * 生命周期函数--监听页面卸载
   */
  onUnload: function() {},

  /**
   * 页面相关事件处理函数--监听用户下拉动作
   */
  onPullDownRefresh: function() {},

  /**
   * 页面上拉触底事件的处理函数
   */
  onReachBottom: function() {},

  /**
   * 用户点击右上角分享
   */
  onShareAppMessage: function() {},
  bindKeyInput: function(e) {
    this.setData({ inputValue: e.detail.value });
  },
  jump: function(e) {
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
  search: function(e) {
    const cate_id = e.currentTarget.dataset.cateId || '';
    const title = e.currentTarget.dataset.title || '';

    this.setData({
      cateIndex: cate_id || 0,
    });

    const params = {
      cate_id,
      title,
    };

    this.getData(params);
  },

  // 获取数据
  getData: function(params = {}) {
    util.request.post('/koa-api/product/list', params).then(data => {
      data.list.forEach(item => {
        item.img_list = item.img_list && item.img_list.split(',')[0];
      });
      this.setData({
        list: data.list,
      });
    });
  },
});
