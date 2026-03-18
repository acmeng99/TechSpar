# MCP协议

> 第3周（3.18 - 3.24）| 优先级：核心（趋势性考点，越来越多JD提到）

## 要搞定的知识点

- MCP是什么（Model Context Protocol，Anthropic提出）
- MCP解决的问题（工具标准化、跨平台互通）
- MCP架构（Client-Server模式、Transport层）
- MCP核心概念（Tools、Resources、Prompts、Sampling）
- MCP vs Function Calling的区别与联系
- MCP Server的开发流程

## MCP vs Function Calling 的区别与联系

**区别：**
- Function Calling：tool 定义在应用代码里，与 App 耦合，不可复用
- MCP：tool 抽离成独立 Server，通过标准协议暴露，任何 MCP Client 都能接入

**联系：**
- MCP 的 Tools 概念本质上是 Function Calling 的超集/标准化版本，底层执行逻辑相似，但 MCP 在架构层面多了 Client-Server 的解耦

## 文件说明

在这个文件夹里整理每个知识点的八股文笔记。
