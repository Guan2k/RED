# RED v0.315：五文件玩家包复现

从仓库根目录运行Python3.9+标准库：

```sh
python3 tools/player-release-v315/build-player-package.py --source . --output ../RED-v0.315-player.zip
python3 tools/player-release-v315/test-player-package.py --source .
python3 tools/player-release-v315/player-package/test-derive-guide.py --source CURRENT_PLAYER_GUIDE.md
```

输出须在源目录外且不存在。五文件白名单为index.html、README.md、CURRENT_PLAYER_GUIDE.md、QUICK_START.html、SHA256SUMS.txt，目录RED-v0.315-player/。固定源输入、模板、逐段映射、派生指南哈希及ZIP时间、权限、顺序和ZIP_STORED保证复现。玩家README由专用模板提供，不复制开发README；开发README本身仍作为固定输入校验。

本次恢复后重新构建的ZIP为619722字节，SHA-256为066e39e76c0ea5acfb329942e25dfd7092ec8279ea0849633386eb14672aec6d。包内index.html与恢复后的最终集成版本逐字相同，SHA-256为3956a8f7f751949b226fc4cdd91dfe8abd7b4eadd79f83ee02a0df794e08acb6。包内清单覆盖其余四个文件。所有下述检查均对本次恢复后的文件重新执行，不将恢复前的记录视为本次运行。

## 指南范围与逐段保留

211个源段落全部分类，派生输出214段。本版增加3段画面、操作界面与验证边界说明；原有208个源段落仅标题和当前版本范围2段改变，其余206段及15段存档风险说明逐字保留。历史源v0.297生命条段落保持原文；派生玩家指南将它明确为先前顶部位置修正，避免“颜色不变”的旧范围与本版低生命琥珀色提示冲突。

原有211个派生输出段落仅标题、当前范围与上述历史生命条说明3段改变，其他208段逐字保留，另加本版3段。旧源段落编号在标题后统一顺延3位，完整旧新编号对应表见preservation-results.json；映射理由中继承的陈旧段落编号同步纠正，当前范围段不再误指无关坐标段落，不改变输出内容。

QUICK_START.html的核心说明、五项警告、链接、样式和无脚本结构全部保持原字节，只更新元数据与页尾两个版本标签，并把继承的可见V0.311标签纠正为V0.315。新工具按完整版本token统一校验这三个当前版本标签，不依赖紧接中文时的词边界。

## 本次恢复后的静态检查

- 30项指南检查通过，包括明确将v0.315改成v0.316的非同值版本负控，以及新画面语义、预览默认关闭、命令不保证抵达与原生/FPS未验收边界。
- 29项打包负控通过，覆盖变更输入/模板、包外链接、外部资源、错误校验、额外文件、路径穿越、软链接、输出冲突与竞态等；新增可见速查版本标签v0.315改成v0.316负控。
- 打包测试在不可变完整临时副本执行，测试前后4506个源文件字节一致；其4项固定玩家输入与最终源一致。该文件数描述测试时副本，不是最终开发包文件数。
- 测试内两处临时源/输出路径的ZIP逐字相同；另在两处独立完整源/工具副本分别启动Python CLI，两个ZIP与本次交付ZIP再次逐字一致。复现不依赖工作目录、源路径或文件修改时间。
- 本次交付ZIP独立解压后执行sha256sum -c SHA256SUMS.txt，四项全部通过。
- 所有288个继承的版本化玩家工具/构建文档文件保持原字节，旧版工具、模板和证据未改写。

本次新证据位于tools/player-release-v315/evidence：guide-test.json、player-test.json、player-build.json、independent-reproduction.json、extracted-checksums.json、preservation-results.json与history-preservation.json。这里的独立复现指不同完整目录和Python进程，不冒称独立人员审查；本说明不借用恢复前的审查记录。

这些检查只覆盖静态指南转换、文档与打包，不构成游戏、原生键盘、浏览器、读屏、真实存档、下载或FPS验收。新增绘制可能增加开销，调用计数不等于帧率。当前开发完整验收状态见QA_STATUS.md；玩家包静态通过不代表开发总门禁已通过。本轮打包不包含远程发布。
