import React, { useState, useEffect, useMemo, useCallback } from "react";

const STORAGE_KEY = "applications";

const STATUSES = ["Applied", "Interview", "Offer", "Rejected", "Withdrawn"];

const LOCATIONS = ["Remote", "In-person", "Hybrid"];

const TYPES = ["Job", "Internship"];

const STATUS_STYLE = {
  Applied: { color: "#5B6470", bg: "#E9EBEC" },
  Interview: { color: "#8A5D18", bg: "#F3E6C8" },
  Offer: { color: "#2E6B41", bg: "#DCEADD" },
  Rejected: { color: "#8C3D28", bg: "#F1DDD4" },
  Withdrawn: { color: "#726E63", bg: "#E6E3D8" },
};

const TYPE_STYLE = {
  Job: { color: "#2E5A8A", bg: "#DCE6F1" },
  Internship: { color: "#7A4C9E", bg: "#EBE0F3" },
};

function uid() {
  return Date.now().toString(36) + Math.random().toString(36).slice(2, 7);
}

function todayISO() {
  return new Date().toISOString().slice(0, 10);
}

function formatDate(iso) {
  if (!iso) return "—";
  const d = new Date(iso + "T00:00:00");
  return d.toLocaleDateString(undefined, { month: "short", day: "numeric", year: "numeric" });
}

const EMPTY_DRAFT = { company: "", role: "", location: LOCATIONS[0], url: "", dateApplied: todayISO(), status: "Applied", type: TYPES[0], notes: "" };

