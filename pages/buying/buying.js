// pages/buying/buying.js
import { request, getConfigs, sleep, baseUrl } from '../../utils/util';

const app = getApp();

Page({
  /**
   * 页面的初始数据
   */
  data: {
    loaded: false,
    id: '',
    title: '',
    description: '',
    lowPrice: '',
    highPrice: '',
    cate_id: 1,
    img_list: [],
    location: 0,
    locationRange: [],
    locationIndex: 0,
    isEditPage: false,
    cateIdRange: [],
    cateIdIndex: 0,
    statusRange: [],
    teamIndex: 0,
    teamRange: [],
    status: 0,
    statusIndex: 0,
    oldImgList: [],
    newImgList: [],
    isIos: false,
    hasLogined: true,
    original: '',
    team: 0,
  },

  /**
   * 生命周期函数--监听页面加载
   */
  onLoad: async function(options) {
    wx.showLoading({ mask: true });

    const system = wx.getSystemInfoSync();
    if (system.platform == 'ios') {
      this.setData({
        isIos: true,
      });
    }

    // 获取相关配置数据
    const configData = await getConfigs(app);

    this.setData({
      cateIdRange: configData.category,
      locationRange: configData.location,
      teamRange: configData.team,
      // statusRange: configData.goodStatus.filter(item => ['0', '3'].includes(item.value)),
      statusRange: [
        { name: '发布', value: '0' },
        { name: '下架', value: '1' },
      ],
    });

    /**
     * 如果有id，则是编辑页面
     */
    const { id } = options;

    // 设置标题
    wx.setNavigationBarTitle({
      title: id ? '编辑求购商品' : '添加求购商品',
    });

    if (id) {
      this.setData({
        isEditPage: true,
        id: id,
      });

      const data = await request.post('/koa-api/purchase/purchaseById', { id });
      if (!data) {
        wx.hideLoading();
        return;
      }
      const { title, description, lowPrice, highPrice, status } = data;
      this.setData({
        title: title,
        description: description,
        lowPrice: lowPrice,
        highPrice: highPrice,
        status: status,
        statusIndex: status,
      });

      return;
    }
  },

  /**
   * 生命周期函数--监听页面初次渲染完成
   */
  onReady: function() {},

  /**
   * 生命周期函数--监听页面显示
   */
  onShow: async function() {
    this.setData({
      hasLogined: app.globalData.hasLogined,
    });

    wx.showLoading({ mask: true });
    await request.get('/koa-api/user/getById').then(
      res => {
        const { contact, location: locationIndex, team: teamIndex } = res;
        this.setData({
          contact,
          locationIndex,
          teamIndex,
        });
      },
      error => {}
    );

    wx.hideLoading();
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
  // 输入框事件
  bindKeyInput: function(e) {
    const type = e.currentTarget.dataset.type;
    let value = e.detail.value;

    // 价格校验
    if (type === 'lowPrice' || type === 'highPrice') {
      const match = value.match(/-?\d{0,5}(\.\d{0,1})?/);
      if (!match) {
        value = '';
      } else {
        value = match[0].replace(/^(-?)0+(\d)/, '$1$2').replace(/^(-?)\./, '$10.');
      }
    }

    this.setData({
      [type]: value,
    });
  },
  // 下拉框事件
  bindPickerChange: function(e) {
    const type = e.currentTarget.dataset.type;

    // 转驼峰
    const toHump = str =>
      str.replace(/\_(\w)/g, function(all, letter) {
        return letter.toUpperCase();
      });

    this.setData({
      [`${toHump(type)}Index`]: e.detail.value,
      [type]: this.data[`${toHump(type)}Range`][e.detail.value].value,
    });
  },

  // 提交
  submit: async function() {
    const required = [
      { key: 'title', value: '标题' },
      { key: 'description', value: '描述' },
      { key: 'lowPrice', value: '求购最低价' },
      { key: 'highPrice', value: '求购最高价' },
      { key: 'contact', value: '联系方式' },
    ];

    let invalid = false;

    required.some(item => {
      if (!this.data[item.key]) {
        wx.showToast({
          title: `请填写${item.value}`,
          icon: 'none',
          duration: 2000,
        });
        invalid = true;
        return true;
      }
    });

    if (invalid) return;

    if (Number(this.data.lowPrice) > Number(this.data.highPrice)) {
      wx.showToast({
        title: `求购最低价需小于求购最大价`,
        icon: 'none',
        duration: 2000,
      });

      return;
    }

    const params = {
      title: this.data.title,
      description: this.data.description,
      lowPrice: this.data.lowPrice,
      highPrice: this.data.highPrice,
    };

    wx.showLoading({
      title: `${this.data.isEditPage ? '提交中' : '发布中'}`,
      mask: true,
    });

    // 将第一图片转为base64做为缩略图使用
    // const compressedFile = await this.compressImage(this.data.tempFilePaths[0], 100, 100);
    // const thumbnail = await this.converBase64(compressedFile);

    // params.thumbnail = thumbnail;

    // 编辑页面
    if (this.data.isEditPage) {
      params.id = this.data.id;
      params.status = this.data.status;
      // console.log(params);
      request.post('/koa-api/purchase/update', params).then(
        async data => {
          wx.hideLoading();
          wx.showModal({
            title: '提示',
            showCancel: false,
            content: '修改求购商品成功',
            success(res) {
              if (res.confirm) {
                wx.reLaunch({
                  // url: `/pages/myself/myself?from=edit`,
                  // url: '/pages/purchase/purchase',
                  url: `/pages/purchase-detail/purchase-detail?id=${params.id}`,
                });
              } else if (res.cancel) {
                console.log('用户点击取消');
              }
            },
          });
        },
        error => {
          console.log(error);
          wx.hideLoading();
        }
      );

      return;
    }

    // console.log(params);
    // wx.hideLoading();
    // return;

    request.post('/koa-api/purchase/add', params).then(
      async data => {
        wx.hideLoading();
        wx.showModal({
          title: '提示',
          showCancel: false,
          content: '添加求购商品成功',
          success(res) {
            if (res.confirm) {
              wx.reLaunch({
                // url: `/pages/myself/myself?from=edit`,
                url: '/pages/purchase/purchase',
              });
            } else if (res.cancel) {
              console.log('用户点击取消');
            }
          },
        });
      },
      error => {
        console.log(error);
        wx.hideLoading();
      }
    );
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
      });

      wx.login({
        success(res) {
          if (res.code) {
            // 发起网络请求
            request
              .post('/koa-api/user/login', {
                code: res.code,
                name: nickName,
                imgUrl: avatarUrl,
              })
              .then(data => {
                wx.setStorageSync('token', JSON.stringify(data.token));
                wx.hideLoading();
              })
              .catch(data => {});
          } else {
            console.log('登录失败！' + res.errMsg);
          }
        },
      });
    }
  },

  perfect: function() {
    wx.navigateTo({
      url: '/pages/userinfo/userinfo',
    });
  },
});
