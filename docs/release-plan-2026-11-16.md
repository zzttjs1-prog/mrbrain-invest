# 原站安全发布/回退方案（仅计划，未执行）

## 当前事实和发布门槛

- 源码：https://github.com/zzttjs1-prog/mrbrain-invest
- Draft PR：https://github.com/zzttjs1-prog/mrbrain-invest/pull/1
- 远程feature commit：`39359725c269d8cab2634a3c6380ae1e80c3be68`。本轮审计修复尚仅本地，必须先审查、提交并更新该PR，再由父级确认。
- 原入口：https://zzttjs1-prog.github.io/mrbrain-invest/
- Pages：legacy，`gh-pages`根目录；未发现源码merge自动部署workflow。源码PR合并不会自动替换gh-pages。
- 已核对当前可回退的部署提交：`8db99c84f325f9828bcea48a602ebb458caeccd2`。发布当天仍须重新核对，不能覆盖他人新部署。

等待父级computerUse完成两个origin的旧六课导入、刷新重开、答题/错题/笔记恢复、手机视图与B12/B13入口检查。当前内容深度只到核心补充，不能宣布完整68套精品长课已完成。接到放行后才执行下面发布动作；本文件不构成自动执行授权。

## 放行后的可审阅命令顺序

以下为方案，尚未执行。所有worktree使用新目录，不能覆盖既有工作区，不使用force/reset-hard/amend。

```bash
# 先将审计修复和UI修复审查、提交并正常push到同一PR；再次跑测试/构建。
gh pr ready 1 --repo zzttjs1-prog/mrbrain-invest
# 等必需checks/review满足之后合并。该命令本身需要父级明确发布放行。
gh pr merge 1 --merge --repo zzttjs1-prog/mrbrain-invest

git fetch origin main gh-pages
SOURCE_SHA=$(gh pr view 1 --repo zzttjs1-prog/mrbrain-invest --json mergeCommit --jq '.mergeCommit.oid')
[[ "$SOURCE_SHA" =~ ^[0-9a-f]{40}$ ]] || exit 1
PREVIOUS_DEPLOY_SHA=$(git rev-parse origin/gh-pages)
# 记录PREVIOUS_DEPLOY_SHA；如与已审计8db99...不同，先审查差异，不继续。
[[ "$PREVIOUS_DEPLOY_SHA" = 8db99c84f325f9828bcea48a602ebb458caeccd2 ]] || exit 1

BUILD=/workspace/brainvest-release-build-20261116
DEPLOY=/workspace/brainvest-release-pages-20261116
# 目录须不存在；如已存在，另选新名字，不删除它们。
test ! -e "$BUILD" && test ! -e "$DEPLOY" || exit 1
git worktree add --detach "$BUILD" "$SOURCE_SHA"
(cd "$BUILD" && npm ci && npm run content && git diff --exit-code && npm test && npm run build)
git worktree add -b release/pages-20261116 "$DEPLOY" origin/gh-pages
# 只比较公开配置文件hash，不打印其内容；保留现网data/config.json和站点标记。
# 先dry-run，检查只替换此站构建产物，尤其确认没有删除私有/无关文件。
rsync -an --delete --exclude=.git --exclude=CNAME --exclude=.nojekyll --exclude=data/config.json "$BUILD/dist/" "$DEPLOY/"
# 人工审查dry-run和差异后才运行写入；仅操作隔离的部署worktree。
rsync -a --delete --exclude=.git --exclude=CNAME --exclude=.nojekyll --exclude=data/config.json "$BUILD/dist/" "$DEPLOY/"
(cd "$DEPLOY" && git status --short && git diff --check && git diff --stat)
# 审查后做普通后继commit；若并发部署导致push非快进，停止，不force。
(cd "$DEPLOY" && git add -A && git commit -m "Deploy approved Brainvest personal learning upgrade" && git push origin HEAD:gh-pages)
```

若`gh-pages`上原配置文件不存在而新build有配置，先核对现有账号实现需要的公开配置，不能在排除规则下无声丢失。任何新增/改变配置须单独审查。不要复制仓库中其他APK签名、keystore或无关目录，不新购或另建服务。

## 进度绝不在部署仓库里

浏览器localStorage跟随origin，不跟随git分支。保留完全相同原入口、`mb-progress-v2`、68个课程ID及原字段；只增补字段并兼容旧格式。新代码会保留备份并对导入合并，不调用clear。发布/回退都不能运行任何清localStorage或重置用户进度脚本，也不能把测试夹具自动灌到真实用户origin。发布前建议由用户通过UI导出自己的同步码，保存离线副本；本轮测试用的6课360XP/18星只是合成夹具，不是用户数据备份。

新旧代码都以原key保存；旧代码使用Object.assign读取整个原对象，通常保留不认识的附加字段，但旧代码不显示新错题/草稿。回退仍须验证实际六课记录，不承诺所有未来格式永远兼容。不同浏览器、App WebView、域名、http/https或端口是不同存储环境，需要手动码搬迁；云同步未验证，不宣传跨设备自动恢复。

## Service worker与发布验收

当前cache版本`mb-v10-deep-20261116`。install预缓存首页、课程数据、书籍、原则索引；activate仅清理旧`mb-`缓存，不清localStorage；数据/导航network-first，资源cache-first，仅缓存OK响应，缺失离线数据返回503而非假HTML。新worker会skipWaiting并claim，已打开页面可能需一次刷新才展示完整新包。

**尚存边界**：install预缓存没有列出构建后的hash JS/CSS，首次成功在线访问后才会运行时缓存它们。因此不能承诺“刚更新即完全离线可用”。本轮没有真实验证生产SW切换。若需要这一保证，应在发布前独立增加hash资产预缓存并测试，不能只改cache版本冒称解决。

发布后：检查Pages构建结果、公开index及对应JS/CSS与数据HTTP200/内容hash；父级computerUse在原origin验证老进度仍6/68并刷新重开、新答题及笔记恢复；检查新SW版本与受控页面；另用干净profile验证新用户入口和真实离线行为。不要因一个GET成功宣布完整部署与存储验收成功。

## 不改历史的回退

若新部署有问题，创建另一个全新gh-pages worktree，先核对其HEAD是刚记录的新部署SHA；以普通新commit恢复旧部署树，保留备份与原origin：

```bash
# 只在全新隔离部署worktree、工作区干净且父级已放行回退时执行：
git restore --source=8db99c84f325f9828bcea48a602ebb458caeccd2 --staged --worktree -- .
# 编辑该worktree的sw.js缓存版本为唯一rollback版本（例如mb-rollback-20261116-1）；
# 旧HTML/旧hash资产/旧数据须同一提交恢复，避免混包。
git add -A
git diff --cached --check
git commit -m "Roll back Brainvest deployment to audited previous release"
git push origin HEAD:gh-pages
```

回退不删git历史、不force push、不清用户存储。回退之后继续检查Pages、SW切换与原进度，不把代码回退等同于清数据。