export default function App() {
  const [apps, setApps] = useState(null); // null = loading
  const [draft, setDraft] = useState(EMPTY_DRAFT);
  const [showForm, setShowForm] = useState(false);
  const [filter, setFilter] = useState("All");
  const [typeFilter, setTypeFilter] = useState("All");
  const [query, setQuery] = useState("");
  const [sortKey, setSortKey] = useState("dateApplied");
  const [sortDir, setSortDir] = useState("desc");
  const [expandedId, setExpandedId] = useState(null);
  const [editingId, setEditingId] = useState(null);

  const loadApps = useCallback(async () => {
    try {
      const raw = window.localStorage.getItem(STORAGE_KEY);
      const parsed = raw ? JSON.parse(raw) : [];
      // Older entries saved before "type" existed default to "Job" so they
      // still show up under a type filter instead of disappearing.
      setApps(parsed.map((a) => ({ type: TYPES[0], ...a })));
    } catch (e) {
      // Missing key, corrupt JSON, or storage unavailable — treat it as
      // an empty log rather than an error that blocks the person from adding one.
      setApps([]);
    }
  }, []);

  useEffect(() => { loadApps(); }, [loadApps]);

  // Writes the full list to storage. Deletes the key outright once the list is empty,
  // so "delete" is exercised as its own operation rather than always storing "[]".
  const persist = useCallback(async (next) => {
    setApps(next);
    try {
      if (next.length === 0) {
        window.localStorage.removeItem(STORAGE_KEY);
      } else {
        window.localStorage.setItem(STORAGE_KEY, JSON.stringify(next));
      }
      return true;
    } catch (e) {
      // If storage is unavailable (e.g. private browsing, quota exceeded) the
      // in-memory state above still reflects the change for this session.
      return false;
    }
  }, []);

  const openNewForm = (type) => {
    setDraft({ ...EMPTY_DRAFT, type: type || TYPES[0] });
    setEditingId(null);
    setShowForm(true);
  };

  const openEditForm = (app) => {
    setDraft(app);
    setEditingId(app.id);
    setShowForm(true);
    setExpandedId(null);
  };

  const isDraftValid = (d) => d.company.trim() && d.role.trim() && d.url.trim();

  const saveDraft = () => {
    if (!isDraftValid(draft)) return;
    const list = apps || [];
    if (editingId) {
      persist(list.map((a) => (a.id === editingId ? { ...draft, id: editingId } : a)));
    } else {
      persist([{ ...draft, id: uid() }, ...list]);
    }
    setShowForm(false);
    setDraft(EMPTY_DRAFT);
    setEditingId(null);
  };

  const removeApp = (id) => {
    persist((apps || []).filter((a) => a.id !== id));
    setExpandedId(null);
  };

  const setStatus = (id, status) => {
    persist((apps || []).map((a) => (a.id === id ? { ...a, status } : a)));
  };

  const stats = useMemo(() => {
    const base = { Applied: 0, Interview: 0, Offer: 0, Rejected: 0, Withdrawn: 0 };
    (apps || [])
      .filter((a) => typeFilter === "All" || a.type === typeFilter)
      .forEach((a) => { base[a.status] = (base[a.status] || 0) + 1; });
    return base;
  }, [apps, typeFilter]);

  const visible = useMemo(() => {
    if (!apps) return [];
    let list = apps;
    if (typeFilter !== "All") list = list.filter((a) => a.type === typeFilter);
    if (filter !== "All") list = list.filter((a) => a.status === filter);
    if (query.trim()) {
      const q = query.trim().toLowerCase();
      list = list.filter(
        (a) => a.company.toLowerCase().includes(q) || a.role.toLowerCase().includes(q) || (a.location || "").toLowerCase().includes(q)
      );
    }
    const dir = sortDir === "asc" ? 1 : -1;
    list = [...list].sort((a, b) => {
      const av = (a[sortKey] || "").toString().toLowerCase();
      const bv = (b[sortKey] || "").toString().toLowerCase();
      if (av < bv) return -1 * dir;
      if (av > bv) return 1 * dir;
      return 0;
    });
    return list;
  }, [apps, filter, typeFilter, query, sortKey, sortDir]);

  const toggleSort = (key) => {
    if (sortKey === key) setSortDir(sortDir === "asc" ? "desc" : "asc");
    else { setSortKey(key); setSortDir("desc"); }
  };

  const sortArrow = (key) => (sortKey === key ? (sortDir === "asc" ? "↑" : "↓") : "");

  return (
    <div className="log-root">
      <style>{`
        @import url('https://fonts.googleapis.com/css2?family=Newsreader:ital,opsz,wght@0,6..72,400;0,6..72,500;0,6..72,600;1,6..72,400&family=IBM+Plex+Sans:wght@400;500;600&family=IBM+Plex+Mono:wght@500&display=swap');

        html, body {
          height: 100%;
          width: 100%;
          margin: 0;
          padding: 0;
          background: #EEEBE2;
        }
        #root {
          min-height: 100vh;
          width: 100%;
          margin: 0;
          display: block;
          place-items: initial;
        }

        .log-root {
          --paper: #EEEBE2;
          --paper-raised: #F8F6EF;
          --ink: #23261F;
          --ink-soft: #5C5C52;
          --rule: #D7D2C1;
          --accent: #3D5A3C;
          --accent-soft: #E4E9DF;
          font-family: 'IBM Plex Sans', sans-serif;
          color: var(--ink);
          background: var(--paper);
          min-height: 100vh;
          width: 100%;
          padding: clamp(20px, 5vw, 40px) clamp(14px, 4vw, 28px) 60px;
          box-sizing: border-box;
          overflow-x: hidden;
        }
        .log-root * { box-sizing: border-box; }

        .lr-header {
          max-width: 980px;
          margin: 0 auto 28px;
          display: flex;
          flex-wrap: wrap;
          justify-content: space-between;
          align-items: flex-end;
          gap: 16px 24px;
          border-bottom: 1px solid var(--rule);
          padding-bottom: 20px;
        }
        .lr-title {
          font-family: 'Newsreader', serif;
          font-weight: 500;
          font-size: 34px;
          letter-spacing: -0.01em;
          margin: 0 0 6px;
          color: var(--accent);
        }
        .lr-sub {
          margin: 0;
          color: var(--ink-soft);
          font-size: 14.5px;
        }
        .lr-add-btn {
          background: var(--accent);
          color: #F8F6EF;
          border: none;
          font-family: inherit;
          font-size: 14.5px;
          font-weight: 500;
          padding: 11px 20px;
          border-radius: 3px;
          cursor: pointer;
          flex-shrink: 0;
          transition: background 0.15s ease;
        }
        .lr-add-btn:hover { background: #33492f; }

        .lr-header-right {
          display: flex;
          align-items: center;
          gap: 12px;
          flex-shrink: 0;
        }

        .lr-stats {
          max-width: 980px;
          margin: 0 auto 24px;
          display: flex;
          gap: 10px;
          flex-wrap: wrap;
        }
        .lr-stat {
          flex: 1;
          min-width: 110px;
          background: var(--paper-raised);
          border: 1px solid var(--rule);
          border-radius: 4px;
          padding: 13px 16px;
        }
        .lr-stat-num {
          font-family: 'Newsreader', serif;
          font-size: 26px;
          line-height: 1;
          margin-bottom: 4px;
        }
        .lr-stat-label {
          font-size: 12.5px;
          color: var(--ink-soft);
        }

        .lr-toolbar {
          max-width: 980px;
          margin: 0 auto 10px;
          display: flex;
          gap: 10px;
          flex-wrap: wrap;
          align-items: center;
        }
        .lr-toolbar-row {
          max-width: 980px;
          margin: 0 auto 14px;
          display: flex;
          gap: 8px;
          flex-wrap: wrap;
          align-items: center;
        }
        .lr-toolbar-label {
          font-size: 11.5px;
          text-transform: uppercase;
          letter-spacing: 0.04em;
          color: var(--ink-soft);
          margin-right: 4px;
        }
        .lr-search {
          flex: 1;
          min-width: 180px;
          padding: 9px 12px;
          border: 1px solid var(--rule);
          border-radius: 3px;
          background: var(--paper-raised);
          font-family: inherit;
          font-size: 14px;
          color: var(--ink);
        }
        .lr-search:focus { outline: 2px solid var(--accent); outline-offset: -1px; }
        .lr-filter-chip {
          border: 1px solid var(--rule);
          background: var(--paper-raised);
          color: var(--ink-soft);
          font-family: inherit;
          font-size: 13px;
          padding: 8px 13px;
          border-radius: 20px;
          cursor: pointer;
        }
        .lr-filter-chip.active {
          background: var(--accent);
          border-color: var(--accent);
          color: #F8F6EF;
        }

        .lr-form-wrap {
          max-width: 980px;
          margin: 0 auto 20px;
          background: var(--paper-raised);
          border: 1px solid var(--rule);
          border-radius: 5px;
          padding: 20px;
        }
        .lr-form-type {
          display: flex;
          gap: 8px;
          margin-bottom: 16px;
          padding-bottom: 16px;
          border-bottom: 1px dashed var(--rule);
        }
        .lr-type-toggle {
          flex: 1;
          border: 1px solid var(--rule);
          background: #fff;
          color: var(--ink-soft);
          font-family: inherit;
          font-size: 14px;
          font-weight: 500;
          padding: 10px;
          border-radius: 4px;
          cursor: pointer;
        }
        .lr-type-toggle.active {
          border-color: var(--accent);
          background: var(--accent-soft);
          color: var(--accent);
        }
        .lr-form-grid {
          display: grid;
          grid-template-columns: 1.3fr 1.3fr 1fr;
          gap: 12px;
        }
        .lr-field label {
          display: block;
          font-size: 12px;
          color: var(--ink-soft);
          margin-bottom: 5px;
        }
        .lr-field input, .lr-field select, .lr-field textarea {
          width: 100%;
          padding: 9px 10px;
          border: 1px solid var(--rule);
          border-radius: 3px;
          font-family: inherit;
          font-size: 14px;
          background: #fff;
          color: var(--ink);
        }
        .lr-field textarea { resize: vertical; min-height: 60px; }
        .lr-form-hint {
          margin-top: 10px;
          font-size: 12.5px;
          color: var(--ink-soft);
        }
        .lr-form-actions {
          margin-top: 14px;
          display: flex;
          gap: 10px;
          justify-content: flex-end;
        }
        .lr-btn-primary {
          background: var(--accent);
          color: #fff;
          border: none;
          padding: 9px 18px;
          border-radius: 3px;
          font-family: inherit;
          font-size: 14px;
          cursor: pointer;
        }
        .lr-btn-primary:disabled {
          background: #B9BCAD;
          cursor: not-allowed;
        }
        .lr-btn-ghost {
          background: transparent;
          border: 1px solid var(--rule);
          color: var(--ink-soft);
          padding: 9px 16px;
          border-radius: 3px;
          font-family: inherit;
          font-size: 14px;
          cursor: pointer;
        }

        .lr-table-wrap {
          max-width: 980px;
          margin: 0 auto;
          border: 1px solid var(--rule);
          border-radius: 5px;
          overflow: hidden;
          background: var(--paper-raised);
        }
        .lr-row-head {
          display: grid;
          grid-template-columns: 1.6fr 1.6fr 1fr 1.1fr 0.9fr 30px;
          padding: 11px 18px;
          font-size: 11.5px;
          text-transform: uppercase;
          letter-spacing: 0.04em;
          color: var(--ink-soft);
          border-bottom: 1px solid var(--rule);
          background: #F1EEE3;
        }
        .lr-row-head span { cursor: pointer; user-select: none; }
        .lr-row {
          display: grid;
          grid-template-columns: 1.6fr 1.6fr 1fr 1.1fr 0.9fr 30px;
          padding: 14px 18px;
          border-bottom: 1px solid var(--rule);
          align-items: center;
          font-size: 14.5px;
          cursor: pointer;
        }
        .lr-row:last-child { border-bottom: none; }
        .lr-row:hover { background: #F1EEE3; }
        .lr-company { font-weight: 600; }
        .lr-company-link {
          cursor: pointer;
          text-decoration: underline;
          text-decoration-color: transparent;
          text-underline-offset: 2px;
          transition: color 0.15s ease, text-decoration-color 0.15s ease;
        }
        .lr-company-link:hover {
          color: var(--accent);
          text-decoration-color: var(--accent);
        }
        .lr-role { color: var(--ink-soft); font-size: 13.5px; display: flex; align-items: center; gap: 6px; flex-wrap: wrap; }
        .lr-type-tag {
          display: inline-block;
          padding: 2px 8px;
          border-radius: 20px;
          font-size: 10.5px;
          font-weight: 600;
          text-transform: uppercase;
          letter-spacing: 0.02em;
        }
        .lr-loc { color: var(--ink-soft); font-size: 13.5px; }
        .lr-date { font-family: 'IBM Plex Mono', monospace; font-size: 12.5px; color: var(--ink-soft); }
        .lr-status-pill {
          display: inline-block;
          padding: 4px 10px;
          border-radius: 20px;
          font-size: 12px;
          font-weight: 500;
        }
        .lr-caret { color: var(--ink-soft); text-align: right; }

        .lr-detail {
          padding: 6px 18px 18px 18px;
          border-bottom: 1px solid var(--rule);
          background: #F5F2E8;
        }
        .lr-detail-grid {
          display: flex;
          gap: 24px;
          flex-wrap: wrap;
          align-items: flex-start;
          font-size: 13.5px;
        }
        .lr-detail-col { min-width: 200px; }
        .lr-detail-label { color: var(--ink-soft); font-size: 11.5px; text-transform: uppercase; letter-spacing: 0.03em; margin-bottom: 4px; }
        .lr-notes { white-space: pre-wrap; line-height: 1.5; max-width: 420px; }
        .lr-status-set { display: flex; gap: 6px; flex-wrap: wrap; margin-top: 4px; }
        .lr-status-opt {
          border: 1px solid var(--rule);
          background: #fff;
          color: #C15C82;
          font-size: 12px;
          padding: 5px 10px;
          border-radius: 20px;
          cursor: pointer;
          font-family: inherit;
        }
        .lr-status-opt.current { border-color: var(--accent); color: var(--accent); font-weight: 600; }
        .lr-detail-actions { display: flex; gap: 10px; margin-top: 10px; }
        .lr-link-btn { background: none; border: none; color: var(--accent); font-family: inherit; font-size: 13px; cursor: pointer; padding: 0; text-decoration: underline; }
        .lr-link-btn.danger { color: #A34A32; }

        .lr-empty {
          padding: 60px 20px;
          text-align: center;
          color: var(--ink-soft);
        }
        .lr-empty-title { font-family: 'Newsreader', serif; font-size: 20px; color: var(--ink); margin-bottom: 6px; }

        @media (max-width: 900px) {
          .lr-form-grid { grid-template-columns: 1fr 1fr; }
        }

        @media (max-width: 720px) {
          .lr-form-grid { grid-template-columns: 1fr; }
          .lr-row-head { display: none; }
          .lr-row {
            grid-template-columns: 1fr auto;
            grid-template-areas: "company caret" "role role" "meta meta";
            row-gap: 4px;
          }
          .lr-company { grid-area: company; }
          .lr-caret { grid-area: caret; }
          .lr-role { grid-area: role; }
          .lr-loc, .lr-date { display: none; }
        }

        @media (max-width: 560px) {
          .lr-header { align-items: flex-start; }
          .lr-header-right { width: 100%; justify-content: flex-start; }
          .lr-add-btn { width: 100%; text-align: center; }
          .lr-stats { gap: 8px; }
          .lr-stat { min-width: calc(50% - 4px); }
          .lr-detail-grid { flex-direction: column; gap: 16px; }
          .lr-form-type { flex-direction: column; }
        }
      `}</style>

      <div className="lr-header">
        <div>
          <h1 className="lr-title">Application Log</h1>
          <p className="lr-sub">Every place you've applied, in one place.</p>
        </div>
        <div className="lr-header-right">
          <button className="lr-add-btn" onClick={() => openNewForm()}>
            + Add application
          </button>
        </div>
      </div>

      <div className="lr-stats">
        {STATUSES.map((s) => (
          <div className="lr-stat" key={s}>
            <div className="lr-stat-num">{stats[s] || 0}</div>
            <div className="lr-stat-label">{s}</div>
          </div>
        ))}
      </div>

      {showForm && (
        <div className="lr-form-wrap">
          <div className="lr-form-type">
            {TYPES.map((t) => (
              <button
                key={t}
                type="button"
                className={`lr-type-toggle ${draft.type === t ? "active" : ""}`}
                onClick={() => setDraft({ ...draft, type: t })}
              >
                {t}
              </button>
            ))}
          </div>
          <div className="lr-form-grid">
            <div className="lr-field">
              <label>Company *</label>
              <input value={draft.company} onChange={(e) => setDraft({ ...draft, company: e.target.value })} placeholder="e.g. Northwind Co." />
            </div>
            <div className="lr-field">
              <label>Role *</label>
              <input value={draft.role} onChange={(e) => setDraft({ ...draft, role: e.target.value })} placeholder="e.g. Product Designer" />
            </div>
            <div className="lr-field">
              <label>Location</label>
              <select value={draft.location} onChange={(e) => setDraft({ ...draft, location: e.target.value })}>
                {LOCATIONS.map((l) => <option key={l} value={l}>{l}</option>)}
              </select>
            </div>
            <div className="lr-field">
              <label>Date applied</label>
              <input type="date" value={draft.dateApplied} onChange={(e) => setDraft({ ...draft, dateApplied: e.target.value })} />
            </div>
            <div className="lr-field">
              <label>Status</label>
              <select value={draft.status} onChange={(e) => setDraft({ ...draft, status: e.target.value })}>
                {STATUSES.map((s) => <option key={s} value={s}>{s}</option>)}
              </select>
            </div>
            <div className="lr-field">
              <label>Posting link *</label>
              <input value={draft.url} onChange={(e) => setDraft({ ...draft, url: e.target.value })} placeholder="https://" />
            </div>
          </div>
          <div className="lr-field" style={{ marginTop: 12 }}>
            <label>Notes</label>
            <textarea value={draft.notes} onChange={(e) => setDraft({ ...draft, notes: e.target.value })} placeholder="Contacts, interview notes, follow-up dates..." />
          </div>
          {!isDraftValid(draft) && (
            <div className="lr-form-hint">Company, role, and posting link are required.</div>
          )}
          <div className="lr-form-actions">
            <button type="button" className="lr-btn-ghost" onClick={() => { setShowForm(false); setEditingId(null); }}>Cancel</button>
            <button
              type="button"
              className="lr-btn-primary"
              disabled={!isDraftValid(draft)}
              onClick={saveDraft}
            >
              {editingId ? "Save changes" : "Add application"}
            </button>
          </div>
        </div>
      )}

      <div className="lr-toolbar">
        <input className="lr-search" placeholder="Search company, role, location…" value={query} onChange={(e) => setQuery(e.target.value)} />
      </div>

      <div className="lr-toolbar-row">
        <span className="lr-toolbar-label">Type</span>
        <button className={`lr-filter-chip ${typeFilter === "All" ? "active" : ""}`} onClick={() => setTypeFilter("All")}>All</button>
        {TYPES.map((t) => (
          <button key={t} className={`lr-filter-chip ${typeFilter === t ? "active" : ""}`} onClick={() => setTypeFilter(t)}>{t}</button>
        ))}
      </div>

      <div className="lr-toolbar-row">
        <span className="lr-toolbar-label">Status</span>
        <button className={`lr-filter-chip ${filter === "All" ? "active" : ""}`} onClick={() => setFilter("All")}>All</button>
        {STATUSES.map((s) => (
          <button key={s} className={`lr-filter-chip ${filter === s ? "active" : ""}`} onClick={() => setFilter(s)}>{s}</button>
        ))}
      </div>

      <div className="lr-table-wrap">
        {apps === null ? (
          <div className="lr-empty">Loading your applications…</div>
        ) : visible.length === 0 ? (
          <div className="lr-empty">
            <div className="lr-empty-title">{apps.length === 0 ? "Nothing logged yet" : "No matches"}</div>
            {apps.length === 0 ? "Add your first application to start tracking." : "Try a different search or filter."}
          </div>
        ) : (
          <>
            <div className="lr-row-head">
              <span onClick={() => toggleSort("company")}>Company {sortArrow("company")}</span>
              <span onClick={() => toggleSort("role")}>Role {sortArrow("role")}</span>
              <span onClick={() => toggleSort("location")}>Location {sortArrow("location")}</span>
              <span onClick={() => toggleSort("dateApplied")}>Applied {sortArrow("dateApplied")}</span>
              <span onClick={() => toggleSort("status")}>Status {sortArrow("status")}</span>
              <span></span>
            </div>
            {visible.map((a) => {
              const st = STATUS_STYLE[a.status] || STATUS_STYLE.Applied;
              const tt = TYPE_STYLE[a.type] || TYPE_STYLE.Job;
              const isOpen = expandedId === a.id;
              return (
                <React.Fragment key={a.id}>
                  <div className="lr-row" onClick={() => setExpandedId(isOpen ? null : a.id)}>
                    <div
                      className="lr-company lr-company-link"
                      title="Open posting"
                      onClick={(e) => { e.stopPropagation(); window.open(a.url, "_blank", "noreferrer"); }}
                    >
                      {a.company}
                    </div>
                    <div className="lr-role">
                      {a.role}
                      <span className="lr-type-tag" style={{ color: tt.color, background: tt.bg }}>{a.type}</span>
                    </div>
                    <div className="lr-loc">{a.location || "—"}</div>
                    <div className="lr-date">{formatDate(a.dateApplied)}</div>
                    <div><span className="lr-status-pill" style={{ color: st.color, background: st.bg }}>{a.status}</span></div>
                    <div className="lr-caret">{isOpen ? "▾" : "▸"}</div>
                  </div>
                  {isOpen && (
                    <div className="lr-detail">
                      <div className="lr-detail-grid">
                        <div className="lr-detail-col">
                          <div className="lr-detail-label">Notes</div>
                          <div className="lr-notes">{a.notes ? a.notes : "No notes yet."}</div>
                        </div>
                        <div className="lr-detail-col">
                          <div className="lr-detail-actions" style={{ marginTop: 0, marginBottom: 12 }}>
                            <button className="lr-link-btn" onClick={(e) => { e.stopPropagation(); openEditForm(a); }}>Edit</button>
                          </div>
                          <div className="lr-detail-label">Update status</div>
                          <div className="lr-status-set">
                            {STATUSES.map((s) => (
                              <button
                                key={s}
                                className={`lr-status-opt ${a.status === s ? "current" : ""}`}
                                onClick={(e) => { e.stopPropagation(); setStatus(a.id, s); }}
                              >
                                {s}
                              </button>
                            ))}
                          </div>
                          <div className="lr-detail-actions">
                            <button className="lr-link-btn" onClick={(e) => { e.stopPropagation(); setExpandedId(null); }}>Save</button>
                            <button className="lr-link-btn danger" onClick={(e) => { e.stopPropagation(); removeApp(a.id); }}>Delete</button>
                          </div>
                        </div>
                      </div>
                    </div>
                  )}
                </React.Fragment>
              );
            })}
          </>
        )}
      </div>
    </div>
  );
}