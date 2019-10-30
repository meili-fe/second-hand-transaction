// pages/publish/publish.js
const util = require('../../utils/util.js');
Page({
  /**
   * 页面的初始数据
   */
  data: {
    id: '',
    title: '',
    description: '',
    price: '',
    contact: '',
    cate_id: '',
    img_list: [],
    location: 0,
    locationRange: [{ id: 0, name: '绿地6层' }, { id: 1, name: '绿地20层' }],
    locationIndex: 0,
    isEditPage: false,
    tempFilePaths: [],
    cateIdRange: [],
    cateIdIndex: 0,
    statusRange: [{ id: 1, name: '发布' }, { id: 2, name: '已卖出' }, { id: 3, name: '关闭' }],
    status: 1,
    statusIndex: 0,
  },

  /**
   * 生命周期函数--监听页面加载
   */
  onLoad: function(options) {
    // 获取分类数据
    const allTypePromise = util.request.post('/koa-api/product/allType').then(data => {
      this.setData({
        cateIdRange: data,
      });

      wx.hideLoading();
    });

    /**
     * 如果有id，则是编辑页面
     */
    const { id } = options;
    if (id) {
      this.setData({
        isEditPage: true,
        id: id,
      });

      Promise.all([allTypePromise]).then(() => {
        util.request.post('/koa-api/product/productById', { id }).then(data => {
          const { title, description, img_list, price, location, contact, cate_id } = data;
          this.setData({
            title: title,
            description: description,
            price: price,
            contact: contact,
            cate_id: cate_id,
            img_list: (img_list && img_list.split(',')) || [],
            location: location,
            locationIndex: location,
            tempFilePaths: (img_list && img_list.split(',')) || [],
            cateIdIndex: cate_id,
            locationIndex: location,
          });

          wx.hideLoading();
        });
      });
    }
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
  // 输入框事件
  bindKeyInput: function(e) {
    const type = e.currentTarget.dataset.type;
    this.setData({
      [type]: e.detail.value,
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
      [type]: this.data[`${toHump(type)}Range`][e.detail.value].id,
    });
  },
  // 上传图片
  upload: async function(e) {
    // 获取待上传的图片列表
    const files = await this.chooseImage().catch(err => {
      console.log(err);
      wx.hideLoading();
    });
    console.log(files);
    wx.showLoading({
      title: '上传中',
      mask: true,
    });
    if (!files) return;

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

      // // 图片上传成功后，显示缩略图
      const tempFilePaths = this.data.tempFilePaths.concat(file);
      // 存储服务端返回的图片地址，提交的时候使用
      const img_list = this.data.img_list.concat(uploadFilePath);

      this.setData({
        tempFilePaths: tempFilePaths,
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
  // 压缩图片
  compressImage: function(filePath) {
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
          let maxWidth = 1000,
            maxHeight = 800;
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
          ctx.draw(false, function() {
            setTimeout(() => {
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
            }, 500);
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
    console.log(filePath);
    return new Promise((resolve, reject) => {
      wx.uploadFile({
        url: `${util.baseUrl}/koa-api/product/upload`,
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
          // console.log('fail:', res.data);
          // wx.hideLoading();
          // wx.showModal({
          //   title: '错误提示',
          //   content: '上传图片失败',
          //   showCancel: false,
          //   success: function(res) {},
          // });
        },
      });
    });
  },
  // 预览图片
  previewImage: function(e) {
    const index = e.currentTarget.dataset.index;
    const that = this;
    wx.previewImage({
      current: that.data.tempFilePaths[index],
      urls: that.data.tempFilePaths,
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
    const that = this;
    console.log(e);
    util.request.post('/koa-api/product/delImgByUrl', { img_url: this.data.img_list[index] }).then(data => {
      // this.data.tempFilePaths.splice(index, 1);
      // this.data.img_list.splice(index, 1);
      const tempFilePaths = [].concat(this.data.tempFilePaths);
      const img_list = [].concat(this.data.img_list);

      tempFilePaths.splice(index, 1);
      img_list.splice(index, 1);
      this.setData({
        tempFilePaths: tempFilePaths,
        img_list: img_list,
      });
      wx.hideLoading();
    });
  },
  // 提交
  submit: function() {
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
      contact: this.data.contact,
      location: this.data.location,
      img_list: this.data.img_list.join(),
      cate_id: this.data.cate_id,
    };

    console.log('done');
    console.log(params);

    wx.showLoading({
      title: `${this.data.isEditPage ? '提交中' : '发布中'}`,
      mask: true,
    });

    // 编辑页面
    if (this.data.isEditPage) {
      params.id = this.data.id;
      params.status = this.data.status;
      util.request.post('/koa-api/product/update', params).then(
        data => {
          wx.showToast({
            title: `修改商品成功`,
            icon: 'none',
            duration: 2000,
          });

          wx.switchTab({
            url: `/pages/myself/myself`,
          });
        },
        error => {
          console.log(error);
          wx.hideLoading();
        }
      );

      return;
    }

    util.request.post('/koa-api/product/add', params).then(
      data => {
        wx.showToast({
          title: `添加商品成功`,
          icon: 'none',
          duration: 2000,
          mask: true,
        });

        wx.switchTab({
          url: `/pages/myself/myself`,
        });
      },
      error => {
        console.log(error);
        wx.hideLoading();
      }
    );
  },
});
