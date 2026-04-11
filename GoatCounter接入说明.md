# GoatCounter 统计已接入说明

已接入 GoatCounter 脚本：
https://ldoboke.goatcounter.com/count

本次改动：
- 底部统计位改为：
  - 总访问
  - 今日访问
  - 当前页
- 每篇文章页新增：
  - 本篇访问

说明：
- 线上 GitHub Pages 访问会被 GoatCounter 收集
- 本地预览时，页面上的数字使用本地浏览器 localStorage 做预览计数
- 因为 GoatCounter 前端脚本本身不直接把数字写回页面，所以这里做了“本地可预览 + 线上已接入”的方式
- 真实聚合数据请在 GoatCounter 后台查看
