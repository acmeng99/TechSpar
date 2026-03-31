# 外部服务配置

这页不讲“项目怎么启动”，只讲**可选外部服务怎么申请、怎么拿到环境变量、怎么验证是否配通**。

如果你只是想先把项目跑起来，这页不是必读；先看 [部署说明](deployment.md)。

### 先看总表

| 环境变量 | 用在哪里 | 不配置会怎样 |
| --- | --- | --- |
| `COPILOT_API_BASE` `COPILOT_API_KEY` `COPILOT_MODEL` | 给 Copilot 单独指定模型 | 回退到主 LLM |
| `NLS_APPKEY` `NLS_ACCESS_KEY_ID` `NLS_ACCESS_KEY_SECRET` | Copilot 实时语音识别 | 只能手动输入 HR 问题 |
| `TAVILY_API_KEY` | Copilot 的公司联网搜索 | 公司情报会退化，其他分析仍可用 |
| `DASHSCOPE_API_KEY` | 录音文件转写 | 不能自动转写，只能贴逐字稿 |
| `QINIU_ACCESS_KEY` `QINIU_SECRET_KEY` `QINIU_BUCKET` `QINIU_DOMAIN` | 录音文件上传到公网 URL | 不能走上传录音转写链路 |

---

### 功能组合速查

如果你不想先读完整页，直接按你要开的功能看：

| 目标功能 | 最少要配什么 | 配好后怎么验证 |
| --- | --- | --- |
| Copilot 文本版 | `COPILOT_*`，或者什么都不填直接复用主 LLM | 进入 Copilot，能正常完成 Prep，并能在实时阶段手动输入 HR 问题 |
| Copilot 实时语音版 | `COPILOT_*` 可选，`NLS_*` 必填，还要装 NLS SDK | 进入 Copilot 实时阶段，点击开始录音后能看到实时字幕 |
| Copilot 联网公司搜索 | `TAVILY_API_KEY` | Copilot Prep 结果里不再出现“未配置搜索 API” |
| 录音上传自动转写 | `DASHSCOPE_API_KEY` + `QINIU_*` | 录音复盘上传短音频后能拿到转写文本 |

再说得更直接一点：

* **只想先用 Copilot**：先不管 `NLS_*` 和 `TAVILY_API_KEY`，文本输入照样能用。
* **只想开 Copilot 语音**：核心是 `NLS_*`，`COPILOT_*` 不是强制。
* **只想开录音上传转写**：只看 `DASHSCOPE_API_KEY + QINIU_*`。

---

### 可复制 `.env` 示例

下面这些示例只展示相关变量，不是完整 `.env`。

#### 1. Copilot 最小可用示例

如果你已经有主 LLM，就可以什么都不填，直接复用主模型。

如果你想给 Copilot 单独模型，可以这样：

```env
COPILOT_API_BASE=https://api.openai.com/v1
COPILOT_API_KEY=sk-your-copilot-key
COPILOT_MODEL=gpt-4o-mini
```

#### 2. Copilot 实时语音示例

```env
NLS_APPKEY=your-nls-appkey
NLS_ACCESS_KEY_ID=your-access-key-id
NLS_ACCESS_KEY_SECRET=your-access-key-secret
```

#### 3. Copilot 联网搜索示例

```env
TAVILY_API_KEY=tvly-your-api-key
```

#### 4. 录音上传转写示例

```env
DASHSCOPE_API_KEY=sk-your-dashscope-key
QINIU_ACCESS_KEY=your-qiniu-ak
QINIU_SECRET_KEY=your-qiniu-sk
QINIU_BUCKET=your-bucket-name
QINIU_DOMAIN=https://cdn.example.com
```

---

### 1. `COPILOT_API_BASE` / `COPILOT_API_KEY` / `COPILOT_MODEL`

这 3 个值的本质不是“某个固定厂商专用配置”，而是：**给 Copilot 单独准备一套 OpenAI 兼容接口**。

你可以这样理解：

* `COPILOT_API_BASE`：接口基地址
* `COPILOT_API_KEY`：接口密钥
* `COPILOT_MODEL`：Copilot 要调用的模型 ID

#### 怎么拿

最常见有两种方式：

#### 方案 A：直接用 OpenAI 官方 API

1. 去 OpenAI 平台创建 API Key。
2. `COPILOT_API_BASE` 填 `https://api.openai.com/v1`
3. `COPILOT_API_KEY` 填你创建的 key
4. `COPILOT_MODEL` 填你实际要用、并且账号可调用的模型 ID

