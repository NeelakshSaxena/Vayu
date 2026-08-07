# Vayu AI Project: Detailed Phase-by-Phase System Design Roadmap

## Phase 0 — Project Architecture  
**Goals:** Establish a clear, maintainable repository structure before adding features. Use a *monorepo* with well-defined boundaries so adding features later doesn’t require refactoring core. For example, organize as:
- **apps/** – separate deployable applications (e.g. `apps/web` for the React frontend, `apps/api` for the FastAPI backend, `apps/desktop` for future Tauri/Electron).  
- **packages/** – shared libraries (e.g. `packages/types` for shared TypeScript types, `packages/prompts` for prompt templates, `packages/ui` for common UI components, `packages/sdk` for API wrappers, `packages/config` for shared configs).  
- **services/** – individual AI services (e.g. `services/llm/`, `services/memory/`, `services/search/`, `services/embeddings/`, `services/tools/`, `services/stt/`, `services/tts/`, `services/vision/`). Each is an isolated module with clear APIs.  
- **data/** – data files (knowledge bases, vector stores, etc.).  
- **docs/** – design docs and markdown specs.  
- **scripts/** – automation (build, deploy scripts, codegen helpers).  
- **tests/** – integration tests and end-to-end scenarios.  
- **docker/** – Dockerfiles and container orchestration configs.

This monorepo approach keeps common code in one place (atomic commits, shared tooling). It enables consistent linting/testing and simplifies refactors, at the cost of careful CI setup (e.g. partial builds per workspace to avoid slow pipelines). For the Python backend, avoid a single `utils.py`; instead split into domains (e.g. `api/core/config.py`, `api/context/builder.py`, `api/tools/…`). For the React frontend, follow a **feature-first** structure (see Phase 3). Define environments (dev, prod) and versioning schemes now.

**Stop Conditions:**  
- A basic repo scaffold exists (directories, placeholder files, build configurations).  
- All sub-apps/modules can build or run independently (e.g. `npm install && npm run build` for web, `uvicorn` for API).  
- No remaining “catch-all” files like `helpers.py`—every function belongs in a clear module.  
- Developer guidelines and architecture notes are documented.

**Verification:**  
- Running each app in isolation works. E.g. `yarn workspace apps/web start` opens the frontend, `uvicorn apps/api/app:app` returns a simple JSON response.  
- Code coverage and linting are set up and pass on CI templates.  
- Adding a new feature under `services/` or `apps/desktop` does not require changes elsewhere (demonstrated by adding a dummy service).

**Codex Prompt:**  
> *“Generate a monorepo scaffold for Vayu with the following layout: `apps/` containing `web/` (React+Vite) and `api/` (FastAPI), a `packages/` directory for shared TypeScript modules (`types`, `prompts`, `ui`, `config`, `sdk`), a `services/` directory for AI components (each in its own folder like `llm`, `memory`, `search`, `tts`, etc.), plus `data/`, `docs/`, `scripts/`, `tests/`, and `docker/` at root. Include workspace/package config files (e.g. Yarn Workspaces or pnpm) so that frontend and backend can reference shared packages.”*

## Phase 1 — Backend Foundation  
**Goals:** Build a production-ready AI backend that is fully decoupled from the frontend. Use FastAPI with routers, dependency injection, and WebSockets for streaming. Organize by feature/module, not by file type. Key components:  
- **Routers and Modules:** Create routers for distinct APIs (e.g. `api/chat`, `api/memory`, `api/tools`, `api/auth`, `api/health`). Each router lives in its own folder (e.g. `api/app/api/chat/router.py`). Include these in the FastAPI app via `app.include_router(...)`.  
- **Core:** Central settings and utilities (`api/core/config.py`, `api/core/logging.py`, `api/core/security.py`). Load environment vars in `config.py`.  
- **Context Management:** Implement a context builder subsystem (`api/context/`) that collects relevant conversation history and user data.  
- **LLM Providers:** Define an abstract LLM interface (e.g. `LLMProvider`) and concrete implementations (e.g. `providers/openrouter.py`, `providers/openai.py`, `providers/anthropic.py`). Ensure async calls.  
- **WebSocket Streaming:** Add a WebSocket endpoint for chat so the frontend can stream tokens. Use e.g. `fastapi.websockets` to send partial responses.  
- **Logging:** Every request should be logged with structured details (user input, context used, model prompt, cost) as spans/traces (see Phase 10).  
- **Configuration & Security:** Use Pydantic settings or similar for config, and secure APIs (e.g. OAuth2, JWT) under `api/auth/`.  
- **Tests:** Write unit tests for each router and core service. Mock LLM calls.

Properly structured FastAPI projects (routers, schemas, models, services) improve maintainability and testability. Avoid monolithic `routes.py`. Use dependency injection (`Depends`) for DB or config where needed.

**Stop Conditions:**  
- The FastAPI app boots and serves at least one “ping” endpoint (e.g. GET `/health` returns 200).  
- Routers for chat and health are hooked up with correct prefixes.  
- LLM provider interface exists and at least one mock or stub implementation is wired (no errors).  
- WebSocket endpoint can send a test message (e.g. echo).  
- All code is type-annotated (Python types) and lint/test pass.

**Verification:**  
- `curl http://localhost:8000/health` returns expected status/message.  
- Simulate a chat request (REST or WS) and receive a formatted response.  
- Use dependency injection (e.g. stub a DB session) in tests to ensure separation.  
- Review logs to ensure they include required fields (timestamps, tokens, etc.).  
- No “import-of-thirdparty” mistakes: every import goes through the well-defined module path.

**Codex Prompt:**  
> *“Create the backend structure for Vayu: a FastAPI project with routers for `chat`, `memory`, `tools`, and `health`. Include `core/config.py` for settings, a WebSocket route for streaming chat responses, and an abstract LLM provider with a sample `OpenRouterProvider`. Set up structured logging of requests, and add placeholder unit tests for each router.”*

## Phase 2 — AI Runtime (Context, Prompt Pipeline, Memory)  
**Goals:** Implement the AI runtime pipeline that builds context, manages memory, assembles prompts, calls the LLM, and returns a response. Structure this as distinct stages:  
- **Context Builder:** Combine inputs from various sources (recent chat history, user profile, external facts) into a context document. Use modular “builder” classes (e.g. `ContextBuilder`) that can inject conversation history, RAG results, calendar events, etc.  
- **Memory Manager:** Implement a three-layer memory system:  
  - *Working Memory:* The current session’s recent exchanges.  
  - *Injection/Long-Term Memory:* Pre-session data such as user preferences, past session summaries (persisted in a vector DB or file). Use embeddings/semantic search to recall relevant items.  
  - *Recall (RAG):* On demand, run semantic search over knowledge bases or documents (vector DB). Inject the top results into context only when triggered (avoid unnecessary recalls).  
- **Prompt Assembly:** Once the relevant context is gathered, assemble the final prompt: combine a system prompt (instructions/personality), the user’s new message, and any retrieved context or memories. Follow a chain-of-thought style if needed. Ensure prompts are in versioned templates (see Phase 6 on prompt management).  
- **LLM Router:** Send the prompt to the appropriate LLM provider (OpenRouter, OpenAI, etc.). Handle streaming or batch completion as needed.  
- **Streaming Engine:** Stream tokens back to the caller; allow partial output to incrementally display results.  
- **Tracing:** Emit observability spans for each stage (context building, LLM call, memory operations) so the flow is auditable.

**Stop Conditions:**  
- Given a user message, the system automatically builds the full prompt (without manual intervention) and obtains a coherent response.  
- Memory is stored and injected correctly: e.g. after a conversation ends, key facts are summarized and saved; on a subsequent run, relevant facts are retrieved.  
- The pipeline is fully asynchronous or non-blocking (especially important for streaming).  
- Each component (Builder, Memory, LLM) has unit tests or mocks to verify behavior.

**Verification:**  
- Test with a scripted chat: send messages that should trigger recall (e.g. “Remember when I said X?”) and confirm the system recalls the correct info.  
- Ensure memory layers are replaceable (swap out vector DB for a mock without breaking flow).  
- Profile the context builder to ensure no stage takes excessive time.  
- Check logs/traces: there should be a clear record “built prompt with these sources → LLM response → output” (see Phase 10 instrumentation).  

**Claude Prompt:**  
> *“Design and implement Vayu’s AI runtime pipeline. Create modular components: a ContextBuilder that merges conversation history with retrieved knowledge; a MemoryManager implementing Working, Injection, and Recall layers; and a PromptAssembler. Ensure each stage (context build, prompt create, LLM call) is separately testable. Provide interfaces so different memory backends (in-memory, vector DB) and LLM providers can be swapped in. The pipeline should stream results back to the caller while logging each step for later debugging.”*  

## Phase 3 — Frontend Architecture  
**Goals:** Refactor the React frontend into a **feature-based** architecture. Organize code by domain (conversation, voice control, settings, etc.) rather than by file type. Example structure under `apps/web/src/`:  
- **app/** – App-wide setup (router, context providers, global layouts).  
- **pages/** – Top-level pages (Home, Settings, Onboarding).  
- **features/** – Major features, each with its own folder:  
  - *orb/* (the interactive orb component and its logic)  
  - *conversation/* (chat bubbles, message list, input bar)  
  - *voice/* (push-to-talk, transcript display)  
  - *memory/* (UI for memory settings or display)  
  - *tools/* (UI for invoking external tools, if any)  
  - *settings/* (profile/preferences UI)  
- Each feature folder contains its React components, hooks (e.g. for API calls), services, styles, and tests specific to that feature. For example, `features/conversation/` might have `ChatInput.tsx`, `ChatBubble.tsx`, and hooks like `useSendMessage.ts`.  
- **components/common/** – Reusable components (buttons, modals) and atomic UI library (`components/ui/`) of styled primitives. Shared components go here, not in feature folders.  
- **services/** – Frontend-side API clients (e.g. `services/api.ts` wrapping backend calls, `services/audio.ts` for microphone, `services/websocket.ts`).  
- **stores/** – State management (Zustand, Redux, etc.), one store per domain or feature.  
- **hooks/** – Custom React hooks for generic tasks.  
- **assets/** – Images, icons, fonts.  
- **styles/** – Global CSS or tailwind configs (if using Tailwind).  

The rule: *“If a component or hook is used by only one feature, put it inside that feature’s folder”*. This avoids jumping between many directories. Integrate the design system and assets globally (orb logo, fonts, theme toggler).

**Stop Conditions:**  
- The app compiles with no import warnings (no cross-feature imports that break boundaries).  
- The Orb and Chat features function exactly as before, with behavior unchanged.  
- New features can be added by creating a new folder under `features/` without touching unrelated code.

**Verification:**  
- Attempt to move `features/orb` into a new independent project: it should include only its folder and common `ui/` components, proving isolation.  
- Code review: no feature’s code imports from another feature except through well-defined interfaces (e.g., no `import Dialog from "../conversation/Dialog"` in `voice`).  
- End-to-end tests (or manual testing) confirm that navigation, theme switching, and chat all still work.

**Gemini Prompt:**  
> *“Refactor the Vayu React frontend into a feature-oriented structure. Create a `features` directory with subfolders like `orb`, `conversation`, `voice`, each containing that feature’s components, hooks, and services. Move all shared UI bits (buttons, inputs, modals) to a common `components/ui` library. Update imports so that each feature module is self-contained. Ensure functionality is preserved (the Orb still animates, chat still sends messages).”*  

## Phase 4 — Orb Engine (UI Animations & Moods)  
**Goals:** Bring the Orb and UI to life with smooth motion and stateful behavior. The Orb is Vayu’s identity – it should feel **alive**, using subtle animations and ‘breathing’ effects. Key aspects:  
- **Orb Animations:** Implement continuous animations: gentle pulsing/glow when idle, slight 3D rotation or parallax to react to cursor or music, breathing light. On states (listening, thinking, speaking), change orb behavior (e.g. enlarge and change color when speaking, ripple/glow when listening).  
- **Particle Effects:** Add small moving particles or background lines behind the orb for depth. Use performant WebGL or Canvas if needed. The background grid (from initial design) should animate subtly.  
- **State Transitions:** When switching modes (idle → listening → thinking → speaking), animate orb transitions (scale, opacity) smoothly over 0.5–1s. Avoid “jumps”. Ensure all transitions use easing and do not block the UI.  
- **Developer Tools:** Expose controls to manually set orb state for testing (e.g. a debug panel dropdown: Idle/Listening/Thinking/Speaking). This helps fine-tune animations.  
- **Consistency:** Ensure light/dark mode does not break orb visuals. Orb overlays (particles, glow) should adapt to theme (brighter in dark mode, darker in light).  

Subtle **micro-interactions** and motion make the interface engaging. Small animations (like a button highlight on hover or a chat bubble fade-in) guide the user’s eye. For example, animating the chat input focus or the orb’s idle pulse encourages a sense of calm activity. Use CSS transitions or requestAnimationFrame for smooth 60fps animations.

**Stop Conditions:**  
- Orb renders at correct scale and color in both light and dark modes.  
- All orb states (idle/listening/thinking/speaking) have an animation sequence that plays fully. The orb never “teleports” or glitches.  
- Animations run smoothly on target devices (60 FPS on desktop, 30+ FPS on mobile).  
- Developer can simulate each orb state via UI controls without reloading.

**Verification:**  
- Manual testing or automated visual regression tests (e.g. Percy) show orb states match design (compare before/after screenshots).  
- Use browser dev tools to throttle CPU/GPU to ensure animations degrade gracefully.  
- Check the performance profiler: no long scripting tasks each frame (should mostly be in GPU).  
- Ensure keyboard/nav accessibility: orb’s motion is decorative, not interfering with focus outline or reading order.

**Codex Prompt:**  
> *“Implement the Orb in Vayu’s UI with stateful animations. The Orb should pulse slowly when idle, expand with a soft glow when listening, shimmer or rotate while ‘thinking’, and vibrate slightly when speaking. Use CSS animations or a JS animation library (like Framer Motion). Also create a debug panel to switch the orb’s state manually (Idle, Listening, Thinking, Speaking) to test these animations. Ensure transitions are smooth (eased over ~700ms) and work in both dark and light themes.”*  

## Phase 5 — Conversation Engine (Streaming Chat, Interruptions, Voice)  
**Goals:** Finalize the chat interaction flow, including streaming responses and voice integration. The UI should feel **responsive and under control**. Key features:  
- **Streaming Responses:** Display LLM output token-by-token (or sentence-by-sentence) as it arrives, so the user sees progress in real time. Use an accessible live region (`aria-live`) to announce updates for screen readers. Handle partial Markdown gracefully: buffer incomplete formatting (e.g. wait for closing `**` before rendering bold text) to avoid layout shifts. Avoid reflowing entire chat on each token—append text to a static container.  
- **Stop/Retry Controls:** Provide a prominent “Stop” button while streaming (not hidden in menu), allowing the user to abort the response mid-stream. After stopping or after full response, offer a “Retry” button to regenerate the last answer (preserving the original prompt).  
- **Interruptions & Editing:** Allow the user to click on a past user message to edit and re-run the conversation from that point. The UI should smoothly handle such branching without losing context.  
- **Voice Mode:** Ensure seamless switch between text chat (Hands-on) and voice chat (Hands-free). When in voice mode, display a transcript in real time and partial Orb animation. Ensure that incoming speech does not override the chat context incorrectly.  
- **Accessibility:** Follow best practices for chat UIs. For example, provide example prompts or hints in the input box to guide users (per [24] suggestion to frame interaction), and make sure all interactive elements are keyboard-accessible.  

The frontend should solve common AI chat UX problems: guide the user on what to say, clearly communicate state (e.g. “Vayu is typing…” shimmer), and allow trust-building controls (stop, source citations to be added later).

**Stop Conditions:**  
- Chat responses appear token-by-token with no “laggy” waits.  
- The Stop button reliably aborts the generation and makes the UI interactive again. Retry regenerates a new response.  
- Switching between text and voice modes preserves the conversation (no restart) and animates the Orb accordingly.  
- All chat and voice interactions work identically across light/dark theme.

**Verification:**  
- Simulate a slow network or a large LLM response: verify the UI stays responsive and partial content flows smoothly (no blank freezes).  
- Press “Stop” and ensure the streaming loop actually stops (check no more tokens arrive, no errors).  
- After editing a previous message and re-submitting, the new branch of conversation displays correctly.  
- Run the “AI Chat UI Best Practices” accessibility checklist (aria attributes, focus management) as recommended by [24].  

**Gemini Prompt:**  
> *“Enhance the chat interface for Vayu with streaming and control features. Implement token-by-token streaming of the LLM response using a `<ResponseViewer>` component that buffers incomplete markdown and supports an onStop callback. Add prominent Stop and Retry buttons for interrupted or bad outputs. Ensure the chat input has suggestions or placeholder text as examples. Also, integrate the voice transcript view so that spoken words appear in the chat like text messages. Follow modern AI chat UI patterns (streaming baseline, feedback controls).”*  

## Phase 6 — Memory (Long-term and Session Memory)  
**Goals:** Build the conversation memory system so Vayu can remember facts and context across sessions. Implement at least:  
- **Working Memory:** Track recent dialogue turns (e.g. last 10 messages) in memory. This is already handled by the context builder, but ensure you can query and modify it (for example, remove irrelevant chatter).  
- **Episodic/Semantic Memory:** After each conversation, summarize key points and save as memory records. Use vector embeddings and a vector store (e.g. Pinecone or Weaviate) for semantic recall. For example, if the user mentions “I like jazz music”, save that. Next time the user says “play something”, Vayu retrieves “user likes jazz” and uses it.  
- **Memory Injection:** On a new session, retrieve the user’s profile and recent memories, inject them into the system prompt or conversation history. Only inject relevant bits (filter by topic).  
- **Versioning and Summarization:** When storing new memories, create concise summaries or titles. Tag each memory with metadata (source, date) as [6] advises, so you can filter/hybrid-search later.  
- **Compression:** If conversation history grows long, periodically summarize or compress older parts to free context window space (store summary in memory instead).

Always summarize conversational history before storing (raw transcripts are noisy). Inject only relevant context (less is more in prompt). Ensure memory records are versioned or timestamped so changes over time are tracked.

**Stop Conditions:**  
- Vayu retains key user info: e.g. after telling the assistant the user’s favorite hobby, Vayu recalls it without prompting.  
- On new chat sessions, relevant memories appear in the initial context (and irrelevant ones do not clutter).  
- Memory layer can be turned on/off or swapped (unit tests should demonstrate that toggling memory doesn’t break the pipeline).  

**Verification:**  
- Unit test: simulate a conversation with known facts (e.g. “I have a cat named Luna”), then in a later conversation query “What is my cat’s name?” and check Vayu responds correctly.  
- Inspect the vector database: ensure embeddings are created and retrieval returns sensible results.  
- Check that older chat messages get replaced by summary records in the DB.  
- Profiling: ensure memory lookups do not exceed a reasonable time threshold (cache if necessary).

**Claude Prompt:**  
> *“Implement the memory subsystem for Vayu with separate stores: WorkingMemory (for the current session), EpisodicMemory (past sessions), and a semantic store (vector DB). After each session, write a short summary of the conversation to EpisodicMemory. On new sessions, inject recent memory summaries into the prompt. Use embeddings to retrieve memories: given the current user message, do a nearest-neighbor search over stored memory chunks and include the top-k relevant ones. Ensure memory operations are abstracted so we can plug in different DBs.”*  

## Phase 7 — Tools Integration  
**Goals:** Enable Vayu to use external tools (APIs, calculators, browser, etc.) as skills. For each tool:  
- **Tool Definition:** Create a dedicated folder under `services/tools/` (or `app/api/tools/` on backend) for each tool (e.g. `calendar/`, `browser/`, `notes/`, `weather/`). Each should include:  
  - A clear **function signature** or schema (what inputs it takes, output format).  
  - The **implementation** calling the external service or internal code (e.g. a Python function that queries a calendar API).  
  - **Documentation:** a description of what the tool does and how to use it.  
  - **Tests:** unit tests using dummy data (e.g. mock the API response) to verify correctness.  
- **Registration:** Register tools in the system so the AI can see what tools are available. For example, use a decorator or registration call that adds each tool to a catalog with its function signature. This catalog can be used by the LLM (via a tool-calling framework) to plan actions.  
- **Invocation:** Update the AI runtime (Phase 2) to allow the LLM to trigger tools. This might follow a ReAct pattern: the LLM outputs an action with a tool name and args, the backend executes it, and the result is fed back to the LLM in a new turn.  
- **Safety/Governance:** Sandbox tools as needed (e.g. limit browser access, enforce CORS). Validate tool outputs (see below).  

Use the “tools as agents” approach: e.g., with LangChain/Graph you might define tools with `@tool` decorators, then bind them to the model. After a tool runs, *verify-then-trust* the result: for example, if a calculator returns a number, the model can double-check the calculation to guard against hallucinated tool use.

**Stop Conditions:**  
- At least one example tool (e.g. weather lookup or calculator) is fully integrated: the LLM can call it, and Vayu returns its output.  
- Tool calls are logged and traced (see Phase 10) with inputs/outputs.  
- Running `pytest` executes tests for tools successfully.

**Verification:**  
- Write a conversation test where the user asks something that requires a tool (e.g. “What’s the weather in Paris today?”) and confirm the tool output is used.  
- Inspect the tool catalog: it should list all tools and schemas.  
- Use a debug mode where you simulate a planning step: ensure the LLM’s output is parsed into a tool call and that the returned value gets back into the chat loop.  
- Edge-case: pass invalid input to a tool and ensure errors are caught (not causing the whole agent to crash).

**Codex Prompt:**  
> *“Design Vayu’s tool framework. For each tool (calendar, search, notes, etc.), create a Python function with a defined schema and register it. For example, `@tool def get_weather(city: str) -> str:`. Ensure the AI can call these tools via a plan. After a tool runs, include its result in the conversation. Add tests that mock the tool APIs. Emphasize a ‘verify-then-trust’ step: after executing a tool, have the agent re-check critical outputs against expectations to catch errors.”*  

## Phase 8 — Intelligence (Planning, Reflection, Self-Correction)  
**Goals:** Elevate Vayu from a reactive chatbot to an **autonomous reasoning agent**. Introduce planning, decomposition, and self-improvement mechanisms. Key strategies:  
- **Plan-and-Execute Loop:** Enable Vayu to break user tasks into subtasks. For example, “Plan a meeting” → step1: check user calendar, step2: propose times, step3: schedule. Implement an iterative loop: *Perceive (current state and input) → Plan (list next actions) → Act (execute one action, possibly via tools) → Observe (get results) → repeat until done*.  
- **Task Decomposition:** Use few-shot or chain-of-thought prompts to instruct the model to decompose complex instructions into a list of steps, then execute them one at a time.  
- **Reflection / Self-Correction:** After completing an action or chain, have the model evaluate results. If something went wrong (or upon user request), allow a reflection step: the model reviews the conversation and outcomes, identifies errors, and retries with adjustments. For example, if Vayu booked the wrong date, it can say “I made a mistake: it should have been X, let me fix that.” Implement a loop that on failure triggers a reflection prompt to generate a corrected plan.  
- **Multi-Agent / Swarms (future):** Consider a supervisor agent or multiple cooperating agents for very complex tasks. For now, focus on a single agent that can call tools and reason.  

This moves Vayu toward an *agentic architecture* where control flow is model-driven. Instead of a single prompt-response, design a loop where Vayu “thinks” in steps. Balance autonomy with safety by setting a limit on loop iterations and using guardrails (e.g. user confirmation for high-impact steps).

**Stop Conditions:**  
- Vayu can outline and follow a multi-step plan for a non-trivial user request. For example, for “Organize a coffee meeting with Alice and Bob” it should call the calendar, send invites, etc.  
- If the model outputs an invalid action (like an impossible date), Vayu invokes a reflection step, corrects it, and succeeds (all without developer intervention).  
- Loops terminate (no infinite planning).  
- The user can see (e.g. via logs or UI) that Vayu planned multiple steps instead of a simple response.

**Verification:**  
- Construct a series of integration tests: ask Vayu to do tasks that require multiple steps and check final outcome.  
- Simulate an error in the middle (e.g. tool returns unexpected data) and verify the reflection mechanism kicks in.  
- Measure that the agent’s reasoning loop doesn’t exceed a set depth (to avoid runaway costs).  

**Gemini Prompt:**  
> *“Upgrade Vayu’s reasoning: implement a planning loop where the model generates a list of subtasks to achieve a user goal, executes them sequentially (via tool calls or internal logic), and loops back until the task is done. After execution, have the model 'reflect' on its work: if an outcome is wrong or missing, instruct it to re-evaluate and fix the plan. For example, use LangGraph or LangChain patterns to interleave ‘Plan’ and ‘Act’ steps, and include a few-shot or in-context example of a reflection step.”*  

## Phase 9 — Polish (UX, Audio, Performance)  
**Goals:** Refine the entire experience so it feels seamless and polished. Focus on **micro-interactions**, feedback, and performance optimizations:  
- **Micro-Interactions:** Add small animations and sound cues to acknowledge actions (e.g. a soft “whoosh” when a message sends, a subtle highlight when switching modes). According to UX research, these details turn routine tasks into delightful moments. Ensure they are not distracting or slow.  
- **Audio Feedback:** For hands-free mode, ensure that voice input and TTS output have clear signals (chimes or clicks to indicate start/stop listening and speaking). Synchronize orb animations with audio (e.g. a waveform pulse).  
- **Accessibility:** Conduct an accessibility audit: ensure high-contrast modes, screen-reader labels for all buttons, keyboard navigation, adjustable font sizes, etc.  
- **Internationalization (optional):** If planning for multiple languages, externalize all UI text now.  
- **Performance:** Optimize for smoothness: lazy-load non-critical code, minimize re-renders (e.g. use React.memo for chat bubbles), and keep the frame rate high. Use the [performance techniques for web animations](#) (hardware-accelerate the orb, avoid expensive canvas draws).  
- **Haptics (future mobile):** Design light vibration cues for mobile use (not yet required, but plan API stubs in case of a mobile app).  
- **User Testing:** At this stage, conduct usability testing or internal demos and polish based on feedback.

**Stop Conditions:**  
- UI animations run at target FPS. No noticeable lag or jank in chat or orb motion.  
- Accessibility violations (via an automated axe or Lighthouse audit) are all addressed (no critical errors).  
- No UI feature is missing explanatory text or placeholder (e.g. all buttons have tooltips or labels).  

**Verification:**  
- Run Lighthouse or performance audits: ensure Time to Interactive (TTI) and CPU usage are acceptable.  
- Use User Testing or heuristics checklist to catch any confusing element.  
- Ensure memory leaks are fixed (check that leaving the chat page doesn’t leave intervals running).  
- Cross-browser check: UI works on Chrome, Safari, Firefox, and mobile browsers.

**Claude Prompt:**  
> *“Polish the Vayu app: add engaging micro-animations (button presses, message arrival), sound cues, and ensure 60fps rendering. Implement any missing accessibility features (ARIA labels, focus outlines). Example: add a hover highlight on chat bubbles or a brief pop animation on send. Also prepare the UI for future i18n by moving all text to a resource file. Finally, run performance profiling and eliminate any slow React renders or large bundle issues.”*  

## Phase 10 — Production (CI/CD, Monitoring, Testing)  
**Goals:** Prepare Vayu for deployment and scale. Complete the DevOps and quality checklist:  
- **Containerization:** Write Dockerfiles for the backend and any other services. Set up Docker Compose or Kubernetes manifests so the entire stack (web, api, vector DB, etc.) can be launched easily.  
- **CI/CD Pipeline:** Configure continuous integration to run tests, linters, and builds on each commit. Automate deployment (to a staging environment) on merge to main. Include a checkout, install, test, build, and package stages. Use stable versions (Pin dependencies).  
- **Automated Testing:** Beyond unit tests, add end-to-end tests (e.g. Playwright or Cypress) to simulate a user chat flow. Add regression tests for key features (chatting, voice toggle, theme switch). Ensure 100% test coverage on core logic.  
- **Logging and Monitoring:** Integrate logging and monitoring (e.g. Sentry, Prometheus/Grafana). For each request/agent run, log context and errors. Implement AI-specific observability: instrument spans as per OpenTelemetry’s GenAI conventions. For example, wrap each LLM call in a `gen_ai.request` span (model name, tokens) and each tool call in `gen_ai.execute_tool`. This will enable trace-based debugging (see Sentry’s guidelines).  
- **Metrics and Alerts:** Set up metrics (agent error rates, latency p95, token usage costs). Configure alerts for critical failures (e.g. >5% request error) or latency spikes.  
- **Documentation:** Write detailed README and developer docs. Include API docs (Swagger from FastAPI). Record any developer how-tos (e.g. “How to add a new tool”, “How to interpret logs”).  
- **Versioning & Releases:** Tag releases semantically. Maintain a changelog.  

**Stop Conditions:**  
- A successful end-to-end deployment (e.g. via `docker-compose up`) spins up Vayu without manual steps.  
- All automated tests pass and the build pipeline runs green.  
- Logs and metrics from a sample conversation (in staging) appear in the monitoring dashboard.  
- The final UX is identical in staging/production (no debug overlays).

**Verification:**  
- Do a load test or smoke test on the deployed service to ensure stability under expected traffic.  
- Verify that all environment variables (API keys, DB URLs) are correctly managed (e.g. via secrets).  
- Review monitoring dashboards: agent traces should show each model/tool invocation as per GenAI spec (allowing debugging of any request).

**Claude Prompt:**  
> *“Set up production infrastructure for Vayu. Write Dockerfiles for the web and API, and a CI pipeline that builds, tests, and deploys the containers. Implement OpenTelemetry tracing with `gen_ai` spans: each FastAPI request should create a `gen_ai.invoke_agent` span with child spans for `gen_ai.request` (LLM call) and `gen_ai.execute_tool` (tool calls) as shown in Sentry’s example. Also add alerts for high latency or errors. Generate a basic Prometheus dashboard config that tracks request rate, model latency, and token usage costs.”*  

---

**Overall Verification:** By the end of Phase 10, Vayu should be production-ready: fully modular, extensively tested, and with rich observability. The complete system satisfies: clean architecture (no “misc” catch-all code), an auditable AI pipeline (context→prompt→LLM→tools→response), and an immersive user experience from idle orb to spoken response. The prompts and design decisions above ensure that each phase is fully specified, independently verifiable, and can be bootstrapped by AI-assisted coding where indicated.  

**Key References:** This plan incorporates industry best practices from monorepo design, FastAPI structuring, feature-based frontend architecture, modern AI chat UI patterns, three-layer agent memory, and AI agent observability. Each phase’s stop criteria and prompts are grounded in these standards.  

