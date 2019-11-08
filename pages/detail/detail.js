// pages/detail/detail.js
const util = require('../../utils/util.js');
const app = getApp()
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
    textareaBottom: '', // 留言板的位置
    placeholder: '',
    message: {
      message: '',
      parentId: '',
      replayId: '',
    },
    icon_group: [
      { name: '超赞', key: 'praise', isDone: false },
      { name: '收藏', key: 'collect', isDone: false },
    ],
    messageList: [],
    hasLogined: false
  },

  /**
   * 生命周期函数--监听页面加载
   */
  onLoad: function(options) {
    const { id } = options;
    this.getProductInfo(id)
  },
  getProductInfo(id) {
    util.request.post('/koa-api/product/productById', { id }).then(data => {
      const locationRange = [{ id: 0, name: '绿地6层' }, { id: 1, name: '绿地20层' }];
      let messageBoard = this.formatMessage(data.messageBoard)
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
        messageList: messageBoard
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
  formatMessage(arr) {
     arr.forEach(item => {
       // 处理时间
      item.createTime = util.converTime(item.createTime)
      //  处理内容
       item.message = item.replayName && `回复@${item.replayName}:${item.message}` || item.message
       item.children && item.children.length && this.formatMessage(item.children)
    })
    return arr
  },
  /**
   * 生命周期函数--监听页面初次渲染完成
   */
  onReady: function() {},

  /**
   * 生命周期函数--监听页面显示
   */
  onShow: function() {
    console.log(app.globalData)
    this.setData({
      hasLogined: app.globalData.hasLogined
    })
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
  blurhandle() {
    this.setData({
      isShowInput: false
    })
  },
  textareaChange(e) {
    let message = this.data.message
    message.message = e.detail.value
    this.setData({
      message
    })
  },
  // 点击每个聊天信息 展示输入框
  showInput(e) {
    let placeholder = e.currentTarget.dataset.use ? `回复@${e.currentTarget.dataset.use}` : '看对眼就留言，问问更多细节'
    let message = Object.assign({}, this.data.message, e.currentTarget.dataset)
    
    this.setData({
      isShowInput: true,
      message,
      placeholder
    })
  },
  // 键盘高度变化 设置输入框的高度
  keyboardheightchange(event) {
    this.setData({
      textareaBottom: event.detail.height
    })
  },
  async submit(e) {
    let obj = Object.assign({}, this.data.message, { proId: this.data.id })
      await util.request.post('/koa-api/meaasgeBoard/add', obj)
      wx.showToast({
        title: '留言成功',
      })
      await util.sleep(500);
      let message = this.data.message
      message.message = ''
      this.setData({
        message
      })
      this.getProductInfo(this.data.id)
  },
  // 没有登陆 先去登陆
  getuserinfo(e) {
    if (e.detail.userInfo) {
      const { nickName, avatarUrl } = e.detail.userInfo;
      app.globalData.userInfo = e.detail.userInfo;
      app.globalData.hasLogined = true;

      this.setData({
        hasLogined: true
      })

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
              .catch(data => { });
          } else {
            console.log('登录失败！' + res.errMsg);
          }
        },
      }); 
    }
  }
});
