# Decision Log
**Project:** Najah AI  
**Format:** DATE | DECISION | RATIONALE

---

## 2026-04-16 — Build Session 1 (MVP + V2)

### ARCH-001: Next.js 14 App Router
**Decision:** Use Next.js 14.2.35 (not 15) with App Router.  
**Rationale:** Next.js 14 is stable; `.ts` config files are only supported in v15+. Using `.mjs` for next.config ensures compatibility. App Router aligns with current React patterns and Supabase SSR client.

### ARCH-002: next.config.mjs instead of .ts
**Decision:** Use `next.config.mjs` (not `.ts`).  
**Rationale:** Next.js 14 does not support TypeScript config files. `.mjs` works correctly with the JSDoc type annotation.

### DB-001: RLS on all tables
**Decision:** Row Level Security enabled on all 15 tables.  
**Rationale:** Supabase projects have RLS disabled by default. With multi-tenant auth (student/parent/admin), every table must have explicit policies. Skipping this would expose student data.

### DB-002: Server-side invite code generation
**Decision:** `generate_invite_code` and `claim_invite_code` implemented as PostgreSQL SECURITY DEFINER functions, not client-side logic.  
**Rationale:** Code uniqueness must be guaranteed by the DB. Client-side generation would have race conditions and could be abused. Security definer means the user's RLS is bypassed for the atomic check+insert.

### DB-003: tutor_sessions unique constraint (student_id, subject, lesson_id)
**Decision:** One active session per (student, subject, lesson) context.  
**Rationale:** Allows upsert-based persistence. A new session per chat would create unbounded rows. Students return to the same lesson and should see their conversation history.

### AI-001: Socratic method enforcement in system prompt
**Decision:** Hard-coded rule "NEVER give the final answer without guiding" in the AI system prompt.  
**Rationale:** The product's pedagogy explicitly requires guided discovery. An AI that gives direct answers trains dependency, not understanding. This is the most important pedagogical constraint on the AI.

### AI-002: Rate limiting via database table (not Redis/in-memory)
**Decision:** Use `api_rate_limits` table in Supabase to track AI requests, 30/hr per student.  
**Rationale:** No Redis available in the stack. DB-based rate limiting is slightly slower but works correctly across multiple serverless instances and requires no new infrastructure. 30/hr is generous enough for legitimate use but blocks abuse.

### AI-003: Adaptive context injection (lesson + weak topics)
**Decision:** Fetch lesson content preview and student's weak topics from DB before every AI call.  
**Rationale:** A generic AI response is much less effective than one that knows the student's weak areas and the current lesson. This turns the tutor from a generic chatbot into a contextually aware learning assistant.

### UX-001: Mastery threshold at 50%
**Decision:** Students must score ≥ 50% to mark a lesson complete. Score < 50% disables "Mark complete" and shows "Review lesson" button.  
**Rationale:** Learning science: allowing completion without minimum mastery defeats the purpose of assessment. 50% is a non-threatening minimum that still enforces some understanding. 75%+ shown as "Great work" per spec.

### UX-002: Invite codes (XXXX-XXXX) instead of raw UUIDs
**Decision:** Parents link children via human-readable 8-char invite codes, not UUIDs.  
**Rationale:** The original MVP used raw UUIDs for parent linking. UUIDs (e.g. `a3f2...`) are not user-friendly for parents to type or share. XXXX-XXXX codes are short, memorable, and less error-prone. The `generate_invite_code` RPC handles uniqueness.

### UX-003: Email confirmation detection on register
**Decision:** After `supabase.auth.signUp()`, check if `data.session` is null. If so, show "Check your email" screen instead of redirecting.  
**Rationale:** Supabase requires email confirmation in production by default. Without this check, the redirect would hit a protected route with no session, causing a confusing redirect loop back to login. This gives users a clear next step.

### UX-004: Skill analysis from attempts (not just diagnostic)
**Decision:** Student dashboard shows per-skill-tag performance derived from last 100 attempts, in addition to diagnostic scores.  
**Rationale:** The diagnostic is a one-time snapshot. Attempts are ongoing. Skill-level analysis from attempts gives a live view of weaknesses that updates as the student works. This is more valuable for identifying what needs practice right now.

### PERF-001: Loading skeletons via Next.js loading.tsx
**Decision:** Use Next.js route-level `loading.tsx` files for dashboard and weekly plan.  
**Rationale:** These are the two heaviest pages (multiple DB queries). The `loading.tsx` pattern in App Router shows a skeleton immediately while the async Server Component fetches data. This eliminates blank loading states.

### SEC-001: Service role key server-only
**Decision:** `SUPABASE_SERVICE_ROLE_KEY` used only in `createServiceClient()` which is called only from API routes (server-side).  
**Rationale:** The service role key bypasses RLS entirely. It must never be exposed to client-side code. The `createServiceClient()` function is in `server.ts` which is a server-only module.

### SEC-002: api_rate_limits table inaccessible to students
**Decision:** RLS policy on `api_rate_limits` is `using (false)` — no direct access from any user.  
**Rationale:** Only the service role (server) inserts rate limit records. If students could read or delete from this table, they could reset their own rate limits.

### CONTENT-001: Weeks 3-4 placeholder content
**Decision:** Seed lessons for weeks 3-4 with structured placeholder markdown (overview + topics) rather than full lesson content.  
**Rationale:** Writing high-quality lesson content for 10 lessons × 5 subjects is significant curriculum work. The platform is technically complete; content can be improved incrementally. Placeholder content demonstrates structure and enables testing.
