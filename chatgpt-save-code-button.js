// ==UserScript==
// @name         ChatGPT Save Code Button (Toolbar integration)
// @namespace    de.osterbrink.chatgpt.savecode
// @version      1.2
// @description  Fügt neben "Kopieren" in ChatGPT-Codeleisten einen "Speichern"-Button ein.
// @author       you
// @match        https://chat.openai.com/*
// @match        https://chatgpt.com/*
// @match        https://*.openai.com/*
// @run-at       document-idle
// @grant        none
// ==/UserScript==

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

  // Hilfsfunktionen
  const qsa = (root, sel) => Array.from(root.querySelectorAll(sel));
  const isInDom = (el) => el && document.contains(el);

  function makeSaveButton() {
    const btn = document.createElement("button");
    btn.type = "button";
    btn.className = "gpt-save-btn flex gap-1 items-center select-none py-1 px-2";
    btn.setAttribute("aria-label", "Speichern");
    btn.textContent = "💾 Speichern";
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
    // Versuch 1: Sprache steht oft im Header-Div (z.B. "javascript")
    const header = container.querySelector('div[class*="flex"][class*="items-center"]');
    const label = header?.textContent?.trim()?.toLowerCase() || "";

    let key = label.split(/\s+/)[0]; // erstem Wort vertrauen
    if (!key || key.length > 20) key = ""; // defensiv

    // Versuch 2: class am <code>
    const code = container.querySelector("pre code");
    const cls = (code?.className || "").toLowerCase();
    const m = cls.match(/(?:language|lang)-([a-z0-9+#]+)/);
    if (!key && m) key = m[1];

    if (key === "c++") key = "cpp";
    if (key === "c#") key = "csharp";

    return EXT_MAP[key] || (key || "txt");
  }

  function getCodeTextFromContainer(container) {
    // ChatGPT formatiert Code in <pre><code>…</code></pre>
    const codeEl = container.querySelector("pre code");
    if (codeEl) return codeEl.innerText || "";
    const pre = container.querySelector("pre");
    if (pre) return pre.innerText || "";
    return "";
  }

  function findCodeContainerFromCopyBtn(copyBtn) {
    // Toolbar liegt typischerweise in einem Container über dem <pre>.
    // Wir gehen hoch, bis wir einen Vorfahren finden, der auch <pre> enthält.
    let n = copyBtn;
    for (let i = 0; i < 8 && n; i++) {
      const candidate = i === 0 ? n.parentElement : n;
      if (candidate && candidate.querySelector && candidate.querySelector("pre")) {
        return candidate;
      }
      n = candidate?.parentElement || null;
    }
    // Fallback: das nächste <pre> in der Nähe
    const pre = copyBtn.closest("div, section, article")?.querySelector("pre");
    return pre ? pre.parentElement || document : document;
  }

  function attachNextToCopyButton(copyBtn) {
    if (copyBtn.dataset.saveBtnAttached === "1") return;
    copyBtn.dataset.saveBtnAttached = "1";

    // Button erzeugen
    const saveBtn = makeSaveButton();

    // Klicklogik
    saveBtn.addEventListener("click", (ev) => {
      ev.stopPropagation();
      const container = findCodeContainerFromCopyBtn(copyBtn);
      const code = getCodeTextFromContainer(container);
      if (!code.trim()) {
        alert("Kein Code gefunden.");
        return;
      }
      const ext = guessExtFromContext(container);
      const defaultName =
        ext === "Dockerfile"
          ? "Dockerfile"
          : `snippet-${new Date().toISOString().replace(/[:.]/g, "-")}.${ext}`;
      const name = prompt("Dateiname eingeben:", defaultName);
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

    // In dieselbe Flex-Leiste einsetzen wie der Copy-Button
    const toolbar = copyBtn.parentElement;
    if (toolbar) {
      toolbar.insertBefore(saveBtn, copyBtn.nextSibling);
    } else {
      // Fallback: direkt hinter den Copy-Button
      copyBtn.insertAdjacentElement("afterend", saveBtn);
    }
  }

  function isCopyBtn(el) {
    if (!(el instanceof HTMLElement) || el.tagName !== "BUTTON") return false;
    const aria = (el.getAttribute("aria-label") || "").toLowerCase();
    const txt = (el.textContent || "").toLowerCase();
    // de/en Varianten
    const isCopyAria = aria.includes("kopieren") || aria.includes("copy");
    const isCopyText = txt.includes("code kopieren") || txt.includes("copy code") || txt === "copy";
    return isCopyAria || isCopyText;
  }

  function scanOnce(root = document) {
    // Alle Copy-Buttons finden und Save daneben einfügen
    qsa(root, "button").forEach((btn) => {
      if (isCopyBtn(btn)) attachNextToCopyButton(btn);
    });
  }

  // Erstscan
  scanOnce();

  // Dynamische Inhalte beobachten
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

  // Style für Dark Mode
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

  // Sicherheit: falls MO mal etwas verpasst
  setInterval(() => {
    if (!document.hidden) scanOnce();
  }, 1500);
})();