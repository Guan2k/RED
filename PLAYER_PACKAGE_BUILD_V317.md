# RED v0.317：五文件玩家包复现

从仓库根目录运行 Python 3.9+ 标准库：

```sh
python3 tools/player-release-v317/build-player-package.py --source . --output ../RED-v0.317-player.zip
python3 tools/player-release-v317/test-player-package.py --source .
python3 tools/player-release-v317/player-package/test-derive-guide.py --source CURRENT_PLAYER_GUIDE.md
```

输出须在源目录外且不存在。五文件白名单为 index.html、README.md、CURRENT_PLAYER_GUIDE.md、QUICK_START.html、SHA256SUMS.txt，目录 RED-v0.317-player/。固定源输入、模板、逐段映射、派生指南哈希及 ZIP 时间、权限、顺序和 ZIP_STORED 保证复现。玩家 README 使用专用模板，不复制开发 README；开发 README 仍作为固定输入校验。根开发 SHA256SUMS.txt 不作为玩家清单复制；包内清单单独计算并覆盖其余四个文件。

本次构建 ZIP 为 623527 字节，SHA-256 为 717548a2bf62bde9595b2ee19ab2082e548d4281093bc41f7573bdfe173c8cdd。包内 index.html 与冻结最终集成版本逐字相同，SHA-256 为 b256810fe285c02bedf0ec252e223c0e67d727912cb5721d07dbae24424c4c9d。

## 指南范围与逐段保留

214 个源段落全部分类，派生输出 217 段。本版新增两段：指挥区与五种生产卡顶部重排、现有路线先于单位及生命条绘制；以及源码、全源码 VM／模拟 DOM 与 Canvas 调用证据的边界。两段移入开局章节，保留按钮、快捷键、付款、路径几何、颜色及选择数量规则不变，不承诺帧率改善，原生浏览器和窄屏体验未验收、未发布远端等限制。玩家 README 增加相同说明，沿用生产卡原因与先前视觉说明保留。

原 212 个源段落仅标题与当前版本范围两段改变，其余 210 段逐字保留；原 215 个派生段落同样仅标题与当前版本范围两段改变，其余 213 段逐字保留。15 段原存档风险说明全部逐字保留。旧源段落编号在标题后统一顺延两位，映射解释中的段落引用同步更新。完整源／派生编号对应与前后哈希见 preservation-results.json，不将历史功能说明或历史验证结果冒称当前已验收事实。

QUICK_START.html 沿用冻结源文件，其三个当前版本标签为 v0.317／V0.317，打包验证按完整版本 token 检查，不依赖中文旁的词边界。

## 本次新执行的静态检查

- 33 项指南检查通过，包括 v0.317 改成 v0.318 的非同值版本负控；当前范围明确为 v0.317 而不是 v0.316；新指挥区顺序、路线层序、玩法不变与 VM／原生未验收语义保留。
- 29 项打包负控通过，覆盖输入与模板变更、包外链接、外部资源、错误校验、额外文件、路径穿越、软链接、输出冲突和竞态。可见速查版本负控将 V0.317 改成 V0.318。
- 打包测试在完整独立临时副本执行，断言测试前后全部源文件字节一致，避免其他集成工作并行写入干扰；四项固定输入与交付源匹配。protectedSourceFiles 是测试时副本文件数量，不是最终开发包文件数。
- 在两处独立完整源／工具目录、不同工作目录分别启动 Python CLI；两处副本文件时间也不同，两个 ZIP 均与交付 ZIP 逐字一致。测试内部另有双路径复现检查。这里的独立复现是目录与进程独立，不冒称独立人员审查。
- 交付 ZIP 独立解压后执行 sha256sum -c SHA256SUMS.txt，四项全部通过；解压目录恰有五文件，index 哈希与最终集成冻结值一致。
- 318 个继承的版本化玩家工具、模板、历史证据及构建文档文件保持原字节。所有本次证据均新执行，不复制旧报告充当当前结果。

证据位于 tools/player-release-v317/evidence：guide-test.json、player-test.json、player-build.json、independent-reproduction.json、extracted-checksums.json、preservation-results.json、history-preservation.json。

这些检查仅覆盖静态指南转换、文档与打包，不构成游戏、真实浏览器、原生键盘、触屏、读屏、真实存档、下载、像素或 FPS 验收。调用计数不等于帧率。开发完整验收状态见 QA_STATUS.md；玩家包静态通过不代表开发总门禁已通过。本轮未运行全门禁，不包含远程发布。
