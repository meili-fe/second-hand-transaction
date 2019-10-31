const env = 'dev';
// const env = 'prod';
const baseUrl = env === 'dev' ? 'https://second-hand.ganksolo.com' : '';
// const baseUrl = env === 'dev' ? 'http://172.28.81.113:3003' : '';

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

const formatTime = time => {
  const date = new Date(time);
  const year = date.getFullYear();
  const month = date.getMonth() + 1;
  const day = date.getDate();
  const hour = date.getHours();
  const minute = date.getMinutes();
  const second = date.getSeconds();

  return [month, day].map(formatNumber).join('-') + ' ' + [hour, minute].map(formatNumber).join(':');
};

const formatNumber = n => {
  n = n.toString();
  return n[1] ? n : '0' + n;
};

const sleep = ms => new Promise(resolve => setTimeout(resolve, ms));
module.exports = {
  request,
  env,
  baseUrl,
  formatTime,
  sleep,
};
