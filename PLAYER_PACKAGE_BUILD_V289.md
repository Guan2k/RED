# v289 纯玩家离线包构建工具

游戏仍为v0.289，index.html原字节不变。完整开发包、原玩家指南、历史验证脚本与结果继续保留；本工具生成另外一个仅含4个文件的玩家ZIP。

## 开发侧构建

需要Python 3.9或更新版本的标准库，不安装第三方依赖。在完整包目录运行，显式指定一个已经存在的包外输出目录；目标ZIP必须尚不存在：

```sh
python3 tools/build-player-package.py --source . --output ../RED-v0.289-player.zip
```

玩家只需解压后用桌面浏览器打开index.html，不需要Python或Node.js。ZIP内精确为 `RED-v0.289-player/` 下的index.html、README.md、CURRENT_PLAYER_GUIDE.md、SHA256SUMS.txt；不含工具、验证目录、历史版本或外部资产。

输入index、当前完整README及完整指南均须匹配固定SHA。模板、转换器和段落映射固定；错版、变更或缺段落会拒绝，维护者须先审查再更新配置。派生指南保留7章和实用操作，将末尾3项操作并入第3章，整理历史测试叙述；原完整指南不覆盖。

## 可复现与安全边界

使用ZIP_STORED、固定条目顺序、1980-01-01时间、Unix普通文件0644权限及空extra/comment。不写当前时间、绝对路径或随机名入ZIP。同一已核输入和模板在两个不同临时输入/输出路径生成完全相同字节。

构建只写显式包外输出。源或模板的符号链接、输出路径符号链接、已有输出均拒绝；先完成临时ZIP校验，再使用原子无覆盖链接发布。若目标被并发创建，保留它并失败；临时文件清理。依赖输出文件系统支持硬链接，不支持时失败，不回退为覆盖目标。此为普通本地构建流程，不宣称抵御恶意并发替换所有目录组件。

玩家SHA清单仅含其他3文件，不包含自己。ZIP读取验证精确白名单、无重复/绝对/父级路径/符号链接、固定元数据及每项字节；Markdown链接只指包内文件和现有标题。静态扫描确认当前固定游戏源为内联脚本/样式，没有所检外部资源标签、CSS URL或网络API模式。

## 验证入口与范围

```sh
python3 tools/test-player-package.py
python3 tools/player-package/test-derive-guide.py --source CURRENT_PLAYER_GUIDE.md
```

指南另有26项静态映射检查，结果见tools/player-package/guide-review.json。打包测试包含20项拒绝边界；先正常构建，再验证不同临时路径字节一致、实际解压4文件及SHA，并测试错源/缺段、符号链接、包外链接、保存提醒缺失、额外文件、路径穿越、重复项、错误清单、异常元数据、校验失败和发布竞争等拒绝边界。测试完整包运行前后文件哈希保持相同。结果见tools/player-package/build-results.json及test-results.json，段落去向见tools/player-package/guide-map.json。本次固定玩家ZIP为507119字节，SHA-256为acb876098607dd02ffa54f0222680cd8e9957a54a35e73be8400fd58b6c684a8；ZIP在完整包之外交付。

这里只运行打包和静态检查，没有运行游戏、浏览器、本地存档、载入、导入或导出。静态自包含不等于已经通过原生浏览器离线双击、读屏、输入法或窄屏体验验收；本轮没有重跑游戏全套测试，也没有创建远程release。

构建器开发时首轮静态扫描曾将createObjectURL误识为CSS url；已收紧为词边界，实际Blob下载URL能力不被误判为外部资产。独审另指出模板校验后重读及symlink/..路径检查的边界，均已修正并保留针对性拒绝测试。以上只涉及打包工具，没有更改游戏。
