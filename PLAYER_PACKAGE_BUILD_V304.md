# RED v0.304：五文件玩家包复现

从仓库根目录用 Python 3.9+ 标准库离线运行，无需第三方包、网络或浏览器：

```sh
python3 tools/player-release-v304/build-player-package.py --source . --output ../RED-v0.304-player.zip
python3 tools/player-release-v304/test-player-package.py --source .
python3 tools/player-release-v304/player-package/test-derive-guide.py --source CURRENT_PLAYER_GUIDE.md
```

输出父目录必须存在，输出应在源目录外且不存在。五文件白名单：`index.html`、`README.md`、`CURRENT_PLAYER_GUIDE.md`、`QUICK_START.html`、`SHA256SUMS.txt`，目录为 `RED-v0.304-player/`。完整指南仍保留，README先链接速查；速查链接游戏时会离开该页，所有链接同包相对路径。

ZIP：547416 字节；SHA-256 `6e658db3cdae186f2eed4e3425558b9adbc5167b173bd0f7e7dfa698350b67c6`。

四源输入、README模板、逐段映射、转换器与派生指南均固定哈希。游戏与速查原样复制；README和完整指南按审核模板／逐段映射派生。SHA清单覆盖其余四文件，ZIP使用固定时间、权限、顺序和ZIP_STORED。哈希验证一致性，不构成身份认证。

201个源段落全部分类；新增F／I／M键盘长按重复保护说明移至选择章节，保留首次／重新按下、期间新待点选／攻击移动操作不被重复事件清除、按钮及选择／命令规则不变和原生未验收边界。除当前标题与版本范围标签外，v303原有200个段落逐字保留，包括15段存档风险说明。所有既有指南功能与限制保留。速查仅更新两处版本标记，核心531字符与五项警示不变，12个内容块在当前派生指南中逐项验证来源。

## 静态证据

[构建及速查内容映射](tools/player-release-v304/evidence/build-results.json)、[指南检查](tools/player-release-v304/evidence/guide-test-results.json)、[包检查](tools/player-release-v304/evidence/package-test-results.json)、[迁移复现](tools/player-release-v304/evidence/relocation-results.json)、[文档保留检查](tools/player-release-v304/evidence/preservation-results.json)。

26项指南检查和27项拒绝案例通过，沿用v303测试并更新当前版本与段落总数；独立双路径构建、解包五文件校验和迁移工具临时构建均字节一致。故意重复ZIP项测试会显示预期警告。HTMLParser只用标准库，验证本地链接、无脚本／联网依赖、平衡标签、唯一ID及默认折叠提示。

这里只验静态文件、内容映射、路径与归档，不运行游戏、浏览器、存档或用户存储；无原生布局、读屏、实际下载、新手可用性或FPS验收声明。v303工具与历史文件不改写。玩家只需浏览器打开速查或游戏，不需要开发工具。
