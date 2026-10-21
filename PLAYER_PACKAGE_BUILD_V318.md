# RED v0.318：五文件玩家包复现

从仓库根目录运行 Python 3.9+ 标准库：

```sh
python3 tools/player-release-v318/build-player-package.py --source . --output ../RED-v0.318-player.zip
python3 tools/player-release-v318/test-player-package.py --source .
python3 tools/player-release-v318/player-package/test-derive-guide.py --source CURRENT_PLAYER_GUIDE.md
```

输出必须在源目录外且不存在。白名单恰为 index.html、README.md、CURRENT_PLAYER_GUIDE.md、QUICK_START.html、SHA256SUMS.txt，目录 RED-v0.318-player/。固定四项源输入、专用玩家README模板、逐段指南映射及派生哈希，并固定ZIP时间、权限、顺序和ZIP_STORED，以保证复现。开发README作为固定输入校验，不直接复制到玩家包。包内清单独立覆盖其余四个文件，不复制开发根清单。

本次ZIP为629031字节，SHA-256为6bf583e4247cba1bbfda1b425fccc662f23366212d35ff1b5129610b0412b5dc。包内index.html与冻结集成源逐字一致，SHA-256为7eda2c8962fe223b1397f90afdaf8beb47049342c1aa3979ee5ccbef8cee5234。

## 指南映射与保留

220个源段落全部分类，派生223段。新增6个源段落，包括双闸突进静态操作提示、VM证据限制和补给／跟随／驻守操作小节。顶端本版说明移入开局章节并去除版本前缀；新增小节标题仅在派生版改为加粗标签，避免其他重排开局说明误归双闸小节。源指南不改，其他新增操作正文逐字保留。

原214个源段落只改变当前标题和当前版本范围两段，其余212段逐字保留。原217个派生段落同样只改变两个当前身份段落，其余215段逐字保留。全部15段原存档风险说明保持原文；编号、行号、引用和目标章节重新计算并逐一锁定。精确对照见preservation-results.json与guide-map.json。不将旧版脚本结果或历史说明冒称真人胜率、必胜攻略或原生验收。

玩家README新增本版静态操作说明与证据边界，保留全部历史操作和安全警示。QUICK_START.html沿用冻结源文件，三个当前版本标签均为v0.318／V0.318；链接仍只有游戏与完整指南。

## 本次实际执行

- 37项指南检查通过：保留原33项及所有负控，新增静态范围、循环资金限制、维修跟随、增援选择和脚本边界检查；版本负控明确将v0.318改为v0.319。
- 29项打包负控通过：包括输入／模板变更、外部链接／资源、校验错误、额外文件、路径穿越、软链接、输出冲突与竞态。重复ZIP条目负控触发Python预期Duplicate name警告，已保留stderr，不把它隐瞒为空。
- 打包测试校验测试前后完整源副本字节不变。protectedSourceFiles是测试时副本数量，不是最终开发包文件数。
- 两处独立完整源／工具目录、不同工作目录和不同文件时间的CLI构建均与交付ZIP逐字一致；此处独立仅指目录与进程，不声称独立人员审查。
- 独立解压后sha256sum -c验证四项全部通过，目录恰有五文件，游戏与指南分别匹配冻结源和审定派生。
- 343个继承的版本化玩家工具、模板、历史证据及构建说明文件保持原字节。新证据均为本轮重新执行。

证据位于tools/player-release-v318/evidence：guide-test.json、player-test.json、player-build.json、independent-reproduction.json、extracted-checksums.json、preservation-results.json、history-preservation.json，以及原始stderr。

这些检查仅覆盖静态文档转换和打包，不构成游戏、真实浏览器、键盘时序、触屏、读屏、真实存档、下载、像素或FPS验收。完整开发验收以QA_STATUS.md为准；玩家静态检查通过不代表开发总门禁通过。本打包任务未执行全游戏门禁，未发布远端。
