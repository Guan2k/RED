# RED v0.313：五文件玩家包复现

从仓库根目录运行Python3.9+标准库：

```sh
python3 tools/player-release-v313/build-player-package.py --source . --output ../RED-v0.313-player.zip
python3 tools/player-release-v313/test-player-package.py --source .
python3 tools/player-release-v313/player-package/test-derive-guide.py --source CURRENT_PLAYER_GUIDE.md
```

输出须在源目录外且不存在。五文件白名单为index.html、README.md、CURRENT_PLAYER_GUIDE.md、QUICK_START.html、SHA256SUMS.txt，目录RED-v0.313-player/。固定输入、模板、逐段映射、派生指南哈希及ZIP时间、权限、顺序和ZIP_STORED保证复现。

当前ZIP596780字节，SHA-256为fac60f3cbc25cee093f4239984829f8b8d4a9bc6a6879f29da5da0bb0b87bd43。208个源段落全部分类，仅标题、当前版本范围和既有精炼厂选择说明共3段改变，其他205段及15段存档风险说明逐字保留。速查仅更新两个版本标签。

静态证据位于tools/player-release-v313/evidence。迁移时版本负控发生同值替换，已保留失败说明并修复为313到314的错误版本探测；旧版本测试原字节未改。这些检查不构成游戏、原生键盘、浏览器、读屏、真实存档、下载或FPS验收；旧版本工具和证据保持原范围。
