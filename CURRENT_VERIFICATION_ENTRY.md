# 稳定默认验证入口：v0.306

开发／发布运行 `node verify-development.cjs`。八阶段依次检查包完整性、当前文档契约、文档契约单测、权威src装配一致性、构建器测试、建筑数据、车辆数据和游戏聚合。`node verify-development.cjs --check-only` 只执行前七阶段，不运行游戏。

当前runner为verification/run-tests-v306.cjs，与current-verification.json及README一致。v306新增建造卡直接可见的禁用原因，保留原禁用条件与游戏规则。`node verify-current.cjs` 是既有游戏入口，本身不检查当前文档或editable source。

最终完整隔离gate通过，2941个输入在原包与隔离副本逐SHA不变。此前三次未完成尝试及修正见QA状态与证据；不声称首轮通过。当前结果含959继承行为／标记、10源码检查、15历史身份检查和81专项入口。专项47用例、4精确变异、134 DOM投影检查、12源码逆变换检查通过，独立源码复核247用例通过。历史完整结果仍为各自原版本证据，不能代替当前完整验收。原生浏览器排版、默认键盘激活和读屏尚未验收。

编辑流程见DEVELOPING.md和DOCUMENT_CONTRACT_DEVELOPMENT.md。编辑后需经审查更新当前身份和根校验表，历史身份不得重钉。完整状态见[QA状态](QA_STATUS.md)。
