# v0.284 订单展示字符串同值跳写

## 入口

`node verification/run-tests-v284.cjs`

专项：`node verification/order-display-writes.cjs`。
实际源码变异负控：`node verification/order-display-writes-negative-control.cjs`。

## 最小产品改动

仅版本标记及三个展示函数：updateProductionOrderPriority、updateProductionOrderFactory、updateOrders。textContent/title复用既有setReadonlyPanelProperty；新增setReadonlyOrderAttribute仅用于订单aria-label，先读getAttribute比较字符串。取消title改为局部完整字符串，再一次比较写入。

未改productionOrderButtons/createProductionOrderRow、节点创建/复用/重排/聚焦、任何pointer/key处理、订单有效性、生产状态计算、退款或循环取消语义。disabled/style与ID赋值仍按原逻辑执行；本轮没有声称消除全部DOM写入，也没有扩展到扫描优化。新旧展示结果应完全一致，因此没有新增DOM比较器排除项。

## 稳定调用测量

同seed28342，正常开局后暂停，实际购买8辆侦察车（每单180）。初次渲染后只包装当前8行的status/cancel/priority/factory节点textContent/title setter及aria-label setAttribute，连续调用updateOrders 20次。

- v0.283：1760次目标setter调用；1440次写入与已有值相同。
- 另320次来自每次取消title先写基础说明，再追加Alt说明；最终字符串也未变化。
- v0.284：同样流程0次目标setter调用。
- 两边world与最终订单展示完全一致，当前行/订单/全部子节点身份保留。

这只是合成VM DOM setter调用量，不是原生DOM变更数量、布局/重排、耗时或FPS测量。真实浏览器、窄屏、触屏和辅助技术未验证。

## 8场景 / 229断言

1. 暂停八个付费订单的旧新调用计数、world/展示配对、节点保持。
2. 正常购买三个侦察车，实际推进0.1再1.2秒，确认倒计时真的改变，按ceil(left)检查秒数、按floor(180*clamp(left/total))独立检查退款金额；暂停状态、真实等待调序后的aria编号、订单工厂选择及真实取消退款/队列均与旧版一致。
3. 正常本厂循环付费产生订单，完整取消来源厂警告存在；通过本厂off后来源标记与过期警告去掉。
4. 正常全局循环付费产生订单。关闭全局保留repeatOrder和该已付单的原取消警告，这是既有语义，不误认为关闭全局会抹掉已付单标记。
5–7. 明确synthetic终局、缺电、等待出口分支，要求对应真实变化的展示被写入并与旧版一致；随后稳定刷新不再重复写。
8. 明确synthetic展示损坏：同节点错误text/title与空aria、再移除aria；刷新恢复准确完整内容，world不变，再刷新不写重复值。

变化刷新检查目标setter没有同值写、每个属性每次刷新最多一次完整写入；有真实展示变化的检查必须观察到写入。计数包括前提、配对和重复观察，不表示229条独立游戏规则。

测试通过live生产行当前节点ID定位动态按钮，避开合成VM静态ID表的旧占位节点。它模拟UI事件，没有直接调用退款或插入现金/订单来制造上述正常场景。

## 10项有效负控

临时实际产品副本分别引入：状态重复赋值、aria无条件写、固定初始倒计时、全价退款文字、aria只首写、遗漏完整取消title、错误生产状态、取消title只首写、遗漏终局title、空aria不恢复。

每项必须以exit1、无signal及无spawn error结束，并精确匹配其预定业务/展示断言消息。实际候选没有先执行源码hash门来替代这些检查；仅已冻结基线恢复保持严格身份验证。

## 继承

原verification文件与历史输出逐字节保留。v284恢复器精确逆转本轮展示改动为v283；再走现有历史恢复链。新的巡逻/全局范围/自然坐标副本仅补恢复层或当前源身份；全局范围副本保留“恢复后v282与v281脚本相等”检查，并锁实际当前v284脚本，避免误称v284整段脚本未改。

当前行为与展示检查运行实际v284，恢复后的历史身份检查单列。已有DOM适配器沿用v283，没有新增排除项。没有操作真实用户存档、导出或真实浏览器。可选历史与长局的实际运行范围在最终聚合章节单列。

## 最终聚合与额外运行

最终当前v0.284聚合通过35个专项程序，以及25个继承程序的959项行为/markup＋10项源码检查；15项历史身份检查单列。另实际运行精确恢复v272的可选legacy（65组/1304项）及当前v284源4个长局（9008断言、854检查点），各自独立报告，不能合并称为当前展示规则覆盖。

可选legacy在临时精确恢复的v272源上运行，包含单列精确v249双击基线，不能算v284行为覆盖。可选长局使用保留原字节的run-long-games-v280.cjs驱动，实际读取当前index.html，其报告sourceSha256为885f713ddf019e6d9e5845a7b046a46cfc731fa216e6d38cfc82b97e5484bbc4：3个normal自然败局、1个easy自然胜局，每局终局后冻结30秒。驱动旧scope中的“product remains v0.280”是历史文字，不代表本次测试源；以sourceSha256为准。长局计数包含重复观察，不是9008条独立游戏规则。

这些额外分支没有操作真实用户存档或导出；VM localStorage为局内独立内存Map，临时文件用于产品/变异源与验证报告。没有原生浏览器验证。
