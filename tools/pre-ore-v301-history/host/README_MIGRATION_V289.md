# v289 README 文档整理

本补充包保持游戏v0.289。README改为当前启动、四项基础操作、可选练习、手动保存风险及文档导航；唯一默认测试入口为 `node verification/run-tests-v289.cjs`。

原README的41节历史正文已完整存在原RELEASE_NOTES。另12节包含独有段落，已将这12节整节原文连同尾部“测试与明确限制”整节追加至RELEASE_NOTES的“归档：v289 README 独有历史补充”。原RELEASE_NOTES完整前缀保留，原版本、失败、修复及范围说明没有改写；旧主入口属于历史语境。

产品index.html、CURRENT_PLAYER_GUIDE.md、全部原验证脚本与结果及其他原文件逐字节保留。只修改README.md、RELEASE_NOTES.md和SHA256SUMS.txt，新增本文及机械迁移证明、检查入口、结果。不运行游戏全套测试，不新增原生浏览器或读屏验收声明。

机械检查入口（在本目录运行）：

```sh
node verify-readme-migration.cjs
```

检查固定的原RELEASE_NOTES前缀哈希、13节原文哈希及独有段落、所有受保护原文件哈希、README相对文件与标题锚点，以及当前默认命令唯一性。证明文件为[README_MIGRATION_V289.json](README_MIGRATION_V289.json)，结果为[README_MIGRATION_V289_RESULTS.json](README_MIGRATION_V289_RESULTS.json)。这些是内容迁移与链接检查，不是游戏行为测试。
