const util = require('../../utils/util.js');

const app = getApp();
Page({
  /**
   * 页面的初始数据
   */
  data: {
    id: '',
    loaded: false,
    lowPrice: '',
    highPrice: '',
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
    isShowInputTime: false,
    textareaBottom: '', // 留言板的位置
    placeholder: '',
    collectCount: '', // 点赞量
    praiseCount: '', // 收藏量
    message: {
      message: '',
      parentId: '',
      replayId: '',
    },
    icon_group: [
      // { name: '超赞', key: 'praise', isDone: false, type: 0 },
      // { name: '收藏', key: 'collect', isDone: false, type: 1 },
    ],
    messageList: [],
    hasLogined: false,
    avatarUrl: '', // 用户头像
    isAndroid: false, // 是否是安卓手机
  },

  /**
   * 生命周期函数--监听页面加载
   */
  onLoad: function(options) {
    const { id } = options;
    this.getProductInfo(id);
    if (app.globalData.userInfo) {
      this.setData({
        avatarUrl: app.globalData.userInfo.avatarUrl,
        hasLogined: app.globalData.hasLogined,
      });
    } else {
      app.userInfoReadyCallback = res => {
        this.setData({
          avatarUrl: res.userInfo.avatarUrl,
          hasLogined: true,
        });
      };
    }
    wx.getSystemInfo({
      success: res => {
        this.setData({
          isAndroid: /android/i.test(res.system),
        });
      },
    });
  },
  getProductInfo(id) {
    util.request.post('/koa-api/purchase/purchaseById', { id }).then(data => {
      const locationRange = [
        { id: 0, name: '绿地6层' },
        { id: 1, name: '绿地20层' },
      ];
      let messageBoard = data.messageBoard && this.formatMessage(data.messageBoard);
      this.setData({
        loaded: true,
        id: id,
        lowPrice: data.lowPrice,
        highPrice: data.highPrice,
        img_list: (data.img_list && data.img_list.split(',')) || [],
        description: data.description,
        update_time: util.converTime(data.updateTime) + '发布',
        username: data.userName,
        imgUrl: data.imgUrl,
        // contact: data.contact,
        title: data.title,
        // location: (locationRange[data.location] && locationRange[data.location].name) || data.location,
        // owner_id: data.owner_id,
        // collectCount: data.collectCount,
        // praiseCount: data.praiseCount,
        messageList: messageBoard,
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
    if (app.globalData.hasLogined) {
      let icon_group = this.data.icon_group;
      util.request.post('/koa-api/relation/getStatusByUser', { proId: id }).then(data => {
        data.forEach(item => {
          switch (item.type) {
            case 0:
              icon_group[0].isDone = item.status === 0 ? true : false;
              break;
            case 1:
              icon_group[1].isDone = item.status === 0 ? true : false;
              break;
          }
        });
        this.setData({
          icon_group,
        });
      });
    }
  },
  formatMessage(arr) {
    arr.forEach(item => {
      // 处理时间
      item.createTime = util.converTime(item.createTime);
      //  处理内容
      item.message = (item.replayName && `回复@${item.replayName}:${item.message}`) || item.message;
      item.children && item.children.length && this.formatMessage(item.children);
    });
    return arr;
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
      if (this.data.isMySelf) return;
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
      isShowInput: false,
      isShowInputTime: false,
      textareaBottom: 0,
    });
  },
  textareaChange(e) {
    let message = this.data.message;
    message.message = e.detail.value;
    this.setData({
      message,
    });
  },
  // 点击每个聊天信息 展示输入框
  showInput(e) {
    if (!this.data.isShowInputTime) {
      let placeholder = e.currentTarget.dataset.use
        ? `回复@${e.currentTarget.dataset.use}`
        : '看对眼就留言，问问更多细节';
      let message = Object.assign({}, this.data.message, e.currentTarget.dataset);

      this.setData({
        isShowInput: true,
        message,
        placeholder,
      });
      setTimeout(() => {
        this.setData({
          isShowInputTime: true,
        });
      }, 500);
    } else {
      this.blurhandle();
    }
  },
  // 键盘高度变化 设置输入框的高度
  // keyboardheightchange(event) {
  //   this.setData({
  //     textareaBottom: event.detail.height
  //   })
  // },
  async submit(e) {
    if (e.detail.value) {
      let obj = Object.assign({}, this.data.message, { proId: this.data.id });
      await util.request.post('/koa-api/meaasgeBoard/add', obj);
      wx.showToast({
        title: '留言成功',
      });
      await util.sleep(500);
      let message = this.data.message;
      message.message = '';
      this.setData({
        message,
      });
      this.getProductInfo(this.data.id);
    }
  },
  // 没有登陆 先去登陆
  getuserinfo(e) {
    if (e.detail.userInfo) {
      const { nickName, avatarUrl } = e.detail.userInfo;
      app.globalData.userInfo = e.detail.userInfo;
      app.globalData.hasLogined = true;

      this.setData({
        hasLogined: true,
      });

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
  changeStatus(e) {
    let obj = Object.assign({}, { proId: this.data.id, targetUserId: this.data.owner_id }, e.currentTarget.dataset);
    let { status, type } = e.currentTarget.dataset;
    let message = status == 0 && (type == 0 ? '点赞成功' : '收藏成功');
    util.request.post('/koa-api/relation/collect', obj).then(() => {
      wx.showToast({
        title: message,
      });
      setTimeout(() => {
        this.getProductInfo(this.data.id);
      }, 500);
    });
  },
  focus(e) {
    this.setData({
      textareaBottom: e.detail.height,
    });
    setTimeout(() => {
      this.setData({
        isShowInputTime: true,
      });
    }, 500);
  },
});
