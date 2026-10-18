# 当前车辆数据维护专项

源码构建101项、车辆数据180项、wrapper171项全部通过。只运行这三项专项，没有运行完整游戏aggregate。原builder的67项安全案例保留，新输入增加1动态案例；新文件仅为vehicle合法变异添加分支，其余旧前缀不变。额外覆盖固定marker/footer、非执行装配、精确原renderer/artifact、writer安全实现恒等、各writer失败不写盘与receipt迁移。

数据验证取当前真实defs半径，严格固定10槽与最多63顶点；63是本轮保守预算，不是平台上限。各槽body方框边界、冻结/稠密有限数字、getter拒绝零执行、精确索引/类型分支、异常形状与定义半径均有负例。

wrapper覆盖full8/check7、逐阶段错误短路、外部cwd、只读、真实越界几何可以文本装配但在data阶段阻断game。模拟链仅验证工具控制流，不是游戏覆盖。

vehicle-data-initial-helper-failure.txt是初次178项中一个测试helper默认参数问题的诊断摘录；修正后最终180通过，不能称为产品失败。
