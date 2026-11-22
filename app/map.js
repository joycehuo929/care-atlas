function mapText(english, hindi) {
  return document.documentElement.lang === "hi" ? hindi : english;
}

// Use the same Web Mercator projection for the Patna fixtures and global tile grid.
function mountHospitalMap(container, data, hospitalId, initialView = "street") {
  const hospital = data.destinations[hospitalId];
  const hospitalName = hospital.name || hospitalId;
  const location = [hospital.city, hospital.state].filter(Boolean).join(", ");
  const locationUncertain = hospital.flag_location_uncertain || hospital.locationUncertain;
  const svgNS = "http://www.w3.org/2000/svg";
  const backend = data.basemap || {features: []};
  const controller = new AbortController();
  const listener = {signal: controller.signal};
  const root = document.createElement("section");
  root.className = "atlas-map";
  root.innerHTML = [
    '<header class="am-heading"><div><div class="am-region"></div><h3></h3></div><div class="am-distance" aria-live="polite"></div></header>',
    '<div class="am-mapbar"><fieldset class="am-start"><legend></legend><span class="am-start-name"></span></fieldset>',
    '<fieldset class="am-view"><legend></legend><div class="am-view-options">',
    '<label><input type="radio" name="atlas-map-view" value="street" checked><span></span></label>',
    '<label><input type="radio" name="atlas-map-view" value="satellite"><span></span></label></div></fieldset></div>',
    '<div class="am-board"><svg class="am-canvas" role="img" tabindex="0"></svg>',
    '<div class="am-tools"><button type="button" class="am-zoom-in">+</button><button type="button" class="am-zoom-out">−</button><button type="button" class="am-fit"><svg viewBox="0 0 20 20" aria-hidden="true"><path d="M3 8V3h5m4 0h5v5m0 4v5h-5m-4 0H3v-5" fill="none" stroke="currentColor" stroke-width="1.8"/></svg></button></div>',
    '<div class="am-scale" aria-hidden="true"><span></span></div><a class="am-tile-credit" href="https://www.openstreetmap.org/copyright" target="_blank" rel="noopener noreferrer">© OpenStreetMap</a><div class="am-map-state" role="status" hidden></div></div>',
    '<p class="am-wheel-hint"></p>',
    '<div class="am-endpoints"><span><i class="am-origin-dot"></i><span class="am-origin-text"></span></span><span><i class="am-dest-dot"></i><span class="am-dest-text"></span></span></div>',
    '<p class="am-caption"></p><div class="am-credits"></div>'
  ].join("");
  container.replaceChildren(root);
  const find = selector => root.querySelector(selector);
  const canvas = find(".am-canvas");
  const board = find(".am-board");
  const mapPanel = container.closest(".route-panel") || root;
  const startName = find(".am-start-name");
  const plus = find(".am-zoom-in");
  const minus = find(".am-zoom-out");
  const credits = find(".am-credits");
  find(".am-dest-text").textContent = hospitalName;

  const earth = 6378137;
  const rad = Math.PI / 180;
  const localRadius = earth * Math.cos(25.6 * rad);
  const worldWidth = 2 * Math.PI * localRadius;
  const originX = localRadius * 85.15 * rad;
  const originY = -localRadius * Math.log(Math.tan(Math.PI / 4 + 25.6 * rad / 2));
  function project([lng, lat]) {
    return [localRadius * lng * rad - originX, -localRadius * Math.log(Math.tan(Math.PI / 4 + lat * rad / 2)) - originY];
  }
  function svg(tag, attributes, parent) {
    const element = document.createElementNS(svgNS, tag);
    for (const [name, value] of Object.entries(attributes)) element.setAttribute(name, value);
    parent.append(element);
    return element;
  }
  function pathFor(geometry) {
    if (!geometry) return "";
    const {type, coordinates} = geometry;
    const closed = type === "Polygon" || type === "MultiPolygon";
    let lines;
    if (type === "LineString") lines = [coordinates];
    else if (type === "MultiLineString" || type === "Polygon") lines = coordinates;
    else if (type === "MultiPolygon") lines = coordinates.flat();
    else return "";
    return lines.map(line => line.map((point, i) => {
      const [x, y] = project(point);
      return (i ? "L" : "M") + x.toFixed(1) + "," + y.toFixed(1);
    }).join("") + (closed ? "Z" : "")).join("");
  }
  const world = svg("g", {}, canvas);
  const tiles = svg("g", {}, world);
  const satellite = data.satellite;
  let photo;
  if (satellite?.image && satellite.bbox?.length === 4) {
    const [west, south, east, north] = satellite.bbox;
    const [left, top] = project([west, north]);
    const [right, bottom] = project([east, south]);
    photo = svg("image", {
      class: "am-photo", x: left, y: top, width: right - left, height: bottom - top,
      preserveAspectRatio: "none", "aria-hidden": "true"
    }, world);
  }
  const detailImagery = mountSatelliteDetail(root, world, photo, {hospital, satellite, worldWidth, originX, originY}, listener);
  const viewControl = find(".am-view");
  let view = "street";
  const majorRoads = svg("g", {class:"am-layer-main"}, world);
  const routeLayer = svg("g", {class:"am-layer-route"}, world);
  const outline = svg("path", {class:"am-route-case"}, routeLayer);
  const routeStroke = svg("path", {class:"am-route-ink"}, routeLayer);
  const access = svg("path", {class:"am-route-access"}, routeLayer);
  const labels = svg("g", {class:"am-labels", "aria-hidden":"true"}, canvas);

  // Only the bundled satellite photo needs a separate road and label overlay.
  const names = [];
  const mainPaths = [];
  for (const feature of backend.features) {
    const p = feature.properties || {};
    const geometry = feature.geometry;
    if (!geometry) continue;
    if (geometry.type === "Point") {
      if (p.name) names.push({name:p.name, point:project(geometry.coordinates), kind:p.kind,
        priority:p.kind === "streetLabel" ? 0 : p.kind === "place" ? 1 : 2});
      continue;
    }
    const isRoad = p.kind === "road";
    const isWaterway = p.kind === "water" && geometry.type.includes("LineString");
    if (isRoad && /^(trunk|primary|secondary|motorway)/.test(p.highway || "")) mainPaths.push(pathFor(geometry));
    if (p.name && (isRoad || isWaterway)) {
      const line = geometry.type === "LineString" ? geometry.coordinates : geometry.coordinates[0];
      if (line?.length) names.push({name:p.name, point:project(line[Math.floor(line.length / 2)]),
        kind:isRoad ? "streetLabel" : "waterLabel", priority:isRoad ? 0 : 2});
    }
  }
  if (mainPaths.length) svg("path", {d:mainPaths.join("")}, majorRoads);
  const cellSize = 1000;
  const labelCells = new Map();
  for (const label of names) {
    const key = label.point.map(value => Math.floor(value / cellSize)).join(",");
    if (!labelCells.has(key)) labelCells.set(key, []);
    labelCells.get(key).push(label);
  }
  const origin = svg("g", {"class":"am-marker-start"}, canvas);
  svg("circle", {r:11, fill:"#fff", stroke:"#123d38", "stroke-width":2}, origin);
  svg("circle", {r:5, fill:"#137b74"}, origin);
  const target = svg("g", {"class":"am-marker-end"}, canvas);
  svg("path", {d:"M0 0C-2-4-11-10-11-17a11 11 0 1 1 22 0C11-10 2-4 0 0Z", fill:"#a24732",stroke:"white","stroke-width":2}, target);
  svg("path", {d:"M0-22v10m-5-5H5",stroke:"white","stroke-width":2.4}, target);

  function creditPart(label, url) {
    if (!url || !/^https?:\/\//i.test(url)) { credits.append(label); return; }
    const link = document.createElement("a");
    link.href = url;
    link.target = "_blank";
    link.rel = "noopener noreferrer";
    link.textContent = label;
    credits.append(link);
  }
  function credit(label, url) {
    if (credits.childNodes.length) credits.append(" · ");
    creditPart(label, url);
  }
  let addressStart = null;
  let missingStart = false;
  let nationwide = false;
  let startPoint;
  const endPoint = project([hospital.lon, hospital.lat]);
  let routePoints = [];
  let currentRoute;
  let pendingRoute = false;
  let startPlaceholder;
  let directKm = 0;
  let scaleMetres;
  let scale = 1;
  // Camera limits are independent of route length, origin type and imagery.
  const minimumScale = worldWidth / (256 * 2**19);
  const maximumScale = worldWidth / 256;
  let centre = [0, 0];
  let width = 1;
  let height = 1;
  let frame = 0;
  let cameraAdjusted = false;
  function screen([x, y]) {
    return [(x - centre[0]) / scale + width / 2, (y - centre[1]) / scale + height / 2];
  }
  const localBounds = photo ? [project([satellite.bbox[0], satellite.bbox[3]]),
    project([satellite.bbox[2], satellite.bbox[1]])] : null;
  let photoAvailable = !!photo;
  let localSatellite = false;
  function insideSatellitePhoto() {
    if (!photoAvailable || scale > worldWidth / (256 * 2**12)) return false;
    const [[west,north],[east,south]] = localBounds;
    return centre[0] - width * scale / 2 >= west && centre[0] + width * scale / 2 <= east &&
      centre[1] - height * scale / 2 >= north && centre[1] + height * scale / 2 <= south;
  }
  function constrainCamera() {
    const bounds = [[-worldWidth/2 - originX, -worldWidth/2 - originY],
      [worldWidth/2 - originX, worldWidth/2 - originY]];
    for (const [axis, pixels] of [[0,width], [1,height]]) {
      const mid = (bounds[0][axis] + bounds[1][axis]) / 2;
      const low = Math.min(mid, bounds[0][axis] + pixels * scale / 2);
      const high = Math.max(mid, bounds[1][axis] - pixels * scale / 2);
      centre[axis] = Math.max(low, Math.min(high, centre[axis]));
    }
  }
  function reportTileState() {
    const notice = find(".am-map-state");
    const failed = !!tiles.querySelector('[data-state="failed"]');
    notice.hidden = !failed;
    if (failed) notice.textContent = view === "street"
      ? mapText("Street map tiles unavailable in part of this view.", "इस हिस्से का सड़क मानचित्र उपलब्ध नहीं है।")
      : mapText("Imagery or labels unavailable in part of this view.", "इस हिस्से के उपग्रह चित्र या स्थानों के नाम उपलब्ध नहीं हैं।");
  }

  // Fetch only the visible tiles. EOX uses row/column order, OSM uses column/row.
  function refreshTiles() {
    if (localSatellite) {
      if (tiles.childElementCount) tiles.replaceChildren();
      reportTileState();
      return;
    }
    const hybrid = view === "satellite";
    const z = Math.max(0, Math.min(hybrid ? 14 : 19, Math.round(Math.log2(worldWidth / (256 * scale)))));
    const count = 2 ** z;
    const size = worldWidth / count;
    const left = -worldWidth / 2 - originX;
    const top = -worldWidth / 2 - originY;
    const visible = new Set();
    const x0 = Math.max(0,Math.floor((centre[0] - scale * width / 2 - left) / size));
    const y0 = Math.max(0,Math.floor((centre[1] - scale * height / 2 - top) / size));
    const x1 = Math.min(count-1,Math.floor((centre[0] + scale * width / 2 - left) / size));
    const y1 = Math.min(count-1,Math.floor((centre[1] + scale * height / 2 - top) / size));
    const existing = new Map(Array.from(tiles.children, n => [n.dataset.key, n]));
    for (let x = x0; x <= x1; x++) for (let y = y0; y <= y1; y++) {
      const tileLeft = left + x * size, tileTop = top + y * size;
      const key = view + "/" + z + "/" + x + "/" + y;
      visible.add(key);
      if (existing.has(key)) continue;
      const group = svg("g", {"data-key":key}, tiles);
      const wmts = "https://tiles.maps.eox.at/wmts/1.0.0/";
      const rowColumn = "/default/g/" + z + "/" + y + "/" + x;
      const sources = hybrid ? [
        wmts + "s2cloudless-2025_3857" + rowColumn + ".jpg",
        wmts + "overlay_bright_3857" + rowColumn + ".png"
      ] : ["https://tile.openstreetmap.org/" + z + "/" + x + "/" + y + ".png"];
      for (const source of sources) {
        const tile = svg("image", {x:tileLeft, y:tileTop, width:size,
          height:size, preserveAspectRatio:"none"}, group);
        tile.addEventListener("error", () => {
          tile.dataset.state = "failed";
          tile.style.visibility = "hidden";
          if (tile.isConnected) reportTileState();
        }, {once:true});
        tile.setAttribute("href", source);
      }
    }
    for (const [key, item] of existing) if (!visible.has(key)) item.remove();
    reportTileState();
  }
  function draw() {
    frame = 0;
    constrainCamera();
    const offsetX = width / 2 - centre[0] / scale;
    const offsetY = height / 2 - centre[1] / scale;
    world.setAttribute("transform", "translate(" + offsetX + " " + offsetY + ") scale(" + (1 / scale) + ")");
    const a = screen(startPoint);
    const b = screen(endPoint);
    origin.setAttribute("transform", "translate(" + a.join(" ") + ")");
    target.setAttribute("transform", "translate(" + b.join(" ") + ")");
    // Reserve marker and control space before placing labels from the street network.
    const occupied = [[a[0]-18,a[1]-18,a[0]+18,a[1]+18],[b[0]-16,b[1]-33,b[0]+16,b[1]+7],[width-49,5,width,150]];
    const usePhoto = view === "satellite" && insideSatellitePhoto();
    if (usePhoto !== localSatellite) {
      localSatellite = usePhoto;
      root.dataset.localPhoto = String(localSatellite);
      updateMapInfo();
    }
    drawSatelliteLabels(occupied);
    refreshTiles();
    detailImagery.draw(localSatellite ? "satellite" : "street", centre, scale, width, height);
    const groundScale = scale * earth / localRadius / Math.cosh((centre[1]+originY) / localRadius);
    const maxMetres = Math.min(88,width / 4) * groundScale;
    const power = 10 ** Math.floor(Math.log10(maxMetres));
    const metres = (maxMetres / power >= 5 ? 5 : maxMetres / power >= 2 ? 2 : 1) * power;
    const bar = find(".am-scale span");
    scaleMetres = metres;
    bar.textContent = scaleLabel();
    bar.style.width = (metres / groundScale) + "px";
    plus.disabled = scale <= minimumScale + 0.001;
    minus.disabled = scale >= maximumScale - 0.001;
  }
  function drawSatelliteLabels(occupied) {
    if (!localSatellite) {
      if (labels.childElementCount) labels.replaceChildren();
      return;
    }
    const seen = new Set();
    labels.replaceChildren();
    const candidates = [];
    const xMin = Math.floor((centre[0] - width * scale / 2) / cellSize);
    const xMax = Math.floor((centre[0] + width * scale / 2) / cellSize);
    const yMin = Math.floor((centre[1] - height * scale / 2) / cellSize);
    const yMax = Math.floor((centre[1] + height * scale / 2) / cellSize);
    if (labelCells.size) {
      for (let x = xMin; x <= xMax; x++) for (let y = yMin; y <= yMax; y++) {
        const cell = labelCells.get(x + "," + y);
        if (cell) candidates.push(...cell);
      }
    }
    const labelRank = label => {
      const fromCentre = Math.hypot(label.point[0] - centre[0], label.point[1] - centre[1]);
      return fromCentre + 2 * (label.routeDistance || 0);
    };
    candidates.sort((a,b) => a.priority - b.priority || labelRank(a) - labelRank(b));
    let streetSlots = Math.max(3, Math.round(width * height / 39000));
    let landmarkSlots = Math.max(1, Math.round(streetSlots / 3));
    const streetCells = new Set();
    for (const info of candidates) {
      if (seen.has(info.name)) continue;
      const [x, y] = screen(info.point);
      const half = Math.min(info.name.length * 3.3 + 5, 110);
      if (x < 0 || x > width || y < 0 || y > height) continue;
      const isStreet = info.kind === "streetLabel";
      if (!isStreet && !landmarkSlots) continue;
      const streetCell = Math.floor(x / 100) + "," + Math.floor(y / 70);
      if (isStreet && (streetSlots === 0 || streetCells.has(streetCell))) continue;
      const positions = isStreet ? [[x,y], [x,y-15], [x,y+17], [x+half+8,y], [x-half-8,y]] : [[x,y]];
      for (const [cx,cy] of positions) {
        const box = [cx-half,cy-12,cx+half,cy+9];
        if (box[0] < 4 || box[2] > width-4 || box[1] < 4 || box[3] > height-18) continue;
        if (occupied.some(other => box[0] < other[2] && box[2] > other[0] && box[1] < other[3] && box[3] > other[1])) continue;
        const className = isStreet ? "am-road-name" : info.kind === "place" ? "am-place" : "am-landmark-name";
        svg("text", {x:cx,y:cy,"text-anchor":"middle",class:className}, labels).textContent = info.name;
        occupied.push(box);
        seen.add(info.name);
        if (isStreet) {
          streetSlots--;
          streetCells.add(streetCell);
        } else {
          landmarkSlots--;
        }
        break;
      }
    }
  }
  function scheduleDraw() {
    if (!frame) frame = requestAnimationFrame(draw);
  }
  function measure() {
    width = Math.max(1, canvas.clientWidth);
    height = Math.max(1, canvas.clientHeight);
    canvas.setAttribute("viewBox", "0 0 " + width + " " + height);
  }
  function fit() {
    cameraAdjusted = false;
    measure();
    let xMin = Math.min(startPoint[0],endPoint[0]), xMax = Math.max(startPoint[0],endPoint[0]);
    let yMin = Math.min(startPoint[1],endPoint[1]), yMax = Math.max(startPoint[1],endPoint[1]);
    for (const [x,y] of routePoints) {
      xMin = Math.min(xMin,x); xMax = Math.max(xMax,x);
      yMin = Math.min(yMin,y); yMax = Math.max(yMax,y);
    }
    // Keep both markers clear of the right-hand tools and the map scale.
    const fitScale = Math.max(1000 / width, (xMax - xMin) / Math.max(1,width - 112), (yMax - yMin) / Math.max(1,height - 94));
    scale = Math.max(minimumScale, Math.min(maximumScale, fitScale));
    centre = [(xMin + xMax) / 2 + 17 * scale, (yMin + yMax) / 2 - 4 * scale];
    scheduleDraw();
  }
  function zoom(factor, x = width / 2, y = height / 2) {
    cameraAdjusted = true;
    const next = Math.max(minimumScale, Math.min(maximumScale, scale * factor));
    centre[0] += (x - width / 2) * (scale - next);
    centre[1] += (y - height / 2) * (scale - next);
    scale = next;
    scheduleDraw();
  }
  function showAddressRoute(place, route, pending = false) {
    if (!isMapPoint(place?.point)) {
      showDestination("Starting coordinates unavailable");
      return;
    }
    missingStart = false;
    addressStart = place;
    showRoute(place.point[0], place.point[1], route, pending);
  }
  function showDestination(label = "Choose a starting point") {
    missingStart = true;
    addressStart = null;
    startPlaceholder = label;
    showRoute(hospital.lon, hospital.lat, null);
  }
  function showRoute(lon, lat, route, pending = false) {
    origin.style.display = missingStart ? "none" : "";
    startPoint = project([lon,lat]);
    currentRoute = route;
    pendingRoute = pending;
    const coordinates = currentRoute?.geometry?.coordinates || [];
    const withinLocalMap = point => localBounds && inMapArea(point,satellite.bbox);
    nationwide = !withinLocalMap([lon,lat]) || !withinLocalMap([hospital.lon,hospital.lat]) ||
      coordinates.some(point => !withinLocalMap(point));
    root.dataset.extent = nationwide ? "india" : "patna";
    routePoints = coordinates.map(project);
    // Prefer roads near the trip when choosing the few names drawn over the photo.
    for (const label of names) {
      if (nationwide) { label.routeDistance = 0; continue; }
      let nearest = Infinity;
      for (const [x, y] of routePoints) {
        nearest = Math.min(nearest, (label.point[0] - x) ** 2 + (label.point[1] - y) ** 2);
      }
      label.routeDistance = routePoints.length ? Math.sqrt(nearest) : 0;
    }
    const path = pathFor(currentRoute?.geometry);
    outline.setAttribute("d", path);
    routeStroke.setAttribute("d", path);
    const connectors = [];
    for (const [a,b] of [[startPoint,routePoints[0]],[endPoint,routePoints.at(-1)]]) {
      if (b && Math.hypot(a[0]-b[0],a[1]-b[1]) > 15) connectors.push("M" + a.join(",") + "L" + b.join(","));
    }
    access.setAttribute("d", connectors.join(""));
    const deltaLat = (hospital.lat - lat) * rad;
    const deltaLon = (hospital.lon - lon) * rad;
    const hav = Math.sin(deltaLat/2)**2 + Math.cos(lat*rad) * Math.cos(hospital.lat*rad) * Math.sin(deltaLon/2)**2;
    directKm = 2 * 6371.0088 * Math.asin(Math.sqrt(Math.min(1,hav)));
    updateRouteText();
    updateMapInfo();
    fit();
  }
  function scaleLabel() {
    return scaleMetres >= 1000 ? (scaleMetres / 1000) + mapText(" km"," किमी") : scaleMetres + mapText(" m"," मी");
  }
  function regionText() {
    return location ? placeDisplayLabel(location) : mapText("India","भारत");
  }
  function updateRouteText() {
    const chooseStart = mapText("Choose a starting point", "प्रस्थान स्थान चुनें");
    let originText = startPlaceholder === "Starting coordinates unavailable"
      ? mapText(startPlaceholder, "प्रस्थान स्थान के निर्देशांक उपलब्ध नहीं हैं")
      : chooseStart;
    if (addressStart) originText = placeDisplayLabel(addressStart);
    startName.textContent = originText;
    find(".am-region").textContent = regionText();
    const originLabel = find(".am-origin-text");
    originLabel.textContent = originText + (addressStart?.isGoldLocation ? mapText(" (area reference point)", " (क्षेत्र का अनुमानित स्थान)") : "");
    originLabel.parentElement.hidden = missingStart;
    const distance = find(".am-distance");
    const warning = locationUncertain ? mapText("The facility location is approximate. Confirm the address before travelling.", "संस्थान का स्थान अनुमानित है। निकलने से पहले पते की पुष्टि करें।") : "";
    const caption = find(".am-caption");
    if (missingStart) {
      find(".am-heading h3").textContent = mapText("Facility location", "संस्थान का स्थान");
      distance.textContent = "";
      caption.textContent = warning;
      return;
    }
    find(".am-heading h3").textContent = mapText("Driving route", "सड़क मार्ग");
    const parts = [];
    if (routePoints.length) {
      const km = currentRoute.km.toFixed(1);
      distance.textContent = mapText(km + " km by road", "सड़क से " + km + " किमी");
      parts.push(mapText("Driving route to " + hospitalName + ".", hospitalName + " तक सड़क मार्ग।"));
    } else {
      distance.textContent = pendingRoute ? mapText("Finding road route…", "सड़क मार्ग खोजा जा रहा है…")
        : mapText("Road route unavailable", "सड़क मार्ग उपलब्ध नहीं है");
    }
    if (access.getAttribute("d")) parts.push(mapText("Dotted lines connect the map pins to the road.", "बिंदुदार रेखाएँ चिह्नित स्थानों को सड़क से जोड़ती हैं।"));
    parts.push(mapText(directKm.toFixed(1) + " km in a straight line.", "सीधी दूरी " + directKm.toFixed(1) + " किमी है।"));
    if (warning) parts.push(warning);
    caption.textContent = parts.join(" ");
  }
  function updateMapInfo() {
    const description = view === "satellite" ? mapText("satellite map with road labels", "सड़कों के नाम सहित उपग्रह मानचित्र") : mapText("street map", "सड़क मानचित्र");
    const mapLabel = missingStart ? mapText("showing " + hospitalName, "संस्थान " + hospitalName)
      : mapText("from " + startName.textContent + " to " + hospitalName, startName.textContent + " से " + hospitalName + " तक") + ". " + find(".am-distance").textContent;
    const controls = mapText("Use arrows to pan, scroll or press plus and minus to zoom, Home to fit the map, and Escape to return to page scrolling.", "मानचित्र खिसकाने के लिए तीर वाली कुंजियाँ दबाएँ। ज़ूम के लिए स्क्रॉल करें या प्लस और माइनस दबाएँ। पूरा मार्ग देखने के लिए Home और पन्ने पर वापस स्क्रॉल करने के लिए Esc दबाएँ।");
    canvas.setAttribute("aria-label", regionText() + " " + description + ", " + mapLabel + ". " + controls);
    const tileCredit = find(".am-tile-credit");
    tileCredit.textContent = view === "satellite" ? "EOX · © OpenStreetMap" : "© OpenStreetMap";
    tileCredit.href = view === "satellite" ? "https://maps.eox.at/" : "https://www.openstreetmap.org/copyright";
    if (view === "satellite" && localSatellite && !photo.hasAttribute("href")) {
      photo.setAttribute("href", satellite.image);
    }
    credits.replaceChildren();
    if (view === "satellite") {
      if (!localSatellite) {
        credit("EOxCloudless by EOX (contains modified Copernicus Sentinel data 2025)","https://cloudless.eox.at/");
        credit("Reference overlay by EOX","https://maps.eox.at/");
        credit("MapServer","https://github.com/mapserver/basemaps");
      } else if (satellite.attributionParts?.length) {
        for (const part of satellite.attributionParts) creditPart(part.label, part.url);
      } else {
        credit(satellite.attributionLabel, satellite.attributionUrl);
      }
      if (satellite?.licenseUrl) credit(satellite.licenseLabel || satellite.license, satellite.licenseUrl);
    }
    credit(backend.attributionLabel || "© OpenStreetMap contributors", backend.attributionUrl || "https://www.openstreetmap.org/copyright");
    if (localSatellite && view === "satellite") for (const item of backend.extraCredits || []) credit(item.label, item.url);
    if (addressStart?.isGoldLocation) credit(mapText("Gold location lookup","Gold स्थान निर्देशिका"));
    if (currentRoute) credit(mapText("Routing by OSRM · FOSSGIS","मार्ग की जानकारी OSRM · FOSSGIS से"), "https://routing.openstreetmap.de/");
    if (addressStart) credit(mapText("Fix the map","मानचित्र में सुधार सुझाएँ"), "https://www.openstreetmap.org/fixthemap");
    if (localSatellite) detailImagery.credit(credits, view);
  }
  function updateLanguage() {
    root.setAttribute("aria-label", mapText("Route to " + hospitalName, hospitalName + " तक का मार्ग"));
    find(".am-start legend").textContent = mapText("Starting point", "प्रस्थान स्थान");
    find(".am-view legend").textContent = mapText("Map view", "मानचित्र का प्रकार");
    find('[value="street"] + span').textContent = mapText("Street", "सड़क");
    find('[value="satellite"] + span').textContent = mapText("Satellite", "उपग्रह");
    for (const [button, label] of [[plus, mapText("Zoom in", "ज़ूम इन करें")], [minus, mapText("Zoom out", "ज़ूम आउट करें")], [find(".am-fit"), mapText("Fit route", "पूरा मार्ग दिखाएँ")]]) {
      button.setAttribute("aria-label", label);
      button.title = label;
    }
    find(".am-wheel-hint").textContent = mapText("Scroll over the selected map to zoom. Press Esc to scroll the page.", "चुने हुए मानचित्र पर ज़ूम करने के लिए स्क्रॉल करें। पन्ने पर स्क्रॉल करने के लिए Esc दबाएँ।");
    if (scaleMetres != null) find(".am-scale span").textContent = scaleLabel();
    updateRouteText();
    updateMapInfo();
    detailImagery.updateLanguage();
    reportTileState();
  }
  function setView(choice) {
    view = choice === "satellite" ? "satellite" : "street";
    root.dataset.view = view;
    viewControl.querySelector('input[value="' + view + '"]').checked = true;
    updateMapInfo();
    scheduleDraw();
  }
  viewControl.addEventListener("change", event => setView(event.target.value), listener);
  photo?.addEventListener("error", () => {
    photoAvailable = false;
    scheduleDraw();
  }, listener);
  plus.addEventListener("click", () => zoom(1/1.5), listener);
  minus.addEventListener("click", () => zoom(1.5), listener);
  find(".am-fit").addEventListener("click", fit, listener);
  canvas.addEventListener("keydown", event => {
    const delta = Math.min(width, height) * scale * .2;
    switch (event.key) {
      case "ArrowLeft": centre[0] -= delta; break;
      case "ArrowRight": centre[0] += delta; break;
      case "ArrowUp": centre[1] -= delta; break;
      case "ArrowDown": centre[1] += delta; break;
      case "+": case "=": zoom(1/1.5); break;
      case "-": zoom(1.5); break;
      case "Home": fit(); break;
      default: return;
    }
    if (event.key.startsWith("Arrow")) cameraAdjusted = true;
    event.preventDefault();
    scheduleDraw();
  }, listener);
  const pointers = new Map();
  function pointerFrame() {
    const [a, b] = pointers.values();
    if (!b) return {x:a.x,y:a.y,span:0};
    return {x:(a.x + b.x)/2, y:(a.y + b.y)/2, span:Math.hypot(a.x-b.x,a.y-b.y)};
  }
  function relative(event) {
    const r = canvas.getBoundingClientRect();
    return {x:event.clientX - r.left, y:event.clientY - r.top};
  }
  board.addEventListener("wheel", event => {
    if (!mapPanel.matches(":focus-within") || !event.cancelable || event.shiftKey ||
        event.metaKey || event.altKey) return;
    const mode = event.deltaMode;
    let distance = event.deltaY;
    if (!distance || Math.abs(event.deltaX) > Math.abs(distance)) return;
    event.preventDefault();
    if (mode === WheelEvent.DOM_DELTA_LINE) distance *= 16;
    if (mode === WheelEvent.DOM_DELTA_PAGE) distance *= height;
    // Trackpad pinches arrive as Ctrl+wheel with much smaller deltas.
    const step = Math.max(-1, Math.min(1, distance / (event.ctrlKey ? 75 : 240)));
    const {x, y} = relative(event);
    zoom(2 ** step, x, y);
  }, {passive:false, signal:controller.signal});
  mapPanel.addEventListener("keydown", event => {
    if (event.key === "Escape" && !event.defaultPrevented && !event.target.matches("select")) {
      event.target.blur();
    }
  }, listener);
  canvas.addEventListener("pointerdown", event => {
    if (event.button !== 0 || pointers.size >= 2) return;
    canvas.focus({preventScroll:true});
    canvas.setPointerCapture(event.pointerId);
    pointers.set(event.pointerId, relative(event));
  }, listener);
  canvas.addEventListener("pointermove", event => {
    if (!pointers.has(event.pointerId)) return;
    cameraAdjusted = true;
    const before = pointerFrame();
    pointers.set(event.pointerId, relative(event));
    const after = pointerFrame();
    if (before.span > 1 && after.span > 1) zoom(before.span / after.span, before.x, before.y);
    centre[0] -= (after.x - before.x) * scale;
    centre[1] -= (after.y - before.y) * scale;
    scheduleDraw();
  }, listener);
  for (const type of ["pointerup","pointercancel","lostpointercapture"]) {
    canvas.addEventListener(type, event => pointers.delete(event.pointerId), listener);
  }
  showDestination();
  setView(initialView);
  updateLanguage();
  document.addEventListener("care-atlas-language", updateLanguage, listener);
  const resize = new ResizeObserver(() => {
    if (canvas.clientWidth === width && canvas.clientHeight === height) return;
    if (!cameraAdjusted) { fit(); return; }
    measure();
    scheduleDraw();
  });
  resize.observe(board);
  return {showAddressRoute, showDestination, get view() { return view; }, destroy() {
    controller.abort();
    resize.disconnect();
    cancelAnimationFrame(frame);
    root.remove();
  }};
}
