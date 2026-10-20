# 稳定默认验证入口：v0.314

开发／发布运行 `node verify-development.cjs`。八阶段依次检查包完整性、当前文档契约、文档契约单测、权威src装配一致性、构建器测试、建筑数据、车辆数据和游戏聚合。`node verify-development.cjs --check-only` 只执行前七阶段，不运行游戏。

当前runner为verification/run-tests-v314.cjs，与current-verification.json及README一致。聚焦“攻击移动 [A]”或侧栏建造按钮时，长按Enter产生的非输入法系统重复按键会被阻止默认激活，避免重复切换待攻击或待建造操作。首次Enter、松开后重新按下、空格与点击沿用原规则；输入法组字和keyCode 229事件不受这项新增拦截影响。此项只按事件的repeat标记处理，不是时间间隔限制，不改变单位命令、建造价格、资金或其他玩法规则。原生浏览器默认激活、键盘时序、焦点与输入法效果尚未验收。 `node verify-current.cjs` 是既有游戏入口，本身不检查当前文档或editable source。

身份集成复核及完整隔离gate已完成：2026-10-20T08:17:07.529070+00:00至2026-10-20T08:42:05.907152+00:00通过，退出0且stderr为空；4359个原包／隔离副本输入逐SHA不变。通过101构建器、56建筑数据、180车辆数据、959继承行为／标记、10源码检查、15历史身份检查及99专项入口。历史结果不是当前完整验收；原生浏览器键盘时序、读屏、真实存储尚未验收。编辑流程见DEVELOPING.md和DOCUMENT_CONTRACT_DEVELOPMENT.md。编辑后需经审查更新当前身份和根校验表，历史身份不得重钉。完整状态见[QA状态](QA_STATUS.md)。
