# RED v0.302：五文件玩家包复现

从仓库根目录用 Python 3.9+ 标准库离线运行，无需第三方包、网络或浏览器：

```sh
python3 tools/player-release-v302/build-player-package.py --source . --output ../RED-v0.302-player.zip
python3 tools/player-release-v302/test-player-package.py --source .
python3 tools/player-release-v302/player-package/test-derive-guide.py --source CURRENT_PLAYER_GUIDE.md
```

输出父目录必须存在，输出应在源目录外且不存在。所有旧四文件版本工具保持原字节。本轮明确采用五文件白名单：`index.html`、`README.md`、`CURRENT_PLAYER_GUIDE.md`、`QUICK_START.html`、`SHA256SUMS.txt`，目录为 `RED-v0.302-player/`。完整指南仍保留，README先链接速查；速查链接游戏时会离开该页，所有链接同包相对路径。

ZIP：545512 字节；SHA-256 `eb534917c9be08a5c5d842763026791eed64c3681539527dd9c8ae251feeb6e8`。

四源输入 index/README/guide/QUICK_START、模板、映射、转换器、派生指南均固定哈希。游戏与速查原样复制；README和完整指南按审核模板/逐段映射派生。SHA清单覆盖其余四文件，ZIP使用固定时间、权限、顺序和ZIP_STORED。哈希验证一致性，不构成身份认证。

199个源段落全部分类，原存档风险章15段和全部既有操作规则保留。v302新增矿块8/4/1绝对量粗档、非百分比、数字优先、遮挡及原生/FPS边界全部保留。速查核心531字符和五项警示沿用已审核稿，12个内容块在当前派生指南中逐项验证来源；内容映射嵌入构建证据，阅读无需Python。

## 静态证据

[构建及速查内容映射](tools/player-release-v302/evidence/build-results.json)、[指南检查](tools/player-release-v302/evidence/guide-test-results.json)、[包检查](tools/player-release-v302/evidence/package-test-results.json)、[迁移复现](tools/player-release-v302/evidence/relocation-results.json)。

26项指南检查和27项拒绝案例通过（原20项，加7项速查专用输入/脚本/资源/路径/事件/样式/跳转拒绝）；独立双路径构建、解包五文件校验和迁移工具临时构建均字节一致。故意重复ZIP项测试会显示预期警告。HTMLParser只用标准库，验证本地链接、无脚本/联网依赖、平衡标签、唯一ID及默认折叠提示。

只验静态文件、内容映射、路径与归档，不运行游戏、浏览器、存档或用户存储；无原生布局、读屏、实际下载、新手可用性或FPS验收声明。旧v301 ZIP未改变。玩家只需浏览器打开速查或游戏，不需要开发工具。
