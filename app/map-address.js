import {administrativeNameHindi, cityStateLabel} from "./places-hindi.js";

// The location field serves both the facility directory and the open route map.
function locationText(value) {
  return String(value || "").normalize("NFKC").toLowerCase().replace(/[^\p{L}\p{N}\p{M}]+/gu, " ").trim();
}

// Translate known area names for lookup, retaining the Gold record and its point.
// Other names and addresses keep their spelling for the existing directory/geocoder.
const areaHindi = {patna:"पटना", bihar:"बिहार", bastar:"बस्तर", chhattisgarh:"छत्तीसगढ़"};
const areaQueries = new Map(Object.entries(areaHindi).map(([en, hi]) => [locationText(hi), en]));
for (const [hi, en] of [["शहर","city"],["ज़िला","district"],["जिला","district"]]) {
  areaQueries.set(locationText(hi), en);
}
function placeLookupQuery(raw) {
  return raw.replace(/[\p{L}\p{M}\p{N}]+/gu, word => areaQueries.get(locationText(word)) ?? word);
}
function placeDisplayLabel(place, language = document.documentElement.lang) {
  const label = typeof place === "string" ? place : place?.label || place?.name || "";
  if (!language.startsWith("hi") || !label) return label;
  if (typeof place === "string") return label.split(",").map(administrativeNameHindi).join(", ");
  if (place.kind === "address") return place.labelHi || label;
  if (["city","district","state","pincode","pin"].includes(place.kind)) {
    if (place.name && (place.state || label === place.name)) return cityStateLabel(place.name, place.state, language);
    return label.split(",").map(administrativeNameHindi).join(", ");
  }
  if (place.isGoldLocation && place.name && place.state) {
    // Postal and other directory entries can contain a POI or a street name.
    return [place.name, administrativeNameHindi(place.state)].join(", ");
  }
  return label;
}

const placeMessagesHi = {
  "Directory places":"निर्देशिका में स्थान", "Suggested places":"सुझाए गए स्थान", "Choose a location":"स्थान चुनें",
  "More places":"और स्थान देखें", "Browse all places":"सभी स्थान देखें", "Finding locations…":"स्थान खोजे जा रहे हैं…",
  "Directory location search is unavailable. Try again or select a listed match.":"निर्देशिका में अभी स्थान नहीं खोज सकते। फिर कोशिश करें या सूची से स्थान चुनें।",
  "No matching place or address found. Try a street, landmark or PIN.":"कोई स्थान या पता नहीं मिला। सड़क, पहचान वाली जगह या पिन कोड लिखें।",
  "Choose your matching location.":"सूची में अपना स्थान चुनें।",
  "City":"शहर", "District":"ज़िला", "State":"राज्य", "Post Office":"डाकघर", "Pincode":"पिन कोड", "Pin":"पिन कोड",
  "Facility destination":"स्वास्थ्य सुविधा", "Street and house number match":"सड़क और मकान का नंबर मेल खाते हैं",
  "Similar street · verify the address":"मिलती-जुलती सड़क · पते की पुष्टि करें",
  "Nearby match · house number unconfirmed":"आस-पास का पता · मकान के नंबर की पुष्टि नहीं हुई",
  "Bank branch":"बैंक शाखा", "Shop":"दुकान", "Café":"कैफ़े", "Hospital":"अस्पताल", "Station":"स्टेशन",
};
function placeMessage(text) {
  return (document.documentElement.lang.startsWith("hi") && placeMessagesHi[text]) || text;
}

function inMapArea(point, extent) {
  return Array.isArray(point) && point.length === 2 && point.every(Number.isFinite) &&
    point[0] >= extent[0] && point[0] <= extent[2] && point[1] >= extent[1] && point[1] <= extent[3];
}

function isMapPoint(point) {
  return inMapArea(point, [-180, -85.05113, 180, 85.05113]) && (point[0] !== 0 || point[1] !== 0);
}

async function mapJson(url, task) {
  const timer = setTimeout(() => task.abort(), 11000);
  try {
    const response = await fetch(url, {
      signal: task.signal, credentials: "omit", cache: "no-store", referrerPolicy: "strict-origin-when-cross-origin"
    });
    if (!response.ok) throw Error("Map service unavailable");
    return await response.json();
  } finally {
    clearTimeout(timer);
  }
}

function goldPlace(location) {
  return {...location, label:location.label || location.name,
    point:isMapPoint(location.point) ? location.point : null, isGoldLocation:true};
}

