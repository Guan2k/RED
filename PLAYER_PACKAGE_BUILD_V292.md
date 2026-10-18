# RED v0.292：独立精简玩家包复现

本页记录当前 v0.292 玩家 ZIP 的静态构建与校验。游戏版本不变；原 v0.289 构建器、配置及历史证据保持原字节。当前工具在独立目录 `tools/player-release-v292/`，只读取仓库根目录三个固定输入，不存放重复的游戏输入副本。

## 从当前仓库构建

需要 Python 3.9+，只用标准库。下列命令在 RED 仓库根目录执行：

```sh
python3 tools/player-release-v292/build-player-package.py --source . --output ../RED-v0.292-player.zip
python3 tools/player-release-v292/test-player-package.py --source .
python3 tools/player-release-v292/player-package/test-derive-guide.py --source CURRENT_PLAYER_GUIDE.md
```

输出父目录必须已存在，输出必须位于源目录之外。已有同名输出会被拒绝；要重做对比，请使用另一个尚不存在的输出文件名。不要通过改写配置去接受未知版本：源文件、映射、转换器、模板和派生指南均固定 SHA-256，任何新增、缺失或改动须重新审查。

运行时不需要旧工作区、原 v0.289 源文件、联网、第三方 Python 包或浏览器。上述三个命令只执行静态打包及工具测试，不运行游戏、游戏验证器、浏览器或存档／导入导出操作。

## 已交付 ZIP 身份

- 文件名：`RED-v0.292-player.zip`
- 大小：508709 字节
- SHA-256：`c4561d583638cafcabeec8679a6c864737f3187de136f621a593d56c0fbf9c33`
- 顶层目录：`RED-v0.292-player/`
- 恰好四个文件：`index.html`、`README.md`、`CURRENT_PLAYER_GUIDE.md`、`SHA256SUMS.txt`
- 游戏文件 SHA-256：`e5edd8f7384d37a356071c66c6788e681f3e45ad9ab224a52a783692b5ca0884`，与当前仓库 `index.html` 完全相同
- 玩家指南 SHA-256：`96683b724a1ecdb77ba7aacaa2ea1e7c29e59b2bdae747926ef8028cfdef76ae`

使用 ZIP_STORED、固定排序、1980-01-01 时间戳、普通文件 0644 权限与空附加元数据。包内清单只记录其余三个文件，不自包含；归档外的 ZIP SHA-256 用于比对完整归档。玩家 README 与指南由当前配置产生，不是仓库根目录文档的原样副本。

## 当前静态证据

[真实构建结果](tools/player-release-v292/evidence/build-results.json)从这个版本化目录调用构建器，在临时目录生成 ZIP，并逐字节对比已交付 ZIP，完全一致。

[包检查结果](tools/player-release-v292/evidence/package-test-results.json)：两组不同源／输出路径产生相同 ZIP 字节；解压恰好四文件；20 项拒绝案例通过，覆盖输入和模板哈希、缺失指南、符号链接路径、路径穿越、绝对路径、重复 ZIP 项、ZIP 符号链接权限、外部链接／资源、缺失保存提醒、坏锚点、坏清单、额外文件、已有输出、源目录内输出、验证失败及并发目标保护。测试中的重复 ZIP 项警告来自故意构造的拒绝样例。

[指南检查结果](tools/player-release-v292/evidence/guide-test-results.json)：26 项通过；188 个原始段落全部分类；七个操作章节保持；原存档风险章 15 个段落逐字保留；编队空选保护、普通命令未接收原因、数字键重复保护归入当前操作说明。原有坐标、选择、取消输入与迟到点击限制继续保留。

## 范围与限制

这些结果只证明当前固定输入的静态文件、指南映射、路径与 ZIP 结构及可复现性，不计入游戏行为覆盖，不新增原生浏览器、物理键盘、读屏、窄屏、离线存储或真实游玩验收结论。没有保存、载入、导入、导出或接触用户存档。校验哈希只提供一致性比对，不构成来源认证或远端最新版本证明。

旧入口 `tools/build-player-package.py` 继续绑定 v0.289；要复现本页的当前玩家包，请使用上面的版本化命令。历史记录见 [v0.289 构建说明](PLAYER_PACKAGE_BUILD_V289.md)。
