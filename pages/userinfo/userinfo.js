// pages/userinfo/userinfo.js
import { request, getConfigs } from '../../utils/util';
const app = getApp();

Page({

  /**
   * 页面的初始数据
   */
  data: {
    avatarUrl:'',
    cateIdRange: [],
    locationRange: [],
    teamRange:[],
    statusRange:[],
    genderRange: [{ name: "女", value: 0 },{ name: "男", value: 1 }],
    genderIndex:0,
    locationIndex: 0,
    cateIdIndex: 0,
    teamIndex: 0,
    contact:''
  },

  /**
   * 生命周期函数--监听页面加载
   */
  onLoad: async function (options) {
    const { nickName, avatarUrl, gender } = app.globalData.userInfo;
    this.setData({
      nickName: nickName,
      avatarUrl: avatarUrl,
      genderIndex: gender == 1?1:0,
    });
    // 获取相关配置数据
    const configData = await getConfigs(app);

    this.setData({
      cateIdRange: configData.category,
      locationRange: configData.location,
      teamRange: configData.team,
      statusRange: configData.goodStatus.filter(item => ['0', '2', '3'].includes(item.value)),
    });

    await request.get('/koa-api/user/getById').then(res => {
      const { contact, location: locationIndex, sex: genderIndex, team: teamIndex} = res
      this.setData({
        contact, locationIndex, genderIndex, teamIndex
      })
    }, error => {
    })
  },

  /**
   * 生命周期函数--监听页面初次渲染完成
   */
  onReady: function () {

  },

  /**
   * 生命周期函数--监听页面显示
   */
  onShow: function () {
    wx.hideLoading()
  },

  /**
   * 生命周期函数--监听页面隐藏
   */
  onHide: function () {

  },

  /**
   * 生命周期函数--监听页面卸载
   */
  onUnload: function () {

  },

  /**
   * 页面相关事件处理函数--监听用户下拉动作
   */
  onPullDownRefresh: function () {

  },

  /**
   * 页面上拉触底事件的处理函数
   */
  onReachBottom: function () {

  },

  /**
   * 用户点击右上角分享
   */
  onShareAppMessage: function () {

  },
  bindPickerChange: function (e) {
    const type = e.currentTarget.dataset.type;

    // 转驼峰
    const toHump = str =>
      str.replace(/\_(\w)/g, function (all, letter) {
        return letter.toUpperCase();
      });

    this.setData({
      [`${toHump(type)}Index`]: e.detail.value,
      [type]: this.data[`${toHump(type)}Range`][e.detail.value].value,
    });
  },
  bindKeyInput: function (e) {
    const type = e.currentTarget.dataset.type;
    let value = e.detail.value;

    this.setData({
      [type]: value,
    });
  },
  confirm : async function(){
    wx.showLoading({
      title: '提交中...',
      mask: true,
    });
    const {
      genderIndex:sex,
      locationIndex:location,
      teamIndex:team,
      contact
    } = this.data
    const praiseData = await request.post('/koa-api/user/update', { sex, location, team, contact }).then(res =>{
      wx.hideLoading();
      let msg = '恭喜'
      if (sex == 0){
        msg += '小姐姐修改信息成功~~' 
      }else{
        msg += '小哥哥修改信息成功~~' 
      }
      wx.showModal({
        title: '提示',
        showCancel: false,
        content: msg,
        success(res) {},
      });
    },error =>{
      wx.hideLoading();
    })
  }
})