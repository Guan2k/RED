# RED v0.316：五文件玩家包复现

从仓库根目录运行Python3.9+标准库：

```sh
python3 tools/player-release-v316/build-player-package.py --source . --output ../RED-v0.316-player.zip
python3 tools/player-release-v316/test-player-package.py --source .
python3 tools/player-release-v316/player-package/test-derive-guide.py --source CURRENT_PLAYER_GUIDE.md
```

输出须在源目录外且不存在。五文件白名单为index.html、README.md、CURRENT_PLAYER_GUIDE.md、QUICK_START.html、SHA256SUMS.txt，目录RED-v0.316-player/。固定源输入、模板、逐段映射、派生指南哈希及ZIP时间、权限、顺序和ZIP_STORED保证复现。玩家README使用专用模板，不复制开发README；开发README仍作为固定输入校验。根开发SHA256SUMS.txt不作为玩家清单复制；包内清单单独计算并覆盖其余四个文件。

本次构建ZIP为621481字节，SHA-256为3f9bd65a40b7012cf6766c35e13f5d004842587a68a22b5eb1bb96fdd795059a。包内index.html与冻结的最终集成版本逐字相同，SHA-256为6e170c0b72206693e554f0798a02b413af12b0c2fb3c2f0f7160c5e00c24dd61。

## 指南范围与逐段保留

212个源段落全部分类，派生输出215段。本版新增1段五车型生产卡常显既有不可下单原因说明，移入建造、订单与出厂章节，保留禁用优先级、恢复可用清空、暂停和工厂施工边界、不改玩法、无新增实时播报与原生未验收限制。玩家README也增加相同说明。

原211个源段落仅标题与当前版本范围2段改变，其余209段逐字保留；原214个派生段落同样仅标题与当前版本范围2段改变，其余212段逐字保留。15段原存档风险说明全部逐字保留。旧源段落编号在标题后统一顺延1位，完整编号对应表见preservation-results.json；映射解释中的段落引用同步更新。v0.315画面与操作界面说明完整保留，不将历史性能或浏览器限制写成当前已验收事实。

QUICK_START.html只更新三个当前版本标签为v0.316／V0.316，原有操作、五项警告、样式、链接和无脚本结构保留。打包工具仍按完整版本token校验三个标签，不依赖中文旁的词边界。

## 本次新执行的静态检查

- 32项指南检查通过，包括v0.316改成v0.317的非同值版本负控、新生产卡提示与恢复、暂停、不改规则及原生未验收语义检查，并明确派生指南当前范围必须为v0.316而非v0.315。
- 29项打包负控通过，覆盖输入和模板变更、包外链接、外部资源、错误校验、额外文件、路径穿越、软链接、输出冲突和竞态；可见速查标签负控将V0.316改成V0.317。
- 打包测试在完整独立临时副本执行，断言测试前后全部源文件字节一致，避免其他集成工作并行写入干扰；四项固定玩家输入与交付源匹配。protectedSourceFiles字段是测试时副本数量，不是最终开发包文件数。
- 测试内两处临时源／输出路径的ZIP逐字相同；另在两处独立完整源／工具副本、不同工作目录分别启动Python CLI，修改副本文件时间后，两个ZIP与交付ZIP仍逐字一致。复现不依赖工作目录、源路径或文件修改时间。
- 交付ZIP独立解压后执行sha256sum -c SHA256SUMS.txt，四项全部通过，解压目录恰有五文件。
- 303个继承的版本化玩家工具、模板、历史证据及构建文档文件保持原字节；未复制旧证据为本次结果。

本次新证据位于tools/player-release-v316/evidence：guide-test.json、player-test.json、player-build.json、independent-reproduction.json、extracted-checksums.json、preservation-results.json、history-preservation.json。这里的独立复现是不同完整目录和Python进程，不冒称独立人员审查。

这些检查仅覆盖静态指南转换、文档与打包，不构成游戏、真实浏览器、原生键盘、触屏、读屏、真实存档、下载、像素或FPS验收。调用计数不等于帧率。当前开发完整验收状态见QA_STATUS.md；玩家包静态通过不代表开发总门禁已通过。本轮打包不包含远程发布。
