// pages/myself/myself.js
const util = require('../../utils/util.js');
Page({
  /**
   * 页面的初始数据
   */
  data: {
    list: [],
    totalPrice: '',
    totalGoods: '',
    publish: '',
    saled: '',
  },

  /**
   * 生命周期函数--监听页面加载
   */
  onLoad: function(options) {
    util.request.post('/koa-api/product/productByUser', { status: 1 }).then(data => {
      if (data.length) {
        this.setData({
          list: data,
        });
      }

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
  onShow: function() {},

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
  jump: function(e) {
    const id = e.currentTarget.dataset.id;

    wx.navigateTo({
      url: `/pages/publish/publish?id=${id}`,
    });
  },
});
