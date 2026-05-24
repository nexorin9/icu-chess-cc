# ICU-Chess-CC — 战棋格隔离调床会签协同台

## 项目简介

ICU-Chess-CC 是一个将 ICU 床位以战棋格形式可视化的系统，实时计算隔离约束（MRSA 患者周围不能有免疫抑制患者），输出「调床建议单」，且建议须护士长+感控+床位中心三方会签确认后才执行。

## 核心功能

- **床位图可视化**：战棋格形式展示 ICU 床位分布
- **隔离规则引擎**：基于 Golang 的高效隔离约束计算
- **调床建议生成**：智能计算最优调床方案
- **三方会签流程**：护士长+感控+床位中心协同确认
- **调床建议单输出**：生成可打印的建议单

## 技术栈

- **后端规则引擎**：Golang
- **API 服务**：TypeScript / Node.js + Express
- **前端可视化**：React

## 目录结构

```
icu-chess-cc/
├── data/          # 示例数据
├── src/           # 源代码
├── templates/     # 模板文件
├── README.md      # 本文件
└── buymeacoffee.png
```

## 快速开始

### 安装依赖

```bash
# Golang 依赖
cd src/go && go mod tidy

# Node.js 依赖
cd src/api && npm install

# 前端依赖
cd src/web && npm install
```

### 运行

```bash
# 启动 API 服务
cd src/api && npm run dev

# 启动前端
cd src/web && npm run dev
```

## 使用场景

1. ICU 护士长发起调床申请
2. 系统计算隔离约束，生成调床建议
3. 感控护士在线审批
4. 床位中心确认执行
5. 三方会签完成后，系统输出调床建议单

---

## 支持作者

如果您觉得这个项目对您有帮助，欢迎打赏支持！
Wechat:gdgdmp
![Buy Me a Coffee](buymeacoffee.png)

**Buy me a coffee (crypto)**

| 币种 | 地址 |
|------|------|
| BTC | `bc1qc0f5tv577z7yt59tw8sqaq3tey98xehy32frzd` |
| ETH / USDT | `0x3b7b6c47491e4778157f0756102f134d05070704` |
| SOL | `6Xuk373zc6x6XWcAAuqvbWW92zabJdCmN3CSwpsVM6sd` |