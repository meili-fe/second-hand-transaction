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
    totalReview: '',
    saled: '',
    nickName: '',
    avatarUrl: '',
    tabIndex: 10,
    from: '',
    scrollTop: 0,
    favoritesList: [],
    tabList: [
      { name: '待审核', icon: 'audit', status: '0'},
      { name: '已发布', icon: 'release', status: '1' },
      { name: '已卖出', icon: 'sell', status: '2' },
      { name: '收藏夹', icon: 'favorites', status: 'favorites'},
    ]
  },

  /**
   * 生命周期函数--监听页面加载
   */
  onLoad: async function(options) {
    // 已登录，直接获取用户信息
    if (app.globalData.hasLogined) {
      const { nickName, avatarUrl, gender } = app.globalData.userInfo;
      this.setData({
        nickName: nickName,
        avatarUrl: avatarUrl,
        gender: gender,
        hasLogined: app.globalData.hasLogined,
      });
    }
  },

  /**
   * 生命周期函数--监听页面初次渲染完成
   */
  onReady: function() {},

  /**
   * 生命周期函数--监听页面显示
   */
  onShow: async function() {
    if (typeof this.getTabBar === 'function' && this.getTabBar()) {
      this.getTabBar().setData({
        selected: 3,
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
  // 获取用户信息
  onGotUserInfo: function(e) {
    if (e.detail.userInfo) {
      wx.showLoading({
        mask: true,
        title: '登录中',
      });

      const { nickName, avatarUrl, gender } = e.detail.userInfo;
      app.globalData.userInfo = e.detail.userInfo;
      app.globalData.hasLogined = true;
      this.setData({
        hasLogined: true,
        nickName: nickName,
        avatarUrl: avatarUrl,
      });

      const that = this;

      wx.login({
        success(res) {
          if (res.code) {
            // 发起网络请求
            util.request
              .post('/koa-api/user/login', {
                code: res.code,
                name: nickName,
                imgUrl: avatarUrl,
              })
              .then(data => {
                wx.setStorageSync('token', JSON.stringify(data.token));

              })
              .catch(data => {});
          } else {
            console.log('登录失败！' + res.errMsg);
          }
        },
      });
    }
  },
  changeTab: function(e) {
    if (!this.data.hasLogined) {
      wx.showToast({
        title: `请先登录`,
        icon: 'none',
        duration: 2000,
      });
      return;
    }
    let status = e.currentTarget.dataset.status
    wx.navigateTo({
      url: `/pages/products/index?status=${status}`,
    })
  },
  perfect:function(){
    wx.navigateTo({
      url: '/pages/userinfo/userinfo',
    })
  }
});
