# 稳定默认验证入口：v0.301

开发／发布运行 `node verify-development.cjs`。当前顺序为包完整性、当前文档契约、文档契约单测、权威 src 装配一致性、构建器测试、可信建筑数据验证、可信车辆数据验证，最后运行 current-verification.json 指定的游戏聚合。`node verify-development.cjs --check-only` 只执行前七阶段，不运行游戏。

当前 runner 为 verification/run-tests-v301.cjs，与 current-verification.json 及 README 一致。本次为 v301 的车辆静态数据与开发工具增补，游戏、README、当前玩家指南和玩家 ZIP 输入未变。旧的 `node verify-current.cjs` 仍是游戏验证入口，本身不检查文档契约。发布请使用开发入口。

编辑循环、有限语法范围、历史 host 和工具测试见 [文档契约开发说明](DOCUMENT_CONTRACT_DEVELOPMENT.md)。完整性首先检查封包；编辑后直接检查源或文档，再经审查更新相应身份及根校验表，历史身份不能重钉。未刷新校验表时完整开发入口拒绝继续是预期行为。

原 v301 游戏发布的完整隔离证据见 [QA 状态](QA_STATUS.md)：67 构建器、56 建筑数据及 959/10/15/73 游戏检查，1953 个输入未变。本次维护增补的独立隔离结果另见 [工具验收](DOCUMENT_CONTRACT_DEVELOPMENT.md)。原生浏览器、无障碍及 FPS 验收仍未由这些 VM/合成检查证明。

车辆源数据的新增校验、保守复杂度预算及本次同字节迁移证据见 [车辆数据开发说明](VEHICLE_ART_DATA_DEVELOPMENT.md)。旧文档契约增补记录属于此前阶段；当前完整入口为八阶段，check-only 为七阶段。
