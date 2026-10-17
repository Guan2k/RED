# 稳定默认验证入口

游戏保持v0.289。本次新增稳定命令和包内前置完整性检查，不改原聚合、断言、游戏或玩家ZIP。

## 使用

在完整包目录运行 `node verify-current.cjs`。入口显示本包声明版本、源SHA、精确runner及核验文件数，校验通过后，把已核清单文件及清单原字节复制到私有临时目录，重新完整校验，再仅启动副本中的 `verification/run-tests-v289.cjs`，不附加legacy、long或其他参数。原runner的输出继续显示，退出状态原样传递；子进程信号会明确报告并非零退出，spawn错误或缺少退出状态也不会误报成功。

仅检查文件、不运行游戏验证：`node verify-current.cjs --check-only`。只支持无参数或一次--check-only，其他和重复参数拒绝。该路径只加载Node标准库fs/path/crypto，读取文本和哈希，不加载游戏或runner，不创建子进程或临时目录。可从包外工作目录用脚本路径调用，根目录始终取入口自身位置。

## 门禁

current-verification.json固定六个字段：schemaVersion、version、source、sourceSha256、runner、runnerSha256。未知、缺少、重复键、错误类型、非规范版本/SHA拒绝；源固定index.html，runner必须严格对应声明的十进制版本。

SHA256SUMS.txt必须是小写SHA、双空格、规范相对POSIX路径及LF换行。拒绝绝对/父级/点段/反斜杠/控制字符、重复或大小写冲突、符号链接和非常规文件。每个列入的文件都读取并核SHA；源、精确runner、入口、manifest及README必须列入。manifest和实际文件、清单三方一致后，还检查源中的唯一版本展示及README稳定默认标记块。清单不包含自身，manifest不引用清单哈希，避免循环依赖。

只检查清单内文件及必需项；不替未列入清单的附加文件背书，也不扫描或执行.git等工作区元数据。包内完整性不是发布者认证，离线不能证明远端最新；应从可信发布物获取，并核对外部公布的包哈希。攻击者同时改入口、manifest和清单不在自校验可防范围。

复制使用同一次核验得到的字节快照，创建独立普通文件，不使用硬链接；只复制清单白名单及清单自身。副本完整重验及启动前源/runner复核后，以副本为cwd执行。原runner会重写带临时路径的结果文件，这些写入仅发生在副本，子runner退出、错误或信号返回后，以及复制/校验异常时，在finally清理自有临时目录，不把新结果写回历史证据。wrapper自身被SIGKILL或宿主中断时不能保证finally完成，可能留下临时目录。文件系统不是事务，不声称抵御全部并发更改；原runner精确源门禁仍保留。

## 历史与玩家构建衔接

原README归档至tools/stable-verification/README-before-stable-entry.md。旧README迁移结果仍描述原整理版本；旧验证脚本未改，当前README保留一次明确底层实际命令，历史结果未冒充本轮检查。

玩家builder的工具、模板、派生指南不改，仅更新tools/player-package/manifest.json中完整README输入SHA，原配置另存manifest-before-stable-entry.json。仍严格校验README，不放宽错版门禁。新完整包实际重建玩家ZIP应保持既有507119字节与acb876098607dd02ffa54f0222680cd8e9957a54a35e73be8400fd58b6c684a8，证据单列。

独立入口测试使用明确标注的临时stub包及受控子进程，验证静态拒绝、无执行检查路径、退出7/信号/spawn失败；这些不是游戏行为覆盖。初版原包执行设计经一次真实聚合发现会改写历史结果，原批准撤回并保留证据。修正为入口自身隔离执行后，按明确授权再运行一次必要纠正聚合，不附加legacy/long；两次结果及最终原包不变证据见tools/stable-verification。没有运行浏览器或存档操作。

## 独立门禁复查

在完整包目录运行 `node tools/stable-verification/test-entry.cjs`。默认报告打印至stdout，若用--output必须指定包外文件，不改包内证据。该工具绝不启动真正游戏默认runner：仅真包check-only、临时synthetic包、受控真实stub子进程。

初版153项通过，包括2项真包check-only（仅fs/path/crypto与零spawn证明、包外cwd实际调用）及151项边界/身份检查。原始报告为tools/stable-verification/entry-results-original-cwd.json；其470清单条目数对应专项执行当时，后续新增本报告及默认聚合证据使最终清单条目数增加，清单数量并非测试覆盖数。原README迁移检查及玩家ZIP同hash重建结果见compatibility-results.json。

修正版最终167项通过，报告entry-results.json；165项边界/身份检查与2项真包check-only分列。新增实际写入stub证明原包不变、运行后check-only仍过，并核白名单复制、独立文件身份及复制/复验/子runner错误和信号的清理。初版入口和测试脚本归档在original-cwd-attempt子目录，仅供解释已撤回设计，不作为执行入口。

唯一必要纠正真实运行直接从候选原包调用稳定入口成功：473个当时包内文件（含清单）运行前后SHA全部相同，临时副本源与runner字节一致且文件身份不同，运行后临时目录已删除，原包第二次check-only成功。结果见default-isolated-results.json。原聚合46条专项结果（42个直接程序加稳定族4条结果）、959项继承行为/markup与10项源码检查通过，15项历史身份分列；没有启用legacy或long。初版一次运行游戏验证也成功，但改写results-v289.json造成随后check-only失败，事实与旧结果保留在default-original-cwd-results.json，不算最终入口验收通过。
