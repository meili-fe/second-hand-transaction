// pages/detail/detail.js
const util = require('../../utils/util.js');
Page({
  /**
   * 页面的初始数据
   */
  data: {
    id: '',
    loaded: false,
    price: '',
    description: '',
    img_list: [],
    update_time: '',
    isMySelf: false,
    nickName: '',
    avatarUrl: '',
  },

  /**
   * 生命周期函数--监听页面加载
   */
  onLoad: function(options) {
    const { id } = options;
    util.request.post('/koa-api/product/productById', { id }).then(data => {
      this.setData({
        loaded: true,
        id: id,
        price: data.price,
        img_list: (data.img_list && data.img_list.split(',')) || [],
        description: data.description,
        update_time: data.update_time,
      });

      // 判断当前商品是否为本人发布
      const token = JSON.parse(wx.getStorageSync('token'));
      const { userId } = token;

      if (userId === data.owner_id) {
        this.setData({
          isMySelf: true,
        });
      }

      wx.hideLoading();
    });

    console.log(id);
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
    console.log(id);

    wx.navigateTo({
      url: `/pages/publish/publish?id=${id}`,
    });
  },
});
