# LLM基础原理

> 第2周（3.11 - 3.17）| 优先级：最高（两边都问）

## 要搞定的知识点

- Transformer架构（Self-Attention计算过程、多头注意力、位置编码）
- GPT vs BERT（自回归 vs 自编码）
- Tokenization（BPE、SentencePiece、token数与成本）
- 推理参数（temperature、top_p、top_k、frequency_penalty）
- 上下文窗口（context window限制、长文本处理策略）
- 主流模型能力边界（OpenAI/Claude/Gemini/开源模型）
- 模型幻觉（原因、检测、缓解）
- 微调基础（Full Fine-tuning vs 参数高效微调PEFT）
- LoRA原理（低秩分解、为什么有效、r值选择、适用场景）
- QLoRA（量化+LoRA，降低显存开销）
- SFT监督微调流程（数据准备→训练→评估）
- 微调 vs Prompt Engineering vs RAG 的选型
- 模型部署与推理（vLLM、Ollama、TGI，本地部署开源模型的基本流程）
- 推理优化基础（KV Cache、量化INT4/INT8、批处理策略）
- 多模态基础（VLM原理、主流多模态模型、视觉理解/OCR的基本能力）

## 文件说明

在这个文件夹里整理每个知识点的八股文笔记。
