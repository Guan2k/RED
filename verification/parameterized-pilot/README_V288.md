# v288 当前配置与 v287 历史证据

本目录原README.md、results.json、runner-probes-results.json、portable-validation.json及bootstrap记录描述已批准v287试点，全部保留，不冒充当前v288结果。

稳定两族suite、suite-context、VM边界、runner、mutations没有修改。只更新当前配置，另新增reference-v287.html作为独立固定历史host和差异围栏输入；原配置完整归档为current-suite-manifest-v287.json。

从RED目录执行：

```sh
node verification/run-pilot-release-v288.cjs
node verification/run-pilot-release-v288.cjs --historical-v287
```

当前结果写本目录results-v288.json；显式历史重现写results-v287-replay.json，不覆盖原results.json。旧直接run-current-suites入口与旧默认run-tests-v287属于v287历史使用方式；在v288请用上述包装入口或新的run-tests-v288默认聚合。

包装入口临时建立精确v287 host，用于旧脚本自带的严格恢复链；当前候选加载仍指向真实v288文件，且由原VM边界核实际HTML/script SHA。临时配置只重定向候选路径，不改变预期hash、固定reference、suite、mutator、围栏或身份检查。历史模式则明确使用v287 candidate及归档配置。临时目录结束后删除，所有正式输入文件运行前后核字节不变。

v288清单围栏仅允许v287→v288版本字符串和power函数的单次completed列表复用，不泛化允许任意新源码。两族原行为/断言数8/229与7/110、原18个具体变异及角色/hash证据门禁全部保留。
