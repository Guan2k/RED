# 稳定默认验证入口：v0.302

开发／发布运行 `node verify-development.cjs`。当前顺序为包完整性、当前文档契约、文档契约单测、权威 src 装配一致性、构建器测试、可信建筑数据验证、可信车辆数据验证，最后运行 current-verification.json 指定的游戏聚合。`node verify-development.cjs --check-only` 只执行前七阶段，不运行游戏。

当前 runner 为 verification/run-tests-v302.cjs，与 current-verification.json 及 README 一致。本次v302仅改变矿田粗档图示与版本，附独立速查页。旧的 `node verify-current.cjs` 仍是游戏验证入口，本身不检查文档契约。发布请使用开发入口。

编辑循环、有限语法范围、历史 host 和工具测试见 [文档契约开发说明](DOCUMENT_CONTRACT_DEVELOPMENT.md)。完整性首先检查封包；编辑后直接检查源或文档，再经审查更新相应身份及根校验表，历史身份不能重钉。未刷新校验表时完整开发入口拒绝继续是预期行为。

当前唯一完整隔离已通过101构建器、56建筑数据、180车辆数据与959/10/15/74游戏结果，2382输入保持不变；实际结果见[QA 状态](QA_STATUS.md)及verification/ore-density-v302-evidence。原生浏览器、无障碍及FPS验收仍未由VM/合成检查证明。

车辆源数据的新增校验、保守复杂度预算及历史v301同字节迁移证据见 [车辆数据开发说明](VEHICLE_ART_DATA_DEVELOPMENT.md)。旧文档契约增补记录属于此前阶段；当前完整入口为八阶段，check-only 为七阶段。
