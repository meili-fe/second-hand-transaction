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
    list: [],
    hasLogined: false,
    page: 1,
    pageSize: 10,
    totalCount: 0,
    title: '',
    noMoreGoods: false,
    scrollTop: 0,
    showMoreLoading: false,
  },

  /**
   * 生命周期函数--监听页面加载
   */
  onLoad: async function(options) {
    const that = this;
    app.userInfoReadyCallback = res => {
      this.setData({
        hasLogined: true,
      });
    };
    // 获取商品列表数据
    const { title, page, pageSize } = this.data;
    const product = await this.getData({
      title,
      page,
      pageSize,
    });

    this.setData({
      list: product.list,
      totalCount: product.totalCount,
      loaded: true,
    });

    wx.hideLoading();
  },

  /**
   * 生命周期函数--监听页面初次渲染完成
   */
  onReady: function() {},

  /**
   * 生命周期函数--监听页面显示
   */
  onShow: function() {
    if (typeof this.getTabBar === 'function' && this.getTabBar()) {
      this.getTabBar().setData({
        selected: 0,
      });
    }

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
  onReachBottom: async function() {},
  reachBottom: async function() {
    // 当前页数
    let currentPageIndex = this.data.page;
    // 总页数
    let totalPage = Math.ceil(this.data.totalCount / this.data.pageSize);

    // 只有一页的情况
    if (totalPage === 1) return;

    currentPageIndex += 1;
    // 当前页数大于等于总页数，则没有更多商品了，不进行加载
    if (currentPageIndex > totalPage) {
      this.setData({
        noMoreGoods: true,
      });

      return;
    }

    this.setData({
      showMoreLoading: true,
      page: currentPageIndex,
    });

    const { title, pageSize, page } = this.data;
    const params = {
      title,
      pageSize,
      page,
    };

    const product = await this.getData(params);
    const list = this.data.list.concat(product.list);

    await util.sleep(200);
    this.setData({
      list: list,
      showMoreLoading: false,
    });
  },

  /**
   * 用户点击右上角分享
   */
  onShareAppMessage: function() {},
  onPageScroll: function(e) {},
  bindKeyInput: function(e) {
    this.setData({ title: e.detail.value });
  },
  bindConfirm: function(e) {
    this.setData({ title: e.detail.value });
    this.search();
  },
  jump: function(e) {
    const id = e.currentTarget.dataset.id;

    /**
     * 有id则跳转至详情页
     * 无id则跳转至发布页
     */
    if (id) {
      wx.navigateTo({
        url: `/pages/purchase-detail/purchase-detail?id=${id}`,
      });
    } else {
      // wx.navigateTo({
      //   url: `/pages/publish/publish`,
      // });
    }
  },
  // 清空搜索
  emptySearch: function(e) {
    this.setData({
      title: '',
    });

    this.search();
  },

  // 搜索
  search: async function(e) {
    this.setData({
      page: 1,
    });

    const { title, page, pageSize } = this.data;

    const params = {
      title,
      page,
      pageSize,
    };

    wx.showLoading({
      mask: true,
      title: '加载中',
    });

    const product = await this.getData(params);

    await util.sleep(300);
    this.setData({
      list: product.list,
      totalCount: product.totalCount,
      scrollTop: 0,
      noMoreGoods: false,
    });

    wx.hideLoading();
  },

  // 获取数据
  getData: function(params = {}, cb) {
    return util.request.post('/koa-api/purchase/list', params).then(data => {
      data.list.forEach(item => {
        item.update_time = util.converTime(item.update_time) + '发布';
      });
      return data;
    });
  },
});
