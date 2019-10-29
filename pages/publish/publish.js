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
    imageCount: 9,
    imageLength: 0,
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
    wx.hideLoading();
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
  upload: function(e) {
    const that = this;
    wx.chooseImage({
      count: 9,
      sizeType: ['compressed'],
      sourceType: ['album', 'camera'],
      success: function(res) {
        wx.showLoading({
          title: '正在上传',
          mask: true,
        });

        const tempFilePaths = res.tempFilePaths;
        const imageLength = res.tempFilePaths.length;

        tempFilePaths.forEach((item, index) => {
          const currentIndex = index + 1;
          wx.uploadFile({
            url: `${util.baseUrl}/koa-api/product/upload`,
            filePath: item,
            name: 'uploadfile',
            header: {
              'Content-Type': 'multipart/form-data',
              token: wx.getStorageSync('token'),
            },
            success: function(res) {
              if (res.statusCode === 200) {
                const data = JSON.parse(res.data);
                // 图片上传成功后，显示缩略图
                const tempFilePaths = that.data.tempFilePaths.concat(item);
                // 存储服务端返回的图片地址，提交的时候使用
                const img_list = that.data.img_list.concat(data.data.file_path);

                that.setData({
                  tempFilePaths: tempFilePaths,
                  imageLength: tempFilePaths.length,
                  img_list: img_list,
                  // imageCount: count,
                });
              } else {
                wx.showModal({
                  title: '错误提示',
                  content: '上传图片失败',
                  showCancel: false,
                  success: function(res) {},
                });
              }

              //如果是最后一张,则隐藏等待中
              if (currentIndex === imageLength) {
                wx.hideLoading();
              }
            },
            fail: function(res) {
              console.log('fail:', res.data);
              wx.hideLoading();
              wx.showModal({
                title: '错误提示',
                content: '上传图片失败',
                showCancel: false,
                success: function(res) {},
              });
            },
          });
        });
      },
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
