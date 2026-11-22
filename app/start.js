import mount from "./finder.js";
import {bilingualText, mountLanguage} from "./locale.js";

const host = document.querySelector("#care-atlas").attachShadow({mode: "open"});
const status = document.querySelector("#load");
const retry = status.querySelector("button");

async function read(url) {
  const response = await fetch(url, {cache: url.startsWith("/api/") ? "no-store" : "default"});
  if (!response.ok) throw new Error("Directory request failed");
  return response.json();
}

async function start() {
  retry.hidden = true;
  bilingualText(status.querySelector("span"), "Loading the facility directory…", "स्वास्थ्य संस्थानों की सूची लोड हो रही है…");
  bilingualText(retry, "Retry", "फिर कोशिश करें");
  try {
    const [services, basemap, config] = await Promise.all([
      read("/api/services"), read("/assets/map-basemap.json"), read("/assets/map-config.json")
    ]);
    const query = new URLSearchParams(window.location.search);
    const requestedService = services.find(s => s.id === query.get("service"));
    const initial = requestedService || services.find(s => s.id === "dialysis") || services[0];
    const facilities = initial ? await read("/api/facilities?service=" + encodeURIComponent(initial.id)) : [];
    host.replaceChildren(document.querySelector("#ui").content.cloneNode(true));
    mountLanguage(host, {en: "Care Atlas · Find a facility", hi: "Care Atlas · स्वास्थ्य संस्थान खोजें"});
    mount({parentElement: host, data: {
      services, activeServiceId: initial?.id || "", facilities, basemap, ...config,
      requestedRecord: query.get("facility"), requestedServiceFound: Boolean(requestedService)
    }});
    status.hidden = true;
    // The finder stays usable if the independent coverage read is unavailable.
    read("/api/coverage").then(({facilities}) => {
      if (Number.isSafeInteger(facilities) && facilities >= 0) {
        const noun = facilities === 1 ? "facility" : "facilities";
        const count = facilities.toLocaleString("en-IN");
        bilingualText(host.querySelector(".coverage-intro"), "Search " + count + " " + noun + " across India.",
          "पूरे भारत में " + count + " स्वास्थ्य संस्थान खोजें।");
      }
    }).catch(() => {});
  } catch {
    bilingualText(status.querySelector("span"), "The facility directory could not be loaded.", "स्वास्थ्य संस्थानों की सूची लोड नहीं हो सकी।");
    retry.hidden = false;
  }
}

retry.addEventListener("click", start);
start();