function locationDirectory(locations, facilities) {
  const places = locations.filter(p => p.name).map(goldPlace);
  const seen = new Set();
  for (const facility of facilities) {
    if (!facility.name) continue;
    const key = facility.record || facility.facility_id ||
      JSON.stringify([facility.name, facility.city, facility.state, facility.lat, facility.lon]);
    if (seen.has(key)) continue;
    seen.add(key);
    places.push({kind:"facility", id:facility.id, record:facility.record, name:facility.name,
      label:facility.name, city:facility.city, state:facility.state,
      detail:["Facility destination",facility.city,facility.state].filter(Boolean).join(" · "),
      aliases:[[facility.name,facility.city,facility.state].filter(Boolean).join(" ")]});
  }
  return places;
}

// Photon accepts free text. Keep the entered house number separate when evaluating
// its suggestions so that a POI's name and its unrelated road cannot form a match.
function parseAddressQuery(raw) {
  const postcode = raw.match(/\b[1-9]\d{5}\b/u)?.[0] || "";
  const withoutPin = (postcode ? raw.replace(postcode," ") : raw).trim();
  const parts = withoutPin.split(",").map(part => part.trim()).filter(part => part && locationText(part) !== "india");
  const cityLike = part => part && !/[\d]/u.test(part) &&
    !/\b(road|rd|street|st|lane|ln|avenue|marg|nagar|sector|phase|block|plot|flat|house|no|number|station|junction|museum|hospital|market|shop|store|bank|atm|mall|cafe|restaurant|supermarket|branch|terminal|platform|gate|ward|airport)\b/i.test(part);
  let city = "";
  let region = "";
  let address = parts.join(", ");
  if (parts.length >= 2 && cityLike(parts[0]) && (/\d/.test(parts.slice(1).join(" ")) || !cityLike(parts[1]))) {
    city = parts.shift();
    address = parts.join(", ");
  } else if (parts.length >= 2 && /\d/.test(parts[0])) {
    // A building number may be its own comma-separated address component.
    const splitAt = /^\d[\w/-]*$/u.test(parts[0]) ? 2 : 1;
    if (cityLike(parts[splitAt])) {
      address = parts.slice(0,splitAt).join(", ");
      city = parts[splitAt];
      region = parts.slice(splitAt+1).join(", ");
    }
  } else {
    const prefix = address.match(/^([^,\d]+?)\s+(?=\d)/u);
    if (prefix && cityLike(prefix[1])) {
      city = prefix[1];
      address = address.slice(prefix[0].length);
    } else {
      const suffix = address.match(/^(.+?\b(?:road|rd|street|st|lane|ln|avenue|marg)(?:\s+\d[\w/-]*)?)\s+([^,\d]+)$/iu);
      if (suffix && /\d/.test(suffix[1]) && cityLike(suffix[2])) {
        address = suffix[1];
        city = suffix[2];
      }
    }
  }
  const number = "(\\d{1,5}(?:[-/]\\d{1,5})*(?:-?[a-z])?)";
  const first = address.match(new RegExp("^(?:(?:house|plot|flat|building)\\s+(?:no\\.?\\s*)?|#\\s*)?"+number+"(?:\\s+|,\\s*)(.+)$","i"));
  const numberedPlace = /\b(?:sector|terminal|platform|phase|gate|block|ward)\s+\d[\w/-]*$/i.test(address);
  const last = !first && !numberedPlace && address.match(new RegExp("^(.+?)(?:,\\s*|\\s+)"+number+"$","i"));
  const house = first?.[1] || last?.[2] || "";
  const street = first?.[2] || last?.[1] || "";
  return {city, house, street, postcode, query:city ? [address,city,region,postcode].filter(Boolean).join(", ") : raw};
}

function streetTokens(value) {
  const aliases = {rd:"road", st:"street", ln:"lane", ave:"avenue", hwy:"highway"};
  return locationText(value).replace(/\bm g\b/g,"mg").replace(/\bmahatma gandhi\b/g,"mg")
    .split(" ").filter(Boolean).map(word => aliases[word] || word);
}

function placeWords(value) {
  // Fold accents in Latin spellings while retaining vowel signs in Indian scripts.
  const folded = String(value || "").normalize("NFD").replace(/(\p{Script=Latin})\p{M}+/gu,"$1").normalize("NFC");
  return streetTokens(folded).join(" ").replace(/\bd mart\b/g,"dmart")
    .replace(/\bstate bank of india\b/g,"sbi").split(" ").filter(Boolean);
}

