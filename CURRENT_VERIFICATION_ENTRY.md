# 稳定默认验证入口：v0.294

运行 `node verify-current.cjs`；仅核文件与身份使用 `node verify-current.cjs --check-only`。manifest固定v294源和 `verification/run-tests-v294.cjs`。原wrapper字节不变：白名单快照复制，临时副本复验，只在副本运行聚合并清理，原包不写回结果。不附加legacy或long。

独立入口工具：`node tools/stable-verification/test-entry-v294.cjs`。仅真包check-only及synthetic stub，不计游戏覆盖。历史工具/脚本/报告及research-v292实验资料原字节保留，原实验脚本不是当前产品验收入口。v293文档归档于verification/release-v293-docs。

当前专项覆盖默认原画绘制、预览两路径完整render绘制等价、开关生命周期、纯布局结果与分配计数及变异。三个现有DOM比较器仅额外排除displayPreview精确子树，保留旧投影边界；独立边界测试验证周围设置与控件仍可检测。

没有原生浏览器、游戏存档/载入/导入导出或真实浏览器存储操作。普通VM初始化可能读取空模拟存储。离线清单只证明包内一致性，不认证来源或远端最新；SIGKILL可能留下临时目录。历史及当前玩家精简包由各自打包验证负责，不计游戏回归。

## 当前开发源码发布入口（v294 附加工具）

开发／发布必须运行 `node verify-development.cjs`：先原包完整性核验，再源码装配一致性、44项构建器测试，最后调用原字节的 `node verify-current.cjs` 完整聚合。任一步失败即停止。`--check-only` 仅前三步，不执行游戏。原游戏入口本身不检查 src，不能单独替代开发发布入口。工具编排单测另用 `node --test tools/test-development-preflight.cjs`。详见 [DEVELOPING.md](DEVELOPING.md)。

本次保持游戏v0.294、index、README、玩家指南、当前游戏manifest及全部历史测试／工具原字节。源码分片保留顺序与共享全局，只有geometry是小型真实ES模块；不是完整引擎模块化。玩家包无需重建，已有打包输入仍相同。
