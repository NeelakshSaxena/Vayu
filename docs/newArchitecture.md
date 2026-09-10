# Vayu AI Project: Conversation Engine + Open-Source–First System Design Roadmap

## Current State

Vayu is currently at:

```text
origin/conversation-engine
```

This is the **existing foundation**.

The objective is **not to rebuild Vayu from scratch**.

Instead, Vayu should use the existing Conversation Engine as the integration point and adopt mature open-source technologies for the capabilities required to turn it into a full agentic AI system.

The development philosophy is:

> **Reuse → Integrate → Adapt → Extend → Build only what is missing.**

Do not implement a custom version of functionality that is already mature, tested, and suitable for Vayu.

---

# Architecture Strategy

The target architecture is:

```text
                         VAYU
                           │
                           ▼
                ┌─────────────────────┐
                │ Conversation Engine │
                │                     │
                │ EXISTING FOUNDATION │
                └──────────┬──────────┘
                           │
             ┌─────────────┼──────────────┐
             │             │              │
             ▼             ▼              ▼
         Agent Runtime   Memory        Tool Runtime
             │             │              │
             │             │              │
             ▼             ▼              ▼
        Open-source     Existing /     Open-source
        framework       specialized    tool systems
             │             │              │
             └─────────────┼──────────────┘
                           │
                           ▼
                     Task Runtime
                           │
                    ┌──────┴──────┐
                    ▼             ▼
                  Queue         Workers
                    │             │
                    └──────┬──────┘
                           ▼
                    Notification Layer
```

Vayu owns:

* Conversation Engine integration
* product behavior
* user experience
* agent configuration
* orchestration policy
* permissions
* task lifecycle
* UI
* integrations specific to Vayu

Open-source projects should provide as much of the underlying machinery as practical.

---

# Technology Reuse Policy

Before implementing any subsystem, perform this sequence:

```text
1. Does a mature open-source solution exist?
             │
        YES  │  NO
         │   │   │
         ▼   │   ▼
     Evaluate│ Build
         │
         ▼
Can it integrate cleanly?
         │
     ┌───┴───┐
    YES      NO
     │        │
     ▼        ▼
 Integrate   Build adapter /
             replace only missing piece
```

Do not copy large sections of third-party code simply because they exist.

Prefer:

```text
dependency
   ↓
adapter
   ↓
Vayu interface
```

rather than:

```text
copy entire framework
   ↓
modify framework
   ↓
maintain fork forever
```

This keeps Vayu maintainable and dramatically reduces development time.

---

# Phase 0 — Audit `origin/conversation-engine`

## Goal

Understand exactly what already exists.

Do **not** replace the Conversation Engine.

Audit:

* conversation state
* messages
* streaming
* events
* execution lifecycle
* LLM integration
* context handling
* persistence
* cancellation
* retry behavior
* WebSocket/API layer
* frontend integration
* tests

Create an explicit integration contract:

```text
Conversation Engine
       │
       ├── accepts user input
       ├── creates execution
       ├── emits events
       ├── streams output
       └── completes execution
```

Then identify where external agent frameworks, tools, memory, and task workers can plug into it.

## Stop Conditions

* Current architecture is understood.
* Existing behavior works.
* Existing tests pass.
* Integration points are documented.
* No duplicate Conversation Engine is created.

---

# Phase 1 — Select Existing Agent Technology

## Goal

Do **not** build the agent loop yourself initially.

Evaluate mature open-source agent frameworks/runtime projects such as:

### LangGraph

Use as the primary candidate for:

* stateful agent execution
* graph-based workflows
* checkpoints
* resumability
* human-in-the-loop
* multi-step execution

### OpenHands

Study/use where appropriate for:

* autonomous execution
* long-running agent behavior
* tool/runtime architecture
* execution environments
* agent event systems

### smolagents

Use as a reference or lightweight implementation for:

* simple agent loops
* tool calling
* minimal agent abstractions

### CrewAI

Evaluate for:

* multi-agent orchestration
* role/task abstractions
* delegation

### Letta

Evaluate for:

* persistent agent memory
* memory/state architecture
* long-lived agents

### Agno

Evaluate for:

* agent runtime
* tools
* sessions
* teams
* model abstraction

The goal is **not to use all of them**.

Select the smallest combination that provides the required functionality.

A likely direction is:

