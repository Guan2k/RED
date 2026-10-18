# CPU 采样摘要与复现边界

`summary.json` 原样保留三次采样的函数数据；本快照打包时用原 `analyze.py` 对三组 raw profile、trace、runtime 的临时副本重算，输出与摘要逐字节相同。摘要 SHA-256：

`387ed72cd0dde4b44a9a68d9eda73d1ec7857c9a848442024fbac558d7956f6f`

`REPORT.md` 记录方法与结论。三次均为 v0.292 源码、seed 29301、合法 UI 操作；共享归一化 trace SHA-256：

`12637d53a9de8ffed6102ac08a210f1ca2ab65032712c8c789b673cbbbbc8bab`

这是 Node VM + mock DOM + no-op/proxy Canvas 的冷进程采样。不是原生浏览器帧率、GPU 或 Windows 性能测量；sample 数不是调用数，inclusive 百分比不能相加。快照间函数 URL 可能含原工作区绝对路径，仅为历史归属标签，不是可移植位置。

## 包含什么、不能直接运行什么

- 保留 `analyze.py` 和 `profile-template.cjs` 作为方法源码，不作为可直接运行的完整性能基准。
- 原始 `run-1/`、`run-2/`、`run-3/` profiles、状态 trace 及 runtime 均留在本地，不随此快照发布；哈希在根目录 `SOURCE_EVIDENCE.json`。
- 重新分析需在这份 `analyze.py` 同级提供各 `run-N/main.cpuprofile`、`seed-29301.json`、`runtime.json`，然后 `python analyze.py`。它会重写该目录的 `summary.json`。
- 重新采样还需完整 v292 基线与 `verification/vm-environment.cjs`。原采样脚本位于本地 `red-development/cpu-profile-pilot/run-N/profile.cjs`；其 `../../v292-package-tools/RED` 相对路径依赖原工作区布局。模板直接置于本快照 `cpu/` 运行时不能解析这些依赖，不应原样运行。
- 原运行使用 Node v24.19.0、V8 13.6.233.17-node.51，其他硬件/容器可见信息在摘要。样本时间随机器、负载及 JIT 变化，不保证数值一致。

这组证据不足以证明布局缓存、WebGL 或原生引擎的性能收益。本快照不包含后续布局优化候选。
