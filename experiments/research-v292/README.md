# RED 工程研究快照

2026-10-18 · **研究基线 v0.292，主游戏版本见仓库根目录。** 本目录是研究附加资料；原型未并入默认游戏，不进入玩家包。尚未迁移引擎，也没有 FPS 提升结论。单 HTML 是当前交付形式，不是未来技术栈或分发形式的限制；可评估其他合理技术栈并继续美术迭代。

## 已得到的证据

- [模块化试验](architecture/README.md)：两个真实 ES module 函数、固定输入构建器、11 项单测。快照独立可重建与 v292 完全相同的 456,018 字节 HTML。保留一个必要模板，不保留 assembled-RED、生成输出或历史整包副本。
- [CPU 方法与结果](cpu/README.md)：三次合法 UI 场景采样，摘要已用原始本地数据重新计算并逐字节核对。18–29 个实体是约五秒快照观察范围；这是 VM/mock Canvas 冷进程数据，不能外推原生浏览器、大军规模或 FPS。
- [美术方向](art/README.md)：概念板与第二版真实绘制指令重放图，均保留 SVG、PNG 与原创代码。它们不是浏览器截图。第二版多边形指令增多，存在成本风险；不包含第三版或原型游戏 HTML。

## 技术路径比较

以下是基于官方资料与当前本地证据的工程判断，**不是引擎性能实测排名**。官方页面于 2026-10-18 核对。

- **先保持 Canvas 2D 并分离源码职责**：当前模块化试验已经证明最小抽取可保持离线输出字节不变。建议先分出模拟/渲染/输入边界，再用真实浏览器测量确认瓶颈；现有 VM 数据不足以要求重写寻路或渲染器。这是基于本项目证据的建议。
- **PixiJS**：官方将其定位为 2D 渲染引擎，支持 WebGL 与可选 WebGPU、场景图及资源加载。若后续真实数据表明绘制成为瓶颈，可先做保留现有模拟的独立 renderer 对照；不能因为换库便承诺更快。见 [PixiJS 官方介绍](https://pixijs.com/8.x/guides/getting-started/intro)。
- **Phaser**：面向 Web 的 2D 游戏框架，使用 JavaScript/TypeScript，提供 WebGL/Canvas 渲染；桌面/移动原生分发可依赖第三方工具。适合评估更完整的框架组织方式，但本项目需要验证输入、模拟与打包迁移成本。见 [Phaser 官方介绍](https://docs.phaser.io/phaser/getting-started/what-is-phaser)。
- **Godot 原生 Windows**：是有效的引擎迁移与桌面交付候选。官方 Windows 导出将项目数据打包为 PCK，配合优化后的运行程序，可选择 x86_64、x86_32 或 arm64。需要独立迁移原型验证模拟、输入、存档及 Windows 实机表现；不能从引擎名称推定性能改善。见 [Godot 官方 Windows 导出说明](https://docs.godotengine.org/en/stable/tutorials/export/exporting_for_windows.html)。
- **Godot Web**：是与原生 Windows 不同的导出路线。官方要求 WebAssembly、WebGL 2.0，导出多个由 Web 服务器提供的文件；多线程涉及跨源隔离，Godot 4 C# 项目当前不能导出 Web。这些是 Web 路线限制，不是排除原生 Windows 的理由；若选择 Web，应评估新的交付方式。见 [Godot 官方 Web 导出说明](https://docs.godotengine.org/en/stable/tutorials/export/exporting_for_web.html)。

不同技术栈都需要独立候选、同场景测量、玩法/输入/持久化回归与交付方式验证。此快照没有安装或运行上述新引擎。

## 身份与复现

v292 基线 SHA-256：

`e5edd8f7384d37a356071c66c6788e681f3e45ad9ab224a52a783692b5ca0884`

- `SOURCE_EVIDENCE.json`：原始输入/证据的实际字节数与哈希；明确哪些只留在本地，哪些快照文档加了适配说明。
- `SHA256SUMS.txt`：本快照文件校验（不自包含）；在本目录运行 `sha256sum -c SHA256SUMS.txt`。
- `INVENTORY.json`：逐文件字节数与 SHA-256；清单不包含它本身及 SHA256SUMS，以避免循环。

架构构建与单测可独立运行；概念 SVG 可独立生成。CPU 重新采样/分析、美术原型完整测试依赖未包含的本地输入与目录布局，各子目录说明具体缺项。不提供不可运行的整包验证承诺。

## 合入边界

本研究附加目录与仓库根目录的主游戏分开维护。研究基线为 v292，主游戏版本见仓库根目录；原型未并入默认游戏，不进入玩家包。研究模板和实验 patch 不能作为正式游戏入口；任何未来集成都需要针对最新主游戏重新验证。
