# v288：同次 power(team) 局部只读复用

产品 SHA：c67df10f2988f10d2949a5016d5dd453c1714471ff860b9d3f601e31c430ae20。

## 唯一产品差异

除版本字符串外，只改 power 函数：`const completed=structures(team).filter(e=>!e.build)`，供给取其中power类型数量，需求仍按原实体顺序 reduce buildingPowerDemand。保留 BASE + count × STATION 的算术顺序、默认team=0、严格team相等、hp>0、建筑资格、!build和新返回对象。

列表在函数返回即丢弃，没有跨调用、跨帧、队伍或UI缓存。structures、powered、AI、生产、随机、事件及其他调用点不变。restore-v287.cjs严格要求两处唯一逆向替换后与v287产品逐字节相等。

## 专项

执行：`node verification/power-read-reuse.cjs`；负控：`node verification/power-read-reuse-negative-control.cjs`。

5场景803断言，结果见 power-read-reuse-v288-results.json：

1. 正常开局、合法第二厂和3单侦察车。每0.1秒配对完整state、uid、选区、编队、未提交输入及模拟余数。12.1秒供需120/130，2辆已出厂，第三个已付订单剩约0.05生产秒；补建电站的前4.9秒订单不推进。17.2秒供需220/130，18.2秒订单清空且3辆已生产。
2. 正常UI选原电站并回收，紧接读取从120/80变20/80。敌方初始供需220/130独立保留。额外只读调用确认无RNG消耗、world不变。
3. 正常开局自然交战，按0.25游戏秒观察，约121.99999999999436秒初始炼厂自然被毁，需电80→50立即可见；每步旧新world一致。该计数是一次场景及观察精度，不代表所有战斗条件。
4. 明确synthetic实体fixture：空建筑、存活低血量、死亡、在建、车型、两队及null/string队伍、供需相等、刚完工/刚死亡。省略或undefined才默认0；每次返回新对象。
5. 明确synthetic纯读取helper fixture：按factory/refinery/turret顺序读取需求，夹入车辆确保不读车辆需求；用1e16、-1e16、1暴露浮点重排，结果必须为1。施工标记0/false/null/空串与1/字符串0/true沿原真值语义，不改成数值归一化。

## 实测计数

同一个18.2秒合法场景，两个版本均包裹原函数做计数，不写游戏字段：

- 模拟来源power调用4261→4261，structures全实体filter8522→4261，谓词访问184984→92492。
- UI来源power调用52→52，structures104→52，访问2108→1054。
- 主动观察power调用3→3，structures6→3，访问132→66。

structures使用全数组filter，访问数为每次当时实体数组长度累计。这不是find提前退出估计，不包含本地已完工建筑数组上的筛选/reduce，也不是总运行时、内存、真实DOM或FPS测量。

## 精确负控

原当前源必须完整先过。12项临时实际产品源码变异均退出1并命中特定AssertionError：重复整表扫描（仅此1项计数负控）；计算在建；排除低血量存活建筑；纳入死亡建筑；跨队混算；null错误归一化；改基础供电；漏工厂需求；跨调用缓存；共享返回对象；反转需求累计；只接受build===0。

11项命中world、明确供需、严格队伍、新对象或求和顺序等语义，不能用hash拒绝/语法错误/超时/任意异常代替。负控不改变正式源码，参考通过正式冻结host精确恢复，不从变异源恢复。

## 继承与参数化边界

原默认入口及历史文件保留。新run-tests-v288默认不运行legacy/long；当前与历史身份核验分列。两族稳定参数化代码不复制新版本，原current manifest另存current-suite-manifest-v287.json，新manifest只有明确候选hash、固定v287参考及版本/power差异围栏。当前wrapper只在临时配置中重定向候选到真实v288，旧脚本在精确v287 host运行用于语义结果比较；不会把旧源算作当前测试。

历史README、results.json、portable-validation.json记录v287试点，保留原字节；新结果写results-v288.json。历史重现命令与当前入口均见parameterized-pilot/README_V288.md。

## 聚合适配记录

首轮默认聚合在第25个直接专项加载新增巡逻适配脚本时中止：批量版本名替换误将新恢复层写成不存在的restore-v288.cjs。此前24项已通过；后续未执行。这是测试适配基础设施错误，不是产品失败或成功负控。纠正恢复层为restore-v287并静态核验所有新增依赖后，进行单次纠正重跑，最终状态由v288-aggregate-results.json记录；未因此增加legacy/long范围。

最终默认聚合已通过：39个直接专项程序加两族稳定入口的4条正负结果，共43条专项结果；25个继承当前源程序为959项行为/markup＋10项源码检查，15项历史身份单列。两族仍为8/229、7/110及18负控。未运行legacy/long。纠正后聚合退出0，运行前后280项产品/测试输入hash一致。
