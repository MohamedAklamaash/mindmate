## ChatBot High-Level Design

### Purpose
The `ChatBot` coordinates classification, prompt specialization, and response generation using a Gemini model. It maintains lightweight conversational memory and automatically summarizes context when nearing the model's input budget.

### Key Components
- **ChatBot**: High-level orchestrator that manages messages, summary/insight memories, and when to summarize.
- **ChatCompletionBase**: Model adapter for Google GenAI (Gemini). Provides model invocation, system prompts, and context window info.
- **PromptManager**: Generates category classification and specialized prompts based on user input and history.
- **Structures**: Typed payloads for model calls:
  - `Analysis` for response generation
  - `Summarise` for conversation summarization
  - `PersonalSummary` for structured summary output

### Core State in ChatBot
- `self._messages: List[Dict[str, str]]`: Rolling turn-by-turn history.
- `self._previous_Summary: List[str]`: Accumulated compact summaries used as prior context.
- `self._previous_Insights: List[str]`: Accumulated insights (e.g., preferences, recurring themes).
- `self._last_context_reset_date: date`: For midnight-based lifecycle events (future use).
- `self.initial_message: bool`: Indicates first-turn handling to inject `question_info` once.
- `self.db`: Placeholder for persistence (not yet used).
- `self._context_threshold: int`: 70% of model max input tokens; triggers summarization.

### Configuration and Model Limits
On init, `ChatCompletionBase` reads `config.yaml`, initializes the client, and augments config with model context window:
- `max_input_tokens`
- `max_output_tokens`
- `context_window`

`ChatBot` sets `self._context_threshold = int(max_input_tokens * 0.7)` to maintain a safe buffer before summarization.

### Message Processing Logic (reply)
1. Append user message to `self._messages`.
2. Compute a specialized system prompt via `PromptManager`.
3. Construct `Analysis` memory payload:
   - First message: include `messages?`, `previous context?` (from `self._previous_Summary`), `previous insights?`, and `question_info?` from `config`.
   - Subsequent messages: include `messages?`, `previous context?`, `previous insights?`.
4. Call `chat.invoke_model(input=Analysis, ...)` and attach the AI response to the latest message.
5. Call `_maybe_summarize()`; if over threshold, summarize and rotate memory.

### Summarization Strategy
- `_estimate_context_length()` approximates token usage as `chars / 2.5` across:
  - Current `messages`
  - `previous_Summary`
  - `previous_Insights`
  - An approximate system prompt length (constant)
- If `estimated_tokens > _context_threshold`:
  - Call `summarize()` → `invoke_model` with `Summarise` and `request_format={type: list, schema: PersonalSummary}`
  - Append `summary_text.summary` to `self._previous_Summary`
  - `reset()` clears `self._messages`

### Error Handling
- Non-critical failures in summarize are logged and safely ignored to avoid blocking replies.

### Extensibility Points
- Replace `self.db = None` with a real repository that syncs local and cloud (see `db.py`).
- Add persistence hooks on every reply and summarize event.
- Insert guardrails for PII handling and safety prompts in `PromptManager`.
- Refine token estimation with a tokenizer if needed.

### Data Lifecycles
- Short-term: `self._messages`
- Mid-term: `self._previous_Summary`, `self._previous_Insights`
- Long-term: Future DB persistence for analytics, personalization, and user-facing recaps.


