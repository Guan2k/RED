# v0.286 选区筛选字符串同值跳写

## 执行

默认聚合：`node verification/run-tests-v286.cjs`。
专项：`node verification/selection-filter-writes.cjs`。
负控：`node verification/selection-filter-writes-negative-control.cjs`。

## 产品范围

仅版本标记与updateSelectionFilters这一函数。七个循环内按钮的textContent/title及critical按钮title改用已有setReadonlyPanelProperty，共对应每次刷新15个字符串属性。没有增加缓存、额外helper、事件或控件；selectionFilterView、车型/损伤计算、commandBlocked及所有disabled赋值位置保持原来顺序。applySelectionFilter和任何战斗/生产/输入/存档生命周期未改。

字符串最终值应完全不变，因此本轮没有增加DOM比较器排除项。

## 7场景 / 110断言

1. seed28551正常开局→暂停→选军队→保存编队1。初始战斗车3、坦克2、侦察车1。包装8个筛选按钮text/title setter，连续20次updateUI：旧v285共300次，全部相同值；v286目标调用0次。state/selection/groups及完整world保持。点击原坦克筛选实际选[6,7]，战斗车3→2、侦察1→0、坦克已全匹配而禁用；通过真实Shift地图点击把侦察车加回，再清空选区。完整view及disabled与旧版配对。
2. 正常开局选军队，用原攻击按钮和地图点击下令；每0.25游戏秒自然推进，7秒时实际观察到侦察车8受伤。实时受损数量=1，critical筛选可用；暂停后点击受损筛选，实际只保留受伤ID8。旧新世界和显示一致。不注入血量或伤害来制造该正常场景。
3–5. 未开局菜单、真实重开确认、实际新局，核完整展示/禁用配对及同节点、刷新纯度。
6. 明确synthetic损伤→恢复满血→所选侦察车死亡→终局，检查每次即时重算及禁用。该“恢复”是测试fixture，不冒充自然维修玩法。
7. 明确synthetic展示损坏，七个动态text及八个title先写错误内容，再写空text/undefined title；刷新均补回与旧版一致的完整字符串，不改world。critical静态text不在本轮动态写入范围，也没有假称它会被updateSelectionFilters修复。稳定后再次刷新不写相同值。

所有配对都运行实际v286与精确恢复的v285，节点身份不变。计数包含前提和重复观察，不代表110条独立规则。

## 8项精确负控

临时产品源码变异：恢复无条件text写、缓存首次非空选区view、抑制已有非零text更新、critical title只首写不修复、受损数量恒0、忽略生命周期blocked、忽略全匹配禁用、错误critical语义。

先重跑正常候选成功，变异必须spawn无error/无signal、exit1且精确命中对应断言消息。缓存与抑制更新在实际坦克筛选后的完整view配对失败；受损恒0在真实自然受伤后失败；title修复错误在展示损坏恢复失败。并非只靠“不写”或源码hash门。

## 继承与限制

保留v285所有verification旧文件与历史结果。新恢复器只逆转版本标记及上述函数，精确恢复原源。适配副本仅补恢复层和当前源身份；既有业务断言、DOM比较器与排除范围不扩不减。默认聚合不跑额外--legacy/--long。

仪器观察的是合成VM JavaScript setter调用，不是原生DOM变更、布局/重排、耗时或FPS。没有实际浏览器、触屏设备、读屏或真实存档/导出验证。

## 最终聚合

最终默认聚合：当前v0.286的39个专项程序、25个继承程序的959项行为/markup＋10项源码检查全部通过；15项历史身份核验单列。未运行可选--legacy或--long。

原v285全部293个verification文件保持原字节；各新适配程序在这次冻结源运行。855个专项case包含历史继承前提与重复观察，不表示855条独立游戏规则。
