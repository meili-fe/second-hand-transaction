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
    height: '',
    status: '',
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

    const { status } = options;
    if (status) {
      this.setData({
        status: status,
      });
    }
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
  onShow: async function() {
    // 已登录，直接获取数据
    if (app.globalData.hasLogined) {
      const { nickName, avatarUrl, gender } = app.globalData.userInfo;
      this.setData({
        nickName: nickName,
        avatarUrl: avatarUrl,
        gender: gender,
        hasLogined: app.globalData.hasLogined,
        tabIndex: 10,
      });

      await this.getData();

      // 发布页跳转过来，需显示待审核列表面
      if (this.data.status) {
        this.changeTab({
          currentTarget: { dataset: { status: 0 } },
        });
      }
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
        util.sleep(500);
        wx.hideLoading();
      });
  },
});
