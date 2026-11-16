# 同语义版本空题稿吞答案：真实UI导出的纯数据复现与最小修复

状态：待局部浏览器复验，不合并、不部署；教学正文、课程ID、存储key/schema、账号权限和测试origin均不改。

## 复现与根因

父级受控测试的原始文件位于`/workspace/brainvest-stage5-backups/`，仅只读；原文件哈希记录在工作区外复现证据中。旧版本fe15717：

- `127-before.txt`中u6l9为b版，slide0、answers={}。
- `localhost-after-oldreimport.txt`中u6l9同为b版，slide20、answers={0:3,1:0,2:1,3:2}，4题现行答案齐。
- 真实`mergeProgress(local,decode(remoteCode))`却返回空answers，slide仍0，仅合并了history；随后浏览器到结算页保存slide20，仍报4题未答。`127-after-newcode.txt`与`127-after-oldreimport.txt`记录了这个后果。
- 根因在`mergeDraft`：只在版本不同时选择现行版；同版本无条件选择整个本机草稿，空本机对象遮掉全部远端回答。**这是错误设计，不是合理的“本机优先”。**外层归档成功并不能证明当前答案已同步。

修复前新增8个行为测试有6个失败（工作区外red日志）。修复仅改`src/quiz-content.js`的同版本分支与`src/progress.js`的过时注释；未改main/reader/结算实现。

## 非破坏合并规则

1. 相同revision（未设版号的旧课按同一未设版号处理）才逐题合并：远端填本机缺项/空项；有效数字索引0必须算答案，不能用真值判断。
2. 两端同题均有非负整数索引且不同时，**保留本机选择**；远端空/null/非法值不能清除本机答案。无逐题时间戳，不能谎称可判断哪端更新。
3. 同版本恢复位置取“有效已存答案更多”的一端，数量相同保留本机位置；不让空草稿的旧结算页位置挡住远端实际答题进度。slide只是阅读位置，不能代表已答齐或已结算；真正可结算性仍由现行题答案判定。
4. 不同版本不逐题拼接：当前已知语义版优先，旧稿保留history快照；旧码不得把旧选择填入现行题。原legacy迁移规则不改。
5. 两端history合并去重；同一码重复导入幂等。notes/wrong原本机冲突优先、阅读回答补合、完成OR、XP最大值、best/星最大值规则不改。
6. 不清用户localStorage、不变schema3/mb-progress-v2、不修改测试origin、不触线上数据。合并本身不发XP；已done课程正常结算仍+0XP。

## 证据与回归

- 修复前：`/workspace/brainvest-same-revision-repro-before.json`、`/workspace/brainvest-same-revision-red-test.log`。
- 修复后：`/workspace/brainvest-same-revision-repro-after.json`。分别用真实127-before、127-after-newcode、127-after-oldreimport接收同一原localhost码，均恢复四个答案、slide20，14课/410XP/35星；history仅一份，重导旧码不降级，原本机笔记/错题/阅读回答逐项保留，原六份备份SHA256未变。
- `tests/fixtures/same-revision-empty-draft.json`只提交受控合成测试的目标题稿最小投影，不提交完整导出码、个人笔记或登录数据。
- 新增9个行为回归：真实空稿与已失败稿恢复、索引0/补空/冲突、位置选择、跨版本隔离、历史/幂等/旧码防降级、保存重开/备份/编码往返、256种稀疏组合；读取产品现行纯洗牌/答案解析/XP表达式确认恢复结果为4/4、0未答、已完成+0XP，而非重写一个假评分器。
- 全量69/69测试、构建、diff检查通过；生成物幂等、教学正文无差异。纯函数证据不能替代真实UI验收。

## 最小浏览器复验（仅父级同一computerUse）

1. 保留两测试origin及全部原始备份，不清任何网站数据。刷新接收端127测试origin，让它载入修复后的JS；不要进入用户线上站点，不登录云账号。
2. 接收端仍可用其现有失败状态（u6l9 b、0答案、结算4未答）。在正常“账号与进度同步”UI导入**原封不动**的`/workspace/brainvest-stage5-backups/localhost-after-oldreimport.txt`；不要导入预先修好的状态冒充同步测试。
3. 进入u6l9：应恢复旧localhost的4个现行选择、0题未答，结算4/4，+0XP；累计仍14/68、410XP、35星。保留旧题失效提示及一份legacy归档，旧错题仍不展示旧标准。
4. 刷新、关标签重开；答案及结算一致。正常导出码供父级纯数据decode核对revision=b、answers={0:3,1:0,2:1,3:2}、history一份；此时导出会记录当前阅读位置，不强求之后一直slide20。
5. 重导同一新码，再导原七课合成旧码；答案不回空、不被legacy替换，history不重复，XP/星/完成与笔记/阅读回答不丢。再次结算仍+0XP。
6. 如需最小双向空码防回归，在localhost用正常UI导入原`127-before.txt`（该码含b空草稿）；localhost现行4答案不应被空值抹掉，仍4/4、+0XP。不要重置origin。

不需重验已通过的大案例或全站排版。云同步/实际离线仍未测。
