// pages/myself/myself.js
const util = require('../../utils/util.js');
const app = getApp();
Page({
  /**
   * 页面的初始数据
   */
  data: {
    list: [],
    totalList: [],
    hasLogined: false,
    totalPrice: 0,
    totalGoods: '',
    publish: '',
    saled: '',
    nickName: '',
    avatarUrl: '',
    tabIndex: 0,
    ownerId: '',
    height: '',
  },

  /**
   * 生命周期函数--监听页面加载
   */
  onLoad: async function(options) {
    wx.hideLoading();
    const containerHeight = await this.getHeight('#container');
    const wrapHeight = await this.getHeight('#wrap');

    this.setData({
      height: containerHeight - wrapHeight,
    });

    const { ownerId, imgUrl, username } = options;
    this.setData({
      nickName: username,
      avatarUrl: imgUrl,
      ownerId: ownerId,
    });

    this.getData();
  },
  getHeight: function(id) {
    return new Promise((resolve, reject) => {
      const query = wx.createSelectorQuery();
      query.select(`${id}`).boundingClientRect();
      query.selectViewport().scrollOffset();
      query.exec(function(res) {
        resolve(res[0].height);
      });
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
  changeTab: function(e) {
    const status = Number(e.currentTarget.dataset.status);
    const list = [].concat(this.data.totalList);

    this.setData({
      list: status === 0 ? list : list.filter(item => item.status === status),
      tabIndex: Number(status),
    });
  },
  // 获取数据
  getData() {
    wx.showLoading();
    util.request.post('/koa-api/product/productByUser', { status: 0, ownerId: this.data.ownerId }).then(data => {
      if (data.length) {
        let totalPrice = 0;
        let publish = 0;
        let saled = 0;
        data.forEach(item => {
          item.img_list = item.img_list && item.img_list.split(',')[0];

          // 发布的
          if (item.status === 1) {
            publish += 1;
          }

          // 卖出的
          if (item.status === 2) {
            saled += 1;
            totalPrice += item.price;
          }
        });
        this.setData({
          list: data,
          totalList: data,
          totalPrice: totalPrice,
          totalGoods: data.length,
          publish: publish || '',
          saled: saled || '',
        });
      }
      util.sleep(500);
      wx.hideLoading();
    });
  },
});
