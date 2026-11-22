// Record both versions on the element so template clones retain their English copy.
const storageKey = "care-atlas-language";
function savedLanguage() {
  try { return localStorage.getItem(storageKey) === "hi" ? "hi" : "en"; }
  catch { return null; }
}
let language = savedLanguage() || "en";
document.documentElement.lang = language;

function setLanguage(value) {
  if (!value || value === language) return;
  language = value;
  document.documentElement.lang = language;
  document.dispatchEvent(new CustomEvent("care-atlas-language", {bubbles: true, detail: {language}}));
}
window.addEventListener("pageshow", event => {
  if (event.persisted) setLanguage(savedLanguage());
});

export function localizeStatic(root) {
  for (const node of root.querySelectorAll("[data-hi], [data-hi-label], [data-hi-placeholder]")) {
    for (const [suffix, attribute] of [["", null], ["Label", "aria-label"], ["Placeholder", "placeholder"]]) {
      const hindi = node.dataset["hi" + suffix];
      if (hindi === undefined) continue;
      const key = "en" + suffix;
      if (node.dataset[key] === undefined) {
        node.dataset[key] = attribute ? node.getAttribute(attribute) || "" : node.textContent;
      }
      const text = language === "hi" ? hindi : node.dataset[key];
      if (attribute) node.setAttribute(attribute, text);
      else if (node.textContent !== text) node.textContent = text;
    }
  }
  for (const template of root.querySelectorAll("template")) localizeStatic(template.content);
}

export function bilingualText(node, english, hindi) {
  node.dataset.en = english;
  node.dataset.hi = hindi;
  node.textContent = language === "hi" ? hindi : english;
}

export function mountLanguage(root, titles) {
  const group = root.querySelector(".language-switch");
  function update() {
    localizeStatic(root);
    document.title = titles[language];
    for (const button of group.querySelectorAll("[data-language]")) {
      button.setAttribute("aria-pressed", String(button.dataset.language === language));
    }
  }
  group.addEventListener("click", event => {
    const button = event.target.closest("[data-language]");
    if (!button || button.dataset.language === language) return;
    const selected = button.dataset.language === "hi" ? "hi" : "en";
    try { localStorage.setItem(storageKey, selected); } catch {}
    setLanguage(selected);
  });
  document.addEventListener("care-atlas-language", update);
  update();
}
