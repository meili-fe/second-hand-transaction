const util = require('./utils/util.js');
//app.js
App({
  onLaunch: function() {
    wx.showLoading({
      mask: true,
    });

    // 展示本地存储能力
    // var logs = wx.getStorageSync('logs') || [];
    // logs.unshift(Date.now());
    // wx.setStorageSync('logs', logs);
    // // 登录
    // wx.login({
    //   success: res => {
    //     // 发送 res.code 到后台换取 openId, sessionKey, unionId
    //   },
    // });
    // 获取用户信息;
    wx.getSetting({
      success: res => {
        if (res.authSetting['scope.userInfo']) {
          // 已经授权，可以直接调用 getUserInfo 获取头像昵称，不会弹框
          wx.getUserInfo({
            success: res => {
              // 可以将 res 发送给后台解码出 unionId
              this.globalData.userInfo = res.userInfo;

              // 设置全局登录状态
              this.globalData.hasLogined = true;

              // 由于 getUserInfo 是网络请求，可能会在 Page.onLoad 之后才返回
              // 所以此处加入 callback 以防止这种情况
              if (this.userInfoReadyCallback) {
                this.userInfoReadyCallback(res);
              }

              const { nickName, avatarUrl, gender } = res.userInfo;
              wx.login({
                success(res) {
                  if (res.code) {
                    // 发起网络请求
                    util.request
                      .post('/koa-api/user/login', {
                        code: res.code,
                        name: nickName,
                        imgUrl: avatarUrl,
                        sex: gender,
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
            },
          });
        }
      },
    });
  },
  globalData: {
    userInfo: null,
  },
});
