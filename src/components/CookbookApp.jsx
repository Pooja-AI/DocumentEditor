import { useState, useEffect, useRef } from "react";
import DocumentViewer from "./DocumentViewer";

const RED = "#9A0718";

// ============================================================
// HEADER  (menu button + title only)
// ============================================================

function Header({ title, menuOpen, onToggleMenu }) {
  const bar = {
    display: "block",
    width: 20,
    height: 2,
    borderRadius: 2,
    background: "#fff",
    transition: "transform 0.2s, opacity 0.2s",
  };

  return (
    <header
      style={{
        position: "sticky",
        top: 0,
        zIndex: 30,
        height: 64,
        padding: "0 20px",
        background: RED,
        color: "#fff",
        display: "flex",
        alignItems: "center",
        gap: 16,
        boxShadow: "0 1px 4px rgba(0,0,0,0.2)",
      }}
    >
      <button
        className="cb-menu-btn"
        onClick={onToggleMenu}
        aria-label={menuOpen ? "Close menu" : "Open menu"}
        aria-expanded={menuOpen}
      >
        <span style={{ ...bar, transform: menuOpen ? "translateY(6px) rotate(45deg)" : "none" }} />
        <span style={{ ...bar, opacity: menuOpen ? 0 : 1 }} />
        <span style={{ ...bar, transform: menuOpen ? "translateY(-6px) rotate(-45deg)" : "none" }} />
      </button>

      <h1
        style={{
          margin: 0,
          fontSize: 20,
          fontWeight: 600,
          letterSpacing: "-0.2px",
          minWidth: 0,
          overflowWrap: "anywhere",
        }}
      >
        {title}
      </h1>
    </header>
  );
}

// ============================================================
// MENU (left drawer content)
// ============================================================

function QuestionCard({ recipe, index, selected, onSelect }) {
  return (
    <button
      className={`cb-card${selected ? " active" : ""}`}
      onClick={() => onSelect(recipe)}
    >
      <span className="cb-num">{index + 1}</span>
      <span style={{ minWidth: 0 }}>
        <span style={{ display: "block", fontSize: 11, color: "var(--color-text-tertiary)", marginBottom: 2 }}>
          {recipe.category}
        </span>
        <span style={{ display: "block", fontSize: 14, fontWeight: 500, lineHeight: 1.35, overflowWrap: "anywhere" }}>
          {recipe.title}
        </span>
      </span>
    </button>
  );
}

function Sidebar({ recipes, categories, selected, onSelect, category, setCategory, search, setSearch }) {
  const searchText = search.trim().toLowerCase();

  const filtered = recipes.filter((r) => {
    const matchCategory = category === "All" || r.category === category;
    const matchSearch =
      !searchText ||
      r.title?.toLowerCase().includes(searchText) ||
      r.category?.toLowerCase().includes(searchText);
    return matchCategory && matchSearch;
  });

  return (
    <div style={{ display: "flex", flexDirection: "column", flex: 1, minHeight: 0 }}>
      <input
        className="cb-field"
        type="text"
        placeholder="Search questions…"
        value={search}
        onChange={(e) => setSearch(e.target.value)}
        style={{ marginBottom: 14 }}
      />

      {categories.length > 2 && (
        <select
          className="cb-field"
          value={category}
          onChange={(e) => setCategory(e.target.value)}
          aria-label="Category"
          style={{ marginBottom: 14, cursor: "pointer" }}
        >
          {categories.map((c) => (
            <option key={c} value={c}>{c}</option>
          ))}
        </select>
      )}

      <div style={{ display: "flex", flexDirection: "column", gap: 8, overflowY: "auto", flex: 1, minHeight: 0 }}>
        {filtered.length === 0 ? (
          <div style={{ color: "var(--color-text-tertiary)", fontSize: 13, padding: "12px 0" }}>
            No questions found.
          </div>
        ) : (
          filtered.map((r) => (
            <QuestionCard
              key={r.id}
              recipe={r}
              index={recipes.indexOf(r)}
              onSelect={onSelect}
              selected={selected?.id === r.id}
            />
          ))
        )}
      </div>
    </div>
  );
}

// ============================================================
// PRESENTER (slide-style document view)
// ============================================================

