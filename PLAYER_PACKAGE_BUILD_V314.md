# RED v0.314：五文件玩家包复现

从仓库根目录运行Python3.9+标准库：

```sh
python3 tools/player-release-v314/build-player-package.py --source . --output ../RED-v0.314-player.zip
python3 tools/player-release-v314/test-player-package.py --source .
python3 tools/player-release-v314/player-package/test-derive-guide.py --source CURRENT_PLAYER_GUIDE.md
```

输出须在源目录外且不存在。五文件白名单为index.html、README.md、CURRENT_PLAYER_GUIDE.md、QUICK_START.html、SHA256SUMS.txt，目录RED-v0.314-player/。固定输入、模板、逐段映射、派生指南哈希及ZIP时间、权限、顺序和ZIP_STORED保证复现。

当前ZIP597953字节，SHA-256为c6c06b4cd83acbd665dc8978b84e81e24b37842f997b23eccde063ec70033763。208个源段落全部分类，仅标题、当前版本范围和既有键盘操作说明共3段改变，其他205段及15段存档风险说明逐字保留。211个派生输出段落同样只改对应3段，其余208段逐字保留；速查仅更新两个版本标签。

26项指南检查、28项打包负控及两处独立临时路径的ZIP字节复现已通过。打包测试针对不可变临时完整副本执行，避免与开发适配器集成并发；其四项玩家输入与最终玩家ZIP一致。版本负控明确把v0.314改为v0.315，不是同值替换。静态证据位于tools/player-release-v314/evidence。

本次同时修正新模板中继承的两处陈旧文字：派生指南当前范围由v0.307改为v0.314，玩家README将校验清单覆盖数从三个改为四个非清单文件。旧版工具、模板和证据全部保持原字节。

这些检查只覆盖静态指南转换与打包，不构成游戏、原生键盘、浏览器、读屏、真实存档、下载或FPS验收；当前开发完整验收状态见QA_STATUS.md。当前开发验证与打包不包含远程发布。
