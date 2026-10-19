# 稳定默认验证入口：v0.305

开发／发布运行 `node verify-development.cjs`。八阶段依次检查包完整性、当前文档契约、文档契约单测、权威src装配一致性、构建器测试、建筑数据、车辆数据和游戏聚合。`node verify-development.cjs --check-only` 只执行前七阶段，不运行游戏。

当前runner为verification/run-tests-v305.cjs，与current-verification.json及README一致。v305仅修复全工厂选择按钮长按空格后丢失释放激活的问题，并更新显示版本。`node verify-current.cjs` 是既有游戏入口，本身不检查当前文档或editable source。

本轮唯一完整隔离gate已通过，2823个冻结输入在原包与隔离副本保持不变。当前结果为959继承行为／标记、10源码检查、15历史身份检查和79专项入口，含本轮62用例与4个精确变异负例。旧版在专项中准确复现6项长按失败。历史完整结果仍为各自原版本证据，不能代替当前完整验收。原生浏览器默认激活、物理按键时序与读屏尚未验收。

编辑流程见DEVELOPING.md和DOCUMENT_CONTRACT_DEVELOPMENT.md。编辑后需经审查更新当前身份和根校验表，历史身份不得重钉。完整状态见[QA状态](QA_STATUS.md)。
