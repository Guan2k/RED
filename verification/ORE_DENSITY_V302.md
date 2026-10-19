# v302 矿点余量辅助外观

矿点装饰块按剩余量显示1/4/8块：0<amount≤1500为1，1500<amount≤4500为4，amount>4500为8。耗尽矿点原有跳过逻辑保持不变。仅改变原八块序列的尾部是否绘制，不改变每块位置、尺寸、交替色、底盘、标签布局、hover或经济/开采规则。整数和小数都按原数值比较；显示为辅助趋势，具体余量仍以原数字标签和悬浮信息为准，二者继续按原规则取整（标签向上取整为k单位，悬浮量向上取整为整数）。

## 严格源码边界

changes-v302.json仅记录展示版本与唯一矿块for循环头两项变化。restore-v301.cjs锁定整个当前源和最终v301源身份，再沿原历史链恢复。source-delta-v302只用于限定源码断言的逆变换，保留无关变异；不会替换实际当前游戏运行源。所有旧测试与证据原字节保存于v301-host-manifest.json，当前无新增DOM投影排除。

## 绘制比较边界

当前渲染适配仅允许已验证的旧矿块序列尾部省略。底盘、保留块的原序号/坐标/尺寸/交替颜色、文字和其他Canvas操作均不能宽泛忽略。必须拒绝错误阈值、位置、颜色、底盘/标签或非矿块方法变化；不能按fillRect方法名、颜色或任意局部坐标整体过滤。

聚焦测试覆盖边界整数和小数、耗尽矿点、八地图、预览开关及渲染前后的世界/RNG不变。Canvas证据为模拟命令，不是原生栅格、实际视觉辨识或FPS结论。最终通过计数以当前归档结果和完整gate报告为准。

## 开发构建测试职责

本轮将历史迁移身份与活动通用构建检查分离。原101项和原wrapper171项原字节留在tools/pre-ore-v301-history/host，可运行验证原v301迁移。新活动source-build-ore-density-v302.test.mjs不逆游戏版本，也不永久绑定旧renderer或旧HTML；它要求当前manifest、receipt、实际index和assemble输出身份一致，验证固定输入摘要、原样模块插入与全部原安全门。旧writer实现未改的事实属于本轮独立diff证据。

路径/符号链接、输入UTF-8、固定marker/export、禁止装配执行模块、锁、覆盖拒绝、receipt恢复与失败不写盘等安全案例保留。八阶段开发入口仅更新活动builder测试路径，其余次序和短路保持。历史身份仍由verify-current、严格恢复链和旧host提供，不能以此职责分离放宽游戏身份验证。

## 当前专项结果

最终聚焦结果：矿密度118项（含19个产品行为负例）；render78项/7281断言、health2312项、progress202项、building450项、建筑标记10617断言及8图各90秒世界/RNG对照；矿布局5528项及19负例，render/health/progress负例分别27/10/9项，均零失败。独立审查另外验证矿投影30断言和当前产品50场景/458断言及5行为负例。

非渲染适配：坚守16、循环方式31、指南41、源逆变换7、反馈104、DOM250、visual10和参数化专项均通过。活动通用builder101、wrapper171与未改vehicle-data180通过。stable-entry准备阶段synthetic165通过；默认167须由封包后的独立入口记录确认，不能混记。runner注册70个直接专项及4个参数化结果，共74项；1596份历史verification文件逐字节一致。

当前非渲染证据存放ore-density-v302-evidence/current-verification；渲染最终11套结果与12文件hash另存ore-density-v302-evidence/renderer-focused/FROZEN.json。integration/builder-generic.tap与wrapper.tap为最终活动工具结果；builder.tap为后来弃用的逆版本比较设计记录，不作为当前验收。wrapper-pre-doc-failure.tap是专项说明未落盘导致文档契约拒绝，说明补齐后通过。repair/attack-direct-host-mislaunch.stderr记录误从当前目录运行旧host专用脚本时的精确身份拒绝；随后在正确历史host上分别57/42通过，原保护未改。