```text
Conversation Engine
       │
       ▼
LangGraph / compatible Agent Runtime
       │
       ├── Tools
       ├── Memory
       └── Tasks
```

while using OpenHands/Letta/smolagents/CrewAI primarily as architectural references or selectively adopted components.

## Stop Conditions

* Agent framework candidates are evaluated.
* One primary runtime is selected.
* Vayu does not contain a custom agent loop unless the selected framework genuinely cannot provide the requirement.
* An adapter/interface isolates Vayu from framework-specific APIs.

---

# Phase 2 — Integrate Agent Runtime with Conversation Engine

## Goal

Connect the selected open-source agent runtime to `origin/conversation-engine`.

The architecture should be:

```text
User
 ↓
Conversation Engine
 ↓
Agent Adapter
 ↓
Agent Framework
 ↓
Tools / Memory
 ↓
Agent Framework
 ↓
Agent Adapter
 ↓
Conversation Engine
 ↓
User
```

The Conversation Engine remains Vayu's canonical interaction layer.

The agent framework handles:

```text
Plan
 ↓
Act
 ↓
Observe
 ↓
Continue
```

Vayu should translate framework events into Conversation Engine events.

For example:

```text
Agent framework:
TOOL_STARTED

        ↓ adapter

Conversation Engine:
TOOL_EXECUTION_STARTED
```

This prevents the framework from leaking throughout the Vayu codebase.

## Stop Conditions

* Agent can be invoked from a normal conversation.
* Agent events appear through the Conversation Engine.
* Tool calls work.
* Agent results become normal conversation responses.
* Framework-specific APIs are isolated behind an adapter.

---

# Phase 3 — Adopt Existing Tool Infrastructure

## Goal

Avoid creating a custom tool ecosystem unnecessarily.

Evaluate existing standards and frameworks for:

* tool schemas
* function calling
* MCP
* tool registries
* authentication
* permissions

Where appropriate, use **MCP-compatible tools** rather than inventing a proprietary tool protocol.

Architecture:

```text
Conversation Engine
       ↓
Agent Runtime
       ↓
Tool Registry / MCP
       ↓
┌──────┼─────────┐
▼      ▼         ▼
Search Calendar Browser
```

Vayu-specific tools should implement the standard interface.

Example:

```text
tools/
├── search
├── browser
├── calendar
├── filesystem
└── github
```

Each tool should expose a machine-readable schema.

## Stop Conditions

* Agent can discover tools.
* Existing compatible tools can be plugged in.
* Vayu-specific tools use the same interface.
* Permissions and authentication are handled outside individual tool functions where possible.
* Tool execution is observable.

---

# Phase 4 — Adopt Existing Memory Technology

## Goal

Do not immediately create a custom vector/memory database architecture.

Evaluate existing solutions according to the actual requirements.

Potential technology:

```text
PostgreSQL
+
pgvector
```

for straightforward persistent memory/RAG.

Evaluate:

* Letta
* vector stores
* embedding providers
* existing RAG libraries

The initial architecture should remain simple:

```text
Conversation Engine
       │
       ▼
Memory Adapter
       │
       ├── Working Memory
       ├── Episodic Memory
       └── Semantic Retrieval
```

The Conversation Engine asks for relevant context.

The memory implementation decides how to retrieve it.

## Stop Conditions

* Existing conversation context works.
* Relevant memories can be retrieved.
* Memory implementation can be replaced.
* No unnecessary custom vector database is created.
* Memory does not own conversation execution.

---

# Phase 5 — Background / Long-Running Task Runtime

## Goal

Implement:

> **“Give Vayu a job, leave, and come back when it is finished.”**

Do not build a custom distributed task system.

Use mature infrastructure.

Preferred initial stack:

```text
FastAPI
   ↓
Redis
   ↓
ARQ / Celery / equivalent
   ↓
Worker
   ↓
Agent Runtime
```

Evaluate the existing infrastructure before choosing between queue technologies.

The task lifecycle:

```text
Conversation Engine
       ↓
Create Task
       ↓
Queue
       ↓
Worker
       ↓
Agent Runtime
       ↓
Tools / Memory / Search
       ↓
Checkpoint
       ↓
Continue
       ↓
Completed
```

Persistent task state should live in the database.

The queue is for execution, not the permanent source of truth.

## Task States

