# 车辆预览静态数据抽取：只读评估与独立证明

## 建议

可以做，但只建议在下一次确有车辆轮廓编辑需求时，做“小范围几何数据抽取”。单为674字节搬家发一轮产品版本，收益有限。当前没有功能缺陷需要修复，也不建议本轮进一步抽取配色/绘制配方。

基线为主分支557beaa30429840115d49215f8b5c2e2dd6293e6对应的最终 v301-doc-contract-tools/RED；整个 index.html SHA256 为 75c75c7a25af246d366770809853f2fab440cd734c11d9fbe6acfe840a0efd39。独立临时目录证明21项通过，抽取后生成HTML完全逐字节相同，原2029文件树hash没有变化。没有运行游戏aggregate。

## 实际边界

- src/script/03-renderer.jsfrag 第51–63行，从 `const unitArtCanonicalRadius=` 开始，到 `function unitArtTrace(` 之前结束。该连续块674字节，包含五车型规范半径和10个冻结多边形，共63顶点。
- 建议候选文件 src/art/vehicles.mjs：上述字节原样，加固定开发用导出尾行 `export { unitArtCanonicalRadius, unitArtGeometry };`。不改数字格式、空格或换行。
- 原位置只放独占 `@@RED_UNIT_ART@@`，且严格要求其下一行是 `function unitArtTrace(`。装配器只去掉固定导出尾行并原位拼回，不import、不执行模块、不用JSON重序列化。
- unitArtTrace、unitArtPoly、初始化/失败回退、drawUnitPreview、vehicleArtPreview、unitTrackMemory/履带相位全部留在renderer。
- 规范路径映射：scout为0/1，tank为2/3/4，artillery为5/6，repair为7/8/9。harvester虽然有规范半径16，但完全使用矩形与动态载荷条，无缓存多边形。不要伪造它的路径条目。

## 配色为何不一起抽

drawUnitPreview第69行的阵营基础色/高光/暗部色仍是局部表达式；第73–108行还有散布在rect和unitArtPoly调用中的颜色、炮管长度、矿车外形矩形、动态载荷条与半径相关的阵营角标。它们混在控制流、动态参数、绘制顺序中。

把它们改成可编辑palette/recipe并让runtime查表，会改变生成JS字节；把整个绘制函数挪到所谓data模块也不再是纯静态数据。模板生成数十个literal替换虽可硬保留输出，但会扩大装配语言/安全审查面，收益不足。不建议以此为本轮范围。

## 固定装配与安全约束

现有tools/source-build.mjs的INPUTS只追加固定vehicles路径；固定解构追加一项。对新marker实行唯一且正确位置检查，fragment未知marker检查仅允许renderer内两个特定marker。模块必须唯一固定export footer，body不得出现import/export，仍执行UTF-8检查及最终Script语法编译但不运行。

保留既有普通文件/路径祖先符号链接拒绝、输出保护、独占wx锁、手改artifact拒绝覆盖、输入摘要绑定、恢复仅允许装配字节与现有HTML相等的约束。不得改atomic/locked/writeGenerated/recover/out/main的实现或放宽参数。

输入列表和源码文件改变后，inputsSha256必变，outputSha256不变。旧receipt应先严格拒绝；使用既有显式recover流程，在确定装配字节等于HTML后仅更新receipt。独立证明已经检查此拒绝→恢复→check闭环。两文件替换仍不是事务，锁仍不是强制协作锁，不能新增原子事务保证。

## 数据验证与预算

候选tools/vehicle-art-data-validation.mjs及其test负责可信开发模块的独立验证；装配器继续不执行数据模块。验证五个精确key、半径为有限正数且符合defs、递归冻结、普通record/密集数组、无getter/symbol/循环、坐标有限、偶数配对、每条至少三点、不得退化、索引映射正确。固定本轮恰好10个路径槽和顶点上限63；数字索引已固定在renderer，禁止无配套审查的任意插入/重排。后续扩展必须显式审查预算。

轮廓边界按原规范body方框检查，不能把炮管或整个外观声明成碰撞圆内。车辆缓存仍10条，建筑仍20，总30；本次没有新缓存路径或分配。原有构造/填充失败锁存与直接路径残留语义必须保留。

## 最小验收范围

1. 生成artifact完整字节/SHA同基线；JS/CSS、版本、游戏数据、存档代码及所有玩家输入同字节。旧receipt拒绝、只恢复receipt后check通过；原包全树只读证明。
2. 新builder测试：正确抽取/重建、missing/duplicate/misplaced marker、错误或重复footer、非法module语法、未知marker、闭script标签、非法UTF-8、missing/symlink文件与art目录、路径越界、修改vehicle数据后inputs绑定。复用完整旧builder安全案例，保留旧版本host与旧测试原字节。
3. 注意原source-build.test.mjs第9行对未知新输入会在末尾追加注释，vehicles有固定尾行因而会失败。需新版本测试对vehicle输入进行尾行之前的合法变异；不能修改历史测试掩盖差异。新增一项输入也会让动态案例数量增加，报告按真实数量。
4. 新data validator的正例及冻结/非有限/稀疏/错误key/奇数/越界/退化/预算负例。无配色表，不宣称本次验证全部车辆颜色。
5. 现有渲染focused可直接用于同字节artifact：默认OFF零分配、开启10+20缓存、缓存/直接命令一致、构造和fill失败及后续帧、所有车型双阵营、动态图层/载荷/履带/旋转、队列与世界RNG。无需新绘制投影或放宽任何Canvas比较。
6. 如果最终实施，再由单一集成人运行完整gate；此评估没有替代它。历史记录和旧工具host继续保留。

## 证明产物

prove.mjs 在临时目录复制必要固定输入，运行修改后的text-only assemble，最后清理临时目录；不会编辑基线。results.json记录21项、路径/顶点与hash。vehicles.mjs.proposed、renderer.jsfrag.proposed、source-build.mjs.proposed仅是评估提案，不是已迁移产品，不含正式新validator和完整builder安全测试。

独立评估复核确认同一最小边界。模块实际收益来自可独立import验证的不可变几何schema、逐槽车型边界与预算校验，以及固定装配输入摘要，不以新增文件数为收益。未实现validator前，不建议声称抽取已完成。

## 实施顺序与停止条件

经授权后，从上述final2029文件包fresh-copy独立候选；先迁移两个声明和固定装配，再实现独立vehicle validator/单测。verify-development增加独立可信车辆数据校验阶段，新增wrapper顺序、每阶段短路、check-only不跑game及只读测试，旧wrapper/测试放历史host原样保留。最后绑定新输入receipt，确认输出字节身份，封包后由集成人统一跑一次完整gate。若专用数据校验尚未落实、输出字节改变或旧安全门被削弱，则本次迁移不交付。

独立复核测得抽取块SHA256为0290f626c92864b05b8d908382c2197c0e812a9c424828bce88ffb708b594cb5。后续真正改美工时，现有render测试会绑定10路径/63顶点及精确trace计数，历史恢复身份也会变化；不能把“这次同字节抽取通过”当作未来任意坐标编辑已经获验证。
