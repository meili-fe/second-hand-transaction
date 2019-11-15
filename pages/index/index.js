//index.js
import { request, getConfigs, converTime, sleep } from '../../utils/util';

//获取应用实例
const app = getApp();
Page({
  /**
   * 页面的初始数据
   */
  data: {
    loaded: false,
    category: [],
    list: [],
    cateIndex: 0,
    hasLogined: false,
    page: 1,
    pageSize: 10,
    totalCount: 0,
    title: '',
    cate_id: '',
    noMoreGoods: false,
    lineStyle: '',
    scrollTop: 0,
    showMoreLoading: false,
    // 当前swiper索引值
    currentSwiperIndex: 0,
    // 当前swiper数据
    currentSwiperData: [],
    // 所有swiper数据
    swiperData: [],
    // swiper切换时动画时长
    swiperDuration: 300,
  },

  /**
   * 生命周期函数--监听页面加载
   */
  onLoad: async function(options) {
    wx.showLoading({
      mask: true,
    });

    // 获取当前用户登录状态
    app.userInfoReadyCallback = res => {
      this.setData({
        hasLogined: true,
      });
    };

    // 获取分类数据
    const category = (await getConfigs(app)).category;

    let swiperData = [];

    /**
     * 每个swiper数据结构
     * {
     *  list: [], 商品数据
     *  noMoreGoods: false, 无更多商品标识
     *  page: 1, 当前页数
     *  pageSize: 10, 每页数据
     *  scrollTop: 0, 当前swiper的scrollTop值(搜索之后，需重置为0)
     *  showMoreLoading: false, 是否显示上拉加载loading的标识
     *  totalCount: 0, 当前swiper内的总数据条数(从接口取值)
     * }
     */

    // 获取第一个swiper内的商品列表数据
    const { title, page, pageSize, noMoreGoods, scrollTop, showMoreLoading } = this.data;
    let { cate_id } = this.data;
    const first = await this.getData({
      title,
      cate_id,
      page,
      pageSize,
    });
    first.noMoreGoods = noMoreGoods;
    first.scrollTop = scrollTop;
    first.showMoreLoading = showMoreLoading;
    swiperData.push(first);

    // 获取各个分类的数据
    for (let i = 0; i < category.length; i++) {
      cate_id = category[i].value;
      let swiper = await this.getData({
        title,
        cate_id,
        page,
        pageSize,
      });
      swiper.noMoreGoods = noMoreGoods;
      swiper.scrollTop = scrollTop;
      swiper.showMoreLoading = showMoreLoading;
      swiperData.push(swiper);
    }

    this.setData({
      category: category,
      loaded: true,
      swiperData: swiperData,
    });

    const style = await this.getStyle(`#category${this.data.cateIndex}`);
    this.setData({
      lineStyle: style,
    });

    this.setData({ lineStyle: style });
    wx.hideLoading();

    sleep(1000);
    style.transition = 'all 0.2s ease-in';
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
        url: `/pages/detail/detail?id=${id}`,
      });
    } else {
      wx.navigateTo({
        url: `/pages/publish/publish`,
      });
    }
  },
  /**
   * 上拉刷新
   */
  reachBottom: async function() {
    // 当前swiper索引值
    const index = this.data.currentSwiperIndex;
    // 当前swiper数据
    const swiper = this.data.swiperData[index];
    // 当前页数
    let currentPageIndex = Number(swiper.page);
    // 总页数
    let totalPage = Math.ceil(swiper.totalCount / swiper.pageSize);

    // 只有一页的情况
    if (totalPage === 1) return;

    currentPageIndex += 1;
    // 当前页数大于等于总页数，则没有更多商品了，不进行加载
    if (currentPageIndex > totalPage) {
      this.setData({
        [`swiperData[${index}].noMoreGoods`]: true,
      });

      return;
    }

    this.setData({
      [`swiperData[${index}].showMoreLoading`]: true,
    });

    swiper.page = currentPageIndex;

    // cate_id和title从this.data中获取
    const { cate_id, title } = this.data;

    // pageSize和page从当前swiper数据中获取
    const { pageSize, page } = swiper;
    const params = {
      cate_id,
      title,
      pageSize,
      page,
    };

    const data = await this.getData(params);
    const list = swiper.list.concat(data.list);

    await sleep(200);
    this.setData({
      [`swiperData[${index}].list`]: list,
      [`swiperData[${index}].showMoreLoading`]: false,
    });
  },
  // 清空搜索
  emptySearch: function(e) {
    this.setData({
      title: '',
    });

    this.search();
  },
  // 切换tab
  changeTab: async function(e) {
    const cate_id = e.currentTarget.dataset.cateId;
    this.setData({
      cate_id: cate_id,
      cateIndex: cate_id,
      swiperDuration: 0,
    });

    const style = await this.getStyle(`#category${this.data.cateIndex}`);
    this.setData({
      lineStyle: Object.assign({}, this.data.lineStyle, style),
    });

    this.setData({
      currentSwiperIndex: cate_id,
    });
    // this.search();
  },

  getStyle: function(id) {
    return new Promise((resolve, reject) => {
      const query = wx.createSelectorQuery();
      query.select(`${id}`).boundingClientRect();
      query.selectViewport().scrollOffset();
      query.exec(function(res) {
        resolve({
          width: res[0].width + 'px',
          left: res[0].left + 'px',
        });
      });
    });
  },

  // 搜索
  search: async function(e) {
    // 当前swiper索引值
    const index = this.data.currentSwiperIndex;
    // 当前swiper数据
    const swiper = this.data.swiperData[index];

    // 将page设为1
    this.setData({
      [`swiperData[${index}].page`]: 1,
    });

    // cate_id和title从this.data中获取
    const { cate_id, title } = this.data;

    // pageSize和page从当前swiper数据中获取
    const { pageSize, page } = swiper;
    const params = {
      cate_id,
      title,
      pageSize,
      page,
    };

    wx.showLoading({
      mask: true,
      title: '加载中',
    });

    const data = await this.getData(params);
    data.noMoreGoods = false;
    data.scrollTop = 0;
    data.showMoreLoading = false;

    await sleep(200);
    this.setData({
      [`swiperData[${index}]`]: data,
    });

    wx.hideLoading();
  },

  // 获取数据
  getData: function(params = {}) {
    // 全部的cate_id改为''
    if (params.cate_id === 0) {
      params.cate_id = '';
    }
    return request.post('/koa-api/product/list', params).then(data => {
      data.list.forEach(item => {
        item.img_list = item.img_list && item.img_list.split(',')[0];
        item.update_time = converTime(item.update_time) + '发布';
      });
      return data;
    });
  },
  switchTab: async function(e) {
    const { source, current } = e.detail;

    // 滑动切换
    if (source === 'touch') {
      await sleep(200);
      this.changeTab({
        currentTarget: { dataset: { cateId: current } },
      });

      this.setData({
        currentSwiperIndex: current,
        swiperDuration: 300,
      });
      return;
    }

    // 通过点分类切换
    this.setData({
      currentSwiperIndex: current,
      cate_id: current,
      cateIndex: current,
      swiperDuration: 300,
    });
  },
});
