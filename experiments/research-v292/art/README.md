# 美术概念与第二版绘制原型

**研究基线 v292，主游戏版本见仓库根目录。原型未并入默认游戏，不进入玩家包。图像不是游戏截图；没有原生浏览器视觉或 FPS 验收。**

## 阅读顺序

1. `concept/red-vehicle-art-concept.png`：独立概念设计板；SVG 可编辑，`build-board.py` 是确定性生成源码。`DESIGN_NOTES.md` 是原设计说明，其中相对路径/行号指向原工作区 v292，不是本快照的目录布局。
2. `prototype-v2/draw-command-proof.png`：截获第二版实际 `drawUnit` Canvas 调用并重放到 SVG 后的栅格图；不是另画一套车体，也不是浏览器截图。SVG 与生成器 `build-proof.cjs` 同时保留。
3. `prototype-v2/draw-unit-art.js` 与 `draw-only.patch`：原始绘制源码与精确差异。只变五类车体与队徽；游戏规则、碰撞、存档、地形、UI、特效、选框、血条未纳入该变更。
4. `prototype-v2/art-test-results.json` 与 `verify-art.cjs`：历史 VM 验证结果/方法源码。360 种单体绘制组合、八地图各 90 秒的有界差分，不是完整游戏回归或浏览器可读性证明。

第二版游戏副本不包含在快照内，不应将 patch 自动应用到当前版本。它的历史 SHA-256 是 `ad8001a0ccb31152f5ac9e8220adc34f7fa64fb31a916a62e6a2235c2b436d04`；基线为根清单记录的 v292。未收入未审阅的第三版，也未提供默认可玩的原型 HTML。

## 风险与下一步

6×4 后角细条/三角队徽保留炮塔、货斗、维修扳手；0.5× 时约两像素高，不能宣称不依赖颜色也能识别敌我。绘制指令数相对原版增加，例如坦克 20→53、维修车 19→56；这些是方法调用数，不是 GPU draw 或耗时。不得宣称性能中性或帧率提高。

任何合入都应针对届时最新游戏源码重新做差异/行为检查，并进行真实浏览器混合部队、旋转、低血、选中、战斗、窄视口以及整帧/绘制耗时验证。

## 复现边界

概念 SVG 可单独重建（Python 标准库）：在 `concept/` 执行 `python build-board.py`。它重写该目录 SVG。PNG 导出需要系统已安装 Inkscape 及中文字体；版本、字体和渲染器影响像素，非所有环境都保证相同 PNG 哈希。原导出命令为：

```sh
inkscape red-vehicle-art-concept.svg --export-type=png --export-filename=red-vehicle-art-concept.png
```

`prototype-v2/verify-art.cjs` 和 `build-proof.cjs` 原样存档，依赖同级未包含的 `index.html` 及原位置 `../../v292-package-tools/RED/{index.html,verification/vm-environment.cjs}`。在本快照布局下不能直接运行；没有假称这些测试由快照独立复现。本次只复核历史结果与原件哈希。要重跑，需在隔离副本还原原工作区布局与已校验输入；不要操作当前游戏候选。SVG 生成器只是 Canvas 子集记录器，不模拟浏览器的光栅、布局、裁剪、DPR 或时序。
