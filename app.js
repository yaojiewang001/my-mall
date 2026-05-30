const fs = require('fs')
var express = require('express')
var bodyParser = require('body-parser')
var path = require('path')
// 路由加载
var mount = require('mount-routes')

var app = express()

// ########## 修复 CORS 跨域（关键！！！）##########
app.use(function(req, res, next) {
  res.header('Access-Control-Allow-Origin', 'https://my-mall-front.onrender.com')
  res.header('Access-Control-Allow-Credentials', 'true')
  res.header('Access-Control-Allow-Headers', 'X-Requested-With, Content-Type, Authorization')
  res.header('Access-Control-Allow-Methods', 'PUT,POST,GET,DELETE,OPTIONS')
  if (req.method === 'OPTIONS') {
    return res.sendStatus(200)
  }
  next()
})
// #################################################

/**
 *
 * 公共系统初始化
 *
 */
app.use(bodyParser.json())
app.use(bodyParser.urlencoded({ extended: true }))

// 初始化数据库模块
var database = require('./modules/database')
database.initialize(app, function(err) {
  if (err) {
    console.error('连接数据库失败失败 %s', err)
  }
})

/**
 *
 *	后台管理系统初始化
 *
 */
// 获取管理员逻辑模块
var managerService = require(path.join(process.cwd(), 'services/ManagerService'))
// 获取角色服务模块
var roleService = require(path.join(process.cwd(), 'services/RoleService'))

// 初始化统一响应机制
var resextra = require('./modules/resextra')
app.use(resextra)

// 初始化 后台登录 passport 策略
admin_passport = require('./modules/passport')
// 设置登录模块的登录函数衔接 passport 策略
admin_passport.setup(app, managerService.login)
// 设置 passport 登录入口点
app.use('/api/private/v1/login', admin_passport.login)
// 设置 passport 验证路径
app.use('/api/private/v1/*', admin_passport.tokenAuth)

// 获取验证模块
var authorization = require(path.join(process.cwd(), '/modules/authorization'))

// 设置全局权限
authorization.setAuthFn(function(req, res, next, serviceName, actionName, passFn) {
  if (!req.userInfo || isNaN(parseInt(req.userInfo.rid))) return res.sendResult('无角色ID分配')
  // 验证权限
  roleService.authRight(req.userInfo.rid, serviceName, actionName, function(err, pass) {
    passFn(pass)
  })
})

/**
 *
 * 初始化路由
 *
 */
// 带路径的用法并且可以打印出路有表
mount(app, path.join(process.cwd(), '/routes'), true)

// 富文本编辑器上传
var ueditor = require(path.join(process.cwd(), '/modules/ueditor'))
// 富文本控件处理
app.use('/ueditor/ue', ueditor)
// 设置富文本空间地址
app.use('/ueditor', express.static('public/ueditor'))

app.use('/tmp_uploads', express.static('tmp_uploads'))
app.use('/x/common', express.static('uploads/common'))
app.use('/uploads/goodspics', express.static('uploads/goodspics'))

var upload_config = require('config').get('upload_config')
app.use('/' + upload_config.get('upload_ueditor'), express.static(upload_config.get('upload_ueditor')))

const logistics = require('./modules/Logistics.js')
app.get('/api/private/v1/kuaidi/:orderno', logistics.getLogisticsInfo)

/**
 *
 * 统一处理无响应
 *
 */
// 如果没有路径处理就返回 Not Found
app.use(function(req, res, next) {
  res.sendResult(null, 404, 'Not Found')
})

app.listen(8888)

module.exports = app