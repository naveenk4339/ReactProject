# AI POC: LLM → RAG → Agent (AutoMart car shop)

A small proof of concept that builds AI up in **4 steps**, one file each. It has about 400 lines (mostly comments) of Python and only needs the `anthropic` package. RAG is written from scratch so you can see each step and explain it in an interview.

| Step | File | Concept | One-line explanation |
|------|------|---------|----------------------|
| 1 | `step1_plain_llm.py` | **LLM** | Text in → text out. Smart, but knows nothing about *your* data. |
| 2 | `step2_rag.py` | **RAG** | Search your documents first, put the relevant facts in the prompt, then ask the LLM. |
| 3 | `step3_agent.py` | **Agent** | The LLM picks **tools** to call (RAG search, a DB lookup, loan and delivery calculators) in a **loop** until i
| 4 | `step4_chat.py` | **Memory** | LLMs forget everything between calls. Chat "memory" is just sending the whole conversation again each turn. |
Supporting files: `llm.py` (the only code that calls Claude), `rag.py` (chunking, embeddings, similarity search), `knowledge_base/*.txt` (the "private" company documents).

## Run it

```bash
cd ai-agent-rag-poc
pip install -r requirements.txt
export ANTHROPIC_API_KEY=sk-ant-...        # from console.anthropic.com

python step1_plain_llm.py "What is AutoMart's restocking fee for returns?"
python step2_rag.py       "What is AutoMart's restocking fee for returns?"
python step3_agent.py     # uses a built-in multi-step question
python step4_chat.py      # chat with follow-ups, e.g. "what about 72 months?"
```

Run the tests (no API key needed). They check that each sample question retrieves the right document and that the agent tools return correct values:

```bash
python -m unittest test_poc.py -v
```

**Without an API key**, everything still runs except the LLM call. Step 2 prints the retrieved chunks and the exact prompt it would send, and step 3 runs each tool on its own. That's handy for a demo with no key.

Illustrative agent output for step 3 (the tool results and math are real; the LLM wording will differ):

```
[step 1] LLM calls get_car_price({"model": "Model 3"})
[step 1] LLM calls search_policies({"query": "interest rate credit score down payment"})
[step 1] LLM calls search_policies({"query": "return policy"})
[step 2] LLM calls calculate_monthly_payment({"loan_amount": 37800, "annual_rate_percent": 6.5, "months": 60})
FINAL ANSWER: ~$739.60/month after a $4,200 (10%) down payment. You can return it within 7 days if driven < 300 miles (2% restocking fee).
```

(The exact tool calls also vary from run to run, because the LLM chooses them.)

---

## How to explain it in an interview

### 1. What is an LLM?
> "A Large Language Model is a neural network trained on huge amounts of text to predict the next word. To us it is a function: text in, text out. It is great at language and reasoning, but it has two limits. It only knows what was in its training data, so it can't see private or recent information. And when it doesn't know something, it can **hallucinate**, which means it gives a confident wrong answer."

Demo: `step1_plain_llm.py`. The model can't know AutoMart's restocking fee.

### 2. What is RAG (Retrieval-Augmented Generation)?
> "RAG gives the LLM the right facts at question time, without retraining it. It has three steps."

```
 INDEX (offline)            RETRIEVE (per question)          GENERATE
 documents -> chunks   ->   question -> vector          ->   prompt = top chunks + question
 chunks -> vectors          find most similar chunks          LLM answers using ONLY that context
 store in vector DB         (cosine similarity)
```

- **Chunking**: split documents into small pieces (here, one sentence each; in practice ~200–1000 tokens, often overlapping).
- **Embedding**: turn text into a vector of numbers so that similar meanings end up close together. This POC uses simple word counts (`rag.py → embed`) so you can see how it works. Real systems use an embedding model.
- **Vector database**: stores the vectors and finds the nearest ones quickly (Pinecone, pgvector, Chroma, FAISS, Elasticsearch). Here it's a Python list (`VectorStore`).
- **Similarity search**: cosine similarity, where 1.0 means "same direction" and 0 means "unrelated".
- **Grounding prompt**: "Answer using ONLY this context; otherwise say I don't know." This cuts down hallucinations. Each fact is numbered and the LLM cites it like `[1]`, so every claim can be checked against its source document (`rag.py → build_rag_prompt`).

Why RAG instead of fine-tuning? It's cheaper, data updates take effect right away (just re-index), you can show the source of each answer, and you can apply access control per document.

### 3. What is an AI Agent?
> "An agent is an LLM plus tools plus a loop. We describe the tools (name, description, input schema) to the LLM. The LLM doesn't run anything itself. It replies 'please call `get_car_price` with `Model 3`'. Our code runs the function and sends the result back. This repeats until the LLM has enough to answer."

```
while True:
    response = llm(messages, tools)
    if no tool requested: return answer        # done
    for each tool call: result = run_tool(...)  # OUR code executes it
    messages += tool results                    # LLM sees results next turn
```

See `run_agent()` in `step3_agent.py`. The whole loop is about 25 lines.

Key points to mention:
- **RAG is just one tool** the agent can use (`search_policies`). The agent decides *when* to search.
- **Tools cover what LLMs are weak at**: exact math (calculator), live data (DB/API lookup), actions (send email, place an order).
- **Safety**: a max-steps limit, errors are returned to the LLM so it can recover, and real actions (payments) should need human approval.
- **Pattern names**: this is the "ReAct" pattern (Reason → Act → Observe → repeat). It's also known as "function calling" or "tool use".

### Common interview questions (short answers)

| Question | Answer |
|----------|--------|
| How do you reduce hallucinations? | RAG with a "use only the context" prompt, citations, low-temperature/structured outputs, tools for facts and math, and evaluation sets. |
| How do you choose chunk size? | Small chunks are precise but lose context. Large chunks keep context but add noise. Start at ~500 tokens with overlap and tune with evaluation. |
| Keyword search vs vector search? | Keyword (BM25) matches exact words. Vector search matches meaning ("refund" ≈ "return"). Production systems often use **hybrid** search plus a **re-ranker**. |
| How do you evaluate a RAG system? | Retrieval: did the right chunk appear in the top-k (recall@k)? Generation: is the answer faithful to the context and correct? Use a labelled question set. |
| How does a chatbot "remember"? | It doesn't. The LLM is stateless, so the app resends the conversation history on every call (`history` in `step4_chat.py`). Long chats get trimmed or summarized to control token cost. |
| When NOT to use an agent? | When a fixed pipeline works. Agents are slower, cost more, and are less predictable. Use them for open-ended, multi-step tasks. |
| What is the context window? | The maximum text (tokens) the LLM can read at once. RAG sends only the relevant pieces instead of every document. |
| Frameworks? | LangChain, LlamaIndex, Spring AI (Java), Semantic Kernel. They wrap exactly these steps. This POC shows what's underneath. |

## Moving this to production

- Replace `embed()` with a real embedding model, and `VectorStore` with pgvector, Pinecone or similar.
- Chunk by paragraphs/tokens with overlap. Store metadata (source, date, permissions).
- Add evaluation, logging/tracing of every tool call, rate limits, and human approval for risky actions.
- Java/Spring Boot equivalent: Spring AI (`ChatClient`, `VectorStore`, `@Tool` methods) maps 1:1 onto these three files.
