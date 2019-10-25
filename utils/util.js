const env = 'dev';
// const env = 'prod';
const baseUrl = env === 'dev' ? 'http://second-hand.femans.com' : '';

/**
 * wx.request封装
 */
class Request {
  constructor() {}
  getToken() {
    return wx.getStorageSync('token');
  }
  get(url, data, header, showToast = true) {
    return this.request('GET', url, data, header, showToast);
  }
  post(url, data, header, showToast = true) {
    header = Object.assign(
      {
        'Content-Type': 'application/x-www-form-urlencoded',
      },
      header
    );

    return this.request('POST', url, data, header, showToast);
  }
  request(method, url, data, header, showToast) {
    // 如果url中没有http，则做处理
    if (!/^http/.test(url)) {
      url = baseUrl + url;
    }

    header = Object.assign(
      {
        token: this.getToken(),
      },
      header
    );
    // console.log(url)
    return new Promise((resolve, reject) => {
      wx.request({
        url,
        data,
        header,
        method,
        success(res) {
          // ocr接口
          if (res.data.status === 0 || res.data.code === 0) {
            resolve(res.data.data);
            return;
          }

          // 腾讯接口
          if (res.data.code === '0') {
            resolve(res.data.result);
            return;
          }

          // 未登录
          if (res.data.code === 405 && !url.includes('saveErrorInfo')) {
            wx.removeStorageSync('accessToken');
            wx.redirectTo({
              url: '/pages/index/index',
            });
            return;
          }

          showToast &&
            wx.showToast({
              title: res.data.msg || res.data.message,
              icon: 'none',
              duration: 2000,
            });
        },
        fail() {
          reject({
            msg: '请求失败',
            url,
            method,
            data,
          });
        },
      });
    });
  }
}
const request = new Request();

module.exports = {
  request,
  env,
};
