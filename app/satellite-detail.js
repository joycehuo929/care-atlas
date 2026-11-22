// Keep the team's georeferenced Patna image under the optional hosted imagery.
function mountSatelliteDetail(root, world, photo, config, listener) {
  const {hospital, satellite, worldWidth, originX, originY} = config;
  const board = root.querySelector(".am-board");
  const detail = document.createElement("div");
  detail.className = "am-satellite-detail";
  detail.hidden = true;
  board.after(detail);

  function link(label, href) {
    const anchor = document.createElement("a");
    anchor.textContent = label;
    anchor.href = href;
    anchor.target = "_blank";
    anchor.rel = "noopener noreferrer";
    return anchor;
  }

  const mapUrl = new URL("https://www.google.com/maps/@");
  mapUrl.search = new URLSearchParams({api: "1", map_action: "map", basemap: "satellite",
    center: [hospital.lat, hospital.lon].join(","), zoom: "19"});
  const externalMap = link("", mapUrl.href);
  detail.append(externalMap);
  function updateLinkLanguage() {
    externalMap.textContent = mapText("Open satellite in Google Maps ↗", "Google Maps पर उपग्रह दृश्य खोलें ↗");
  }
  const key = satellite?.maptilerPublicKey;
  if (!key || !photo) {
    return {
      draw(view) { detail.hidden = view !== "satellite"; },
      credit() {},
      updateLanguage: updateLinkLanguage
    };
  }

  const layer = document.createElementNS(world.namespaceURI, "g");
  layer.setAttribute("pointer-events", "none");
  photo.after(layer);
  const badge = link("", "https://www.maptiler.com/");
  badge.className = "am-imagery-brand";
  badge.hidden = true;
  const logo = document.createElement("img");
  logo.alt = "MapTiler";
  logo.width = 84;
  badge.append(logo);
  detail.prepend(badge);
  const status = document.createElement("span");
  status.setAttribute("role", "status");
  detail.append(status);
  const tileURL = "https://api.maptiler.com/tiles/satellite-v2/";
  let active = false;
  let timer;
  let lastGrid = "";

  function refreshStatus() {
    const failed = Array.from(layer.children).some(tile => tile.dataset.failed);
    status.textContent = failed ? mapText("Some detailed imagery is unavailable. The Patna overview fills those areas.", "कुछ स्थानों के विस्तृत चित्र उपलब्ध नहीं हैं। वहाँ पटना का सामान्य दृश्य दिखाया गया है।") : "";
  }

  function draw(view, centre, scale, width, height) {
    active = view === "satellite";
    detail.hidden = !active;
    layer.style.display = active ? "" : "none";
    if (!active || width < 2 || height < 2) {
      clearTimeout(timer);
      lastGrid = "";
      return;
    }
    badge.hidden = false;
    if (!logo.hasAttribute("src")) logo.src = "https://api.maptiler.com/resources/logo.svg";
    const zoom = Math.max(0, Math.min(19, Math.round(Math.log2(worldWidth / (512 * scale)))));
    const count = 2 ** zoom;
    const span = worldWidth / count;
    const left = -worldWidth / 2 - originX;
    const top = -worldWidth / 2 - originY;
    const range = (value, pixels, offset) => [
      Math.max(0, Math.floor((value - pixels * scale / 2 - offset) / span)),
      Math.min(count - 1, Math.floor((value + pixels * scale / 2 - offset) / span))
    ];
    const [x0, x1] = range(centre[0], width, left);
    const [y0, y1] = range(centre[1], height, top);
    const grid = [zoom, x0, x1, y0, y1].join("/");
    if (lastGrid === grid) return;
    lastGrid = grid;
    clearTimeout(timer);
    timer = setTimeout(() => {
      if (listener.signal.aborted || !active) return;
      const existing = new Map(Array.from(layer.children, tile => [tile.dataset.xyz, tile]));
      for (let y = y0; y <= y1; y++) {
        for (let x = x0; x <= x1; x++) {
          const xyz = [zoom, x, y].join("/");
          if (existing.delete(xyz)) continue;
          const tile = document.createElementNS(world.namespaceURI, "image");
          tile.dataset.xyz = xyz;
          tile.setAttribute("x", left + x * span);
          tile.setAttribute("y", top + y * span);
          tile.setAttribute("width", span);
          tile.setAttribute("height", span);
          tile.setAttribute("preserveAspectRatio", "none");
          tile.addEventListener("error", () => {
            tile.dataset.failed = "true";
            tile.style.visibility = "hidden";
            refreshStatus();
          }, {once: true});
          layer.append(tile);
          tile.setAttribute("href", tileURL + xyz + ".jpg?key=" + encodeURIComponent(key));
        }
      }
      for (const tile of existing.values()) tile.remove();
      refreshStatus();
    }, 120);
  }
  listener.signal.addEventListener("abort", () => clearTimeout(timer), {once: true});
  return {
    draw,
    updateLanguage() {
      updateLinkLanguage();
      refreshStatus();
    },
    credit(credits, view) {
      if (view === "satellite") credits.append(" · ", link("© MapTiler", "https://www.maptiler.com/copyright/"));
    }
  };
}
