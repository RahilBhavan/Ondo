# Ondo Nexus Dashboard — Development Log

This file is the living record of the build. Every session is logged.
Audience: project continuity, public proof-of-work, recruiter artifact.

---

## Log Format
Each entry follows this structure:

### [YYYY-MM-DD] — Session Title
**Phase:** Phase 0 / 1 / 2 / 3
**Duration:** ~Xhr
**Goal:** What this session set out to do

**Shipped**
- Concrete thing completed

**Attempted / Blocked**
- What didn't work and why

**Learned**
- Any new domain knowledge (contract structure, Dune quirks, etc.)

**Decisions Made**
- Any architecture or methodology decision (link to DECISIONS.md if significant)

**Next Session**
- Specific goal for next session

---

## Entries

### [2026-04-09] — Project Setup
**Phase:** Phase 0
**Duration:** ~1hr
**Goal:** Establish project structure, CLAUDE.md hierarchy, slash commands

**Shipped**
- Full folder structure created
- CLAUDE.md (root) written with token-optimized session workflow
- STATUS.md initialized as one-page snapshot
- Slash commands: log-session, update-status, log-decision
- PRD finalized (13 sections)
- Architecture Decision Records initialized (ADR-001, ADR-002)

**Attempted / Blocked**
- None

**Learned**
- Claude Code auto-memory writes to ~/.claude/projects/<project>/memory/
- Subdirectory CLAUDE.md files only load when Claude touches that directory
- STATUS.md indirection keeps root context under 60 lines

**Decisions Made**
- Dune over custom subgraph (see DECISIONS.md ADR-001)
- Mock data as first-class feature (see DECISIONS.md ADR-002)

**Next Session**
- Phase 0: Scrape docs.ondo.finance + github.com/ondoprotocol
- Goal: locate all Nexus contract addresses and confirm event schema
