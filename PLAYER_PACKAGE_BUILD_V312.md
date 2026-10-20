# RED v0.312：五文件玩家包复现

从仓库根目录运行Python3.9+标准库：

```sh
python3 tools/player-release-v312/build-player-package.py --source . --output ../RED-v0.312-player.zip
python3 tools/player-release-v312/test-player-package.py --source .
python3 tools/player-release-v312/player-package/test-derive-guide.py --source CURRENT_PLAYER_GUIDE.md
```

输出须在源目录外且不存在。五文件白名单为index.html、README.md、CURRENT_PLAYER_GUIDE.md、QUICK_START.html、SHA256SUMS.txt，目录RED-v0.312-player/。固定输入、模板、逐段映射、派生指南哈希及ZIP时间、权限、顺序和ZIP_STORED保证复现。

当前ZIP594273字节，SHA-256为08762b390804204869d0d7d4e8f00cbf26b86d16e499464aa101dcd5af55f70d。208个源段落全部分类，仅标题、当前版本范围和既有Esc说明共3段改变，其他205段及15段存档风险说明逐字保留。速查仅更新两个版本标签。

静态证据位于tools/player-release-v312/evidence。这些检查不构成游戏、原生键盘、浏览器、读屏、真实存档、下载或FPS验收；旧版本工具和证据保持原范围。
