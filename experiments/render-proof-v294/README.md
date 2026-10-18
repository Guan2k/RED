# v294 全战场绘制指令回放归档

[并排对比 PNG](full-field-comparison.png) · [并排对比 SVG](full-field-comparison.svg)

本归档展示当前v294实际完整战场渲染函数在明确合成VM场景中的绘制指令回放，左侧为原外观，右侧为开启实验预览。两侧使用同一捕获世界和履带相位，包含双方五种车辆、建筑、血条、选择、命令、炮弹及特效。**不是原生浏览器截图，也不是自然游玩可达性证明。**

独立战场图：[原外观PNG](legacy-full-frame.png)／[SVG](legacy-full-frame.svg)，[预览外观PNG](preview-full-frame.png)／[SVG](preview-full-frame.svg)。每幅记录战场为1200×800；并排图2472×966，标题和说明是添加在战场外的归档说明。

## 来源与边界

- 游戏源SHA-256：`740f0f6155e2c316992ec7cbd9d9dbd92395810454e904baeddc376d7ff5bc3d`
- 使用已提交的[绘制验证器](../../verification/render-preview-v294.cjs)，其SHA-256：`659243337f4d3dfb2cd67e7695f852d26cf684190cc33aa674973d9a2bdc8d62`
- 种子29401，classic地图，时间0。车辆位置、角度、生命、选择、订单、建筑和特效均由明确fixture设置。
- 字体测量来自VM/mock环境，SVG字体与原生Canvas字体不等价。图中标签、字体排版不是原生浏览器布局验收；侧栏与显示预览控件不在图中。
- 原外观351项paint，预览400项paint；这不是耗时或FPS测量，也不能据此量化性能差异。预览可能增加绘制成本。
- [原始元数据](proof-metadata.json)、[合成世界快照](captured-world.json)、[文件来源清单](PROVENANCE.json)保留证据身份；世界快照不含用户存档。

这里只归档既有图像和证据，不重新运行游戏。原本生成SVG/PNG的工作区脚本没有一并发布，依赖原工作区布局，因此**不承诺本目录可独立重建这些图像**。当前提交中的绘制测试仍可用于核验渲染逻辑，但不等于本归档图片的独立生成器。未来原生截图、侧栏布局、可用性及FPS仍需另外验收。