function placeCategory(p) {
  const type = (p.osm_value || "").replace(/_/g," ");
  if (p.osm_key === "shop") {
    const label = type && type !== "yes" ? type.charAt(0).toUpperCase() + type.slice(1) : "Shop";
    return {label, terms:type + " shop store"};
  }
  if (p.osm_key === "amenity") {
    if (type === "bank") return {label:"Bank branch", terms:"bank branch"};
    if (type === "atm") return {label:"ATM", terms:"atm cash machine"};
    if (type === "cafe") return {label:"Café", terms:"coffee cafe shop"};
  }
  if (!type || type === "yes" || !["amenity","tourism","leisure","railway","place","historic"].includes(p.osm_key)) {
    return {label:"",terms:""};
  }
  return {label:type.charAt(0).toUpperCase()+type.slice(1),terms:type};
}

function nearStreetWord(a,b) {
  if (a === b) return true;
  if (Math.min(a.length,b.length) < 5 || Math.abs(a.length-b.length) > 1) return false;
  let i = 0, j = 0, edits = 0;
  while (i < a.length && j < b.length) {
    if (a[i] === b[j]) { i++; j++; continue; }
    if (++edits > 1) return false;
    if (a.length >= b.length) i++;
    if (b.length >= a.length) j++;
  }
  return edits + a.length-i + b.length-j <= 1;
}

function providerPlaces(json, raw) {
  const {city,house,street,postcode} = parseAddressQuery(raw);
  const terms = placeWords(raw).filter(word => word !== "india");
  const roadWords = streetTokens(street.split(",")[0]);
  const suffixes = new Set(["road","street","lane","marg","avenue","highway","path"]);
  const distinct = roadWords.filter(word => !suffixes.has(word));
  const streetMatchWords = distinct.length ? distinct : roadWords;
  const results = [];
  const normalizeHouse = value => String(value || "").trim().toLowerCase().replace(/\s+/g,"");
  for (const feature of json.features || []) {
    const point = feature.geometry?.coordinates;
    const p = feature.properties || {};
    if (feature.geometry?.type !== "Point" || !inMapArea(point,[-180,-90,180,90])) continue;
    if ((p.countrycode && String(p.countrycode).toUpperCase() !== "IN") ||
        (!p.countrycode && p.country && locationText(p.country) !== "india") ||
        ["proposed","construction"].includes(p.osm_value)) continue;
    if (postcode && !String(p.postcode || "").split(/[;,\s]+/u).includes(postcode)) continue;
    const locality = p.city || p.town || p.village || (p.type === "city" && p.name) || "";
    const areas = [locality,p.locality,p.district,p.county,p.state,p.postcode].filter(Boolean);
    if (city && !areas.some(area => (" "+placeWords(area).join(" ")+" ").includes(" "+placeWords(city).join(" ")+" "))) continue;
    const isStreet = p.type === "street" || p.osm_key === "highway";
    const addressLine = [p.housenumber,p.street || (isStreet && p.name)].filter(Boolean).join(" ");
    const parts = [p.name,addressLine,p.locality,p.district,locality,!locality && p.county,p.state,p.postcode];
    const label = [...new Set(parts.filter(Boolean))].join(", ");
    if (!p.name && !addressLine) continue;
    let exact = false, numberMatches = false, detail = "", branchRank = 0;
    if (house) {
      const candidate = streetTokens(p.street || p.name);
      if (!p.street && !isStreet && !candidate.some(word => suffixes.has(word))) continue;
      if (!streetMatchWords.length || !streetMatchWords.every(word => candidate.some(value => nearStreetWord(word,value)))) continue;
      const sameStreet = roadWords.join(" ") === candidate.join(" ");
      numberMatches = normalizeHouse(p.housenumber) === normalizeHouse(house);
      exact = numberMatches && sameStreet;
      detail = exact ? "Street and house number match" : numberMatches ? "Similar street · verify the address" :
        "Nearby match · house number unconfirmed";
    } else {
      const category = placeCategory(p);
      const labelWords = placeWords([label,category.terms,p.extra?.brand,p.extra?.operator].filter(Boolean).join(" "));
      if (!terms.length || !terms.every(word => labelWords.includes(word) || (word.length >= 4 && labelWords.some(w => w.startsWith(word))))) continue;
      if (terms.includes("atm") && p.osm_value === "bank" && !placeWords(p.name).includes("atm")) continue;
      detail = category.label;
      if (terms.includes("bank") || terms.includes("sbi")) branchRank = p.osm_value === "bank" ? 1 : p.osm_value === "atm" ? -1 : 0;
      exact = [p.name,label].filter(Boolean).some(name => placeWords(name).join(" ") === placeWords(raw).join(" ")) &&
        !["street","city","district","county","state","locality"].includes(p.type) && !isStreet;
    }
    if (results.some(place => place.label === label && place.detail === detail && Math.hypot(place.point[0]-point[0],place.point[1]-point[1]) < .0002)) continue;
    const nameHi = ["city","district","state","county"].includes(p.type) ? administrativeNameHindi(p.name) : p.name;
    const regionsHi = [p.district,locality,!locality && p.county,p.state].filter(Boolean).map(administrativeNameHindi);
    const labelHi = [...new Set([nameHi,addressLine,p.locality,...regionsHi,p.postcode].filter(Boolean))].join(", ");
    results.push({name:p.name || addressLine,label,labelHi,city:locality,point,kind:"address",exact,numberMatches,detail,branchRank});
  }
  for (const place of results) {
    if (results.some(other => other !== place && other.label === place.label)) {
      place.detail = [place.detail,place.point[1].toFixed(5)+"°, "+place.point[0].toFixed(5)+"°"].filter(Boolean).join(" · ");
    }
  }
  return results.sort((a,b) => b.branchRank-a.branchRank || Number(b.exact)-Number(a.exact) || Number(b.numberMatches)-Number(a.numberMatches));
}

