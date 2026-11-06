import { useEffect, useRef, useState, forwardRef } from "react";
import { renderAsync } from "docx-preview";

const getExt = (url = "") =>
  url.split("?")[0].split("#")[0].split(".").pop().toLowerCase();

const clamp = (v, lo, hi) => Math.min(hi, Math.max(lo, v));

function Centered({ children, color }) {
  return (
    <div
      style={{
        position: "absolute",
        inset: 0,
        display: "flex",
        alignItems: "center",
        justifyContent: "center",
        padding: 24,
        textAlign: "center",
        color: color || "var(--color-text-secondary)",
        fontSize: 14,
      }}
    >
      {children}
    </div>
  );
}

function PdfView({ url, outerRef }) {
  return (
    <div ref={outerRef} style={{ position: "absolute", inset: 0 }}>
      <iframe
        title="Document"
        src={`${url}#view=FitH&navpanes=0`}
        style={{ width: "100%", height: "100%", border: "none", background: "#fff" }}
      />
    </div>
  );
}

function DocxView({ url, outerRef, scale, onFitScale }) {
  const hostRef = useRef(null);
  const pageWidthRef = useRef(0);
  const [status, setStatus] = useState("loading");

  // expose the scroll container to the parent (arrow-key scrolling)
  useEffect(() => {
    if (outerRef && typeof outerRef === "object") outerRef.current = hostRef.current;
  }, [outerRef]);

  // render the document
  useEffect(() => {
    let cancelled = false;
    setStatus("loading");
    (async () => {
      try {
        const res = await fetch(url);
        if (!res.ok) throw new Error("Failed to load file");
        const buffer = await res.arrayBuffer();
        if (cancelled || !hostRef.current) return;
        hostRef.current.innerHTML = "";
        await renderAsync(buffer, hostRef.current, null, {
          className: "docx",
          inWrapper: true,
          ignoreWidth: false,
          breakPages: true,
          renderHeaders: true,
          renderFooters: true,
          renderFootnotes: true,
        });
        if (cancelled) return;
        pageWidthRef.current = hostRef.current.querySelector("section.docx")?.offsetWidth || 0;
        setStatus("ready");
      } catch (err) {
        console.error(err);
        if (!cancelled) setStatus("error");
      }
    })();
    return () => { cancelled = true; };
  }, [url]);

  // compute "fit to width" scale, keep it updated on resize / fullscreen
  useEffect(() => {
    if (status !== "ready" || !hostRef.current) return;
    const host = hostRef.current;
    const measure = () => {
      const pw = pageWidthRef.current;
      if (!pw) return;
      onFitScale(clamp((host.clientWidth - 32) / pw, 0.3, 1.6));
    };
    measure();
    const ro = new ResizeObserver(measure);
    ro.observe(host);
    return () => ro.disconnect();
  }, [status, onFitScale]);

  // apply zoom
  useEffect(() => {
    const wrapper = hostRef.current?.querySelector(".docx-wrapper");
    if (wrapper) wrapper.style.zoom = scale;
  }, [scale, status]);

  return (
    <>
      {status === "loading" && <Centered>Loading document…</Centered>}
      {status === "error" && (
        <Centered color="var(--red)">Could not render this document. Use Download instead.</Centered>
      )}
      <div
        ref={hostRef}
        className="docx-host"
        style={{ visibility: status === "ready" ? "visible" : "hidden" }}
      />
    </>
  );
}

const DocumentViewer = forwardRef(function DocumentViewer({ file, title }, ref) {
  const [fit, setFit] = useState(true);
  const [fitScale, setFitScale] = useState(1);
  const [manual, setManual] = useState(1);

  const ext = getExt(file);
  const isDocx = ext === "docx" || ext === "dotx";
  const scale = fit ? fitScale : manual;

  const zoomBy = (delta) => {
    setManual(clamp(Math.round((scale + delta) * 10) / 10, 0.4, 2.5));
    setFit(false);
  };

  if (!file) {
    return (
      <div className="cb-viewer">
        <div className="cb-stage">
          <Centered>No document available for this topic.</Centered>
        </div>
      </div>
    );
  }

  const fileName = `${title || "document"}.${ext}`;

  return (
    <div className="cb-viewer">
      <div
        style={{
          display: "flex",
          justifyContent: "space-between",
          alignItems: "center",
          gap: 8,
          flexWrap: "wrap",
          marginBottom: 10,
        }}
      >
        <div style={{ display: "flex", gap: 6, alignItems: "center" }}>
          {isDocx && (
            <>
              <button className="cb-btn cb-btn-sm" onClick={() => zoomBy(-0.1)} aria-label="Zoom out">−</button>
              <span style={{ fontSize: 12, minWidth: 44, textAlign: "center", color: "var(--color-text-secondary)" }}>
                {Math.round(scale * 100)}%
              </span>
              <button className="cb-btn cb-btn-sm" onClick={() => zoomBy(0.1)} aria-label="Zoom in">+</button>
              <button className="cb-btn cb-btn-sm" onClick={() => setFit(true)}>Fit width</button>
            </>
          )}
        </div>

        <div style={{ display: "flex", gap: 6 }}>
          <a className="cb-btn cb-btn-sm" href={file} target="_blank" rel="noreferrer">⤢ Open in new tab</a>
          <a className="cb-btn cb-btn-sm" href={file} download={fileName}>⬇ Download</a>
        </div>
      </div>

      <div className="cb-stage">
        {ext === "pdf" && <PdfView url={file} outerRef={ref} />}
        {isDocx && <DocxView url={file} outerRef={ref} scale={scale} onFitScale={setFitScale} />}
        {!(ext === "pdf" || isDocx) && <Centered>Unsupported file type: .{ext}. Use PDF or DOCX.</Centered>}
      </div>
    </div>
  );
});

export default DocumentViewer;
