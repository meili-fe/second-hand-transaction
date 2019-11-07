// list.js
Page({
  /**
   * 页面的初始数据
   */
  data: { lineStyle: {}, tabIndex: '0' },

  /**
   * 生命周期函数--监听页面加载
   */
  onLoad: async function(options) {
    // wx.hideLoading();

    const style = await this.getStyle(`#box${this.data.tabIndex}`);
    this.setData({
      lineStyle: style,
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
        selected: 1,
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
  // 切换tab
  changeTab: async function(e) {
    const id = e.currentTarget.dataset.id;
    this.setData({
      tabIndex: id,
    });

    const style = await this.getStyle(`#box${this.data.tabIndex}`);
    this.setData({
      lineStyle: style,
    });
  },
});
