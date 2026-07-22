/* 南开新生问答 — 前端逻辑（原生 JS，本地搜索，无后端）
   数据来源：优先使用内联的 window.__FAQ_DATA__（单文件版），否则 fetch data/faq.json。 */
(function () {
  "use strict";

  var VERIFY = {
    "官方已核验": "b-official", "多人回答一致": "b-multi", "单一经验回答": "b-single",
    "存在冲突": "b-conflict", "可能已经过时": "b-outdated", "无法确认": "b-na"
  };
  var CAT_NAME = {};
  var state = { q: "", cat: "all", data: null };

  var el = {
    input: document.getElementById("search"),
    clear: document.getElementById("clear"),
    chips: document.getElementById("chips"),
    count: document.getElementById("count"),
    list: document.getElementById("list"),
    updated: document.getElementById("updated"),
    disclaimer: document.getElementById("disclaimer"),
    toggle: document.getElementById("theme-toggle")
  };

  /* ---------- 主题切换 ---------- */
  (function initTheme() {
    var saved = null;
    try { saved = window.localStorage.getItem("nk-theme"); } catch (e) {}
    if (saved === "dark" || saved === "light") document.documentElement.setAttribute("data-theme", saved);
    function label() {
      var t = document.documentElement.getAttribute("data-theme");
      var dark = t === "dark" || (!t && window.matchMedia && window.matchMedia("(prefers-color-scheme: dark)").matches);
      el.toggle.textContent = dark ? "☀ 浅色" : "☾ 深色";
      el.toggle.setAttribute("aria-label", dark ? "切换到浅色模式" : "切换到深色模式");
    }
    label();
    el.toggle.addEventListener("click", function () {
      var cur = document.documentElement.getAttribute("data-theme");
      var dark = cur === "dark" || (!cur && window.matchMedia && window.matchMedia("(prefers-color-scheme: dark)").matches);
      var next = dark ? "light" : "dark";
      document.documentElement.setAttribute("data-theme", next);
      try { window.localStorage.setItem("nk-theme", next); } catch (e) {}
      label();
    });
  })();

  /* ---------- 工具 ---------- */
  function esc(s) { return String(s == null ? "" : s).replace(/[&<>"]/g, function (c) {
    return { "&": "&amp;", "<": "&lt;", ">": "&gt;", '"': "&quot;" }[c]; }); }

  function highlight(text, q) {
    var safe = esc(text);
    if (!q) return safe;
    var terms = q.split(/\s+/).filter(Boolean).map(function (t) {
      return t.replace(/[.*+?^${}()|[\]\\]/g, "\\$&"); });
    if (!terms.length) return safe;
    try { return safe.replace(new RegExp("(" + terms.join("|") + ")", "gi"), "<mark>$1</mark>"); }
    catch (e) { return safe; }
  }

  function haystack(f) {
    var parts = [f.q, CAT_NAME[f.cat] || "", (f.kw || []).join(" "), f.note || ""];
    f.answers.forEach(function (a) { parts.push(a.text, a.applies || "", a.src || ""); });
    if (f.official) parts.push(f.official.text, f.official.title);
    return parts.join(" ").toLowerCase();
  }

  function matches(f) {
    if (state.cat !== "all" && f.cat !== state.cat) return false;
    if (!state.q) return true;
    var hs = haystack(f);
    return state.q.toLowerCase().split(/\s+/).filter(Boolean).every(function (t) { return hs.indexOf(t) !== -1; });
  }

  /* ---------- 渲染 ---------- */
  function badge(label) {
    return '<span class="badge ' + (VERIFY[label] || "b-na") + '">' + esc(label) + "</span>";
  }

  function answerHTML(a, q) {
    var h = '<div class="ans"><div class="text">' + highlight(a.text, q) + "</div>";
    if (a.applies) h += '<div class="applies">' + highlight(a.applies, q) + "</div>";
    h += '<div class="ans-meta">' + badge(a.verify);
    if (a.para) h += '<span class="badge b-para">整理表述</span>';
    h += '<span class="src">' + esc(a.src || "群友") + "</span>";
    h += '<span class="date">' + esc(a.date || "") + "</span></div></div>";
    return h;
  }

  function faqHTML(f, q) {
    var mini = "";
    if (f.conflict) mini += badge("存在冲突");
    if (f.outdated) mini += badge("可能已经过时");
    if (f.official) mini += badge("官方已核验");

    var h = '<article class="faq" id="' + esc(f.id) + '" open-state="0">';
    h += '<button class="faq-head" aria-expanded="false" aria-controls="body-' + esc(f.id) + '">';
    h += '<span class="cat-tag">' + esc(CAT_NAME[f.cat] || f.cat) + "</span>";
    h += '<span class="q">' + highlight(f.q, q) + "</span>";
    if (mini) h += '<span class="mini-badges">' + mini + "</span>";
    h += '<span class="chev" aria-hidden="true">▾</span></button>';

    h += '<div class="faq-body" id="body-' + esc(f.id) + '">';
    if (f.conflict) h += '<div class="alert conflict"><span class="a-t">存在冲突：</span>以下回答互相矛盾，均予保留，请以最新官方通知为准。</div>';
    if (f.outdated) h += '<div class="alert outdated"><span class="a-t">可能已过时：</span>该信息各年可能变化，请以当年学校安排为准。</div>';

    h += '<div class="answers">';
    f.answers.forEach(function (a) { h += answerHTML(a, q); });
    h += "</div>";

    if (f.official) {
      var o = f.official;
      h += '<div class="official"><div class="o-t">✓ 官方核验 · ' + esc(o.title) + "</div>";
      h += '<div class="o-b">' + highlight(o.text, q) + "</div>";
      h += '<div class="o-src">来源：' + esc(o.src) + '（访问日期 ' + esc(o.date) + '）';
      if (o.url) h += '<br><a href="' + esc(o.url) + '" target="_blank" rel="noopener">' + esc(o.url) + "</a>";
      h += "</div></div>";
    }
    if (f.note) h += '<div class="note">' + highlight(f.note, q) + "</div>";
    h += '<button class="copy-link" data-id="' + esc(f.id) + '">🔗 复制本问题链接</button>';
    h += "</div></article>";
    return h;
  }

  function render() {
    var q = state.q;
    var shown = state.data.faqs.filter(matches);
    // 计数
    el.count.innerHTML = "共 <b>" + state.data.faqs.length + "</b> 条问答" +
      (state.q || state.cat !== "all" ? "，当前筛选出 <b>" + shown.length + "</b> 条" : "");
    // 分类计数
    Array.prototype.forEach.call(el.chips.children, function (chip) {
      var c = chip.getAttribute("data-cat");
      var n = c === "all" ? state.data.faqs.length : state.data.faqs.filter(function (f) { return f.cat === c; }).length;
      var cnt = chip.querySelector(".c"); if (cnt) cnt.textContent = n;
      chip.setAttribute("aria-pressed", state.cat === c ? "true" : "false");
    });

    if (!shown.length) {
      el.list.innerHTML = '<div class="empty"><div class="big">没有找到相关问答</div>' +
        "<div>换个关键词试试，或清除筛选查看全部。</div>" +
        '<button id="reset">清除搜索与筛选</button></div>';
      document.getElementById("reset").addEventListener("click", resetAll);
      return;
    }
    el.list.innerHTML = shown.map(function (f) { return faqHTML(f, q); }).join("");
    bindCards();
    // 若 URL 带锚点，自动展开定位
    if (location.hash) openFromHash();
  }

  function bindCards() {
    Array.prototype.forEach.call(el.list.querySelectorAll(".faq-head"), function (btn) {
      btn.addEventListener("click", function () { toggleCard(btn.closest(".faq")); });
    });
    Array.prototype.forEach.call(el.list.querySelectorAll(".copy-link"), function (b) {
      b.addEventListener("click", function () {
        var url = location.origin + location.pathname + "#" + b.getAttribute("data-id");
        var done = function () { b.textContent = "✓ 链接已复制"; setTimeout(function () { b.textContent = "🔗 复制本问题链接"; }, 1600); };
        if (navigator.clipboard && navigator.clipboard.writeText) navigator.clipboard.writeText(url).then(done, function () { prompt("复制此链接：", url); });
        else prompt("复制此链接：", url);
        history.replaceState(null, "", "#" + b.getAttribute("data-id"));
      });
    });
  }

  function toggleCard(card, forceOpen) {
    var open = card.getAttribute("open-state") === "1";
    var next = forceOpen ? true : !open;
    card.setAttribute("open-state", next ? "1" : "0");
    card.querySelector(".faq-head").setAttribute("aria-expanded", next ? "true" : "false");
  }

  function openFromHash() {
    var id = decodeURIComponent(location.hash.slice(1));
    var card = document.getElementById(id);
    if (card && card.classList.contains("faq")) {
      toggleCard(card, true);
      document.querySelectorAll(".faq.target").forEach(function (c) { c.classList.remove("target"); });
      card.classList.add("target");
      card.scrollIntoView({ behavior: "smooth", block: "start" });
    }
  }

  function resetAll() {
    state.q = ""; state.cat = "all"; el.input.value = ""; el.clear.classList.remove("show");
    render();
  }

  /* ---------- 事件 ---------- */
  el.input.addEventListener("input", function () {
    state.q = el.input.value.trim();
    el.clear.classList.toggle("show", !!el.input.value);
    render();
  });
  el.clear.addEventListener("click", function () {
    el.input.value = ""; state.q = ""; el.clear.classList.remove("show"); el.input.focus(); render();
  });
  window.addEventListener("hashchange", openFromHash);

  /* ---------- 启动 ---------- */
  function boot(data) {
    state.data = data;
    (data.categories || []).forEach(function (c) { CAT_NAME[c.key] = c.name; });
    document.getElementById("subtitle").textContent = data.meta.disclaimer ? "" : "";
    el.disclaimer.innerHTML = "<strong>免责声明：</strong>" + esc(data.meta.disclaimer);
    el.updated.innerHTML = "整理来源：" + esc(data.meta.source) +
      "（约 " + esc(data.meta.msg_total) + " 条消息，时间范围 " + esc(data.meta.range) + "）<br>" +
      "最后更新：<b>" + esc(data.meta.generated) + "</b>";
    // 分类 chips
    var chips = ['<button class="chip" data-cat="all" aria-pressed="true">全部<span class="c"></span></button>'];
    (data.categories || []).forEach(function (c) {
      chips.push('<button class="chip" data-cat="' + esc(c.key) + '" aria-pressed="false">' + esc(c.name) + '<span class="c"></span></button>');
    });
    el.chips.innerHTML = chips.join("");
    Array.prototype.forEach.call(el.chips.children, function (chip) {
      chip.addEventListener("click", function () { state.cat = chip.getAttribute("data-cat"); render(); });
    });
    render();
  }

  if (window.__FAQ_DATA__) { boot(window.__FAQ_DATA__); }
  else {
    fetch("data/faq.json").then(function (r) {
      if (!r.ok) throw new Error("加载失败 " + r.status); return r.json();
    }).then(boot).catch(function (err) {
      el.list.innerHTML = '<div class="empty"><div class="big">数据加载失败</div><div>' +
        esc(err.message) + '<br>若在本地打开单文件版，请使用 dist/index.html。</div></div>';
    });
  }
})();
