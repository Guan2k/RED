# RED v0.294：独立精简玩家包复现

当前版本化构建工具位于 `tools/player-release-v294/`。保留旧版本工具和历史证据，不需要旧工作区或重复的游戏输入文件；只读取仓库根目录固定哈希的 `index.html`、`README.md`、`CURRENT_PLAYER_GUIDE.md`。

## 复现命令

Python 3.9+，仅标准库；从 RED 仓库根目录运行：

```sh
python3 tools/player-release-v294/build-player-package.py --source . --output ../RED-v0.294-player.zip
python3 tools/player-release-v294/test-player-package.py --source .
python3 tools/player-release-v294/player-package/test-derive-guide.py --source CURRENT_PLAYER_GUIDE.md
```

输出父目录必须存在，输出必须位于源目录外且尚不存在。要独立对比请用另一个输出文件名。输入、配置模板、转换器、映射和派生指南均固定SHA-256；新增、缺失或未知改动会拒绝，不能通过随意改哈希替代审查。无需网络、第三方Python包或浏览器。

## 玩家归档身份

- `RED-v0.294-player.zip`：517178字节
- ZIP SHA-256：`a0132424e994f2f64580f60bfcda7d02bcb557ef86e8b4982483776285cbd41e`
- 游戏 SHA-256：`740f0f6155e2c316992ec7cbd9d9dbd92395810454e904baeddc376d7ff5bc3d`
- 玩家指南 SHA-256：`9e0935aceb709294d1feac3c069a27207f4ee6a95a5fdd0194b1b8026e39d5ab`
- 顶层目录 `RED-v0.294-player/` 恰好四个文件：`index.html`、`README.md`、`CURRENT_PLAYER_GUIDE.md`、`SHA256SUMS.txt`

游戏字节等同当前源文件。玩家README和指南由审查后的模板及映射产生，不是仓库文档原样复制。ZIP_STORED、固定时间戳、顺序、权限和空附加元数据使不同源／输出路径产生相同ZIP字节。包内SHA清单覆盖其余三个文件；上述ZIP哈希覆盖整个归档。

## 静态证据

[构建结果](tools/player-release-v294/evidence/build-results.json)、[迁移复现结果](tools/player-release-v294/evidence/relocation-results.json)、[包检查结果](tools/player-release-v294/evidence/package-test-results.json)、[指南检查结果](tools/player-release-v294/evidence/guide-test-results.json)。

20项包拒绝案例、26项指南检查通过；两个独立路径构建结果相同，迁移后的版本化入口也在临时目录构建并与该归档逐字节比较一致。包括输入／模板哈希、路径与符号链接、重复ZIP项、外部资源／链接、坏锚点／校验清单、保存提醒、已有输出、源内输出、验证失败和并发输出保护。重复ZIP项警告来自故意构造的拒绝样例。

191个源指南段落全部分类；七章和原存档风险章15个段落保持。第七任务“双闸突进”的配置、只预填不自动开始、（600,500）目标、严格小于65范围、独占8秒占领、90有效驻守游戏秒、争夺暂停及无人／失去归属归零、车辆资格、指挥中心优先级和路线风险完整保留。任务简报逐字保留，参考路线胜利余量很小，不保证安全或必胜。所有既有编队、输入、坐标、命令回执与保存限制继续保留。

当前显示预览操作完整保留：音效／速度旁折叠入口、默认关闭、5种车辆轮廓、手动开启及取消、仅页面会话保留、新局沿用、重新打开页面关闭、不改单位属性／选择／命令／存档规则、绘制开销可能更高、原生效果及帧率尚未验收。矿石标签只在单次计算内复用障碍框数组，不跨帧缓存、不改变标签位置，不承诺FPS改善。

## 范围

这里只验证静态文件、映射、路径和ZIP可复现性，不运行游戏或游戏验证器，不增加游戏行为覆盖；未使用浏览器、物理键盘、读屏或窄屏验收，未执行存档、载入、导入、导出或接触用户存储。哈希只能比对一致性，不构成来源认证或远端最新证明。
