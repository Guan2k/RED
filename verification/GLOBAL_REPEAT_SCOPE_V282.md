# v0.282 全局循环范围说明

## 入口

`node verification/run-tests-v282.cjs`

专项：`node verification/global-repeat-scope.cjs`、`node verification/global-repeat-scope-negative-control.cjs`、`node verification/inherit-dom-v282-negative-control.cjs`。

## 产品边界

仅改变版本标记、全局循环select的六个选项文字/aria-label/title/aria-describedby，以及一条固定可见的短提示。没有增加游戏逻辑；整个内联script与v0.281逐字节相同。changeRepeatProduction、onchange处理、updateUI、生产及经济、暂停与菜单禁用、存档生命周期原样保留，没有确认框。

提示明确开启任意全局车型会关闭全部本厂循环、清本厂补单目标，已付订单保留；关闭全局不关闭本厂循环。提示不依赖选区，使用普通段落，声明white-space:normal和overflow-wrap:anywhere。不是宣称实际窄屏布局已验收。

## 5场景 / 243断言

两组合法双厂场景（正常/暂停）：从标准开局，付费建电站和第二座工厂，自然推进13秒完工。逐厂通过地图选择及原下拉配置scout目标3、tank目标5；自然补单后实际观察两厂的已付订单。清空选区后，确认常显提示与可用性。

三次updateUI刷新前后核心状态相同，onchange代理计数为零。只在用户模拟明确改变下拉时触发一次原处理函数。开启artillery全局循环后，所有工厂的本厂车型和目标删除，已付订单对象内容仅移除factoryRepeatSource，现金不再因切换额外扣款；关闭全局仍保留订单。重新逐厂设本厂循环后，在矿车选区选择全局off，全部本厂设置和状态保持不变。

以上与精确v0.281按同样UI输入进行完整命令/战局核心配对。另外覆盖初始菜单、非战斗矿车选区与重开确认，提示不随工厂选区隐藏，原disabled行为一致。

合成DOM解析器不保留静态文字节点，所以六个选项及提示全文通过严格源标记检查验证；DOM检查负责元素存在/hidden、关联、aria-label及title。所有展示排除项均有新专项直接检查。最后另断言整个执行脚本与v0.281一致。

## 负控及继承

8项临时源码标记变异：模糊选项名、错误option value、隐藏提示、错误范围文字、错误title、旧aria-label、错误描述关联、禁止换行。每项必须命中特定检查，不能把精确源码hash拒绝算作负控通过。原产品文件不变。

16项DOM比较器边界检查涵盖两个历史程序：仅额外排除globalRepeatScopeHint子树和repeatProduction的aria-label/title/aria-describedby；disabled、value、其他属性及本厂控件仍比较。这些新排除字段全部在新专项严格检查。既有v281排除范围不扩散。

旧测试文件及结果均保留。新patrol-action-v282与其负控副本只接入精确v282→v281→v280恢复链，原场景和断言不减；coordinate-command-natural-v282仅更新精确源身份。restore-v281逆转展示差异得到精确旧源，不接受任意变动。

## 最终聚合

`v282-aggregate-results.json`：25个继承程序在精确v0.282源码实跑，959项行为/markup和10项源码检查通过；15项历史身份门槛单列核验，30个专项程序通过。本轮专项计数5/243、8、16。旧巡逻专项在新增恢复链的副本上仍为35/725和9负控，无削减断言。未运行可选的`--legacy`或`--long`分支。

## 限制

合成VM/DOM，无游戏状态/资金/伤害注入。没有运行浏览器、保存、载入、导入或导出。没有原生读屏或真实窄屏截图验收。经济规则未改变，不能把本次提示改进理解为改变循环优先级、取消订单或新增覆盖确认。