```text
CREATED
QUEUED
RUNNING
WAITING_FOR_APPROVAL
PAUSED
COMPLETED
FAILED
CANCELLED
```

## Checkpointing

Use the selected agent framework's existing checkpoint/state capabilities wherever possible.

Do not implement an independent checkpoint system unless required.

For example:

```text
Agent Framework
      │
      ▼
Checkpoint
      │
      ▼
Task Runtime
```

## Stop Conditions

* Long-running tasks run outside HTTP requests.
* User receives immediate acknowledgement.
* Worker executes independently.
* Agent state can be resumed.
* Task state survives worker restarts.
* Tasks can be cancelled.
* Failed tasks can retry.
* User can approve and resume paused tasks.

---

# Phase 6 — Notifications

## Goal

Use existing notification infrastructure instead of building a custom notification platform.

For active sessions:

```text
WebSocket / SSE
```

For users who leave:

```text
Web Push
```

Optional:

```text
Email
Telegram
Discord
Slack
```

Architecture:

```text
Task Runtime
      ↓
Task Event
      ↓
Notification Adapter
      ↓
Provider
```

The worker should never contain:

```python
send_email(...)
```

Instead:

```text
TASK_COMPLETED
      ↓
Notification Service
      ↓
selected provider
```

This allows notification providers to change without touching the agent runtime.

---

# Phase 7 — Agent Planning, Reflection & Multi-Step Execution

## Goal

Use the selected agent framework's existing capabilities before implementing custom reasoning loops.

Required behavior:

```text
Goal
 ↓
Plan
 ↓
Action
 ↓
Observation
 ↓
Reflection
 ↓
Next Action
 ↓
...
 ↓
Result
```

Use framework-native:

* state
* graph/workflow execution
* retries
* checkpoints
* human approval
* tool calling

where available.

Only implement custom Vayu logic around these capabilities.

## Multi-Agent

Do not start with a swarm.

First achieve:

```text
One strong agent
+
Good tools
+
Good memory
+
Good task runtime
```

Then evaluate whether multi-agent orchestration is actually necessary.

If needed, use CrewAI/LangGraph or another proven framework rather than implementing a custom swarm protocol.

---

# Phase 8 — Frontend Integration

## Goal

The frontend should reflect the Conversation Engine's event stream.

Feature structure:

```text
features/
├── conversation/
├── tasks/
├── agents/
├── tools/
├── memory/
├── voice/
└── orb/
```

The task interface should make background execution obvious.

Example:

```text
┌────────────────────────────────────┐
│ Task accepted                      │
│                                    │
│ Vayu is working on this in the    │
│ background.                        │
│                                    │
│ You can leave this conversation.   │
│ We'll notify you when it's ready. │
│                                    │
│ [ View Task ]                      │
└────────────────────────────────────┘
```

Task dashboard:

```text
MY TASKS

● Research AI internships
  Running · 57%

✓ Analyze portfolio
  Completed

⏸ Organize calendar
  Waiting for approval
```

The UI should consume events rather than implement its own approximation of agent state.

---

# Phase 9 — Voice & Orb Integration

## Goal

Voice becomes another interface to the Conversation Engine.

```text
STT
 ↓
Conversation Engine
 ↓
Agent Runtime
 ↓
Conversation Events
 ↓
TTS
```

The Orb reflects the actual runtime:

```text
IDLE
LISTENING
THINKING
TOOL_RUNNING
WAITING
SPEAKING
COMPLETED
ERROR
```

The Orb should not contain agent logic.

It should simply visualize engine state.

---

# Phase 10 — Production Hardening

## Goal

Use existing infrastructure wherever possible.

### Observability

Evaluate/use:

* OpenTelemetry
* Sentry
* Prometheus
* Grafana
* Langfuse or equivalent LLM observability

Rather than building custom tracing.

Trace:

```text
Conversation
 └── Agent Execution
      ├── Context
      ├── Memory
      ├── LLM
      ├── Tool
      ├── LLM
      └── Result
```

For background work:

```text
Task
 └── Worker Execution
      └── Agent Execution
           ├── LLM
           ├── Tools
           └── Result
```

### Infrastructure

Prefer proven infrastructure:

```text
PostgreSQL
Redis
Docker
OpenTelemetry
Sentry
Prometheus/Grafana
```

rather than custom replacements.

