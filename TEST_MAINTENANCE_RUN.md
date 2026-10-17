# v287 测试维护补充入口

产品仍为 v287，原 README、指南、发行说明及全部历史测试逐字节保留，默认聚合入口不变。

新增两族稳定参数化验证位于 `verification/parameterized-pilot`，完整 RED 目录可移位运行：

```sh
node verification/parameterized-pilot/verify-bootstrap-migration.cjs
node verification/parameterized-pilot/run-current-suites.cjs
node verification/parameterized-pilot/runner-probes.cjs
```

从 RED 目录执行以上命令。首项验证启动代码之外的历史断言逐字节保留；第二项运行两族当前源与固定参考，比较旧新结果并执行18个精确行为负控；第三项验证运行器门禁。详细范围见该目录 README.md。本轮没有玩法、版本或默认聚合更改，不声称真实浏览器性能。
