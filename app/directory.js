import {mountServicePicker} from "./service-picker.js";
import {bilingualText, mountLanguage} from "./locale.js";
import {cityStateLabel} from "./places-hindi.js";

mountLanguage(document, {en: "Facility directory · Care Atlas", hi: "स्वास्थ्य संस्थानों की सूची · Care Atlas"});

const form = document.querySelector("#hospital-search");
const nameInput = document.querySelector("#hospital-name");
const list = document.querySelector("#hospitals");
const status = document.querySelector("#results-status");
const recovery = document.querySelector("#recovery");
const pagination = document.querySelector("#pagination");
const pageSize = 24;
const number = new Intl.NumberFormat("en-IN");
let currentRequest;

function element(tag, className, text, hindi) {
  const node = document.createElement(tag);
  if (className) node.className = className;
  if (hindi != null) bilingualText(node, text, hindi);
  else if (text != null) node.textContent = text;
  return node;
}

async function getJSON(url, signal) {
  const response = await fetch(url, {signal, cache: "no-store"});
  if (!response.ok) throw new Error("Directory request failed");
  return response.json();
}

function retryButton(action) {
  const button = element("button", "recovery-link", "Try again", "फिर कोशिश करें");
  button.type = "button";
  button.addEventListener("click", action, {once: true});
  return button;
}

function showServices(target, hospital, services, signal) {
  target.replaceChildren();
  if (!services.length) {
    target.append(element("p", null, "This facility has no listed services.", "इस संस्थान के लिए कोई सेवा दर्ज नहीं है।"));
    return;
  }
  const label = element("label", null, "Service", "सेवा");
  const input = element("input");
  input.id = "service-" + hospital.record;
  input.placeholder = "Type or choose a service";
  label.htmlFor = input.id;
  const entry = element("div", "service-entry");
  entry.append(input);
  const action = element("a", "evidence-action", "View service evidence", "सेवा के प्रमाण देखें");
  const updateLink = item => {
    if (!item) {
      action.removeAttribute("href");
      action.setAttribute("aria-disabled", "true");
      return;
    }
    action.removeAttribute("aria-disabled");
    action.href = "/?" + new URLSearchParams({service: item.id, facility: hospital.record});
  };
  const items = services.map(item => ({id: item.service_id, label: item.service, service_source: item.service_source}));
  mountServicePicker(input, {items, selectedId: items[0].id, onSelect: updateLink, onEdit: updateLink, signal});
  updateLink(items[0]);
  const controls = element("div", "service-controls");
  controls.append(entry, action);
  target.append(label, controls);
}

function hospitalRow(hospital, signal) {
  const row = element("li");
  const details = element("details", "hospital-row");
  const summary = element("summary");
  const identity = element("span", "hospital-identity");
  const place = cityStateLabel(hospital.city, hospital.state);
  identity.append(hospital.name ? element("span", "hospital-title", hospital.name) :
    element("span", "hospital-title", "Unnamed facility", "संस्थान का नाम उपलब्ध नहीं है"));
  if (place) identity.append(element("span", "hospital-location", place, cityStateLabel(hospital.city, hospital.state, "hi")));
  const count = hospital.service_count;
  summary.append(identity, element("span", "service-count", number.format(count) + (count === 1 ? " service" : " services"),
    number.format(count) + (count === 1 ? " सेवा" : " सेवाएँ")));
  const content = element("div", "service-picker");
  details.append(summary, content);
  row.append(details);

  async function loadServices() {
    const loading = element("p", null, "Loading services…", "सेवाएँ लोड हो रही हैं…");
    loading.setAttribute("role", "status");
    content.replaceChildren(loading);
    try {
      const services = await getJSON("/api/hospitals/" + encodeURIComponent(hospital.record) + "/services", signal);
      if (!signal.aborted) showServices(content, hospital, services, signal);
    } catch {
      if (signal.aborted) return;
      bilingualText(loading, "The service list could not be loaded.", "सेवाओं की सूची लोड नहीं हो सकी।");
      content.append(retryButton(loadServices));
    }
  }
  details.addEventListener("toggle", () => {
    if (details.open && !content.firstChild) loadServices();
  });
  return row;
}

