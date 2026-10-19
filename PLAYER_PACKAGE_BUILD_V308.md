# RED v0.308：五文件玩家包复现

从仓库根目录用Python3.9+标准库离线运行：

```sh
python3 tools/player-release-v308/build-player-package.py --source . --output ../RED-v0.308-player.zip
python3 tools/player-release-v308/test-player-package.py --source .
python3 tools/player-release-v308/player-package/test-derive-guide.py --source CURRENT_PLAYER_GUIDE.md
```

输出父目录须存在，输出在源目录外且不得已存在。五文件白名单为index.html、README.md、CURRENT_PLAYER_GUIDE.md、QUICK_START.html、SHA256SUMS.txt，ZIP内目录为RED-v0.308-player/。工具固定输入、模板、逐段映射与派生指南哈希；游戏和速查原样复制。固定ZIP时间、权限、顺序及ZIP_STORED确保复现，哈希仅校验一致性。

临时双路径及迁移工具构建已复现相同五文件ZIP：553960字节，SHA-256为3f1db3226f8cf904ae716bba82b91c6555a8c5dcdb42402910766c2e224debf1。最终交付ZIP在完整开发gate后于源目录外复现，不修改冻结输入。

205个源段落全部分类。除当前标题／版本范围标签外，v307原有204段逐字保留；15段存档风险说明保留。新增说明只涵盖缺少已完工工厂时的无厂、施工中、暂停施工提示；无ETA、自动下单或规则改变。速查仅更新版本标签，12个内容块对当前完整指南重新验证。

静态证据在tools/player-release-v308/evidence：build-results.json、guide-test-results.json、package-test-results.json、relocation-results.json、preservation-results.json。26项指南检查、27项包拒绝案例通过；双路径构建、五文件校验、迁移复现一致。故意重复ZIP项目测试的警告为预期结果。

这些工具只检查静态内容、相对链接、无脚本／网络依赖、路径及归档；不构成游戏、原生浏览器、读屏、存档、真实下载或FPS验收。旧版本工具和证据保持原范围。
