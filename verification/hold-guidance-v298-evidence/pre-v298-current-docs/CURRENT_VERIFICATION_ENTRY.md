# 稳定默认验证入口：v0.297

开发／发布仍运行 `node verify-development.cjs`。当前五阶段依次为：包完整性、权威src装配一致性、67项构建器测试、56项可信建筑数据验证、未改动的 `node verify-current.cjs` 游戏聚合。`--check-only` 只运行前四阶段，不运行游戏。源码编辑后须先显式构建，再经审阅更新验证身份与封包清单；入口不会自动构建或重封包。玩家不需要Node。

本次只调整开发源文件组织和非版本化工具：建筑静态声明移入src/art/buildings.mjs，由固定标记插回原位。装配器只读文本／验证语法，不执行数据模块；独立数据测试会导入可信开发源码，约束冻结结构、角色尺寸、颜色、局部方形边界及20路径／128顶点／12圆弧预算。index.html、README、玩家指南及当前游戏manifest逐字节保持原v297，游戏版本不变。

verify-current.cjs及所有版本化历史验证／证据保持原字节。verify-development.cjs和三个非版本化活动工具已明确更新，不能声称它们原字节不变。旧活动工具、七输入布局和receipt在tools/source-build-history-v297/host中精确保留；原44项构建器与40项wrapper工具测试在该旧布局host通过。这是旧工具测试host，不是完整历史游戏聚合包。旧当前文档另存于同目录current-docs。

当前游戏聚合仍为verification/run-tests-v297.cjs：959行为／标记、10源码、15精确历史身份拒绝、68专项入口。v297生命条只修正负Y，天然指针命令路线证据为约3.8到4像素；完全裁剪边界来自合成测试。v296的四个进度偏移及更早严格恢复链继续保留。

原生浏览器栅格、实体键鼠、读屏、FPS尚未验收；无真实玩家存档生命周期操作。当前源码工具说明见BUILDING_DATA_DEVELOPMENT.md；本次完整验证证据见tools/building-data-pilot-evidence/fullgate-summary.json。