function directoryURL(query, page) {
  const url = new URL("/hospitals", location.origin);
  if (query) url.searchParams.set("q", query);
  if (page > 1) url.searchParams.set("page", page);
  return url;
}

function navigate(url, focusResults = false) {
  if (url.href !== location.href) history.pushState(null, "", url);
  if (focusResults) document.querySelector("#results-title").focus();
  loadDirectory();
}

function directoryLink(label, hindi, url, className, focusResults) {
  const link = element("a", className, label, hindi);
  link.href = url;
  link.addEventListener("click", event => {
    if (event.ctrlKey || event.metaKey || event.shiftKey || event.altKey || event.button !== 0) return;
    event.preventDefault();
    navigate(url, focusResults);
  });
  return link;
}

function showPagination(query, page, pages) {
  pagination.replaceChildren();
  pagination.hidden = pages <= 1;
  if (pagination.hidden) return;
  if (page > 1) pagination.append(directoryLink("Previous", "पिछला", directoryURL(query, page - 1), "paging-link", true));
  pagination.append(element("span", "page-position", "Page " + number.format(page) + " of " + number.format(pages),
    "पृष्ठ " + number.format(page) + " / " + number.format(pages)));
  if (page < pages) pagination.append(directoryLink("Next", "अगला", directoryURL(query, page + 1), "paging-link", true));
}

async function loadDirectory() {
  currentRequest?.abort();
  currentRequest = new AbortController();
  const signal = currentRequest.signal;
  const params = new URLSearchParams(location.search);
  const query = (params.get("q") || "").trim().slice(0, nameInput.maxLength);
  const requestedPage = Number(params.get("page"));
  const page = Number.isSafeInteger(requestedPage) && requestedPage > 0 && Number.isSafeInteger(requestedPage * pageSize) ? requestedPage : 1;
  nameInput.value = query;
  list.setAttribute("aria-busy", "true");
  list.replaceChildren();
  recovery.replaceChildren();
  pagination.hidden = true;
  bilingualText(status, "Loading hospitals…", "अस्पतालों की सूची लोड हो रही है…");
  const search = new URLSearchParams({q: query, offset: (page - 1) * pageSize, limit: pageSize});
  try {
    const {items, total} = await getJSON("/api/hospitals?" + search, signal);
    if (signal.aborted) return;
    const pages = Math.max(1, Math.ceil(total / pageSize));
    if (page > pages) {
      history.replaceState(null, "", directoryURL(query, pages));
      loadDirectory();
      return;
    }
    if (items.length) {
      const start = (page - 1) * pageSize + 1;
      const end = start + items.length - 1;
      const range = start === end ? number.format(start) : number.format(start) + "–" + number.format(end);
      const match = query ? " matching “" + query + "”" : "";
      bilingualText(status, range + " of " + number.format(total) + (total === 1 ? " facility" : " facilities") + match,
        (query ? "“" + query + "” से मेल खाने वाले " : "") + number.format(total) + " संस्थानों में से " + range);
      list.replaceChildren(...items.map(item => hospitalRow(item, signal)));
      showPagination(query, page, pages);
    } else {
      bilingualText(status,
        query ? "No hospitals found for “" + query + "”. Try a shorter name or another spelling." : "There are no facilities in the directory yet.",
        query ? "“" + query + "” के लिए कोई अस्पताल नहीं मिला। छोटा नाम या दूसरी वर्तनी आज़माएँ।" : "सूची में अभी कोई संस्थान नहीं है।");
      if (query) recovery.append(directoryLink("Clear search", "खोज हटाएँ", directoryURL("", 1), "recovery-link", true));
    }
  } catch {
    if (signal.aborted) return;
    bilingualText(status, "The facility directory could not be loaded.", "स्वास्थ्य संस्थानों की सूची लोड नहीं हो सकी।");
    recovery.append(retryButton(loadDirectory));
  } finally {
    if (!signal.aborted) list.setAttribute("aria-busy", "false");
  }
}

form.addEventListener("submit", event => {
  event.preventDefault();
  navigate(directoryURL(nameInput.value.trim(), 1));
});
window.addEventListener("popstate", loadDirectory);
loadDirectory();
