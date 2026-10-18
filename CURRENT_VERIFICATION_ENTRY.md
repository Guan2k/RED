# 稳定默认验证入口：v0.296

开发／发布运行 `node verify-development.cjs`：包完整性、权威src装配一致性、44项构建器测试，然后当前 `node verify-current.cjs` 聚合。`--check-only` 不运行游戏。源码编辑后须先构建／核验、经审阅更新当前版本验证身份和清单；发布入口不会自动构建或重封包。玩家不需要Node。

原两个wrapper保持原字节；current manifest选择verification/run-tests-v296.cjs。完整保留v295及更早文件／严格身份门槛；新restore-v295反转恰好四偏移及版本后验证原v295 SHA。新进度专项覆盖实际裁剪交集、完整绘制、状态／标签／颜色／宽度／世界不变，以及四偏移反转、clip放宽与边界变异。当前renderer／building测试只在已识别的历史进度矩形上调整预期y坐标，其余paint/style/clip不忽略；DOM投影不变。

原生浏览器栅格、键鼠、读屏、FPS尚未验收。普通旧VM初始化可读取空模拟存储；新几何专项使用禁持久化VM。无游戏存档、载入、导入或导出操作。当前玩家包按独立产物打包验证，不计游戏回归；历史包只证明各自版本。详见QA_STATUS.md及verification/PROGRESS_RAILS_V296.md。