官方入口：

* OpenAI API Keys: <https://platform.openai.com/api-keys>
* OpenAI Docs Overview: <https://platform.openai.com/docs/overview>

#### 方案 B：用任意 OpenAI 兼容提供方

1. 在供应商控制台创建 API Key。
2. 找到它提供的 OpenAI 兼容 Base URL。
3. 在供应商文档或控制台里确认真实可用的模型 ID。

如果你用阿里云百炼的兼容模式，思路也是一样：先拿 API Key，再用它提供的兼容接口地址。

#### 怎么验证

最稳的验证顺序是：

1. 先在供应商控制台确认 key 已创建、模型已开通。
2. 再用一个最小请求验证接口真的能通。
3. 最后再把这组值填进 `.env`。

通用检查方式：

```bash
curl "$COPILOT_API_BASE/models" \
  -H "Authorization: Bearer $COPILOT_API_KEY"
```

如果你的供应商不支持 `/models`，就按它自己的官方文档做最小请求验证。

#### 常见坑

* `COPILOT_MODEL` 不要照抄示例，必须填你账号实际可用的模型 ID。
* 不同供应商的“Base URL 到底带不带 `/v1`”不一样，以官方文档为准。
* 如果你不想单独配 Copilot 模型，直接把这 3 个变量留空即可，系统会回退到主 LLM。

---

### 2. `NLS_APPKEY` / `NLS_ACCESS_KEY_ID` / `NLS_ACCESS_KEY_SECRET`

这组变量给 **Copilot 实时语音识别** 用，来自阿里云 **智能语音交互**。

当前项目里这 3 个值分别承担不同职责：

* `NLS_APPKEY`：识别项目的 AppKey
* `NLS_ACCESS_KEY_ID` / `NLS_ACCESS_KEY_SECRET`：服务端动态换取 NLS Token

也就是说，**不是让你手填 Token**。后端会自己用 AK/SK 换 Token。

#### 怎么拿

1. 开通阿里云 **智能语音交互** 服务。
2. 在智能语音交互控制台里创建项目，拿到 `AppKey`。
3. 在阿里云 AccessKey 管理里创建或使用一对 `AccessKey ID` / `AccessKey Secret`。

控制台入口：

* 智能语音交互文档入口：<https://help.aliyun.com/zh/isi>
* 阿里云 AccessKey 管理：<https://ram.console.aliyun.com/manage/ak>

#### 额外依赖

只填环境变量还不够。当前项目启用 NLS 还需要安装阿里云 NLS Python SDK。

仓库里的说明已经写在 [requirements.txt](/Users/aari/Documents/TechSpar/requirements.txt) 注释里，按那里安装即可。

#### 怎么验证

最实用的验证方式不是先写脚本，而是直接走产品路径：

1. 配好 `.env`
2. 装好 NLS SDK
3. 重启后端
4. 进入 **面试 Copilot** 的实时阶段
5. 点击开始录音，看是否能持续收到实时字幕

如果配错了，当前实现通常会退化成“语音识别不可用，请使用手动输入”，而不是整页直接不可用。

#### 常见坑

* `NLS_APPKEY` 和 `AccessKey` 不是一回事，别填反。
* AK/SK 必须放在服务端，不能直接暴露到前端。
* 没装 NLS SDK 时，光填环境变量也不会生效。

---

### 3. `TAVILY_API_KEY`

这个值给 Copilot Prep 阶段的**公司联网搜索**用。

#### 怎么拿

1. 注册 Tavily 账号
2. 在控制台创建 API Key
3. 把 key 填进 `TAVILY_API_KEY`

官方入口：

* Tavily Docs: <https://docs.tavily.com/>
* Tavily Dashboard: <https://app.tavily.com/>

#### 怎么验证

最简单的验证方式就是直接走 Copilot Prep：

1. 填一个真实公司名和岗位
2. 开始准备
3. 看结果页里的公司情报是否不再是“未配置搜索 API”或“搜索未返回结果”

当前实现里，不配置 `TAVILY_API_KEY` 不会让 Copilot 整体失败，只会跳过公司联网搜索。

#### 常见坑

* 这不是通用搜索引擎 key，不能拿别家的替代。
* 就算 key 正确，冷门公司也可能搜不到高质量结果。

---

### 4. `DASHSCOPE_API_KEY`

这个值给 **录音文件转写** 用，来自阿里云 **百炼 / DashScope**。

#### 怎么拿

