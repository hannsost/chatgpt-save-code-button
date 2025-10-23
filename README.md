# ChatGPT Save Code Button

Adds a "Save" button next to "Copy" in ChatGPT code toolbars so you can download code blocks as files. Works both as a Userscript (Tampermonkey/Violentmonkey) and as a Chromium Extension (MV3).

## Variants

- Userscript: `userscript/chatgpt-save-code.user.js`
- Extension (Chromium, MV3): `extension/` (with `manifest.json` and `content.js`)

## Installation

### Userscript
1. Install Tampermonkey or Violentmonkey in your browser.
2. Import `userscript/chatgpt-save-code.user.js` into the script manager (or add via raw URL).

### Chrome/Chromium Extension
1. Open `chrome://extensions`.
2. Enable Developer Mode.
3. Click "Load unpacked" and select the `extension/` folder.

## Usage

- On `chat.openai.com` or `chatgpt.com`, a "💾 Save" button appears next to "Copy".
- Clicking it reads the code from the associated block and downloads it as a file.
- The filename is inferred from the detected language (e.g., `js`, `py`, `Dockerfile`) and can be edited in the prompt.

## Supported Domains

- `https://chat.openai.com/*`
- `https://chatgpt.com/*`
- `https://*.openai.com/*`

## Notes

- Language detection uses the code header label and/or classes on the `<code>` element (e.g., `language-js`).
- Dark mode styles are applied automatically via `prefers-color-scheme`.

## License

See `LICENSE`.
