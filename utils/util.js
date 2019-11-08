const env = 'dev';
// const env = 'prod';
const baseUrl = env === 'dev' ? 'https://second-hand.ganksolo.com' : '';
// const baseUrl = env === 'dev' ? 'http://172.28.86.253:3003' : '';

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
          if (res.data.code === 0) {
            resolve(res.data.data);
            return;
          }

          if (res.data.code === 600) {
            wx.removeStorageSync('token');
            resolve();
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

  const currentYear = new Date().getFullYear();
  if (currentYear > year) {
    return [year, month, day].map(formatNumber).join('-') + ' ' + [hour, minute].map(formatNumber).join(':');
  }
  return [month, day].map(formatNumber).join('-') + ' ' + [hour, minute].map(formatNumber).join(':');
};

const formatNumber = n => {
  n = n.toString();
  return n[1] ? n : '0' + n;
};

const sleep = ms => new Promise(resolve => setTimeout(resolve, ms));

const converTime = time => {
  const curTime = new Date();
  const postTime = new Date(time);
  const timeDiff = curTime.getTime() - postTime.getTime();

  // 单位换算
  const min = 60 * 1000;
  const hour = min * 60;
  const day = hour * 24;
  const week = day * 7;

  // 计算发布时间距离当前时间的周、天、时、分
  const exceedWeek = Math.floor(timeDiff / week);
  const exceedDay = Math.floor(timeDiff / day);
  const exceedHour = Math.floor(timeDiff / hour);
  const exceedMin = Math.floor(timeDiff / min);

  if (exceedWeek > 0) {
    return formatTime(time);
  } else {
    if (exceedDay < 7 && exceedDay > 0) {
      return exceedDay + '天前';
    } else {
      if (exceedHour < 24 && exceedHour > 0) {
        return exceedHour + '小时前';
      } else {
        return exceedMin + '分钟前';
      }
    }
  }
};

const checkLogin = () => {};
module.exports = {
  request,
  env,
  baseUrl,
  formatTime,
  sleep,
  converTime,
};
