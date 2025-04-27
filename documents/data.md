### Tips
项目是由原 [智慧空间操作系统]((http://10.245.1.10:18080/web/gemdale-web.git) ) 的 umi 框架升级为 vite，提升了打包构建的速度。后续代码开发对比原来需要做调整的地方主要有以下几点：

1. 全局状态管理由原来的 `useModel` 改为 `zustand`
2. `antd` 升级为 `v5.x`
3. `vite` 不支持 `commonjs`，异步加载图片由原来的 `require` 改为 `requireImage`
4. 路由使用 `react-router-dom@v6.x`，获取路由查询参数使用自定义hook `useLocation`
5. CSS Module 文件后缀以 `.module.*` 结尾，响应式样式文件为 `.vw.module.less`
6. 使用高德地图的组件要通过自定义高阶组件 `withAmap` 注入Amap对象
7. `Layout` 通过页面文件自主包裹，不注入路由处理
8. 从全局loading改为局部loading，通过 `useRequest` 导出异步请求loading

### 项目运行

- 安装依赖，统一使用yarn
```bash
yarn
```

- 启动项目
```bash
yarn dev
```

- 测试包
```bash
yarn build:test
```

- 生产包
```bash
yarn build:prod
```
- 指定后端服务IP
```bash
# 默认 http
yarn build:cmd --ip=10.245.1.71:9981
# 指定 https
yarn build:cmd --ip=https://10.245.1.71:9981
```

- 本地打包预览
```bash
yarn preview
```


### 代码提交规范

- 遵循 `gitflow` 工作流
    - feature：新功能迭代，从develop分支创建，结束合并到develop
    - release：发布版本，从develop创建，finish合并到master，自动打tag
    - hotfix：线上bug修复，从master创建，finish合并到develop和master，自动打tag

- 代码提交日志
```bash
# 使用该命令会触发 githooks，配置了代码自动格式化和日志规范
yarn commit
```

### 目录说明
- dist：构建产物
- public：不需要经过构建的静态资源
- routes：路由配置表
- src
    - api：统一管理后端api
    - assets：图片等资源文件
    - components：公共组件
    - constants：常量
    - hoc：高阶组件
    - hooks：自定义hook，状态逻辑复用
      - useApi：调取后端api，处理数据的逻辑
      - 其他状态逻辑
    - layouts：全局布局
    - pages：页面
    - store：状态管理
    - style：公共样式，主题，函数等
    - utils：工具函数
    - wrappers：公共的页面逻辑处理，如权限、资源等
    - 其他配置文件：无特别需要请勿更改


### 浏览器兼容说明
- >ie11

### 开发/测试环境发布
1. 合并各自的 `feature` 分支代码到 `dev` 和 `test` 分支
2. 登录 `jenkins` 平台，分别找到 `dev-isv-web` 和 `test-isv-web` 任务，点击构建即可

### 演示环境发布
1. 合并 `test` 分支代码到 `space` 分支
2. 登录 `jenkins` 平台，分别找到 `k8s-space-web` 任务，点击构建，选择构建分支为 `space` 后开始构建
3. 待 `k8s-space-web` 任务构建完成后，再构建 `k8s-space-web-public` 任务同步到外网环境

### 展厅环境发布
1. 分支 `exhibition` 开发
2. 登录 `jenkins` 平台，找到 `k8s-zt-web` 任务，点击构建即可


### 发版上线规范
1. 提交各自的 `feature` 分支代码，并 `finish` 分支自动合并到 `develop` 分支并推送到远程仓库；
2. 由负责人统一从 `develop` 开始一个 `release` ，然后结束 `release`，将自动合并到 `master` 分支并生成版本 `tag` 推送到远程仓库；
3. 通知运维人员拉取`master`分支进行发布上线；
4. 线上bug修复，统一从 `master` 分支开始一个 `hotfix` 分支，修改完毕后推送到远程仓库并合并到 `test` 分支，测试通过后，直接结束`hotfix` 分支，将自动合并到 `master` 分支并生成版本 `tag` 推送到远程仓库。