function mountPlaceSearch(form, data, facilities, onPick, onEdit, listener, lookupGold) {
  const field = form.querySelector("#location");
  const panel = form.querySelector(".location-suggestions");
  const toggle = form.querySelector(".location-suggestions-toggle");
  const title = panel.querySelector(".location-suggestions-title");
  const list = panel.querySelector(".location-options");
  const browse = panel.querySelector(".location-browse");
  const status = form.querySelector(".location-status");
  const catalog = locationDirectory(lookupGold ? [] : data.locations || [], facilities);
  const all = [...catalog].sort((a,b) => a.name.localeCompare(b.name) || (a.detail || "").localeCompare(b.detail || ""));
  const searchKeys = place => {
    const keys = [place.name, place.label, ...(place.aliases || [])];
    if (place.isGoldLocation && ["city","district"].includes(place.kind)) {
      keys.push(place.name + " " + place.kind, place.kind + " of " + place.name);
      if (place.state) keys.push(place.name + " " + place.kind + " " + place.state);
    }
    return [...new Set(keys.filter(Boolean).map(locationText))];
  };
  const indexed = new Map(all.map(place => [place,searchKeys(place)]));
  const pageSize = 25;
  let selected = null;
  let request = null;
  let pendingTimer;
  let visible = [];
  let nextPage = null;
  let lastReply = null;
  let headingText = "Suggested places";
  let statusKey = "", lastStatus = "";

  function setStatus(text) {
    statusKey = text;
    lastStatus = placeMessage(text);
    status.textContent = lastStatus;
  }

  function cancel() {
    clearTimeout(pendingTimer);
    request?.controller.abort();
    request = null;
    form.removeAttribute("aria-busy");
    browse.disabled = false;
  }
  function hide() {
    panel.hidden = true;
    toggle.setAttribute("aria-expanded","false");
    visible = [];
    nextPage = null;
  }
  function set(place) {
    cancel(); hide();
    selected = place;
    field.value = placeDisplayLabel(place);
    setStatus("");
  }
  function choose(place) {
    set(place);
    onPick(place);
  }
  function show(heading, items, more) {
    headingText = heading;
    title.textContent = placeMessage(heading);
    visible = items;
    nextPage = more;
    list.replaceChildren(...items.map((place,index) => {
      const li = document.createElement("li");
      const button = document.createElement("button");
      button.type = "button";
      button.dataset.index = index;
      button.textContent = placeDisplayLabel(place);
      if (place.detail) {
        const detail = document.createElement("small");
        detail.textContent = place.kind === "facility" && document.documentElement.lang.startsWith("hi")
          ? [placeMessage("Facility destination"), administrativeNameHindi(place.city), administrativeNameHindi(place.state)].filter(Boolean).join(" · ")
          : place.detail.split(" · ").map(part => placeMessage(part)).join(" · ");
        button.append(detail);
      }
      li.append(button);
      return li;
    }));
    browse.hidden = !more;
    browse.textContent = placeMessage(more?.page ? "More places" : "Browse all places");
    panel.hidden = false;
    toggle.setAttribute("aria-expanded","true");
  }
  function localMatches(term) {
    if (!term) return all;
    const exact = [], prefix = [], other = [];
    for (const place of all) {
      const keys = indexed.get(place);
      if (keys.includes(term)) exact.push(place);
      else if (keys.some(key => key.startsWith(term))) prefix.push(place);
      else if (keys.some(key => key.includes(term))) other.push(place);
    }
    return [...exact,...prefix,...other];
  }
  function render(reply, submit) {
    const {query, page, places, more, exact, failed} = reply;
    if (submit && exact.length === 1 && !failed) { choose(exact[0]); return; }
    if (submit && places.length === 1 && places[0].exact && !failed) { choose(places[0]); return; }
    const common = !query && page === 0;
    const items = common ? places.slice(0,6) : places;
    let continuation = more ? {query,page:page + 1} : null;
    if (common && (places.length > items.length || more)) continuation = {query,page:0,expanded:true};
    show(!query ? (page ? "Directory places" : "Suggested places") : "Choose a location",items,continuation);
    setStatus(failed ? "Directory location search is unavailable. Try again or select a listed match." :
      query && !places.length ? "No matching place or address found. Try a street, landmark or PIN." :
      query ? "Choose your matching location." : "");
  }

  async function search(query, submit = false, page = 0, expanded = false) {
    if (expanded && lastReply?.query === query && lastReply.page === 0) {
      show("Directory places",lastReply.places,lastReply.more ? {query,page:1} : null);
      return;
    }
    if (request?.query === query && request.page === page) { request.submit ||= submit; return; }
    if (lastReply?.query === query && lastReply.page === page && !lastReply.failed) {
      render(lastReply,submit);
      return;
    }
    cancel();
    const task = {query,page,submit,controller:new AbortController()};
    request = task;
    form.setAttribute("aria-busy","true");
    browse.disabled = !!page;
    setStatus("Finding locations…");
    const lookupQuery = placeLookupQuery(query);
    const term = locationText(lookupQuery);
    const local = localMatches(term);
    const offset = page * pageSize;
    const section = local.slice(offset,offset + pageSize);
    const suffix = term.match(/^(.+) (city|district)$/u);
    const prefix = term.match(/^(city|district) of (.+)$/u);
    const areaName = suffix?.[1] || prefix?.[2];
    const areaType = suffix?.[2] || prefix?.[1];
    let gold = [], failed = false;
    try {
      if (lookupGold) {
        gold = (await lookupGold(areaName || lookupQuery,offset,task.controller.signal)).map(goldPlace);
        if (areaType) gold = gold.filter(place => place.kind === areaType);
      }
    } catch { failed = true; }
    if (request !== task) return;
    const exactGold = gold.filter(p => searchKeys(p).includes(term));
    const exactLocal = section.filter(p => indexed.get(p).includes(term));
    // Gold place names and PINs are authoritative area starts. Photon resolves the
    // more detailed street, house-number and landmark queries outside the lookup.
    let live = [];
    const addressLike = /[,0-9]/.test(query) || term.includes(" ");
    const useGeocoder = !page && term.length >= 3 && !exactGold.length && !exactLocal.length &&
      (addressLike || !gold.length) && !/^\d{1,5}$/.test(term);
    if (useGeocoder) {
      const url = new URL("https://photon.komoot.io/api/");
      url.search = new URLSearchParams({q:parseAddressQuery(lookupQuery).query,countrycode:"IN",limit:"40",lang:"en"});
      try { live = providerPlaces(await mapJson(url,task.controller),lookupQuery); }
      catch { /* Directory matches are still usable when Photon times out. */ }
    }
    if (request !== task) return;
    const exact = exactGold.length ? exactGold : exactLocal;
    const matches = new Set(exact);
    const places = [...exact, ...gold.filter(p => !matches.has(p)), ...live, ...section.filter(p => !matches.has(p))];
    const reply = {query,page,places,exact,failed,more:gold.length === pageSize || local.length > offset + pageSize};
    lastReply = reply;
    render(reply,task.submit);
    if (request === task) {
      request = null;
      form.removeAttribute("aria-busy");
      browse.disabled = false;
    }
  }
  form.addEventListener("submit",event => {
    event.preventDefault();
    if (!form.reportValidity()) return;
    clearTimeout(pendingTimer);
    const query = field.value.trim();
    if (!query) {
      selected = null;
      cancel(); hide();
      onPick(null);
      return;
    }
    if (selected && query === placeDisplayLabel(selected)) { choose(selected); return; }
    search(query,true);
  },listener);
  field.addEventListener("input",event => {
    cancel(); hide();
    selected = null;
    onEdit();
    setStatus("");
    const query = field.value.trim();
    if (event.isComposing) return;
    pendingTimer = setTimeout(() => search(query),query ? 650 : 0);
  },listener);
  toggle.addEventListener("click",() => {
    const wasOpen = !panel.hidden;
    cancel();
    if (wasOpen) hide();
    else search("");
  },listener);
  browse.addEventListener("click",() => {
    if (nextPage) search(nextPage.query,false,nextPage.page,!!nextPage.expanded);
  },listener);
  list.addEventListener("click",event => {
    const item = event.target.closest("button");
    if (item) { field.focus(); choose(visible[Number(item.dataset.index)]); }
  },listener);
  form.addEventListener("keydown",event => {
    if (event.key === "Escape" && (request || pendingTimer || !panel.hidden)) {
      cancel(); hide(); setStatus(""); field.focus(); return;
    }
    if (!["ArrowDown","ArrowUp"].includes(event.key) || panel.hidden) return;
    const buttons = Array.from(list.querySelectorAll("button"));
    const index = buttons.indexOf(event.target);
    if (!buttons.length || (index === -1 && event.target !== field && event.target !== toggle)) return;
    event.preventDefault();
    const step = event.key === "ArrowDown" ? 1 : -1;
    buttons[(index < 0 ? (step === 1 ? 0 : buttons.length-1) : (index+step+buttons.length)%buttons.length)].focus();
  },listener);
  function localize() {
    field.placeholder = document.documentElement.lang.startsWith("hi") ? "शहर, पहचान वाली जगह या पिन कोड" : "City, landmark or PIN";
    toggle.textContent = placeMessage("Suggested places");
    if (selected) field.value = placeDisplayLabel(selected);
    if (!panel.hidden) show(headingText, visible, nextPage);
    if (status.textContent === lastStatus) setStatus(statusKey);
  }
  localize();
  document.addEventListener("care-atlas-language", localize, listener);
  listener.signal.addEventListener("abort",cancel,{once:true});
  return {set, hide() { cancel(); hide(); }, focus() { field.focus(); field.scrollIntoView({block:"center"}); field.select(); },
    get selected() { return selected; }, catalog};
}