### Testing

Use:

* pytest
* Playwright
* framework-provided testing utilities
* mocked LLM providers
* integration tests
* task-worker tests

---

# Technology Reuse Matrix

The following should be the default strategy:

| Capability                | Prefer Reusing                                          | Vayu Builds              |
| ------------------------- | ------------------------------------------------------- | ------------------------ |
| Conversation              | `origin/conversation-engine`                            | Integration              |
| Agent graph/runtime       | LangGraph or selected framework                         | Adapter                  |
| Autonomous coding/runtime | OpenHands concepts/components where useful              | Integration              |
| Simple agents             | smolagents patterns                                     | Adapter if needed        |
| Multi-agent               | CrewAI / LangGraph                                      | Configuration            |
| Memory                    | Letta concepts / PostgreSQL + pgvector / suitable store | Memory adapter           |
| Tool protocol             | MCP / existing tool systems                             | Vayu tool definitions    |
| Background queue          | Redis + ARQ/Celery/equivalent                           | Task integration         |
| Checkpoints               | Agent framework                                         | Task persistence adapter |
| WebSocket                 | FastAPI                                                 | Vayu event integration   |
| Push notifications        | Web Push infrastructure                                 | Notification adapter     |
| LLM providers             | Existing SDKs                                           | Provider adapter         |
| Observability             | OpenTelemetry / Sentry / Langfuse                       | Instrumentation          |
| Frontend                  | React ecosystem                                         | Vayu UX                  |
| Voice                     | Existing STT/TTS providers                              | Integration              |
| Containers                | Docker                                                  | Configuration            |
| CI                        | GitHub Actions/etc.                                     | Pipeline configuration   |

---

# The Rule for AI-Assisted Development

When asking Codex/Claude/Gemini to implement a feature, prompts should explicitly prohibit unnecessary reinvention.

Every implementation prompt should contain the principle:

> **“Before implementing a subsystem, inspect the existing repository and determine whether the functionality already exists in the current architecture or can be provided by an established open-source dependency. Reuse existing functionality where possible. Do not create a parallel implementation. Adapt existing systems through clean interfaces.”**

For example, instead of:

> “Build an agent system.”

Use:

> “Integrate the selected agent framework into Vayu's existing `origin/conversation-engine` architecture. Do not implement a custom agent loop unless the framework cannot satisfy a documented requirement. Create the smallest adapter necessary to translate framework execution events into Conversation Engine events.”

That distinction should be applied to **every future development task**.

---

# Final Target

The finished Vayu architecture should look like:

```text
                         VAYU
                           │
                           ▼
              ┌──────────────────────┐
              │ Conversation Engine  │
              │   EXISTING CORE      │
              └──────────┬───────────┘
                         │
            ┌────────────┼─────────────┐
            │            │             │
            ▼            ▼             ▼
         Memory        Agent         Tools
        Adapter       Runtime       / MCP
            │            │             │
            │       Open-source       │
            │       framework         │
            │            │             │
            └────────────┼─────────────┘
                         │
                         ▼
                    Task Runtime
                         │
                    Redis / Queue
                         │
                       Worker
                         │
                    Agent Runtime
                         │
                         ▼
                      Result
                         │
                         ▼
                  Notification Layer
                         │
               ┌─────────┼─────────┐
               ▼         ▼         ▼
             WebSocket  Push      Email
```

The important part is that **Vayu is the product and integration layer, not a collection of home-grown replacements for every existing AI technology.**

The Conversation Engine is Vayu's core.

Everything else should be selected, integrated, adapted, and only then extended.

---

# Overall Verification

Vayu is ready for the next stage when:

1. `origin/conversation-engine` remains the canonical conversation runtime.
2. A proven open-source agent framework powers autonomous execution.
3. Tools use existing standards where practical.
4. Memory uses an established persistence/retrieval technology.
5. Background tasks use a proven queue/worker system.
6. Agent state/checkpointing uses existing framework capabilities where possible.
7. Notifications use established delivery mechanisms.
8. Observability uses established tooling.
9. Vayu-specific code primarily handles integration, policy, UX, product behavior, and unique capabilities.
10. No major subsystem has been unnecessarily reinvented.

The ultimate principle is:

> **Do not spend six weeks building infrastructure that an open-source project already spent two years building. Spend those six weeks making Vayu better.**
