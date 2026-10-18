# 稳定默认验证入口：v0.295

开发／发布运行 `node verify-development.cjs`：包完整性、权威src装配一致性、44项构建器测试，然后当前 `node verify-current.cjs` 聚合。`--check-only` 不运行游戏。原wrapper与开发入口工具不变，current manifest选择 `verification/run-tests-v295.cjs`。

新增v295当前专项验证车辆＋建筑默认关闭会话预览、总计29条固定路径、动态层、缓存／直接回退、完整绘制、负控和源码恢复。历史v294及更早验证程序保留原字节；当前版本复制必要入口并显式串接严格restore-v294。已有displayPreview子树投影不扩张。

无原生浏览器、真实FPS或游戏存档／载入／导入导出验收。普通旧VM初始化可读取空模拟存储，新建筑专项使用禁用持久化的记录器。实际隔离聚合结果见QA_STATUS.md。旧玩家包由各自版本工具验证，不能冒称当前包。
