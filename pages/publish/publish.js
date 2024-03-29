// pages/publish/publish.js
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
    price: '',
    contact: '',
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
      statusRange: configData.goodStatus.filter(item => ['0', '2', '3'].includes(item.value)),
    });

    /**
     * 如果有id，则是编辑页面
     */
    const { id } = options;

    // 设置标题
    wx.setNavigationBarTitle({
      title: id ? '编辑商品' : '添加商品',
    });

    if (id) {
      this.setData({
        isEditPage: true,
        id: id,
      });

      const data = await request.post('/koa-api/product/productById', { id });
      if (!data) {
        wx.hideLoading();
        return;
      }
      const { title, description, img_list, price, location, contact, cate_id, original, team } = data;
      this.setData({
        title: title,
        description: description,
        price: price,
        // contact: contact,
        cate_id: cate_id,
        img_list: (img_list && img_list.split(',')) || [],
        // location: location,
        // locationIndex: location,
        cateIdIndex: cate_id > 0 ? cate_id - 1 : 0,
        // locationIndex: location,
        oldImgList: (img_list && img_list.split(',')) || [],
        loaded: true,
        original: original,
        // team: team,
        // teamIndex: team,
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
    if (type === 'price' || type === 'original') {
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

    console.log(this.data[type]);
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
  // 上传图片
  upload: async function(e) {
    // 获取待上传的图片列表
    const files = await this.chooseImage().catch(err => {
      wx.hideLoading();
    });

    if (!files) return;

    wx.showLoading({
      title: '上传中',
      mask: true,
    });
    const imageLength = files.length;
    for (let index = 0; index < imageLength; index++) {
      const file = files[index];
      // 压缩当前图片
      const compressedFile = await this.compressImage(file).catch(err => {
        wx.showToast({
          title: err,
          icon: 'none',
          duration: 2000,
        });
      });
      // 上传压缩过的图片
      const uploadFilePath = await this.uploading(compressedFile).catch(err => {
        wx.showToast({
          title: err,
          icon: 'none',
          duration: 2000,
        });
      });

      if (!uploadFilePath) return;

      // // 图片上传成功后，显示缩略图
      const img_list = this.data.img_list.concat(uploadFilePath);

      this.setData({
        img_list: img_list,
      });

      if (index + 1 === imageLength) {
        wx.hideLoading();
      }
    }
  },
  // 选择图片
  chooseImage: function(e) {
    const that = this;
    return new Promise((resolve, reject) => {
      wx.chooseImage({
        count: 5,
        sizeType: ['compressed'],
        sourceType: ['album', 'camera'],
        success: function(res) {
          resolve(res.tempFilePaths);
        },
        fail: function() {
          reject('wx.chooseImage error');
        },
      });
    });
  },
  /**
   * 压缩图片
   * @param {String} filePath 图片路径
   * @param {Number} maxWidth 压缩后的图片的最大宽度
   * @param {Number} maxHeight 压缩后的图片的最大高度
   */
  compressImage: function(filePath, maxWidth = 1000, maxHeight = 800) {
    const that = this;

    return new Promise((resolve, reject) => {
      wx.getImageInfo({
        src: filePath,
        success(res) {
          let originWidth, originHeight;
          originHeight = res.height;
          originWidth = res.width;
          //压缩比例
          // 最大尺寸限制

          // 目标尺寸
          let targetWidth = originWidth,
            targetHeight = originHeight;
          // 等比例压缩，如果宽度大于高度，则宽度优先，否则高度优先
          if (originWidth > maxWidth || originHeight > maxHeight) {
            if (originWidth / originHeight > maxWidth / maxHeight) {
              // 要求宽度*(原生图片比例)=新图片尺寸
              targetWidth = maxWidth;
              targetHeight = Math.round(maxWidth * (originHeight / originWidth));
            } else {
              targetHeight = maxHeight;
              targetWidth = Math.round(maxHeight * (originWidth / originHeight));
            }

            console.log('原图宽度：', originWidth);
            console.log('原图高度：', originHeight);
            console.log('等比缩放后宽度：', targetWidth);
            console.log('等比缩放后高度：', targetHeight);
          }

          //更新canvas大小
          that.setData({
            cw: targetWidth,
            ch: targetHeight,
          });

          //尝试压缩文件，创建 canvas
          let ctx = wx.createCanvasContext('canvas');

          let quality = 0.7;
          ctx.clearRect(0, 0, targetWidth, targetHeight);
          ctx.drawImage(filePath, 0, 0, targetWidth, targetHeight);

          ctx.draw(false, async function() {
            await sleep(300);

            wx.canvasToTempFilePath({
              canvasId: `canvas`,
              destWidth: targetWidth,
              destHeight: targetHeight,
              fileType: 'jpg',
              quality: quality,
              success: res => {
                const { tempFilePath } = res;
                resolve(tempFilePath);
              },
              fail: () => {
                reject('wx.canvasToTempFilePath error');
              },
            });
          });
        },
        fail: () => {
          reject('wx.getImageInfo error');
        },
      });
    });
  },
  uploading: function(filePath) {
    const that = this;
    return new Promise((resolve, reject) => {
      wx.uploadFile({
        url: `${baseUrl}/koa-api/product/upload`,
        filePath: filePath,
        name: 'uploadfile',
        header: {
          'Content-Type': 'multipart/form-data',
          token: wx.getStorageSync('token'),
        },
        success: function(res) {
          if (res.statusCode === 200) {
            const data = JSON.parse(res.data);
            resolve(data.data.file_path);
          } else {
            reject(res.statusCode);
          }
        },
        fail: function(res) {
          reject('上传图片失败');
        },
      });
    });
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
  // 删除图片
  delImage: function(e) {
    const index = e.target.dataset.index;
    const img_url = this.data.img_list[index];

    const del = () => {
      const img_list = [];
      this.data.img_list.forEach(item => {
        if (item === img_url) return;
        img_list.push(item);
      });

      this.setData({
        img_list: img_list,
      });
    };

    // 编辑页面，不调用接口
    if (this.data.isEditPage) {
      del();
      return;
    }

    request.post('/koa-api/product/delImgByUrl', { img_url: img_url }).then(data => {
      del();
      wx.hideLoading();
    });
  },
  // 用base64生成缩略图
  firstPreviewImage: async function() {
    const compressedFile = await this.compressImage(this.data.tempFilePaths[0], 100, 100);

    const base64 = await this.converBase64(compressedFile);
    console.log(base64);
  },
  // 转换为base64
  converBase64: function(filePath) {
    return new Promise((resolve, reject) => {
      wx.getFileSystemManager().readFile({
        filePath: filePath,
        encoding: 'base64',
        success: function(res) {
          resolve(res.data);
        },
        fail: function() {
          reject('getFileSystemManager error');
        },
      });
    });
  },

  // 提交
  submit: async function() {
    if (!this.data.img_list.length) {
      wx.showToast({
        title: `请上传最少一张图片`,
        icon: 'none',
        duration: 2000,
      });
      return;
    }
    const required = [
      { key: 'title', value: '标题' },
      { key: 'description', value: '描述' },
      { key: 'original', value: '原价' },
      { key: 'price', value: '价格' },
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

    const params = {
      title: this.data.title,
      description: this.data.description,
      price: this.data.price,
      img_list: this.data.img_list.join(),
      cate_id: this.data.cate_id,
      original: this.data.original,
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
      params.oldImgList = this.data.oldImgList;
      params.newImgList = this.data.img_list.join();

      request.post('/koa-api/product/update', params).then(
        async data => {
          wx.hideLoading();
          wx.showModal({
            title: '提示',
            showCancel: false,
            content: '修改商品成功，点击确定进入待审核列表',
            success(res) {
              console.log(res.confirm);
              if (res.confirm) {
                wx.redirectTo({
                  // url: `/pages/myself/myself?from=edit`,
                  url: '/pages/products/index?status=0',
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

    console.log(params);
    // wx.hideLoading();
    // return;

    request.post('/koa-api/product/add', params).then(
      async data => {
        wx.hideLoading();
        wx.showModal({
          title: '提示',
          showCancel: false,
          content: '添加商品成功，点击确定进入待审核列表',
          success(res) {
            if (res.confirm) {
              wx.redirectTo({
                // url: `/pages/myself/myself?from=publish`,
                url: '/pages/products/index?status=0',
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
