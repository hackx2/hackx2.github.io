(function(){
/** @type {{ xml: string; json: string }} */
const WATERMARK = {
  xml: "<!-- Converted using Psych2CNE hackx2.github.io/psych2cne -->",
  json: "Converted using Psych2CNE hackx2.github.io/psych2cne",
};

/** @typedef {{ label: string; color: string }} LogTypeObj */

/** @type {{ INFORMATION: LogTypeObj; ERROR: LogTypeObj; WARNING: LogTypeObj; SUCCESS: LogTypeObj }} */
const LogType = {
  INFORMATION: { label: "INFORMATION", color: "#9cdcfe" },
  ERROR: { label: "ERROR", color: "#ff6c6b" },
  WARNING: { label: "WARNING", color: "#ffcb6b" },
  SUCCESS: { label: "SUCCESS", color: "#b5f774" },
};

/**
 * Clears all messages inside the #logBox thingy
 */
function clearLogs() {
  /** @type {HTMLElement | null} */
  const logBox = document.getElementById("logBox");
  if (logBox) logBox.innerHTML = "";
}

/**
 * Logs a message to the #logBox and console.
 * @param {string} msg The message to log
 * @param {string | LogTypeObj} [type=LogType.INFORMATION] The log type or key
 */
function log(msg, type = LogType.INFORMATION) {
  console.warn(msg);

  /** @type {HTMLElement | null} */
  const logBox = document.getElementById("logBox");
  if (logBox) {
    const timestamp = new Date().toLocaleTimeString();

    /** @type {LogTypeObj} */
    let logTypeObj = type;
    if (typeof type === "string") {
      logTypeObj = LogType[type.toUpperCase()] || LogType.INFORMATION;
    }
    const label = logTypeObj.label;
    const color = logTypeObj.color;

    const centeredLabel = label
      .padStart(Math.floor((12 + label.length) / 2), " ")
      .padEnd(12, " ");

    /** @type {HTMLDivElement} */
    const entry = document.createElement("div");
    entry.innerHTML = `<span style="color:${color};font-weight:bold;">[ ${timestamp} | ${centeredLabel}] ${msg}</span>`;
    logBox.appendChild(entry);
    logBox.scrollTop = logBox.scrollHeight;
  }
}

log("Welcome!!!", LogType.SUCCESS);

/**
 * Pretty prints XML string with 2-space indentation.
 * @param {string} xml
 * @returns {string}
 */
function prettyFormatXML(xml) {
  const PADDING = "  ";
  const lines = xml.replace(/>\s*</g, ">\n<").split("\n");
  let indent = 0;

  return lines
    .map((line) => {
      if (/^<\/\w/.test(line)) indent--;
      const formatted = PADDING.repeat(Math.max(indent, 0)) + line;
      if (/^<\w[^>]*[^/]?>/.test(line)) indent++;
      return formatted;
    })
    .join("\n");
}

/**
 * Converts RGB components to a hex color string.
 * @param {number} r
 * @param {number} g
 * @param {number} b
 * @returns {string}
 */
function rgbToHex(r, g, b) {
  const toHex = (c) => {
    const hex = Math.max(0, Math.min(255, c)).toString(16);
    return hex.length === 1 ? "0" + hex : hex;
  };

  return `#${toHex(r)}${toHex(g)}${toHex(b)}`;
}
function hex2rgb(hex_color) {
  if (typeof hex_color !== "string") return { r: 0, g: 0, b: 0 };
  hex_color = hex_color.trim().replace(/^#/, "");
  if (hex_color.length === 3) {
    hex_color = hex_color.split("").map(c => c + c).join("");
  }
  if (hex_color.length !== 6) return { r: 0, g: 0, b: 0 };
  const r = parseInt(hex_color.substring(0, 2), 16);
  const g = parseInt(hex_color.substring(2, 4), 16);
  const b = parseInt(hex_color.substring(4, 6), 16);
  return { r, g, b };
}

/**
 * Convert Psych JSON to Codename Engine XML.
 * @param {any} json The input JSON (ideally typed)
 * @param {string} charTag The character tag attributes string
 * @returns {string} Formatted XML string
 */
async function psychToCNE(json, charTag) {
  log("Starting Psych JSON to CNE XML conversion...", LogType.INFORMATION);

  const blah = json.healthbar_colors;
  const covertedLOL = rgbToHex(blah[0], blah[1], blah[2]);
  log(`Converted healthbar color RGB(${blah.join(", ")}) to hex ${covertedLOL}`, LogType.INFORMATION);

  let out = `<!DOCTYPE codename-engine-character>\n${WATERMARK.xml}\n`;
  out += `<character ${charTag}`;
  out += ` icon="${String(json.healthicon)}"`;
  out += ` color="${String(covertedLOL)}"`;
  out += ` sprite="${String(json.image).replace("characters/", "")}"`;
  out += ` flipX="${String(json.flip_x).toLowerCase()}"`;
  out += ` holdTime="${json.sing_duration}"`;

  const [x, y] = json.position;
  if (x !== 0) out += ` x="${x}"`;
  if (y !== 0) out += ` y="${y}"`;
  log(`Position set to x=${x}, y=${y}`, LogType.INFORMATION);

  const [camX, camY] = json.camera_position;
  if (camX !== 0) out += ` camX="${camX}"`;
  if (camY !== 0) out += ` camY="${camY}"`;
  log(`Camera position set to camX=${camX}, camY=${camY}`, LogType.INFORMATION);

  if (json.scale !== 1) out += ` scale="${json.scale}"`;
  if (json.no_antialiasing !== false) {
    out += ` antialiasing="${String(!json.no_antialiasing).toLowerCase()}"`;
  }
  log(`Scale: ${json.scale}, No Antialiasing: ${json.no_antialiasing}`, LogType.INFORMATION);

  out += ">\n";

  log(`Processing ${json.animations.length} animations...`, LogType.INFORMATION);
  for (const anim of json.animations) {
    log(`Converting animation: ${anim.anim} (${anim.name})`, LogType.INFORMATION);

    out += `  <anim name="${anim.anim}" anim="${anim.name}"`;
    if (anim.fps !== 24) {
      out += ` fps="${anim.fps}"`;
      log(`Animation FPS overridden: ${anim.fps}`, LogType.INFORMATION);
    }
    out += ` loop="${String(anim.loop).toLowerCase()}"`;

    const [ox, oy] = anim.offsets;
    out += ` x="${ox}" y="${oy}"`;
    log(`Animation offsets: x=${ox}, y=${oy}`, LogType.INFORMATION);

    if (anim.indices?.length > 0) {
      const indices = anim.indices;
      let str = "";
      for (let i = 0; i < indices.length; i++) {
        const start = indices[i];
        let end = start;
        while (i + 1 < indices.length && indices[i + 1] === indices[i] + 1) {
          end = indices[++i];
        }
        if (end - start >= 2) {
          str += `${start}..${end},`;
        } else {
          for (let j = start; j <= end; j++) {
            str += `${j},`;
          }
        }
      }
      out += ` indices="${str.slice(0, -1)}"`; // Remove trailing comma
      log(`Animation indices compressed: ${str.slice(0, -1)}`, LogType.INFORMATION);
    }

    out += " />\n";
  }

  out += "</character>\n";

  log("Finished conversion to CNE XML. Formatting output...", LogType.SUCCESS);
  return formatXml(out);
}


/**
 * Convert Codename Engine XML to Psych JSON.
 * @param {string} xmlText The input XML string
 * @returns {Promise<string>} Pretty formatted JSON string
 */
async function cneToPsych(xmlText) {
  log("Parsing XML...", LogType.INFORMATION);
  const parser = new DOMParser();
  const xmlDoc = parser.parseFromString(xmlText, "application/xml");

  if (xmlDoc.querySelector("parsererror")) {
    log("Invalid XML format.", LogType.ERROR);
    throw new Error("Invalid XML format.");
  }

  log("Looking for <character> tag...", LogType.INFORMATION);
  const character = xmlDoc.querySelector("character");
  if (!character) {
    log("No <character> tag found.", LogType.ERROR);
    throw new Error("No <character> tag found.");
  }

  log("Extracting character attributes...", LogType.INFORMATION);
  const flip_x = character.getAttribute("flipX") === "true";
  const sing_duration = parseFloat(character.getAttribute("holdTime")) || 4;
  const posX = parseFloat(character.getAttribute("x")) || 0;
  const posY = parseFloat(character.getAttribute("y")) || 0;
  const camX = parseFloat(character.getAttribute("camX")) || 0;
  const camY = parseFloat(character.getAttribute("camY")) || 0;
  const scale = parseFloat(character.getAttribute("scale")) || 1;
  const _color = character.getAttribute("color") || "#ffffffff";
  const antialiasingAttr = character.getAttribute("antialiasing");
  const no_antialiasing =
    antialiasingAttr !== null
      ? antialiasingAttr.toLowerCase() !== "true"
      : false;

  log("Extracting animations...", LogType.INFORMATION);
  const animations = Array.from(character.querySelectorAll("anim")).map(
    (el, idx) => {
      log(
        `Parsing animation #${idx + 1} (${el.getAttribute("name")})`,
        LogType.INFORMATION
      );
      const indicesAttr = el.getAttribute("indices");
      const indices = [];
      if (indicesAttr) {
        const parts = indicesAttr.split(",");
        for (const part of parts) {
          const trimmed = part.trim();
          if (trimmed.includes("..")) {
            const [startStr, endStr] = trimmed.split("..");
            const start = parseInt(startStr);
            const end = parseInt(endStr);
            if (!isNaN(start) && !isNaN(end)) {
              for (let i = start; i <= end; i++) {
                indices.push(i);
              }
            }
          } else {
            const val = parseInt(trimmed);
            if (!isNaN(val)) indices.push(val);
          }
        }
      }
      return {
        anim: el.getAttribute("anim"),
        name: el.getAttribute("name"),
        fps: parseInt(el.getAttribute("fps")) || 24,
        loop: el.getAttribute("loop") === "true",
        offsets: [
          parseFloat(el.getAttribute("x")) || 0,
          parseFloat(el.getAttribute("y")) || 0,
        ],
        indices,
      };
    }
  );

  log("Building Psych JSON object...", LogType.INFORMATION);
   var healthbar_colors = hex2rgb(_color);

  const psychObj = {
    animations,
    no_antialiasing,
    position: [posX, posY],
    camera_position: [camX, camY],
    sing_duration,
    flip_x,
    scale,
    image: character.getAttribute("sprite") ?? "",
    healthicon: character.getAttribute("icon") ?? "",
    healthbar_colors: [healthbar_colors.r, healthbar_colors.g, healthbar_colors.b],
    __converter__: WATERMARK.json
  };

  log("Conversion to Psych JSON complete.", LogType.SUCCESS);
  const prettyJson = JSON.stringify(psychObj, null, 2);
  return prettyJson;
}

/**
 * Format XML string with indentation.
 * @param {string} xml
 * @returns {string}
 */
function formatXml(xml) {
  const PADDING = "  ";
  const reg = /(>)(<)(\/*)/g;
  let pad = 0;
  xml = xml.replace(reg, "$1\r\n$2$3");
  return xml
    .split("\r\n")
    .map((node) => {
      let indent = 0;
      if (node.match(/^<\/\w/)) indent = --pad;
      else if (node.match(/^<\w([^>]*[^/])?>.*$/)) indent = pad++;
      else indent = pad;
      return PADDING.repeat(indent) + node;
    })
    .join("\r\n");
}

/** Converts a loaded file based on conversionType */
function convertFile() {
  /** @type {HTMLInputElement | null} */
  const fileInput = document.getElementById("fileInput");
  /** @type {HTMLElement | null} */
  const status = document.getElementById("status");
  /** @type {HTMLSelectElement | null} */
  const charTypeEl = document.getElementById("charType");
  /** @type {HTMLElement | null} */
  const codeEl = document.getElementById("output");
  /** @type {HTMLSelectElement | null} */
  const conversionTypeEl = document.getElementById("conversionType");

  if (!fileInput || !fileInput.files || fileInput.files.length === 0) {
    log("Please select a file.", LogType.ERROR);
    return;
  }
  if (!status || !charTypeEl || !codeEl || !conversionTypeEl) {
    log("Missing required UI elements.", LogType.ERROR);
    return;
  }

  const file = fileInput.files[0];
  const charType = charTypeEl.value;
  const conversionType = conversionTypeEl.value;

  const reader = new FileReader();

  reader.onload = async (e) => {
    clearLogs();
    try {
      //if (status) status.textContent = "Successfully loaded!!!";
      let converted;

      if (
        (conversionType === "psych2cne" &&
          file.name.toLowerCase().endsWith(".xml")) ||
        (conversionType === "cne2psych" &&
          file.name.toLowerCase().endsWith(".json"))
      ) {
        const expectedExt = conversionType === "psych2cne" ? ".json" : ".xml";
        const errorMsg = `Error: Invalid file extension. Please upload a ${expectedExt} file.`;
        codeEl.textContent = `// ${errorMsg}`;
        codeEl.className = "language-js";
        window.downloadable = false;
        log(errorMsg, LogType.ERROR);
        return;
      }

      if (conversionType === "psych2cne") {
        log("Parsing JSON...");
        const text = e.target.result;
        const json = JSON.parse(text);
        log("Converting to XML...");
        converted = await psychToCNE(json, charType);
        codeEl.textContent = converted;
        codeEl.className = "language-xml";
        window.downloadable = true;
        Prism.highlightElement(codeEl);
      } else if (conversionType === "cne2psych") {
        log("Parsing XML...");
        const text = e.target.result;
        converted = await cneToPsych(text);
        codeEl.textContent = converted;
        window.downloadable = true;
        codeEl.className = "language-json";
        Prism.highlightElement(codeEl);
      } else {
        log("Unknown conversion type selected.", LogType.ERROR);
        return;
      }
    } catch (error) {
      log("Conversion failed: " + error.message, LogType.ERROR);
    }
  };
 // Prism.highlightAll();
  reader.readAsText(file);
}

// isn't used anywhere else sooooo
window.onFileChange = () => {
  /** @type {HTMLElement | null} */
  const status = document.getElementById("status");

  /** @type {HTMLInputElement | null} */
  const fileInput = document.getElementById("fileInput");

  if (!status || !fileInput) return;
  window.fileNameHUH = fileInput.files[0].name.replace('.json', '').replace('.xml', '');
  status.textContent = (fileInput.files && fileInput.files.length > 0) ? "File selected: " + fileInput.files[0].name+"." : 'No file loaded.';
};


// shi- what the hell
window.downloadXML = () => {
  /** @type {HTMLElement | null} */
  const codeEl = document.getElementById("output");

  if (!window.downloadable || !codeEl.textContent || codeEl.textContent.trim() === "") {
    log("Nothing to download. Convert a valid file first.", LogType.ERROR);
    return;
  }

  const conversionType = document.getElementById("conversionType").value;
  const blobType =
    conversionType === "psych2cne" ? "text/xml" : "application/json";
  const extension = conversionType === "psych2cne" ? "xml" : "json";
  const furryButts = `converted_${window.fileNameHUH}.${extension}`;
  const blob = new Blob([codeEl.textContent], { type: blobType });
  const a = document.createElement("a");
  a.href = URL.createObjectURL(blob);
  a.download =furryButts;
  a.click();

  log(`Downloaded ${furryButts}`, LogType.SUCCESS);
};

window.convertFile = convertFile;
})();