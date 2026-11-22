import {mountServicePicker, serviceDisplayLabel} from "./service-picker.js";
import {buildEvidenceGlossary, hindiCaution, hindiEvidenceNote, hindiExcerpt} from "./evidence-hindi.js";

const urgentServices = new Set(["emergency_c_section", "nicu", "icu", "trauma_emergency", "burn_care"]);

function straightKm(origin, facility) {
  const radians = Math.PI / 180;
  const dLat = (facility.lat - origin[1]) * radians;
  const dLon = (facility.lon - origin[0]) * radians;
  const hav = Math.sin(dLat / 2) ** 2 + Math.cos(origin[1] * radians) *
    Math.cos(facility.lat * radians) * Math.sin(dLon / 2) ** 2;
  return 2 * 6371 * Math.asin(Math.sqrt(Math.min(1, hav)));
}

function nearbyOptions(facilities, origin, serviceId, radius) {
  const weight = urgentServices.has(serviceId) ? .5 : .2;
  const trusted = [];
  const claims = [];
  const kilometres = new Map();
  const score = f => Number.isFinite(f.trust_score) ? f.trust_score : -Infinity;
  const rank = f => score(f) - weight * kilometres.get(f.id);
  const byDistance = (a, b) => kilometres.get(a.id) - kilometres.get(b.id) ||
    String(a.id).localeCompare(String(b.id));
  for (const f of facilities) {
    if (!isMapPoint([f.lon, f.lat])) continue;
    const level = (f.trust_level || "").trim().toLowerCase();
    if (level === "verified" || level === "likely") trusted.push(f);
    else if (level === "claimed only") claims.push(f);
    else continue;
    kilometres.set(f.id, straightKm(origin, f));
  }
  const within = f => kilometres.get(f.id) <= radius;
  const trustedWithin = trusted.filter(within).sort((a, b) => rank(b) - rank(a) || byDistance(a, b));
  claims.sort(byDistance);
  let nearestTrusted = null;
  if (trustedWithin.length <= 2 || trustedWithin.every(f => f.flag_location_uncertain === true)) {
    for (const candidate of trusted) {
      if (!within(candidate) && (!nearestTrusted || byDistance(candidate, nearestTrusted) < 0)) {
        nearestTrusted = candidate;
      }
    }
  }
  return {trusted: trustedWithin, claimed: claims.filter(within), nearestTrusted, nearestClaims: claims.slice(0, 3), kilometres};
}