1. 开通阿里云百炼
2. 在控制台创建 API Key
3. 把这个 key 填进 `DASHSCOPE_API_KEY`

官方入口：

* 百炼 API Key 说明：<https://help.aliyun.com/zh/model-studio/get-api-key>
* 百炼控制台：<https://bailian.console.aliyun.com/>

#### 怎么验证

最直接的方式是：

1. 配好 `DASHSCOPE_API_KEY`
2. 再配好下面那组 `QINIU_*`
3. 去 **录音复盘** 上传一段很短的音频
4. 看能否成功拿到转写文本

因为当前代码不是直接把本地文件发给 DashScope，而是先上传到七牛，再把公网 URL 交给 DashScope。

---

### 5. `QINIU_ACCESS_KEY` / `QINIU_SECRET_KEY` / `QINIU_BUCKET` / `QINIU_DOMAIN`

这组值给 **录音文件上传** 用，来自七牛云。

#### 怎么拿

1. 注册并登录七牛云控制台
2. 在密钥管理里拿到 `AccessKey` 和 `SecretKey`
3. 在 Kodo 对象存储里创建一个存储空间，得到 `Bucket`
4. 给这个空间准备一个可公网访问的域名，填到 `QINIU_DOMAIN`

控制台入口：

* 七牛云控制台：<https://portal.qiniu.com/>
* 七牛云开发者中心：<https://developer.qiniu.com/>

#### `QINIU_DOMAIN` 该填什么

这里不要只填裸域名，应该填**完整前缀**，例如：

```env
QINIU_DOMAIN=https://cdn.example.com
```

因为当前代码会直接拼成：

```text
{QINIU_DOMAIN}/{object_key}
```

如果你只写 `cdn.example.com`，最终 URL 就不是一个可靠的完整公网地址。

#### 怎么验证

最简单的验证路径还是直接走产品：

1. 配好 `QINIU_*`
2. 去 **录音复盘** 上传一个小文件
3. 如果上传阶段就失败，通常优先看 AK/SK、Bucket 名和域名
4. 如果上传成功但转写失败，再回头看 `DASHSCOPE_API_KEY`

#### 常见坑

* `Bucket` 名写错时，通常会卡在上传阶段。
* `QINIU_DOMAIN` 没带协议头时，后面拼出来的 URL 容易有问题。
* 用测试域名做开发可以，但正式环境最好换成你自己的正式访问域名。

---

### 推荐配置顺序

如果你不想一次配一大堆，按这个顺序最稳：

1. 先只跑主 LLM + Embedding，把系统启动起来。
2. 再决定 Copilot 要不要单独模型，最后再填 `COPILOT_*`。
3. 需要实时语音时，再补 `NLS_*` 和 NLS SDK。
4. 需要公司联网搜索时，再补 `TAVILY_API_KEY`。
5. 需要上传录音自动转写时，最后补 `DASHSCOPE_API_KEY` 和整组 `QINIU_*`。

---

### 常见报错和排查

这部分最实用。看到这些提示时，优先按右边查：

| 现象 / 报错 | 优先检查什么 |
| --- | --- |
| `语音识别不可用，请使用手动输入` | `NLS_APPKEY`、`NLS_ACCESS_KEY_ID`、`NLS_ACCESS_KEY_SECRET` 是否已填；NLS SDK 是否已安装 |
| `NLS_APPKEY required` | 没填 `NLS_APPKEY`，或者 `.env` 没被后端读到 |
| `NLS_ACCESS_KEY_ID and NLS_ACCESS_KEY_SECRET required` | 少了 AK/SK 其中一个，或变量名写错 |
| `TAVILY_API_KEY not configured, skipping company search` | 没填 `TAVILY_API_KEY`；这不会让 Copilot 全挂，只会跳过公司搜索 |
| `DASHSCOPE_API_KEY not configured` | 没填 DashScope key，录音上传转写不能用 |
| `Qiniu upload failed` | 优先看 `QINIU_ACCESS_KEY`、`QINIU_SECRET_KEY`、`QINIU_BUCKET` |
| 上传成功但一直拿不到转写文本 | 优先看 `DASHSCOPE_API_KEY` 和 `QINIU_DOMAIN` 是否真能公网访问 |
| Copilot Prep 能跑，但公司情报很空 | `TAVILY_API_KEY` 没配，或目标公司本身公开信息太少 |

如果你排查完环境变量仍然不对，下一步别继续猜，直接看后端启动日志和对应功能路径的报错。