function NavButton({ dir, target, onClick, primary }) {
  const isPrev = dir === "prev";
  return (
    <button
      className={`cb-btn${primary ? " cb-btn-primary" : ""}`}
      onClick={onClick}
      disabled={!target}
      style={{
        flex: "1 1 0",
        maxWidth: 340,
        minWidth: 0,
        padding: "9px 14px",
        justifyContent: isPrev ? "flex-start" : "flex-end",
        textAlign: isPrev ? "left" : "right",
      }}
    >
      <span style={{ minWidth: 0 }}>
        <span style={{ display: "block", fontSize: 11, opacity: 0.8 }}>
          {isPrev ? "← Previous" : "Next →"}
        </span>
        <span
          style={{
            display: "block",
            fontSize: 13,
            whiteSpace: "nowrap",
            overflow: "hidden",
            textOverflow: "ellipsis",
          }}
        >
          {target ? target.title : isPrev ? "Start of deck" : "End of deck"}
        </span>
      </span>
    </button>
  );
}

function Presenter({ recipe, recipeList, onSelect }) {
  const rootRef = useRef(null);
  const scrollRef = useRef(null);
  const [presenting, setPresenting] = useState(false);

  const idx = recipeList.findIndex((r) => r.id === recipe.id);
  const total = recipeList.length;
  const prev = idx > 0 ? recipeList[idx - 1] : null;
  const next = idx >= 0 && idx < total - 1 ? recipeList[idx + 1] : null;

  const goPrev = () => prev && onSelect(prev);
  const goNext = () => next && onSelect(next);

  const startPresenting = () => {
    setPresenting(true);
    const p = rootRef.current?.requestFullscreen?.();
    p?.catch?.(() => {});
  };

  const stopPresenting = () => {
    if (document.fullscreenElement) document.exitFullscreen().catch(() => {});
    setPresenting(false);
  };

  // leaving real fullscreen (Esc) also leaves presentation mode
  useEffect(() => {
    const onChange = () => {
      if (!document.fullscreenElement) setPresenting(false);
    };
    document.addEventListener("fullscreenchange", onChange);
    return () => document.removeEventListener("fullscreenchange", onChange);
  }, []);

  // keyboard: ← → switch, ↑ ↓ scroll, F present, Esc exit
  useEffect(() => {
    const onKey = (e) => {
      const el = document.activeElement;
      const tag = el?.tagName;
      if (tag === "INPUT" || tag === "TEXTAREA" || tag === "SELECT" || el?.isContentEditable) return;
      if (e.ctrlKey || e.metaKey || e.altKey) return;

      if (e.key === "ArrowLeft") {
        e.preventDefault();
        goPrev();
      } else if (e.key === "ArrowRight") {
        e.preventDefault();
        goNext();
      } else if (e.key === "f" || e.key === "F") {
        e.preventDefault();
        presenting ? stopPresenting() : startPresenting();
      } else if (e.key === "Escape" && presenting) {
        stopPresenting();
      } else if (e.key === "ArrowUp" || e.key === "ArrowDown") {
        const pane = scrollRef.current;
        if (pane && pane.scrollHeight > pane.clientHeight) {
          e.preventDefault();
          pane.scrollBy({ top: e.key === "ArrowDown" ? 100 : -100, behavior: "smooth" });
        }
      }
    };
    window.addEventListener("keydown", onKey);
    return () => window.removeEventListener("keydown", onKey);
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [idx, presenting]);

  return (
    <div ref={rootRef} className={`cb-presenter${presenting ? " cb-presenting" : ""}`}>
      {/* TITLE BAR */}
      <div style={{ display: "flex", justifyContent: "space-between", alignItems: "flex-start", gap: 16 }}>
        <div style={{ borderLeft: `4px solid ${RED}`, paddingLeft: 14, minWidth: 0 }}>
          <div
            style={{
              fontSize: 12,
              fontWeight: 600,
              letterSpacing: "0.08em",
              textTransform: "uppercase",
              color: RED,
            }}
          >
            {recipe.category} · Question {idx + 1} of {total}
          </div>
          <h2
            style={{
              margin: "4px 0 0",
              fontSize: presenting ? 28 : 24,
              fontWeight: 600,
              lineHeight: 1.25,
              color: "var(--color-text-primary)",
              overflowWrap: "anywhere",
            }}
          >
            {recipe.title}
          </h2>
        </div>

        <button
          className="cb-btn cb-btn-primary"
          onClick={presenting ? stopPresenting : startPresenting}
          style={{ flexShrink: 0 }}
        >
          {presenting ? "✕ Exit" : "▶ Present"}
        </button>
      </div>

      {/* PROGRESS */}
      <div style={{ display: "flex", gap: 4 }} role="tablist" aria-label="Progress">
        {recipeList.map((r, i) => (
          <button
            key={r.id}
            onClick={() => onSelect(r)}
            title={`${i + 1}. ${r.title}`}
            aria-label={`Go to question ${i + 1}`}
            style={{
              flex: 1,
              height: 6,
              padding: 0,
              border: "none",
              borderRadius: 3,
              cursor: "pointer",
              background: i <= idx ? RED : "var(--color-border-tertiary)",
              opacity: i === idx ? 1 : i < idx ? 0.55 : 1,
            }}
          />
        ))}
      </div>

      {/* DOCUMENT */}
      <DocumentViewer key={recipe.id} ref={scrollRef} file={recipe.concept} title={recipe.title} />

      {/* FOOTER NAV */}
      <div style={{ display: "flex", justifyContent: "space-between", alignItems: "center", gap: 12 }}>
        <NavButton dir="prev" target={prev} onClick={goPrev} />
        <span className="cb-hint" style={{ fontSize: 12, color: "var(--color-text-tertiary)", textAlign: "center" }}>
          ← → navigate · F present · Esc exit
        </span>
        <NavButton dir="next" target={next} onClick={goNext} primary />
      </div>
    </div>
  );
}

// ============================================================
// COOKBOOK APP
// ============================================================

export default function CookbookApp({ data, title }) {
  const [selected, setSelected] = useState(data?.[0] || null);
  const [category, setCategory] = useState("All");
  const [search, setSearch] = useState("");
  const [menuOpen, setMenuOpen] = useState(false);

  const categories = ["All", ...new Set(data.map((r) => r.category).filter(Boolean))];

  useEffect(() => {
    const onKey = (e) => e.key === "Escape" && setMenuOpen(false);
    window.addEventListener("keydown", onKey);
    return () => window.removeEventListener("keydown", onKey);
  }, []);

  const handleSelect = (recipe) => {
    setSelected(recipe);
    setMenuOpen(false);
  };

  return (
    <div
      style={{
        display: "flex",
        flexDirection: "column",
        width: "100%",
        minHeight: "100vh",
        background: "var(--color-background-tertiary)",
        color: "var(--color-text-primary)",
        overflowX: "hidden",
      }}
    >
      <Header title={title} menuOpen={menuOpen} onToggleMenu={() => setMenuOpen((o) => !o)} />

      <div className="cb-content" style={{ flex: 1, minWidth: 0, padding: "24px 28px" }}>
        {selected ? (
          <Presenter recipe={selected} recipeList={data} onSelect={setSelected} />
        ) : (
          <div style={{ color: "var(--color-text-tertiary)", padding: 40, textAlign: "center" }}>
            Select a question to get started.
          </div>
        )}
      </div>

      {/* OVERLAY */}
      <div
        onClick={() => setMenuOpen(false)}
        style={{
          position: "fixed",
          inset: 0,
          background: "rgba(26,26,26,0.45)",
          opacity: menuOpen ? 1 : 0,
          pointerEvents: menuOpen ? "auto" : "none",
          transition: "opacity 0.25s",
          zIndex: 40,
        }}
      />

      {/* LEFT SIDE MENU */}
      <aside
        aria-hidden={!menuOpen}
        style={{
          position: "fixed",
          top: 0,
          left: 0,
          bottom: 0,
          width: 340,
          maxWidth: "88vw",
          padding: 20,
          background: "#fff",
          borderRight: "1px solid var(--color-border-tertiary)",
          boxShadow: menuOpen ? "4px 0 24px rgba(0,0,0,0.15)" : "none",
          transform: menuOpen ? "translateX(0)" : "translateX(-100%)",
          visibility: menuOpen ? "visible" : "hidden",
          transition: "transform 0.25s ease, visibility 0.25s",
          zIndex: 50,
          display: "flex",
          flexDirection: "column",
        }}
      >
        <div style={{ display: "flex", justifyContent: "space-between", alignItems: "center", marginBottom: 16 }}>
          <span style={{ fontSize: 16, fontWeight: 600, color: RED }}>Questions</span>
          <button
            onClick={() => setMenuOpen(false)}
            aria-label="Close menu"
            style={{
              border: "none",
              background: "none",
              color: "var(--color-text-secondary)",
              fontSize: 24,
              lineHeight: 1,
              cursor: "pointer",
            }}
          >
            ×
          </button>
        </div>

        <Sidebar
          recipes={data}
          categories={categories}
          selected={selected}
          onSelect={handleSelect}
          category={category}
          setCategory={setCategory}
          search={search}
          setSearch={setSearch}
        />
      </aside>
    </div>
  );
}
