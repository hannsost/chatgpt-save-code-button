(() => {
  "use strict";

  const EXT_MAP = {
    python: "py", py: "py",
    javascript: "js", js: "js", typescript: "ts", ts: "ts",
    json: "json", yaml: "yml", yml: "yml", xml: "xml",
    html: "html", css: "css", scss: "scss",
    bash: "sh", shell: "sh", zsh: "sh",
    dockerfile: "Dockerfile",
    sql: "sql",
    java: "java", csharp: "cs", "c#": "cs", c: "c", cpp: "cpp", "c++": "cpp",
    rust: "rs", go: "go",
    php: "php", ruby: "rb", r: "r", lua: "lua", kotlin: "kt",
    md: "md", markdown: "md", txt: "txt"
  };

  const qsa = (root, sel) => Array.from(root.querySelectorAll(sel));

  function makeSaveButton() {
    const btn = document.createElement("button");
    btn.type = "button";
    btn.className = "gpt-save-btn flex gap-1 items-center select-none py-1 px-2";
    btn.setAttribute("aria-label", "Save");
    btn.textContent = "Save";
    Object.assign(btn.style, {
      fontSize: "12px",
      lineHeight: "1",
      borderRadius: "6px",
      border: "1px solid var(--border-light, #d1d5db)",
      background: "var(--surface-elev-1, #f9fafb)",
      cursor: "pointer",
      whiteSpace: "nowrap"
    });
    btn.addEventListener("mouseenter", () => (btn.style.filter = "brightness(0.98)"));
    btn.addEventListener("mouseleave", () => (btn.style.filter = ""));
    return btn;
  }

  function guessExtFromContext(container) {
    const header = container.querySelector('div[class*="flex"][class*="items-center"]');
    const label = header?.textContent?.trim()?.toLowerCase() || "";
    let key = label.split(/\s+/)[0];
    if (!key || key.length > 20) key = "";
    const code = container.querySelector("pre code");
    const cls = (code?.className || "").toLowerCase();
    const m = cls.match(/(?:language|lang)-([a-z0-9+#]+)/);
    if (!key && m) key = m[1];
    if (key === "c++") key = "cpp";
    if (key === "c#") key = "csharp";
    return EXT_MAP[key] || (key || "txt");
  }

  function getCodeTextFromContainer(container) {
    const codeEl = container.querySelector("pre code");
    if (codeEl) return codeEl.innerText || "";
    const pre = container.querySelector("pre");
    if (pre) return pre.innerText || "";
    return "";
  }

  function findCodeContainerFromCopyBtn(copyBtn) {
    let n = copyBtn;
    for (let i = 0; i < 8 && n; i++) {
      const candidate = i === 0 ? n.parentElement : n;
      if (candidate && candidate.querySelector && candidate.querySelector("pre")) {
        return candidate;
      }
      n = candidate?.parentElement || null;
    }
    const pre = copyBtn.closest("div, section, article")?.querySelector("pre");
    return pre ? pre.parentElement || document : document;
  }

  function attachNextToCopyButton(copyBtn) {
    const toolbar = copyBtn.parentElement;
    if (toolbar && toolbar.querySelector('.gpt-save-btn')) return;
    if (copyBtn.dataset.saveBtnAttached === "1") return;
    copyBtn.dataset.saveBtnAttached = "1";
    const saveBtn = makeSaveButton();
    saveBtn.addEventListener("click", (ev) => {
      ev.stopPropagation();
      const container = findCodeContainerFromCopyBtn(copyBtn);
      const code = getCodeTextFromContainer(container);
      if (!code.trim()) {
        alert("No code found.");
        return;
      }
      const ext = guessExtFromContext(container);
      const defaultName =
        ext === "Dockerfile"
          ? "Dockerfile"
          : `snippet-${new Date().toISOString().replace(/[:.]/g, "-")}.${ext}`;
      const name = prompt("Enter file name:", defaultName);
      if (!name) return;
      const blob = new Blob([code], { type: "text/plain;charset=utf-8" });
      const url = URL.createObjectURL(blob);
      const a = document.createElement("a");
      a.href = url;
      a.download = name;
      document.body.appendChild(a);
      a.click();
      requestAnimationFrame(() => {
        document.body.removeChild(a);
        URL.revokeObjectURL(url);
      });
    });
    const toolbar = copyBtn.parentElement;
    if (toolbar) {
      toolbar.insertBefore(saveBtn, copyBtn.nextSibling);
    } else {
      copyBtn.insertAdjacentElement("afterend", saveBtn);
    }
  }

  function isCopyBtn(el) {
    if (!(el instanceof HTMLElement) || el.tagName !== "BUTTON") return false;
    const aria = (el.getAttribute("aria-label") || "").toLowerCase();
    const txt = (el.textContent || "").toLowerCase();
    const isCopyAria = aria.includes("kopieren") || aria.includes("copy");
    const isCopyText = txt.includes("code kopieren") || txt.includes("copy code") || txt === "copy";
    return isCopyAria || isCopyText;
  }

  function scanOnce(root = document) {
    qsa(root, "button").forEach((btn) => {
      if (isCopyBtn(btn)) attachNextToCopyButton(btn);
    });
  }

  scanOnce();

  const mo = new MutationObserver((muts) => {
    for (const m of muts) {
      if (m.type === "childList") {
        m.addedNodes.forEach((n) => {
          if (n.nodeType === 1) scanOnce(n);
        });
      } else if (m.type === "attributes" && m.target) {
        scanOnce(m.target.ownerDocument || document);
      }
    }
  });
  mo.observe(document.documentElement, {
    childList: true,
    subtree: true,
    attributes: false
  });

  const style = document.createElement("style");
  style.textContent = `
    .gpt-save-btn { transition: filter .12s ease-in-out, background .12s ease-in-out, border-color .12s ease-in-out; }
    @media (prefers-color-scheme: dark) {
      .gpt-save-btn {
        background: #111827;
        color: #e5e7eb;
        border-color: #374151;
      }
      .gpt-save-btn:hover { filter: brightness(1.08); }
    }
  `;
  document.head.appendChild(style);

  setInterval(() => {
    if (!document.hidden) scanOnce();
  }, 1500);
})();


