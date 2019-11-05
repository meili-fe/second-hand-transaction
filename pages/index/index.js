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
    hasLogined: false,
    page: 1,
    pageSize: 10,
    totalCount: 0,
    title: '',
    cate_id: '',
    noMoreGoods: false,
    fixedTab: false,
    fixedTop: 0,
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
    const { title, cate_id, page, pageSize } = this.data;
    const product = await this.getData({
      title,
      cate_id,
      page,
      pageSize,
    });

    // 获取分类数据
    const allType = await util.request.post('/koa-api/product/allType');

    this.setData({
      list: product.list,
      totalCount: product.totalCount,
      allType: allType,
      loaded: true,
    });

    wx.hideLoading();

    const query = wx.createSelectorQuery();
    query.select('#list').boundingClientRect();
    query.selectViewport().scrollOffset();
    query.exec(function(res) {
      that.setData({
        fixedTop: res[0].top,
      });
      // res[0].top; // #the-id节点的上边界坐标
      // res[1].scrollTop; // 显示区域的竖直滚动位置
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
  onReachBottom: async function() {
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

    wx.showLoading({
      mask: true,
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

    await util.sleep(500);
    this.setData({
      list: list,
    });

    wx.hideLoading();
  },

  /**
   * 用户点击右上角分享
   */
  onShareAppMessage: function() {},
  onPageScroll: function(e) {
    // if (!this.fixedTop) return;
    if (e.scrollTop > this.data.fixedTop) {
      this.setData({
        fixedTab: true,
      });
    } else {
      this.setData({
        fixedTab: false,
      });
    }
  },
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
        url: `/pages/detail/detail?id=${id}`,
      });
    } else {
      wx.navigateTo({
        url: `/pages/publish/publish`,
      });
    }
  },
  // 清空搜索
  emptySearch: function(e) {
    this.setData({
      title: '',
    });

    this.search();
  },
  // 切换tab
  changeTab: function(e) {
    const cate_id = e.currentTarget.dataset.cateId || '';
    this.setData({
      cate_id: cate_id,
      cateIndex: cate_id || 0,
    });

    this.search();
  },

  // 搜索
  search: async function(e) {
    this.setData({
      page: 1,
      noMoreGoods: false,
    });

    const { cate_id, title, page, pageSize } = this.data;

    const params = {
      cate_id,
      title,
      page,
      pageSize,
    };

    wx.showLoading({
      mask: true,
    });

    const product = await this.getData(params);

    await util.sleep(500);
    this.setData({
      list: product.list,
      totalCount: product.totalCount,
    });

    wx.hideLoading();
  },

  // 获取数据
  getData: function(params = {}, cb) {
    return util.request.post('/koa-api/product/list', params).then(data => {
      data.list.forEach(item => {
        item.img_list = item.img_list && item.img_list.split(',')[0];
        item.update_time = util.converTime(item.update_time) + '发布';
      });
      return data;
    });
  },
});
