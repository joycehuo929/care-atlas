import {serviceHindi} from "./service-hindi.js";

const relatedTerms = [
  ["lung", "pulmon", "respirat"],
  ["heart", "cardi"],
  ["kidney", "nephro", "renal", "dialys", "hemodialys", "haemodialys"],
  ["eye", "ophthalm"],
  ["skin", "dermat"],
  ["bone", "orthop"],
  ["child", "pediatr", "paediatr"],
  ["tooth", "teeth", "dental", "dentist"],
];

const commonServices = [
  {id: "dialysis", en: "Dialysis", hi: "डायलिसिस", aliases: ["डायलिसीस", "डायलिसस", "डायलाइसिस"]},
  {id: "emergency_c_section", en: "Emergency C-section", hi: "आपातकालीन सीज़ेरियन प्रसव",
    aliases: ["इमरजेंसी सी सेक्शन", "आपातकालीन सी सेक्शन", "आपातकालीन सिजेरियन", "इमरजेंसी सिजेरियन"]},
  {id: "nicu", en: "NICU", hi: "नवजात गहन चिकित्सा इकाई (NICU)", aliases: ["एनआईसीयू", "एन आई सी यू"]},
  {id: "icu", en: "ICU", hi: "गहन चिकित्सा इकाई (ICU)", aliases: ["आईसीयू", "आई सी यू"]},
  {en: "Cataract surgery", hi: "मोतियाबिंद का ऑपरेशन", aliases: ["मोतियाबिंद सर्जरी", "मोतियाबिंद की शल्य चिकित्सा"]},
];
const commonById = new Map(commonServices.filter(service => service.id).map(service => [service.id, service]));
const commonByName = new Map(commonServices.map(service => [normalize(service.en), service]));

function normalize(text) {
  // Accept both spellings of फ़/फ, ज़/ज, etc. Keep vowels and halants meaningful.
  return String(text ?? "").normalize("NFKD").toLowerCase().replace(/(\p{Script=Latin})\p{M}+/gu, "$1")
    .replace(/[\u093c\u200c\u200d]/gu, "").replace(/ँ/gu, "ं").normalize("NFC")
    .replace(/[^\p{L}\p{M}\p{N}]+/gu, " ").trim();
}

function commonService(item) {
  if (!item) return;
  return commonById.get(item.id) || commonByName.get(normalize(item.label));
}

export function serviceDisplayLabel(itemOrLabel, language = document.documentElement.lang) {
  const item = typeof itemOrLabel === "string" ? {label: itemOrLabel} : itemOrLabel;
  if (language.startsWith("hi")) {
    const translated = serviceHindi[item?.id]?.label || commonService(item)?.hi;
    if (translated) return translated;
  }
  return item?.label || "";
}

function catalogEntries(items) {
  const counts = new Map();
  const variants = new Map();
  const englishNamesByHindi = new Map();
  for (const item of items) {
    const label = normalize(item.label);
    const hindi = normalize(serviceDisplayLabel(item, "hi"));
    const variant = label + "|" + item.service_source;
    counts.set(label, (counts.get(label) || 0) + 1);
    variants.set(variant, (variants.get(variant) || 0) + 1);
    if (!englishNamesByHindi.has(hindi)) englishNamesByHindi.set(hindi, new Set());
    englishNamesByHindi.get(hindi).add(item.label.trim());
  }
  return items.map(item => {
    const label = normalize(item.label);
    const duplicateSource = variants.get(label + "|" + item.service_source) > 1;
    let kind = "";
    if (counts.get(label) > 1) {
      const source = item.service_source === "curated" ? "Core service" : item.service_source === "specialty" ? "Specialty" : item.service_source;
      kind = source && duplicateSource ? source + " (" + item.id + ")" : source || item.id;
    }
    const common = commonService(item);
    const translation = serviceHindi[item.id];
    const hindiLabel = translation?.label || common?.hi || item.label;
    const keys = [...new Set([item.label, [item.label, kind].filter(Boolean).join(" "), hindiLabel,
      ...(translation?.aliases || []), ...(common ? [common.hi, common.en, ...common.aliases] : [])]
      .map(normalize).filter(Boolean))];
    const compactKeys = [...new Set(keys.map(key => key.replaceAll(" ", "")))];
    const hindiCollision = englishNamesByHindi.get(normalize(hindiLabel)).size > 1;
    const words = label.split(" ");
    const related = relatedTerms.filter(group => words.some(word => group.some(stem => word.startsWith(stem)))).flat();
    return {item, kind, keys, compactKeys, label, related, common, hindiLabel, hindiCollision};
  });
}

