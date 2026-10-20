# 稳定默认验证入口：v0.312

开发／发布运行 `node verify-development.cjs`。八阶段依次检查包完整性、当前文档契约、文档契约单测、权威src装配一致性、构建器测试、建筑数据、车辆数据和游戏聚合。`node verify-development.cjs --check-only` 只执行前七阶段，不运行游戏。

当前runner为verification/run-tests-v312.cjs，与current-verification.json及README一致。Esc长按重复事件不再撤销随后新开的待操作或重新部署菜单；首次Esc与松开后再次按下沿用原规则。仅增加现有重复按键保护条件，不改变其他快捷键、世界与经济规则。`node verify-current.cjs` 是既有游戏入口，本身不检查当前文档或editable source。

专项与集成验证已完成。首次完整gate在当前building-reference历史逆变换适配器检查停止：迁移漏接前序耗尽矿点逆变换，并非已证实的产品行为失败；该轮3885个原包／隔离副本输入均保持不变。保留旧断言与哈希，补齐精确逆变换、专项和独立复核后，完整隔离gate重跑于2026-10-20T06:02:50.603944+00:00至2026-10-20T06:20:35.927387+00:00通过，退出0且stderr为空；3929个原包／隔离副本输入逐SHA不变。通过101构建器、56建筑数据、180车辆数据、959继承行为／标记、10源码检查、15历史身份检查及93专项入口。历史结果不是当前完整验收；原生浏览器键盘时序、读屏、真实存储尚未验收。

编辑流程见DEVELOPING.md和DOCUMENT_CONTRACT_DEVELOPMENT.md。编辑后需经审查更新当前身份和根校验表，历史身份不得重钉。完整状态见[QA状态](QA_STATUS.md)。
