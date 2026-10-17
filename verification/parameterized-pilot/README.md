# v287 两族稳定参数化测试试点

本目录是 v287 完整包内的测试维护补充，游戏仍为 v287；未替换现有默认聚合、未修改冻结游戏包或任何历史测试。仅迁移订单展示和选区筛选两个族。本轮没有新增玩法或产品性能修改。

## 执行

从任意目录运行：

```sh
node /path/to/RED/verification/parameterized-pilot/verify-bootstrap-migration.cjs
node /path/to/RED/verification/parameterized-pilot/run-current-suites.cjs
node /path/to/RED/verification/parameterized-pilot/runner-probes.cjs
```

当前产品使用包内 `../../index.html`，旧入口及历史证据使用包内 `../` 路径；固定参考文件均随本目录提供。整个 RED 文件夹可移位运行，不依赖外部历史版本目录。所有运行使用 Node 合成 DOM/VM，不调用浏览器、本机、存档或网络。

## 保留与变化

- 两个稳定 suite 保留原场景及每条断言：订单展示 8 场景 / 229 断言；选区筛选 7 / 110。
- `verify-bootstrap-migration.cjs` 对启动代码、场景记录调用及结果输出三类允许差异反向替换，要求与原脚本逐字节相同；18 个变异的 anchor、replacement 和特定错误消息也与原脚本精确核对。场景映射和哈希见 `bootstrap-migration.json`。
- `run-current-suites.cjs` 实跑新、旧两套入口，对完整语义结果深度相等比较。新附加的装载证据不混入原断言计数。两族旧结果中的 synthetic 场景仍明确标记。
- 当前候选固定为 `01339791a4c2d2773d5f4b7cd8eb215552b00eab147feb9f43fc5fc657ab685f`。订单对照固定 v283，筛选对照固定 v285；另外保存 v286 用于当前 v286→v287 精确声明式差异围栏。参考文件来自对应冻结包，逐字节 SHA 校验；不从当前候选或变异源码反向恢复参考。
- 当前清单同时核 suite、context、VM harness、runner、原历史脚本及变异描述文件。未来如当前候选变化，可更新清单的候选/上一版围栏；稳定 suite 的行为内容无需仅为版本 hash 再复制。但若真实功能与固定参考出现语义差异，仍需明确审查测试修改，不能自动忽略展示差异。

## VM 信任边界

`vm-environment-provenance.cjs` 是原 harness 的独立副本。它读取实际 HTML Buffer，先用 context 的精确路径映射及预期 SHA 授权，再从同份内容提取唯一 inline script。只有 `new vm.Script` 编译成功才记录实际 HTML SHA 与 script SHA；随后执行的正是该 Script。调用方不能传入或覆盖 role。

每个场景严格要求 candidate 先加载、固定 reference 后加载。当前/参考路径、角色、hash 不可交换；runner 另从清单源码独立重算 HTML/script SHA，检查每个场景恰有一条实际编译 candidate 和 reference 记录。装载记录包含 suite、场景、seed、role、源码及脚本 SHA。

`compiled: true` 只表示已成功编译，不表示场景成功；执行时超时或异常仍失败。正向必须完成全部场景与原断言数。

## 负控判定

先运行并确认未经修改的当前源完整通过，才运行原 10+8 个变异。每个变异从当前源按精确 anchor 次数生成，登记原 SHA、变异 SHA 和描述 hash，走同一稳定 suite 与固定参考。runner 独立重算变异后 HTML/script SHA。

只有目标场景中真实编译了该变异且命中原特定 AssertionError 才计 `DETECTED_BEHAVIOR`。错误场景、无候选装载、错误断言、身份/hash/恢复错误、语法错误、超时、信号、模块/文件缺失都不是成功检出。`runner-probes.cjs` 实跑的反例类别为：错误当前 hash、旧源冒充候选、角色互换、仅参考源、空编译迹线、缺少必需族、语法变异、hash 门禁伪装检出、错误断言、参考文件损坏及装载/描述记录篡改。超时、信号、模块/文件缺失在本轮仅有拒绝规则，没有声称逐项实跑。门禁反例不计入游戏行为断言或 18 个行为变异数。

## 结果与边界

- `results.json`：两个族完整正向结果、旧新完全一致比较、18 个负控和实际编译证据。
- `bootstrap-migration-verification.json`：只做代码/描述精确保留审计，不冒充游戏测试。
- `runner-probes-results.json`：门禁反例的精确拒绝证据。
- 原 v287 包的 359 条 SHA 在试点后全部通过。旧默认聚合仍保持原入口；本轮不重跑无关长局或 legacy，不把历史身份核对混计成当前行为。

本试点目标是减少后续仅因 hash/恢复链改变而复制测试入口，未声称减少现有历史文件数量、运行时长或真实浏览器开销。

完整包便携复核：已将整包复制至独立临时目录实际运行上述三入口，结果为 8/229、7/110、18 行为变异、38/38 门禁反例，均通过；见 portable-validation.json。门禁自身先跑两族正向及2条行为校准，这些不另算游戏覆盖。