function suggestions(entries, query) {
  if (!query) return entries;
  const terms = query.split(" ");
  const compact = terms.join("");
  const ranks = [[], [], [], [], []];
  for (const entry of entries) {
    const keys = entry.keys;
    if (entry.compactKeys.includes(compact)) ranks[0].push(entry);
    else if (keys.some(key => key.startsWith(query))) ranks[1].push(entry);
    else if (keys.some(key => key.includes(query))) ranks[2].push(entry);
    else if (keys.some(key => terms.every(term => key.includes(term)))) ranks[3].push(entry);
    else if (terms.every(term => keys.some(key => key.includes(term)) || (term.length >= 3 &&
      entry.related.some(stem => stem.startsWith(term) || term.startsWith(stem))))) ranks[4].push(entry);
  }
  return ranks.flat();
}

// Each entry retains the Gold ID, including entries that share a display label.
export function mountServicePicker(input, {items, selectedId, onSelect, onEdit, signal, shortcuts}) {
  const root = input.parentElement;
  const entries = catalogEntries(items);
  const exactIndex = new Map();
  for (const entry of entries) {
    for (const term of entry.compactKeys) {
      if (!exactIndex.has(term)) exactIndex.set(term, []);
      exactIndex.get(term).push(entry);
    }
  }
  const list = document.createElement("div");
  list.id = input.id + "-options";
  list.className = "service-menu";
  list.setAttribute("role", "listbox");
  list.hidden = true;
  const toggle = document.createElement("button");
  toggle.type = "button";
  toggle.className = "service-chevron";
  toggle.tabIndex = -1;
  toggle.setAttribute("aria-controls", list.id);
  toggle.setAttribute("aria-haspopup", "listbox");
  const feedback = document.createElement("span");
  feedback.className = "visually-hidden";
  feedback.setAttribute("role", "status");
  root.append(toggle, list, feedback);
  input.setAttribute("role", "combobox");
  input.setAttribute("aria-autocomplete", "list");
  input.setAttribute("aria-controls", list.id);
  input.autocomplete = "off";
  input.setAttribute("spellcheck", "false");
  input.disabled = toggle.disabled = !entries.length;
  let selected = entries.find(entry => entry.item.id === selectedId);
  let language = document.documentElement.lang;
  const hindi = () => language.startsWith("hi");
  const display = entry => entry ? (hindi() ? entry.hindiLabel : entry.item.label) : "";
  input.defaultValue = display(selected);
  input.value = input.defaultValue;
  let results = [];
  let renderedQuery;
  let active = -1;
  let shortcutHighlighted = false;
  let outside;
  const options = {signal};
  const shortcutButtons = new Map();

  function markShortcut() {
    for (const [id, button] of shortcutButtons) button.setAttribute("aria-pressed", String(id === selected?.item.id));
  }

  if (shortcuts) {
    for (const {id, en: name} of commonServices) {
      let entry = id && entries.find(option => option.item.id === id);
      if (!entry) {
        const matches = entries.filter(option => option.label === normalize(name));
        const core = matches.filter(option => option.item.service_source === "curated");
        entry = core.length === 1 ? core[0] : matches.length === 1 ? matches[0] : null;
      }
      if (!entry) continue;
      const button = document.createElement("button");
      button.type = "button";
      button.className = "service-shortcut";
      button.textContent = name;
      button.addEventListener("click", () => select(entry, true), options);
      shortcutButtons.set(entry.item.id, button);
      shortcuts.append(button);
    }
    shortcuts.hidden = !shortcutButtons.size;
    markShortcut();
  }

  function expanded(value) {
    list.hidden = !value;
    input.setAttribute("aria-expanded", String(value));
    toggle.setAttribute("aria-expanded", String(value));
  }

  function highlight(index) {
    shortcutHighlighted = false;
    list.children[active]?.classList.remove("active-option");
    active = index;
    const row = list.children[index];
    if (index < 0 || !row) {
      input.removeAttribute("aria-activedescendant");
      return;
    }
    row.classList.add("active-option");
    input.setAttribute("aria-activedescendant", row.id);
    const top = row.offsetTop;
    if (top < list.scrollTop) list.scrollTop = top;
    else if (top + row.offsetHeight > list.scrollTop + list.clientHeight) {
      list.scrollTop = top + row.offsetHeight - list.clientHeight;
    }
  }

  function close() {
    expanded(false);
    highlight(-1);
    outside?.abort();
    outside = null;
    feedback.textContent = "";
  }

  function position() {
    const box = root.getBoundingClientRect();
    const viewport = window.visualViewport;
    const top = viewport?.offsetTop || 0;
    const below = top + (viewport?.height || window.innerHeight) - box.bottom;
    const above = box.top - top;
    const up = below < 150 && above > below;
    list.classList.toggle("opens-up", up);
    list.style.setProperty("--service-room", Math.max(44, (up ? above : below) - 12) + "px");
  }

  function open(browseAll = !!selected && input.value === display(selected)) {
    const query = browseAll ? "" : normalize(input.value);
    const showDefault = list.hidden || query !== renderedQuery;
    if (query !== renderedQuery) {
      results = suggestions(entries, query);
      renderedQuery = query;
      const fragment = document.createDocumentFragment();
      results.forEach((entry, index) => {
        const option = document.createElement("div");
        option.id = list.id + "-" + index;
        option.dataset.index = index;
        option.setAttribute("role", "option");
        option.setAttribute("aria-selected", String(entry === selected));
        option.textContent = display(entry);
        const kind = hindi() ? entry.kind.replace(/^Core service\b/, "मुख्य सेवा").replace(/^Specialty\b/, "विशेषता") : entry.kind;
        // Show the matching script when the query is in the other language.
        // Original Gold labels also distinguish different services translated alike.
        const otherLabel = hindi() && (entry.hindiCollision || /\p{Script=Latin}/u.test(query)) ? entry.item.label :
          !hindi() && /\p{Script=Devanagari}/u.test(query) ? entry.hindiLabel : "";
        const details = [otherLabel !== display(entry) ? otherLabel : "", kind].filter(Boolean).join(" · ");
        if (details) {
          const detail = document.createElement("small");
          detail.className = "service-kind";
          detail.textContent = details;
          option.append(" ", detail);
        }
        fragment.append(option);
      });
      if (!results.length) {
        const empty = document.createElement("div");
        empty.className = "service-no-matches";
        empty.textContent = hindi() ? "कोई सेवा नहीं मिली। छोटा नाम लिखकर देखें।" : "No services match. Try a shorter name.";
        fragment.append(empty);
      }
      list.replaceChildren(fragment);
      highlight(-1);
      list.scrollTop = 0;
    }
    expanded(true);
    // Enter can confirm a visibly highlighted shortcut shared by a Core and
    // Specialty row. Partial queries and other duplicate names require a choice.
    if (showDefault && query && !selected) {
      const compact = query.replaceAll(" ", "");
      const exactMatches = exactIndex.get(compact) || [];
      const preferred = exactMatches.find(entry => {
        if (!entry.common || entry.item.service_source !== "curated") return false;
        if (entry.common.id && entry.common.id !== entry.item.id) return false;
        return [entry.common.en, entry.common.hi, ...entry.common.aliases, entry.hindiLabel]
          .some(name => normalize(name).replaceAll(" ", "") === compact);
      });
      if (preferred) {
        highlight(results.indexOf(preferred));
        shortcutHighlighted = true;
      }
    }
    position();
    feedback.textContent = hindi() ? "सुझाई गई सेवाएँ: " + results.length :
      results.length === 1 ? "1 service suggestion." : results.length + " service suggestions.";
    if (!outside) {
      outside = new AbortController();
      const listen = {signal: outside.signal};
      document.addEventListener("pointerdown", event => {
        if (!event.composedPath().includes(root)) close();
      }, {...listen, capture: true});
      window.visualViewport?.addEventListener("resize", position, listen);
      window.addEventListener("scroll", position, {...listen, capture: true, passive: true});
    }
  }

  function select(entry, fromShortcut = false) {
    if (!entry) return;
    selected = entry;
    input.value = display(entry);
    markShortcut();
    input.setCustomValidity("");
    renderedQuery = undefined;
    close();
    onSelect(entry.item, fromShortcut);
  }

  function exactEntry() {
    const query = normalize(input.value);
    if (!query) return;
    if (selected && input.value === display(selected)) return selected;
    const matches = exactIndex.get(query.replaceAll(" ", "")) || [];
    if (matches.length === 1) return matches[0];
  }

  function localize() {
    const replaceValue = selected && input.value === display(selected);
    language = document.documentElement.lang;
    input.placeholder = hindi() ? "सेवा लिखें या चुनें" : "Type or choose a service";
    input.defaultValue = display(entries.find(entry => entry.item.id === selectedId));
    if (replaceValue) input.value = display(selected);
    list.setAttribute("aria-label", hindi() ? "सेवा के सुझाव" : "Service suggestions");
    toggle.title = hindi() ? "सभी सेवाएँ देखें" : "Browse all services";
    toggle.setAttribute("aria-label", toggle.title);
    for (const [id, button] of shortcutButtons) {
      const entry = entries.find(entry => entry.item.id === id);
      button.textContent = hindi() ? entry.hindiLabel : entry.common.en;
    }
    renderedQuery = undefined;
    if (!list.hidden) open();
  }
  localize();
  document.addEventListener("care-atlas-language", localize, options);
  expanded(false);
  toggle.addEventListener("mousedown", event => event.preventDefault(), options);
  toggle.addEventListener("click", () => {
    const wasOpen = !list.hidden;
    input.focus({preventScroll: true});
    if (wasOpen) close();
    else open(true);
  }, options);
  input.addEventListener("click", () => open(), options);
  input.addEventListener("invalid", event => {
    event.preventDefault();
    input.focus();
    open(false);
  }, options);
  input.addEventListener("input", () => {
    input.setCustomValidity("");
    selected = undefined;
    selected = exactEntry();
    markShortcut();
    onEdit?.(selected?.item);
    open(false);
  }, options);
  input.addEventListener("keydown", event => {
    if (event.isComposing) return;
    if (event.key === "ArrowDown" || event.key === "ArrowUp") {
      event.preventDefault();
      if (list.hidden) open();
      if (results.length) {
        const next = event.key === "ArrowDown" ? Math.min(active + 1, results.length - 1)
          : active < 0 ? results.length - 1 : Math.max(0, active - 1);
        highlight(next);
      }
    } else if (!list.hidden && event.key === "Enter") {
      if (results[active]) {
        // Exact shortcut names also submit the user's location with the form.
        if (!shortcutHighlighted) event.preventDefault();
        select(results[active]);
      } else if (exactEntry()) {
        close(); // Let the form submit the service and the entered starting point together.
      }
    } else if (!list.hidden && event.key === "Escape") {
      event.preventDefault();
      event.stopPropagation();
      close();
    }
  }, options);
  root.addEventListener("focusout", event => {
    if (!root.contains(event.relatedTarget)) close();
  }, options);
  list.addEventListener("mousedown", event => event.preventDefault(), options);
  list.addEventListener("click", event => {
    const option = event.target.closest('[role="option"]');
    if (option) select(results[Number(option.dataset.index)]);
  }, options);
  signal?.addEventListener("abort", close, {once: true});
  return {
    exact: () => exactEntry()?.item,
    suggest() { input.focus(); open(false); },
    reset() {
      selected = entries.find(entry => entry.item.id === selectedId);
      renderedQuery = undefined;
      input.value = display(selected);
      markShortcut();
      close();
    }
  };
}
