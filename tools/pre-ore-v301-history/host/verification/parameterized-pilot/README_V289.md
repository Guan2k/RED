# v289 当前入口

稳定两族代码未修改。v288 current manifest原字节归档为current-suite-manifest-v288.json，新增固定reference-v288及当前4处版本/只读练习差异围栏。

从RED目录运行：

```sh
node verification/run-pilot-release-v289.cjs
node verification/run-pilot-release-v289.cjs --historical-v287
node verification/run-pilot-release-v289.cjs --historical-v288
```

当前结果为results-v289.json，历史回放另名。旧README.md/README_V288.md及旧results仍为冻结历史记录；不要直接把旧run-current-suites命令当本版发布入口，因为旧语义脚本需要独立v287 host。

包装器只在临时配置中重定向实际candidate路径，保留所有固定hash/参考/变异/场景与原VM编译身份门禁；当前和历史报告明确标识源SHA。默认新run-tests-v289调用当前入口，不运行历史可选组合。
