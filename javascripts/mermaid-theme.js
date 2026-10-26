/*
 * Дополняет стили диаграмм, которые Material передаёт в mermaid (themeCSS).
 * Mermaid 11.x поменял разметку, и часть элементов осталась в цветах темы
 * mermaid по умолчанию: фиолетовые линии жизни, тёмные наконечники стрелок,
 * чёрные подписи веток alt/else — в тёмной теме их не видно.
 *
 * Диаграмма живёт в shadow DOM, поэтому extra.css до неё не достаёт, а CSS-
 * переменные --md-mermaid-* проходят. Правила mermaid привязаны к id
 * диаграммы, поэтому здесь !important.
 */
(function () {
  // Локальный mermaid не загрузился — Material сам возьмёт его с unpkg
  if (typeof mermaid === "undefined") return;

  var css = [
    ".actor-line{stroke:var(--md-mermaid-sequence-actor-line-color)!important}",
    ".sectionTitle{fill:var(--md-mermaid-sequence-loop-fg-color)!important}",
    ".noteText{fill:var(--md-mermaid-sequence-note-fg-color)!important}",
    "marker path,marker circle{stroke:var(--md-mermaid-edge-color)!important}",
    "[id$=-arrowhead] path,[id$=-crosshead] path{fill:var(--md-mermaid-sequence-message-line-color)!important;stroke:var(--md-mermaid-sequence-message-line-color)!important}"
  ].join("");

  var initialize = mermaid.initialize;
  mermaid.initialize = function (config) {
    config = Object.assign({}, config);
    config.themeCSS = (config.themeCSS || "") + css;
    return initialize.call(mermaid, config);
  };
})();
