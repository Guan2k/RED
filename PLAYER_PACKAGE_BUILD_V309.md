# RED v0.309：五文件玩家包复现

从仓库根目录用Python3.9+标准库离线运行：

```sh
python3 tools/player-release-v309/build-player-package.py --source . --output ../RED-v0.309-player.zip
python3 tools/player-release-v309/test-player-package.py --source .
python3 tools/player-release-v309/player-package/test-derive-guide.py --source CURRENT_PLAYER_GUIDE.md
```

输出父目录须存在，输出在源目录外且不得已存在。五文件白名单为index.html、README.md、CURRENT_PLAYER_GUIDE.md、QUICK_START.html、SHA256SUMS.txt，ZIP内目录为RED-v0.309-player/。工具固定输入、模板、逐段映射与派生指南哈希；游戏和速查原样复制。固定ZIP时间、权限、顺序及ZIP_STORED确保复现，哈希仅校验一致性。

临时双路径及迁移工具构建已复现相同五文件ZIP：574600字节，SHA-256为b74e91e4bb446162dd2109c793438843b314b4e6d59ad13c4ad0991bb4fce00c。最终交付ZIP在完整开发gate后于源目录外复现，不修改冻结输入。

206个源段落全部分类。除当前标题／版本范围标签外，v308原有205段逐字保留；15段存档风险说明保留。新增说明涵盖五车型静态图文参考、现有预览切换及非实时图像限制；原文本与交互不变。速查仅更新版本标签，12个内容块对当前完整指南重新验证。

静态证据在tools/player-release-v309/evidence：build-results.json、guide-test-results.json、package-test-results.json、relocation-results.json、preservation-results.json。26项指南检查、28项包拒绝案例通过；双路径构建、五文件校验、迁移复现一致。故意重复ZIP项目测试的警告为预期结果。

SVG仅允许标准命名空间声明，其他URL模式仍拒绝，含外部命名空间负控。

这些工具只检查静态内容、相对链接、无脚本／网络依赖、路径及归档；不构成游戏、原生浏览器、读屏、存档、真实下载或FPS验收。旧版本工具和证据保持原范围。
