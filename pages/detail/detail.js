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
    username: '',
    imgUrl: '',
    contact: '',
    title: '',
    owner_id: '',
    isShowInput: false, //  是否显示留言input
    isEmpty: false, // 留言板是否为空
    textareaBottom: '', // 留言板的位置
    placeholder: '',
    message: {
      content: '',
      uid: '',
    },
    messageList: [
      { name: '骆仕富76', time: '16天前', content: '同出', child: [] },
      {
        name: 'pk791358496', time: '15天前', content: '接刀？', child: [
          { name: '群雄割据2010', time: '', content:'最低多少 上架吧 合适就要了' }] 
      }
    ]
  },

  /**
   * 生命周期函数--监听页面加载
   */
  onLoad: function(options) {
    const { id } = options;
    util.request.post('/koa-api/product/productById', { id }).then(data => {
      const locationRange = [{ id: 0, name: '绿地6层' }, { id: 1, name: '绿地20层' }];

      this.setData({
        loaded: true,
        id: id,
        price: data.price,
        img_list: (data.img_list && data.img_list.split(',')) || [],
        description: data.description,
        update_time: util.converTime(data.update_time) + '发布',
        username: data.username,
        imgUrl: data.imgUrl,
        contact: data.contact,
        title: data.title,
        location: (locationRange[data.location] && locationRange[data.location].name) || data.location,
        owner_id: data.owner_id,
      });

      // 设置标题
      wx.setNavigationBarTitle({
        title: data.title,
      });

      // 判断当前商品是否为本人发布
      const token = !!wx.getStorageSync('token') && JSON.parse(wx.getStorageSync('token'));
      const { userId } = token;

      if (userId === data.owner_id) {
        this.setData({
          isMySelf: true,
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
  onShareAppMessage: function() {
    return {
      title: this.data.title,
      imageUrl: this.data.img_list[0] + '?imageView2/5/w/250/h/200/q/75|imageslim' || '',
    };
  },
  // 复制
  copy: function(e) {
    wx.setClipboardData({
      data: this.data.contact,
      success(res) {
        wx.showToast({
          title: '联系方式已复制',
          icon: 'none',
          duration: 1500,
        });
      },
    });
  },
  jump: function(e) {
    const id = e.currentTarget.dataset.id;
    const ownerId = e.currentTarget.dataset.ownerId;
    // 传的是id，则跳转至编辑页
    if (id) {
      wx.navigateTo({
        url: `/pages/publish/publish?id=${id}`,
      });

      return;
    }

    // 传的ownerId，则跳转至个人页
    if (ownerId) {
      // 如果是自己，则不进行跳转
      // if (this.data.isMySelf) return;
      wx.navigateTo({
        url: `/pages/himself/himself?ownerId=${ownerId}&imgUrl=${this.data.imgUrl}&username=${this.data.username}`,
      });

      return;
    }
  },
  // 预览图片
  previewImage: function(e) {
    const index = e.currentTarget.dataset.index;
    const that = this;
    wx.previewImage({
      current: that.data.img_list[index],
      urls: that.data.img_list,
      success: function(res) {
        //console.log(res);
      },
      fail: function() {
        //console.log('fail')
      },
    });
  },
  test() {
    this.setData({
      isShowInput: true
    })
  },
  blurhandle() {
    this.setData({
      isShowInput: false
    })
  },
  textareaChange(e) {
    let message = this.data.message
    message.content = e.detail.value
    this.setData({
      message: message
    })
  },
  // 点击每个聊天信息 展示输入框
  showInput(e) {
    console.log(e)
    let placeholder = `回复@${e.currentTarget.dataset.use}`
    this.setData({
      isShowInput: true,
      placeholder: placeholder
    })
  },
  keyboardheightchange(event) {
    this.setData({
      textareaBottom: event.detail.height
    })
  }
});
