/**
 * Format XML string with indentation.
 * @param {string} xml
 * @returns {string}
 */
function format_xml(xml, padding = 4) {
  const _PADDING = " ".repeat(padding);
  const __xmlReg = /(>)(<)(\/*)/g;

  let pad = 0;
  xml = xml.replace(__xmlReg, "$1\r\n$2$3");
  return xml
    .split("\r\n")
    .map((node) => {
      let indent = 0;
      if (node.match(/^<\/\w/)) indent = --pad;
      else if (node.match(/^<\w([^>]*[^/])?>.*$/)) indent = pad++;
      else indent = pad;
      return _PADDING.repeat(indent) + node;
    })
    .join("\r\n");
}