// A shared throttle limits routing requests even when a user changes hospitals rapidly.
let nextRoutingRequest = 0;
async function roadRoute(data, hospitalId, place, task) {
  const destination = data.destinations[hospitalId];
  if (!destination || !isMapPoint([destination.lon,destination.lat]) || !isMapPoint(place?.point)) return null;
  while (!task.signal.aborted && nextRoutingRequest > Date.now()) {
    await new Promise(resolve => setTimeout(resolve,nextRoutingRequest - Date.now()));
  }
  if (task.signal.aborted) return null;
  nextRoutingRequest = Date.now() + 1050;
  const url = new URL("https://routing.openstreetmap.de/routed-car/route/v1/driving/" +
    place.point.join(",") + ";" + destination.lon + "," + destination.lat);
  url.search = new URLSearchParams({overview:"full",geometries:"geojson",steps:"false",radiuses:"350;150"});
  const mercatorBounds = [-180,-85.05113,180,85.05113];
  function valid(route) {
    return Number.isFinite(route?.km) && route.km >= 0 && route.geometry?.type === "LineString" &&
      Array.isArray(route.geometry.coordinates) && route.geometry.coordinates.length >= 2 &&
      route.geometry.coordinates.every(p => inMapArea(p,mercatorBounds));
  }
  try {
    const result = await mapJson(url,task);
    const match = result.routes?.[0];
    if (result.code === "Ok" && Number.isFinite(match?.distance)) {
      const route = {geometry:match.geometry,km:match.distance / 1000};
      if (valid(route)) return route;
    }
  } catch {
    // The map keeps the selected endpoints when the routing service is unavailable.
  }
  return null;
}
