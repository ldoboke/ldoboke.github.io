# GoatCounter 真实统计修复说明

这次修复了：
1. 计数接口路径改为官方推荐的 encodeURIComponent(path)
2. 当前页路径改为优先读取 window.goatcounter.get_data()['p']
3. 兼容 GoatCounter JSON 返回的 count 字符串
4. 页面初始文案改成“加载中”，避免直接显示 0 或横杠

注意：
- 需要在 GoatCounter 后台开启 “Allow adding visitor counts on your website”
- 线上访问 GitHub Pages 后，再看页面数字
- 今日访问仍保留“后台查看”
