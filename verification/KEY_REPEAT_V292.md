# v292：编队快捷键防连发

## 改动边界
仅游戏版本标签和数字1–3分支的一处条件：仍对有效编队快捷键preventDefault，仅在!e.repeat时调用controlGroup。没有定时器、时间阈值、键盘状态缓存或其他快捷键修改。非重复事件和缺省repeat继续执行；Ctrl／Meta保存和无修饰召回都抑制重复。可见按钮、Ctrl点击、核心controlGroup、保存空选保护和召回语义逐字不变。

## 本轮证据
- `node verification/control-group-repeat-v292.cjs`：40项、257断言。三组×Ctrl／Meta／无修饰×运行／暂停，首次→改变选区及待操作→五次重复→再次首次；输入控件、组字、Alt、未开局／重开／终局、缺省repeat、可见按钮／Ctrl点击。每次重复核完整state（含日志）、编队、选区及待操作，重复事件仍被消费。
- `node verification/control-group-repeat-negative-control-v292.cjs`：11个真实源码变异：恢复连发、禁止首次、放行Ctrl／Meta／召回／暂停／第三组重复、不消费重复、错误拒绝缺省repeat、重复清模式、重复写日志。必须命中明确行为断言；另用精确恢复的v291源命中重复改变现场断言作行为对照，共12项。不把语法／身份／超时／任意异常算作负控通过。
- 独立预写检查204项通过；基线v291失败117项是对新规则的敏感度。原脚本、阻断持久化的模拟器、候选／基线结果及review保存在key-repeat-independent-v292。

## 继承门禁
所有原v291 verification文件按v291-host-manifest.json核SHA。restore-v291.cjs只接受本版精确源，逆转两处变化后核原v291SHA，再沿原链恢复；额外字节和假版本均拒绝。旧测试／工具不覆盖不删除，新增v292副本只迁移当前身份／恢复链／同版引用。

唯一行为期望调整位于control-group-protection-v292.cjs的原重复保存案例：有效选择上的repeat现在应保留原组，然后追加repeat:false确实保存新组的断言。没有删除案例或放宽其他断言；原v291脚本仍按原SHA保留。DOM继承投影不加任何豁免。两个稳定参数化suite及18个变异仍为原字节，本版配置单列并追加精确源码差异围栏。

## 验证限制
这些是全源码VM／mock DOM注册事件检查，按键长按通过repeat属性模拟，不能声称原生浏览器或物理键盘验收。未执行存档／载入／导入导出或真实存储。本版完整聚合和隔离默认入口最终结果见../QA_STATUS.md；历史长局和旧ZIP不算当前运行。
