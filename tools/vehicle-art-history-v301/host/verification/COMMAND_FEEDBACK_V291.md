# v291 安全落点失败的持续回执

## 产品范围
仅版本文字和issueMapCommand中的回执原因补充。复用已经得到的used、followed、guarded、assigned、rallied数量，不增加路径搜索。普通车辆与工厂失败分别计数；矿点分配、矿车护航和维修跟随成功不计失败。原日志、命令、资金、伤害和模拟不改。

## 可复现证据
- command-allocation-feedback-v291.cjs：104项、1114断言。全源码VM、普通与坐标注册事件；对照精确v290世界、日志、搜索调用、随机调用、音效和非回执DOM。
- command-allocation-feedback-negative-control-v291.cjs：8个产品源码变异，要求命中指定回执断言；不把语法/超时/哈希错误当行为检测。
- command-feedback-independent-v291/acceptance.cjs：独立预写109项；候选109通过，v290基线42通过67不符合新增期望。基线失败是差异敏感度，不是旧版异常。
- 既有测试保留原字节；新版本适配只沿用精确恢复与已有投影范围。

## 限制
分配失败用受控groundGoal返回null制造，明确为synthetic，不冒充自然地图堵塞或浏览器复现。未调用存档、载入、导入导出及真实浏览器存储。没有原生浏览器布局、IME、读屏或真实性能验收。只针对这次分配结果说明原因，不能推断所有路径都不可能。
