# RED 五建筑识别设计板（v310 study，仅评审）

## 产物
- `building-reference-board.svg` / `.png`：1100×1690 主评审板；十图各展示建议 UI 96×120 与 2×检查 192×240。
- `building-reference-board-2x.svg` / `.png`：整板 2200×3380 高分辨率版本。
- `compact-comparison.svg` / `.png`：880×390，十图的 96×96 紧凑候选。
- `snippets/`：五种建筑 × 默认/预览的十个装饰 SVG。名称从实际 defs 读取，总部标为「指挥中心（不可新建）」。
- `snippets.json`、`canvas-commands.json`、`manifest.json`：片段、完整 Canvas 调用/绘制状态、来源与每图参数/边界。
- `verification.json`、`readonly-evidence.json`：边界、重捕获、栅格裁切与只读证据。

## 来源与方法
冻结源 `red-development/v309-work/RED/index.html`，SHA256：
`ba5e8c88592018cd42c49843f3d9f49bc91ee298d1bece3050b34b9596be714b`

复用该目录原有 `verification/vm-environment.cjs` 加载整个 HTML 的完整实际脚本，不摘抄/重写建筑绘制函数。直接调用 `drawBuilding` 和 `drawBuildingPreview`，记录实际 Canvas 命令并生成 SVG。沿用 v309 车辆参考板方式，新增建筑必需的 stroke/strokeRect、strokeStyle、lineWidth、lineJoin、lineCap、miterLimit 及完整 save/restore 支持。描边使用 Canvas 默认 miter / butt / miterLimit 10；HQ 旗杆线宽3，电站闪电描边线宽1。阴影 #16231c80 转换为原色和精确128/255透明度，不重设计配色或几何。

VM 没有 Path2D，因此使用源代码自带等价 direct-command fallback。没有浏览器截图或原生 Canvas 像素一致性声明。PNG 是已安装 sharp 的 SVG 栅格化结果；无需安装任何依赖。字体为 Noto Sans CJK SC（生成可能输出无可写 fontconfig 缓存警告，但字形已目视验证）。

输入为 team=0、x=y=angle=0、build=0、hp=max=defs[type].hp，唯一研究用 id=-100；真实半径分别 hq40、power26、factory36、refinery33、turret22。工厂完成闲置，原始 constructionProgressView/factoryProductionView 自然返回 null；没有禁用或 mock 进度函数。无选框、血条、建造/生产进度层。

## 尺寸与取舍
主板所有图都采用共用世界坐标视窗 `-48 -68 96 120`，UI 96×120，即1像素/世界单位；2×检查统一2像素/世界单位。最大总部旗杆 y=-63，投影底 y=49，炮塔炮管 x=34 均完整保留。不会把小炮塔放大到总部的体量。

紧凑候选共用 `-60 -68 120 120`，UI 96×96，即0.8像素/世界单位，保留同一建筑间比例且不拉伸；每行少24px高度，但细节更小。建议先由父任务/用户查看两种尺寸，再决定是否及如何整合；本目录不修改产品。

## 复现与测试
在仓库根目录运行：

    node red-development/v310-study/building-reference-board/build-board.cjs
    node red-development/v310-study/building-reference-board/verify-board.cjs
    node red-development/v310-study/building-reference-board/build-compact.cjs

验证包含：冻结源SHA、整个v309产品树文件SHA前后不变、十片段的尺寸/哈希/装饰属性、完整VM重新捕获命令和SVG主体一致、游戏state和研究实体绘制前后不变、堆栈/变换平衡、描边状态、半透明投影、共用世界尺度及几何边界。

另以4×栅格渲染扩大的视窗检查所有非透明像素在目标视窗内，将扩窗裁切结果与正常视窗逐像素比较；十图全部相等，证明栅格化未截掉旗杆、描边、阴影或炮管。几何边界对多边形描边使用保守miter包络，栅格实际边界另存 verification.json。

只在新建 `v310-study/building-reference-board` 写入产物；v309 完全只读，未进行任何产品集成。
