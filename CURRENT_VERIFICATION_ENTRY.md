# 稳定默认验证入口：v0.308

开发／发布运行 `node verify-development.cjs`。八阶段依次检查包完整性、当前文档契约、文档契约单测、权威src装配一致性、构建器测试、建筑数据、车辆数据和游戏聚合。`node verify-development.cjs --check-only` 只执行前七阶段，不运行游戏。

当前runner为verification/run-tests-v308.cjs，与current-verification.json及README一致。v308细分新购车时无已完工工厂的提示，原购买优先级、资金及排产规则不变。`node verify-current.cjs` 是既有游戏入口，本身不检查当前文档或editable source。

当前164专项、四精确变异、9源码逆变换、134DOM投影边界及既有192资金／80坐标建造用例通过。完整隔离gate通过，3210个原包／隔离副本输入逐SHA不变；959继承行为／标记、10源码检查、15历史身份检查和85专项入口通过。历史结果不是当前完整验收；原生浏览器、读屏与真实存储尚未验收。

编辑流程见DEVELOPING.md和DOCUMENT_CONTRACT_DEVELOPMENT.md。编辑后需经审查更新当前身份和根校验表，历史身份不得重钉。完整状态见[QA状态](QA_STATUS.md)。