export default function mount({ parentElement, data }) {
  const page = parentElement.querySelector(".page");
  const find = selector => page.querySelector(selector);
  const form = find(".search");
  const service = find("#service");
  const searchButton = find(".search-button");
  const list = find(".result-list");
  const matches = find(".matches");
  const radiusFilter = find(".radius-filter");
  const radiusSelect = find("#search-radius");
  const showMore = find(".show-more");
  const unverified = find(".unverified-results");
  const claimedList = find(".claimed-list");
  const fallback = find(".radius-fallback");
  const nextOption = find(".next-trusted-option");
  const panel = find(".evidence-panel");
  const routePanel = find(".route-panel");
  const routeStatus = find(".address-route-status");
  const destination = find("#map-hospital");
  const controller = new AbortController();
  const options = {signal:controller.signal};
  // Keep translated labels on their existing nodes. Changing language must not
  // reselect a facility, collapse a list, or request another driving route.
  const languageBindings = new WeakMap();
  const evidenceViews = new WeakMap();
  let evidenceViewId = 0;
  const isHindi = () => document.documentElement.lang === "hi";
  function localize(node, en, hi, attribute = "textContent") {
    const bindings = languageBindings.get(node) || new Map();
    const value = isHindi() ? hi : en;
    if (attribute === "textContent") node.textContent = value;
    else node.setAttribute(attribute, value);
    bindings.set(attribute, {en, hi, value});
    languageBindings.set(node, bindings);
    node.dataset.finderLanguage = "";
  }
  document.addEventListener("care-atlas-language", () => {
    for (const node of page.querySelectorAll("[data-finder-language]")) {
      for (const [attribute, text] of languageBindings.get(node) || []) {
        const current = attribute === "textContent" ? node.textContent : node.getAttribute(attribute);
        // The address picker also owns some status nodes. Respect its newer message.
        if (current !== text.value) continue;
        text.value = isHindi() ? text.hi : text.en;
        if (attribute === "textContent") node.textContent = text.value;
        else node.setAttribute(attribute, text.value);
      }
    }
    for (const section of page.querySelectorAll(".supporting-records")) {
      evidenceViews.get(section)?.(false);
    }
  }, options);
  const privacyDialog = find(".privacy-dialog");
  find(".privacy-link").addEventListener("click", () => privacyDialog.showModal(), options);
  let facilities = data.facilities;
  const services = data.services;
  const evidenceGlossary = buildEvidenceGlossary(services);
  const defaultServiceId = data.activeServiceId;
  let activeServiceId = defaultServiceId;
  let desiredServiceId = defaultServiceId;
  let serviceRequest = null;
  let locationListeners;
  let byId = new Map(facilities.map(item => [item.id,item]));
  data = {...data,destinations:Object.fromEntries(byId)};
  let results = [];
  let selected = null;
  let expanded = null;
  let addressOrigin = null;
  let map = null;
  let locationControl;
  let mapTrigger = null;
  let routeTask = null;
  const distances = new Map();
  let straightDistances = new Map();
  let nearby = null;
  let currentPlace = null;
  const previewSize = 5;
  const pageSize = 10;

  function mappable(item) {
    return item && isMapPoint([item.lon,item.lat]);
  }
  function locationOf(facility, language = "en") {
    return cityStateLabel(facility.city, facility.state, language);
  }
  function cancelRoute() {
    routeTask?.abort();
    routeTask = null;
    routeStatus.replaceChildren();
  }
  function externalDirections(place, hospital) {
    const url = new URL("https://www.google.com/maps/dir/");
    url.search = new URLSearchParams({api:"1",origin:[place.point[1],place.point[0]].join(","),
      destination:[hospital.lat,hospital.lon].join(","),travelmode:"driving"});
    const link = document.createElement("a");
    link.href = url.toString();
    link.target = "_blank";
    link.rel = "noopener noreferrer";
    const message = document.createElement("span");
    localize(message, "Road directions are unavailable here.", "यहाँ सड़क मार्ग उपलब्ध नहीं है।");
    localize(link, "Open directions in Google Maps", "Google Maps में रास्ता देखें");
    routeStatus.replaceChildren(message, " ", link);
  }
  async function routeFrom(place) {
    cancelRoute();
    const id = destination.value;
    if (!map || !place?.point || !id) return;
    const cached = distances.get(id);
    if (cached) {
      map.showAddressRoute(place,cached);
      localize(routeStatus, "Driving route ready.", "गाड़ी से जाने का रास्ता तैयार है।");
      return;
    }
    const task = new AbortController();
    routeTask = task;
    map.showAddressRoute(place,null,true);
    localize(routeStatus, "Finding a driving route from " + place.name + "…",
      placeDisplayLabel(place, "hi") + " से गाड़ी का रास्ता खोजा जा रहा है…");
    const route = await roadRoute(data,id,place,task);
    if (routeTask !== task || !map || destination.value !== id) return;
    routeTask = null;
    map.showAddressRoute(place,route);
    if (route) {
      distances.set(id,route);
      localize(routeStatus, "Driving route ready.", "गाड़ी से जाने का रास्ता तैयार है।");
    } else {
      externalDirections(place,data.destinations[id]);
    }
  }
  function setAddressOrigin(place) {
    if (addressOrigin !== place) {
      cancelRoute();
      distances.clear();
      straightDistances.clear();
      addressOrigin = place;
    }
  }
  function closeMap(restoreFocus = false) {
    cancelRoute();
    map?.destroy();
    map = null;
    routePanel.hidden = true;
    page.classList.remove("map-open");
    localize(searchButton, "Search", "खोजें");
    if (restoreFocus) {
      if (selected && !results.includes(selected)) {
        selected = nearby ? nearby.trusted[0] || nearby.nearestTrusted || null : results[0] || null;
      }
      (mapTrigger?.isConnected ? mapTrigger : find("#results-heading")).focus();
    }
  }
  function openMap(id) {
    const facility = byId.get(id);
    if (!facility || !mappable(facility)) return;
    const initialView = map?.view ?? "street";
    cancelRoute();
    map?.destroy();
    locationControl.hide();
    if (routePanel.hidden) updateDestinations();
    destination.value = id;
    selected = facility;
    expanded = null;
    page.classList.add("map-open");
    routePanel.hidden = false;
    localize(searchButton, "Get route", "रास्ता देखें");
    map = mountHospitalMap(find(".route-canvas"),data,id,initialView);
    if (isMapPoint(addressOrigin?.point)) routeFrom(addressOrigin);
    else map.showDestination("Choose a starting point");
    updateEvidence();
  }
  function mobileLayout() {
    return page.getBoundingClientRect().width <= 760;
  }
  const servicePhrases = new Map([["cardiac","cardiac care"],["dialysis","dialysis"]]);
  function serviceSummary(facility, name, language) {
    const label = (facility.service || "").trim();
    const tier = (facility.trust_level || "").trim().toLowerCase();
    if (language === "hi") {
      const service = serviceDisplayLabel({id:facility.service_id, label}, "hi") || "यह सेवा";
      const subject = name || "इस केंद्र";
      switch (tier) {
        case "verified": return subject + " में " + service + " उपलब्ध होने के मज़बूत प्रमाण हैं।";
        case "likely": return subject + " में " + service + " उपलब्ध होने की संभावना है।";
        case "claimed only": return subject + " की सूची में " + service + " है, लेकिन इसके समर्थन में सीमित प्रमाण हैं।";
        default: return subject + " में " + service + " उपलब्ध होने के प्रमाण की स्थिति स्पष्ट नहीं है।";
      }
    }
    const service = servicePhrases.get(label.toLowerCase()) || label || "this service";
    const subject = name || "This facility";
    const subjectInSentence = name || "this facility";
    switch (tier) {
      case "verified": return "There is strong evidence that " + subjectInSentence + " offers " + service + ".";
      case "likely": return subject + " likely offers " + service + ".";
      case "claimed only": return subject + " lists " + service + ", but supporting evidence is limited.";
      default: return "The strength of the evidence for " + service + " at " + subjectInSentence + " is unclear.";
    }
  }
  function evidenceScore(rawScore) {
    const score = typeof rawScore === "string" && rawScore.trim() ? Number(rawScore) : rawScore;
    return Number.isFinite(score) && score >= 0 && score <= 100 ? score : null;
  }
  function recordText(value) {
    if (Array.isArray(value)) return value.map(recordText).filter(Boolean).join("\n");
    if (typeof value === "string") return value.trim();
    return Number.isFinite(value) ? String(value) : "";
  }
  function cautionText(value) {
    const points = /^[(\[]?(?:[+−-]\d+(?:\.\d+)?(?:\s+(?:points?|pts?))?|\d+(?:\.\d+)?\s+(?:points?|pts?))[)\]]?(?:\s*[:–—-]\s*|\.?\s+|$)/iu;
    return recordText(value).split("\n").map(line => {
      const message = line.trim().replace(points, "");
      return message.replace(/^\p{Ll}/u, letter => letter.toUpperCase());
    }).filter(Boolean).join("\n");
  }
  const trustLabels = new Map([["verified", "Verified"], ["likely", "Likely"], ["claimed only", "Claimed only"]]);
  const hindiTrust = {"verified":"सत्यापित", "likely":"संभावित", "claimed only":"केवल दावा"};
  const facilityTypes = {"hospital":"अस्पताल", "clinic":"क्लिनिक", "health centre":"स्वास्थ्य केंद्र",
    "health center":"स्वास्थ्य केंद्र", "medical college":"मेडिकल कॉलेज"};
  function populateFacilityCard(card, facility, km, outsideRadius) {
    const tier = recordText(facility.trust_level).toLowerCase();
    const grade = trustLabels.get(tier) || "Trust level unavailable";
    const hindiGrade = hindiTrust[tier] || "प्रमाण का स्तर उपलब्ध नहीं है";
    const score = evidenceScore(facility.trust_score);
    card.dataset.trust = tier;
    localize(card.querySelector(".facility-name"), facility.name || "Unnamed facility",
      facility.name || "बिना नाम का स्वास्थ्य केंद्र");
    const place = card.querySelector(".facility-place");
    const type = recordText(facility.facility_type);
    localize(place, [type, locationOf(facility)].filter(Boolean).join(" · "),
      [facilityTypes[type.toLowerCase()] || type, locationOf(facility, "hi")].filter(Boolean).join(" · "));
    place.hidden = !place.textContent;
    const distance = card.querySelector(".distance");
    const measured = Number.isFinite(km) ? km.toFixed(1) : "";
    localize(distance, measured ? measured + " km in a straight line" + (outsideRadius ? " · Outside " + outsideRadius + " km" : "") : "",
      measured ? "सीधी दूरी " + measured + " किमी" + (outsideRadius ? " · " + outsideRadius + " किमी के दायरे से बाहर" : "") : "");
    distance.hidden = !distance.textContent;
    const badge = card.querySelector(".trust-badge");
    const suffix = score === null ? "" : " · " + score + "/100";
    localize(badge, grade + suffix, hindiGrade + suffix);
    const explanation = card.querySelector(".service-label");
    const note = recordText(facility.explanation);
    localize(explanation, note || "No explanation recorded.",
      hindiEvidenceNote(note, evidenceGlossary) || serviceSummary(facility, null, "hi"));
    const warning = card.querySelector(".facility-warning");
    warning.hidden = !facility.flag_location_uncertain;
    const notice = card.querySelector(".claim-notice");
    notice.hidden = tier !== "claimed only";
    const descriptions = [place, distance, badge, explanation, warning, notice].filter(item => !item.hidden);
    for (const item of descriptions) item.id = item.className + "-" + facility.id;
    card.querySelector(".facility-choice").setAttribute("aria-describedby", descriptions.map(item => item.id).join(" "));
  }
  function renderEvidenceScore(row, rawScore) {
    const score = evidenceScore(rawScore);
    if (score === null) {
      localize(row, "Evidence score unavailable", "प्रमाण का स्कोर उपलब्ध नहीं है");
      return;
    }
    const meter = row.querySelector(".score-meter");
    meter.dataset.band = score <= 30 ? "low" : score <= 70 ? "mid" : "high";
    meter.style.setProperty("--score-fill", score + "%");
    meter.setAttribute("aria-valuenow", String(score));
    meter.setAttribute("aria-valuetext", String(score));
    meter.querySelector(".score-value").textContent = String(score);
  }
  function showFacilityFacts(content, facility) {
    const facts = content.querySelector(".facility-facts");
    for (const [key, label, hindiLabel] of [
      ["facility_type", "Facility type", "केंद्र का प्रकार"], ["address", "Address", "पता"], ["n_beds", "Beds", "बिस्तरों की संख्या"],
      ["n_doctors", "Doctors", "डॉक्टरों की संख्या"], ["official_phone", "Official phone", "आधिकारिक फ़ोन नंबर"],
      ["official_website", "Official website", "आधिकारिक वेबसाइट"]
    ]) {
      const value = recordText(facility[key]);
      if (!value) continue;
      const title = document.createElement("dt");
      localize(title, label, hindiLabel);
      const detail = document.createElement("dd");
      if (key === "facility_type" && facilityTypes[value.toLowerCase()]) {
        localize(detail, value, facilityTypes[value.toLowerCase()]);
      } else detail.textContent = value;
      if (key === "address") {
        const englishPlace = locationOf(facility);
        if (englishPlace && !value.toLowerCase().includes(englishPlace.toLowerCase())) {
          const locality = document.createElement("span");
          locality.className = "address-original-place";
          locality.lang = "en";
          locality.textContent = englishPlace;
          detail.append(locality);
        }
      }
      if (key === "official_website") {
        try {
          const url = new URL(/^[a-z][a-z0-9+.-]*:/i.test(value) ? value : "https://" + value);
          if (["https:", "http:"].includes(url.protocol) && !url.username && !url.password) {
            const link = document.createElement("a");
            link.href = url.href;
            link.target = "_blank";
            link.rel = "noopener noreferrer";
            link.textContent = value;
            detail.replaceChildren(link);
          }
        } catch { /* Keep the recorded text visible when it cannot be used as a web link. */ }
      }
      if (key === "official_phone" && /^\+?[\d\s().-]+$/.test(value)) {
        const dial = value.replace(/[^+\d]/g, "");
        if (/^\+?\d{5,15}$/.test(dial)) {
          const link = document.createElement("a");
          link.href = "tel:" + dial;
          link.textContent = value;
          detail.replaceChildren(link);
        }
      }
      facts.append(title, detail);
    }
    if (!facts.childElementCount) {
      facts.hidden = true;
      facts.previousElementSibling.hidden = true;
    }
    const caution = content.querySelector(".facility-caution");
    const problems = cautionText(facility.problems);
    if (problems) {
      localize(caution.querySelector("p"), problems,
        problems.split("\n").map(line => hindiCaution(line) || line).join("\n"));
      caution.hidden = false;
    }
  }
  function showSupportingRecords(content, facility) {
    const section = content.querySelector(".supporting-records");
    const body = section.querySelector(".evidence-body");
    const toggle = section.querySelector(".original-evidence-toggle");
    const caption = section.querySelector(".evidence-language-note");
    const noteElement = section.querySelector(".evidence-explanation");
    const quotes = section.querySelector(".evidence-quotes");
    body.id = "supporting-records-" + ++evidenceViewId;
    toggle.setAttribute("aria-controls", body.id);
    const fullNote = typeof facility.explanation === "string" ? facility.explanation : recordText(facility.explanation);
    let note = fullNote.trim();
    // Keep the original Gold wording in source details when omitting a repeated rating.
    const grade = (facility.trust_level || "").trim().toLowerCase();
    if (grade && note.toLowerCase().startsWith(grade + ":")) {
      note = note.slice(grade.length + 1).trimStart();
    } else if (grade && note.toLowerCase() === grade) {
      note = "";
    }
    const sourceEvidence = Array.isArray(facility.evidence) ? facility.evidence : [facility.evidence];
    const originals = sourceEvidence.map(value => typeof value === "string" ? value : recordText(value))
      .filter(value => value.trim());
    const excerpts = [...new Set(originals.map(value => value.trim()))].slice(0,5);
    for (const excerpt of excerpts) {
      // Gold can quote the same excerpt inside its explanation. Keep the quote once
      // in the overview and preserve the complete explanation under source details.
      const original = excerpt.replace(/^[^:]+:\s*/, "");
      note = note.replace('Evidence: "' + original + '".', "");
    }
    note = note.trim();
    const translatedNote = hindiEvidenceNote(note, evidenceGlossary);
    const translations = excerpts.map(text => hindiExcerpt(text, evidenceGlossary));
    const displayedItems = note ? [translatedNote, ...translations] : translations;
    let showingOriginal = false;
    function render(original) {
      showingOriginal = original;
      const hindi = isHindi();
      const translated = hindi && !original;
      toggle.hidden = !hindi || (!fullNote && !originals.length);
      toggle.textContent = original ? "हिन्दी दृश्य पर लौटें" : "मूल अंग्रेज़ी देखें";
      caption.hidden = !hindi || !displayedItems.length;
      caption.textContent = original ? "मूल अंग्रेज़ी" : displayedItems.every(Boolean) ? "हिन्दी अनुवाद" :
        displayedItems.some(Boolean) ? "हिन्दी अनुवाद · कुछ अंश मूल भाषा में हैं।" :
        "हिन्दी अनुवाद उपलब्ध नहीं है। नीचे मूल पाठ दिया गया है।";
      noteElement.textContent = original ? fullNote : (translated && translatedNote) || note;
      noteElement.hidden = !noteElement.textContent;
      noteElement.lang = translated && translatedNote ? "hi" : "en";
      quotes.replaceChildren();
      (original ? originals : excerpts).forEach((source, i) => {
        const quote = document.createElement("blockquote");
        const translation = translated && translations[i];
        quote.lang = translation ? "hi" : "en";
        quote.textContent = translation || source;
        quotes.append(quote);
      });
      if (!quotes.childElementCount) {
        quotes.textContent = hindi ? "मूल रिकॉर्ड से कोई उद्धरण उपलब्ध नहीं है।" : "No source excerpts provided.";
      }
    }
    toggle.addEventListener("click", () => render(!showingOriginal));
    evidenceViews.set(section, render);
    render(false);
    const sourceNote = content.querySelector(".source-explanation");
    sourceNote.hidden = note === fullNote.trim();
    if (!sourceNote.hidden) sourceNote.textContent = fullNote;
    sourceNote.lang = "en";
  }
  function evidenceFor(facility) {
    const content = find("#evidence-template").content.cloneNode(true);
    localize(content.querySelector(".evidence-summary"), serviceSummary(facility,facility.name, "en"),
      serviceSummary(facility,facility.name, "hi"));
    localize(content.querySelector(".evidence-location"), locationOf(facility), locationOf(facility, "hi"));
    renderEvidenceScore(content.querySelector(".evidence-score"), facility.trust_score);
    showFacilityFacts(content, facility);
    showSupportingRecords(content, facility);
    const warning = content.querySelector(".location-warning");
    warning.hidden = !facility.flag_location_uncertain;
    if (!warning.hidden) localize(warning, "Location may be inaccurate. Check the address.", "स्थान गलत हो सकता है। पता जाँचें।");
    localize(content.querySelector(".source-record"), "Source: workspace.default.gold_facility_services" +
      (facility.record ? " · Record " + facility.record : ""), "स्रोत: workspace.default.gold_facility_services" +
      (facility.record ? " · रिकॉर्ड " + facility.record : ""));
    return content;
  }
  function updateEvidence() {
    const mobile = mobileLayout();
    panel.hidden = mobile || !selected || !routePanel.hidden;
    panel.replaceChildren();
    if (!panel.hidden) panel.append(evidenceFor(selected));
    for (const card of matches.querySelectorAll(".facility")) {
      const facility = byId.get(card.dataset.facility);
      const button = card.querySelector(".facility-choice");
      card.querySelector(".facility-map").setAttribute("aria-expanded",String(!!map && destination.value === facility.id));
      const drawer = card.querySelector(".mobile-evidence");
      const open = mobile ? facility === expanded : facility === selected;
      card.classList.toggle("is-selected",open);
      button.setAttribute("aria-expanded",String(open));
      button.setAttribute("aria-controls",mobile ? drawer.id : panel.id);
      const action = mobile && open ? "Hide evidence" : "View evidence";
      const hindiAction = mobile && open ? "प्रमाण छिपाएँ" : "प्रमाण देखें";
      localize(button, action + " for " + facility.name, facility.name + " के " + hindiAction, "aria-label");
      localize(card.querySelector(".evidence-link"), action, hindiAction);
      drawer.hidden = !mobile || !open;
      drawer.replaceChildren();
      if (!drawer.hidden) drawer.append(evidenceFor(facility));
    }
  }
  function updateDestinations() {
    const previous = destination.value;
    const choices = document.createDocumentFragment();
    // A new starting point can put the hospital the user is routing to beyond the search radius.
    const retained = map && byId.get(previous);
    const destinations = retained && !results.includes(retained) ? [retained, ...results] : results;
    for (const facility of destinations) {
      if (!mappable(facility)) continue;
      const label = [facility.name,locationOf(facility)].filter(Boolean).join(" · ");
      const option = new Option(label,facility.id);
      localize(option, label, [facility.name, locationOf(facility, "hi")].filter(Boolean).join(" · "));
      choices.append(option);
    }
    destination.replaceChildren(choices);
    if (byId.has(previous)) destination.value = previous;
  }
  function makeCard(facility, outsideRadius) {
    const card = find("#result-template").content.firstElementChild.cloneNode(true);
    card.dataset.facility = facility.id;
    populateFacilityCard(card, facility, straightDistances.get(facility.id), outsideRadius);
    const mapButton = card.querySelector(".facility-map");
    if (mappable(facility)) {
      localize(mapButton, "View map for " + facility.name, facility.name + " का नक्शा देखें", "aria-label");
    } else {
      mapButton.disabled = true;
      localize(mapButton, "Map location unavailable", "नक्शे पर स्थान उपलब्ध नहीं है");
    }
    card.querySelector(".mobile-evidence").id = "evidence-" + facility.id;
    if (map && destination.value === facility.id) mapTrigger = mapButton;
    return card;
  }
  function appendCards(container, items) {
    const fragment = document.createDocumentFragment();
    for (const facility of items) fragment.append(makeCard(facility));
    container.append(fragment);
  }
  function showTrustedPage() {
    const start = list.childElementCount;
    appendCards(list, nearby.trusted.slice(start, start + pageSize));
    showMore.hidden = list.childElementCount >= nearby.trusted.length;
  }
  function showClaims() {
    if (nearby && unverified.open && !claimedList.childElementCount) {
      appendCards(claimedList, nearby.claimed);
      updateEvidence();
    }
  }
  function renderNearest(radius) {
    localize(find(".no-trusted"), "No Verified or Likely facility within " + radius + " km.",
      radius + " किमी के दायरे में कोई सत्यापित या संभावित विकल्प नहीं मिला।");
    const options = find(".nearest-options");
    options.replaceChildren();
    const trustedLabel = document.createElement("p");
    options.append(trustedLabel);
    if (nearby.nearestTrusted) {
      localize(trustedLabel, "Nearest Verified or Likely facility outside " + radius + " km",
        radius + " किमी के दायरे से बाहर निकटतम सत्यापित या संभावित विकल्प");
      options.append(makeCard(nearby.nearestTrusted));
    } else localize(trustedLabel, "No Verified or Likely facility with a known location.",
      "ज्ञात स्थान वाला कोई सत्यापित या संभावित विकल्प नहीं मिला।");
    const claimedLabel = document.createElement("p");
    options.append(claimedLabel);
    if (nearby.nearestClaims.length) localize(claimedLabel, "Nearest Claimed only facilities", "निकटतम केंद्र जहाँ सेवा का केवल दावा है");
    else localize(claimedLabel, "No Claimed only facilities with a known location.", "सेवा का केवल दावा करने वाला कोई केंद्र ज्ञात स्थान पर नहीं मिला।");
    for (const facility of nearby.nearestClaims) {
      const km = straightDistances.get(facility.id);
      const outside = km > radius;
      if (outside) {
        options.append(makeCard(facility, radius));
      } else {
        const button = document.createElement("button");
        button.type = "button";
        button.dataset.nearestClaim = facility.id;
        localize(button, facility.name + " · " + km.toFixed(1) + " km in a straight line · Claimed only",
          facility.name + " · सीधी दूरी " + km.toFixed(1) + " किमी · केवल दावा");
        options.append(button);
      }
    }
  }
  function renderResults(place) {
    currentPlace = place;
    const target = place?.kind === "facility" ? byId.get(place.id) : null;
    const origin = addressOrigin?.point;
    const rankByOrigin = !target && isMapPoint(origin);
    const radius = Number(radiusSelect.value);
    const heading = find("#results-heading");
    const serviceItem = services.find(s => s.id === activeServiceId) || {id: activeServiceId, label: facilities[0]?.service || ""};
    const serviceLabel = serviceDisplayLabel(serviceItem, "en");
    const hindiServiceLabel = serviceDisplayLabel(serviceItem, "hi");
    list.replaceChildren();
    claimedList.replaceChildren();
    unverified.open = false;
    unverified.hidden = !rankByOrigin;
    radiusFilter.hidden = !rankByOrigin;
    fallback.hidden = true;
    nextOption.hidden = true;
    nextOption.textContent = "";
    find(".nearest-options").replaceChildren();
    showMore.hidden = true;
    nearby = null;
    straightDistances = new Map();
    expanded = null;
    if (rankByOrigin) {
      nearby = nearbyOptions(facilities, origin, activeServiceId, radius);
      straightDistances = nearby.kilometres;
      results = nearby.trusted.concat(nearby.claimed);
      const count = nearby.trusted.length;
      if (!count) {
        for (const f of [nearby.nearestTrusted, ...nearby.nearestClaims]) {
          if (f && !results.includes(f)) results.push(f);
        }
        fallback.hidden = false;
        renderNearest(radius);
      } else if (nearby.nearestTrusted) {
        const facility = nearby.nearestTrusted;
        const place = [facility.name, facility.city].filter(Boolean).join(", ");
        const km = straightDistances.get(facility.id).toFixed(1);
        const hiPlace = [facility.name, placeDisplayLabel(facility.city || "", "hi")].filter(Boolean).join(", ");
        const hiLevel = hindiTrust[recordText(facility.trust_level).toLowerCase()] || facility.trust_level;
        localize(nextOption, `Next trusted option: ${place} (${facility.trust_level}), ${km} km away`,
          `अगला भरोसेमंद विकल्प: ${hiPlace} (${hiLevel}), ${km} किमी दूर`);
        nextOption.hidden = false;
      }
      const label = addressOrigin.label || addressOrigin.name;
      localize(heading, (serviceLabel || "Facilities") + " near " + label + ": " + count + " trusted " +
        (count === 1 ? "option" : "options") + " (Verified or Likely) within " + radius + " km",
        placeDisplayLabel(addressOrigin, "hi") + " के पास " + (hindiServiceLabel || "स्वास्थ्य केंद्र") + " · " +
        radius + " किमी के दायरे में " + count + " भरोसेमंद विकल्प (सत्यापित या संभावित)");
      localize(unverified.querySelector("summary"), "Unverified claims (" + nearby.claimed.length + ")",
        "अपुष्ट दावे (" + nearby.claimed.length + ")");
      if (!nearby.claimed.length) localize(claimedList, "No Claimed only facilities within this radius.",
        "इस दायरे में सेवा का केवल दावा करने वाला कोई केंद्र नहीं है।");
      showTrustedPage();
    } else {
      results = target ? [target] : facilities.slice();
      if (!target && place?.kind === "pin") results = results.filter(f => String(f.pin || "") === place.name);
      if (!target && place?.kind === "city") results = results.filter(f => locationText(f.city) === locationText(place.name));
      if (target && isMapPoint(origin) && mappable(target)) straightDistances.set(target.id, straightKm(origin, target));
      if (target) localize(heading, ["Selected hospital", serviceLabel].filter(Boolean).join(" · "),
        ["चुना गया स्वास्थ्य केंद्र", hindiServiceLabel].filter(Boolean).join(" · "));
      else localize(heading, serviceLabel ? serviceLabel + " facilities" : "Matching facilities",
        hindiServiceLabel ? hindiServiceLabel + " के लिए स्वास्थ्य केंद्र" : "मिलते-जुलते स्वास्थ्य केंद्र");
      appendCards(list, results.slice(0, previewSize));
    }
    if (map) updateDestinations();
    else selected = rankByOrigin ? (nearby.trusted[0] || nearby.nearestTrusted || null) : results[0] || null;
    find(".empty-state").hidden = rankByOrigin || results.length > 0;
    updateEvidence();
    if (rankByOrigin) {
      const title = languageBindings.get(heading).get("textContent");
      localize(find(".sr-status"), title.en, title.hi);
    } else localize(find(".sr-status"), list.childElementCount + " of " + results.length + " facilities shown.",
      results.length + " में से " + list.childElementCount + " केंद्र दिखाए गए हैं।");
  }
  function chooseLocation(place) {
    const wasOpen = !!map;
    const isDestination = place?.kind === "facility";
    if (isDestination) locationControl.set(addressOrigin);
    else setAddressOrigin(place);
    if (desiredServiceId !== activeServiceId) return;
    renderResults(place);
    if (isDestination) {
      localize(find(".location-status"), "Selected destination: " + place.name, "चुना गया गंतव्य: " + place.name);
      if (wasOpen && mappable(byId.get(place.id))) openMap(place.id);
    } else if (wasOpen && map) {
      if (isMapPoint(addressOrigin?.point)) routeFrom(addressOrigin);
      else map.showDestination("Choose a starting point");
    }
    if (map && place) find("#route-heading").focus();
  }
  async function lookupGold(query,offset,signal) {
    const params = new URLSearchParams({q:query,offset:String(offset || 0)});
    const response = await fetch("/api/locations?" + params, {signal,cache:"no-store"});
    if (!response.ok) throw Error("Location directory unavailable");
    return response.json();
  }
  function bindLocations() {
    const field = find("#location");
    const draft = field.value;
    locationControl?.hide();
    locationListeners?.abort();
    locationListeners = new AbortController();
    locationControl = mountPlaceSearch(form,data,facilities,chooseLocation,() => {
      setAddressOrigin(null);
      if (desiredServiceId !== activeServiceId) return;
      renderResults(null);
      map?.showDestination("Choose a starting point");
    },{signal:locationListeners.signal},lookupGold);
    if (addressOrigin) locationControl.set(addressOrigin);
    else field.value = draft;
  }
  const counts = find("#service-counts");
  const numberFormat = new Intl.NumberFormat("en-IN");
  function showServiceCounts(item) {
    const tiers = [["verified", "Verified"], ["likely", "Likely"], ["claimed", "Claimed only"]];
    const available = item && tiers.every(([key]) => Number.isInteger(item["n_" + key]) && item["n_" + key] >= 0);
    counts.hidden = !available;
    if (!available) return;
    for (const [key, label] of tiers) {
      const value = item["n_" + key];
      counts.querySelector(`.evidence-bar [data-tier="${key}"]`).style.flexGrow = String(value);
      const count = numberFormat.format(value) + " ";
      localize(counts.querySelector(`.evidence-legend [data-tier="${key}"]`), count + label, count + hindiTrust[label.toLowerCase()]);
    }
  }
  function suspendServiceResults() {
    closeMap();
    locationControl?.hide();
    selected = null;
    expanded = null;
    results = [];
    nearby = null;
    currentPlace = null;
    list.replaceChildren();
    claimedList.replaceChildren();
    find(".nearest-options").replaceChildren();
    panel.hidden = true;
    panel.replaceChildren();
    find(".empty-state").hidden = true;
    find(".matches").hidden = true;
  }
  function serviceDraft() {
    serviceRequest?.controller.abort();
    serviceRequest = null;
    desiredServiceId = null;
    showServiceCounts(null);
    suspendServiceResults();
    find(".matches").removeAttribute("aria-busy");
    find(".location-status").textContent = "";
    localize(find(".sr-status"), "Choose a service to see matching facilities.", "स्वास्थ्य केंद्र देखने के लिए सेवा चुनें।");
  }
  async function changeService(item, submit = false, refresh = false) {
    if (!item) return;
    showServiceCounts(item);
    if (serviceRequest?.id === item.id) {
      serviceRequest.submit ||= submit;
      return;
    }
    serviceRequest?.controller.abort();
    serviceRequest = null;
    const previousChoice = desiredServiceId;
    desiredServiceId = item.id;
    if (item.id === activeServiceId) {
      if (refresh || previousChoice !== item.id || find(".matches").hidden) {
        find(".matches").removeAttribute("aria-busy");
        find(".matches").hidden = false;
        find(".location-status").textContent = "";
        renderResults(addressOrigin);
      }
      return;
    }
    const task = {id:item.id, controller:new AbortController(), submit};
    serviceRequest = task;
    const status = find(".location-status");
    const params = new URLSearchParams({service:item.id});
    suspendServiceResults();
    localize(status, "Loading " + item.label + " facilities…", serviceDisplayLabel(item, "hi") + " के लिए स्वास्थ्य केंद्र लोड हो रहे हैं…");
    find(".matches").setAttribute("aria-busy","true");
    try {
      const response = await fetch("/api/facilities?" + params,{signal:task.controller.signal,cache:"no-store"});
      if (!response.ok) throw Error("Facility directory unavailable");
      const rows = await response.json();
      if (serviceRequest !== task || desiredServiceId !== item.id || controller.signal.aborted) return;
      facilities = rows;
      byId = new Map(rows.map(f => [f.id,f]));
      data = {...data,destinations:Object.fromEntries(byId)};
      activeServiceId = item.id;
      selected = null;
      distances.clear();
      bindLocations();
      find(".matches").hidden = false;
      renderResults(addressOrigin);
      status.textContent = "";
      if (task.submit) {
        serviceRequest = null;
        find(".matches").removeAttribute("aria-busy");
        form.requestSubmit();
      }
    } catch {
      if (serviceRequest === task && !task.controller.signal.aborted) {
        localize(status, "Could not load this service. Select Search to retry.", "यह सेवा लोड नहीं हो सकी। दोबारा कोशिश करने के लिए खोजें चुनें।");
      }
    } finally {
      if (serviceRequest === task) {
        serviceRequest = null;
        find(".matches").removeAttribute("aria-busy");
      }
    }
  }
  const servicePicker = mountServicePicker(service, {
    items: services, selectedId: defaultServiceId, signal: controller.signal,
    shortcuts: find(".service-shortcuts"),
    onSelect(item, fromShortcut) {
      if (fromShortcut) {
        closeMap();
        if (!addressOrigin) find("#location").focus();
      }
      changeService(item, false, fromShortcut);
    },
    onEdit(item) {
      if (item) changeService(item);
      else serviceDraft();
    }
  });
  form.addEventListener("submit",event => {
    const item = servicePicker.exact();
    if (item?.id === activeServiceId && desiredServiceId === item.id && !serviceRequest) return;
    event.preventDefault();
    event.stopImmediatePropagation();
    if (item) changeService(item,true);
    else {
      serviceDraft();
      servicePicker.suggest();
      localize(find(".sr-status"), "Choose a service from the suggestions.", "सुझावों में से कोई सेवा चुनें।");
    }
  },{capture:true,signal:controller.signal});
  showServiceCounts(services.find(item => item.id === defaultServiceId));
  bindLocations();
  radiusSelect.addEventListener("change", () => renderResults(currentPlace), options);
  unverified.addEventListener("toggle", showClaims, options);
  showMore.addEventListener("click", () => {
    if (!nearby) return;
    const start = list.childElementCount;
    showTrustedPage();
    updateEvidence();
    list.children[start]?.querySelector(".facility-choice")?.focus();
    localize(find(".sr-status"), list.childElementCount + " of " + nearby.trusted.length + " trusted facilities shown.",
      nearby.trusted.length + " में से " + list.childElementCount + " भरोसेमंद विकल्प दिखाए गए हैं।");
  }, options);
  matches.addEventListener("click",event => {
    const nearest = event.target.closest("[data-nearest-claim]");
    if (nearest) {
      unverified.open = true;
      showClaims();
      const card = Array.from(claimedList.children).find(c => c.dataset.facility === nearest.dataset.nearestClaim);
      const choice = card?.querySelector(".facility-choice");
      choice?.focus();
      choice?.click();
      return;
    }
    const mapButton = event.target.closest(".facility-map");
    if (mapButton && !mapButton.disabled) {
      mapTrigger = mapButton;
      openMap(mapButton.closest(".facility").dataset.facility);
      find("#route-heading").focus();
      return;
    }
    const button = event.target.closest(".facility-choice");
    if (!button) return;
    closeMap();
    selected = byId.get(button.closest(".facility").dataset.facility);
    expanded = mobileLayout() && expanded === selected ? null : selected;
    updateEvidence();
    if (!mobileLayout()) localize(find(".sr-status"), "Showing service evidence for " + selected.name + ".",
      selected.name + " के लिए सेवा के प्रमाण दिखाए जा रहे हैं।");
  },options);
  destination.addEventListener("change",() => openMap(destination.value),options);
  find(".change-start").addEventListener("click",() => locationControl.focus(),options);
  find(".back-to-results").addEventListener("click",() => {
    closeMap(true);
    updateEvidence();
  },options);
  find(".reset-search").addEventListener("click",() => {
    closeMap();
    form.reset();
    servicePicker.reset();
    setAddressOrigin(null);
    locationControl.set(null);
    service.setCustomValidity("");
    if (desiredServiceId !== defaultServiceId || activeServiceId !== defaultServiceId || serviceRequest) changeService(services.find(item => item.id === defaultServiceId));
    else renderResults(null);
    service.focus();
  },options);
  const toggle = find(".layout-toggle");
  localize(searchButton, "Search", "खोजें");
  localize(showMore, "Show more", "और दिखाएँ");
  localize(toggle, "Preview mobile layout", "मोबाइल दृश्य देखें");
  toggle.addEventListener("click",() => {
    const preview = page.classList.toggle("is-mobile");
    toggle.setAttribute("aria-pressed",String(preview));
    if (preview) localize(toggle, "Return to desktop layout", "डेस्कटॉप दृश्य पर लौटें");
    else localize(toggle, "Preview mobile layout", "मोबाइल दृश्य देखें");
    expanded = null;
    updateEvidence();
    page.scrollIntoView({block:"start"});
  },options);
  let wasMobile = mobileLayout();
  const observer = new ResizeObserver(() => {
    const mobile = mobileLayout();
    if (mobile !== wasMobile) {
      wasMobile = mobile;
      updateEvidence();
    }
  });
  observer.observe(page);
  const linkedFacility = data.requestedServiceFound && data.requestedRecord
    ? facilities.find(f => f.record === data.requestedRecord) : null;
  renderResults(linkedFacility ? {kind:"facility",id:linkedFacility.id} : null);
  if (linkedFacility) {
    const heading = find("#results-heading");
    expanded = linkedFacility;
    updateEvidence();
    heading.focus({preventScroll:true});
    heading.scrollIntoView({block:"start"});
  } else if (data.requestedRecord) {
    selected = null;
    updateEvidence();
    localize(find(".location-status"), "This hospital and service could not be found. Browse all facilities to search again.",
      "यह स्वास्थ्य केंद्र और सेवा नहीं मिली। सभी केंद्रों की निर्देशिका में दोबारा खोजें।");
  }
  return () => {
    observer.disconnect();
    serviceRequest?.controller.abort();
    locationListeners?.abort();
    closeMap();
    controller.abort();
  };
}
