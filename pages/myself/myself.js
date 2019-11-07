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

    /**
     * 发布页跳转过来，from值为publish
     * 编辑页跳转过来，from值为edit
     * 其它情况无值
     */
    const { from } = options;
    if (from) {
      await this.getData();
      // 显示审核页
      this.changeTab({
        currentTarget: { dataset: { status: 0 } },
      });

      return;
    }

    this.getData();
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
        selected: 2,
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

                // 获取列表数据
                that.getData();
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
    const status = Number(e.currentTarget.dataset.status);
    const list = [].concat(this.data.totalList);

    this.setData({
      list: status === 10 ? list : list.filter(item => item.status === status),
      tabIndex: Number(status),
      scrollTop: 0,
    });
  },
  // 获取数据
  getData() {
    wx.showLoading();
    return util.request
      .post('/koa-api/product/productByUser', { status: 0, ownerId: JSON.parse(wx.getStorageSync('token')).userId })
      .then(data => {
        if (data.length) {
          let totalReview = 0;
          let totalPrice = 0;
          let publish = 0;
          let saled = 0;
          data.forEach(item => {
            item.img_list = item.img_list && item.img_list.split(',')[0];

            // 待审核的
            if (item.status === 0) {
              totalReview += 1;
              return;
            }

            // 发布的
            if (item.status === 1) {
              publish += 1;
              return;
            }

            // 卖出的
            if (item.status === 2) {
              saled += 1;
              totalPrice += item.price;
              return;
            }
          });
          this.setData({
            list: data,
            totalList: data,
            totalPrice: totalPrice,
            totalReview: totalReview,
            totalGoods: data.length,
            publish: publish || '',
            saled: saled || '',
          });
        }
        util.sleep(300);
        wx.hideLoading();
      });
  },
});
