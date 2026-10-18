# 稳定默认验证入口：v0.293

运行 `node verify-current.cjs`；只核文件与身份使用 `node verify-current.cjs --check-only`。manifest固定v293源和 `verification/run-tests-v293.cjs`。原wrapper字节不变：白名单快照复制，临时副本复验，只在副本运行聚合并清理，原包不写回结果。不附加legacy或long。

独立门禁工具：`node tools/stable-verification/test-entry-v293.cjs`。仅真包check-only及synthetic stub，不计游戏覆盖。历史工具、脚本和结果原字节保留；v292文档归档于verification/release-v292-docs。

只有两个指定历史DOM比较器及当前反馈比较器增加新任务按钮/说明的精确子树投影，七项介绍采用精确节点/全文文本规范化；独立负边界验证旧字段仍可检测。其他版本化继承只更新身份/恢复链。

无原生浏览器、游戏存档/载入/导入导出或真实浏览器存储操作。自然路线VM初始化会读取空模拟存储。离线清单只证明包内一致性，不认证来源或远端最新；SIGKILL可能留下临时目录。历史玩家ZIP与当前版本的独立打包产物由各自打包验证负责，不属于游戏回归覆盖。
