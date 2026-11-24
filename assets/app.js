/*!
 * 速算 24 点介绍页 —— 交互脚本
 * 依赖 assets/solver.js 暴露的 window.Solver24
 */
(function () {
  'use strict';

  var SUITS = ['\u2660', '\u2665', '\u2663', '\u2666']; // ♠ ♥ ♣ ♦
  var RED_SUITS = { '\u2665': true, '\u2666': true };

  var els = {
    cards: document.getElementById('hand'),
    deal: document.getElementById('deal-btn'),
    reveal: document.getElementById('reveal-btn'),
    answer: document.getElementById('answer'),
    answerExpr: document.getElementById('answer-expr'),
    handCount: document.getElementById('hand-count'),
    year: document.getElementById('year')
  };

  if (!els.cards || !window.Solver24) return;

  var state = { hand: null, shown: false, dealt: 0 };

  function rankOf(n) {
    if (n === 1) return 'A';
    if (n === 11) return 'J';
    if (n === 12) return 'Q';
    if (n === 13) return 'K';
    return String(n);
  }

  function suitFor(i) {
    // 固定花色顺序，让四张牌看起来像真的一手牌
    return SUITS[i % SUITS.length];
  }

  function renderHand() {
    var nums = state.hand.nums;
    els.cards.innerHTML = '';
    nums.forEach(function (n, i) {
      var suit = suitFor(i);
      var card = document.createElement('div');
      card.className = 'playing-card' + (RED_SUITS[suit] ? ' is-red' : '');
      card.style.animationDelay = (i * 70) + 'ms';
      card.setAttribute('role', 'img');
      card.setAttribute('aria-label', rankOf(n) + ' ' + suit);

      var tl = document.createElement('span');
      tl.className = 'pip pip-tl';
      tl.textContent = rankOf(n) + suit;

      var center = document.createElement('span');
      center.className = 'pip pip-center';
      center.textContent = suit;

      var br = document.createElement('span');
      br.className = 'pip pip-br';
      br.textContent = rankOf(n) + suit;

      card.appendChild(tl);
      card.appendChild(center);
      card.appendChild(br);
      els.cards.appendChild(card);
    });
  }

  function hideAnswer() {
    state.shown = false;
    els.answer.hidden = true;
    els.reveal.textContent = '查看解法';
    els.reveal.setAttribute('aria-expanded', 'false');
  }

  function deal() {
    state.hand = window.Solver24.randomHand();
    state.dealt++;
    hideAnswer();
    renderHand();
    if (els.handCount) {
      els.handCount.textContent = '已发 ' + state.dealt + ' 手';
    }
  }

  function toggleAnswer() {
    if (!state.hand) return;
    if (state.shown) {
      hideAnswer();
      return;
    }
    state.shown = true;
    els.answerExpr.textContent = state.hand.expr + ' = 24';
    els.answer.hidden = false;
    els.reveal.textContent = '收起解法';
    els.reveal.setAttribute('aria-expanded', 'true');
  }

  els.deal.addEventListener('click', deal);
  els.reveal.addEventListener('click', toggleAnswer);

  // 键盘快捷键：N 换一组，S 看解法（输入框内不触发）
  document.addEventListener('keydown', function (e) {
    var tag = (e.target && e.target.tagName) || '';
    if (tag === 'INPUT' || tag === 'TEXTAREA' || e.metaKey || e.ctrlKey || e.altKey) return;
    var key = e.key.toLowerCase();
    if (key === 'n') {
      deal();
    } else if (key === 's') {
      toggleAnswer();
    }
  });

  // 平滑滚动（尊重减少动效偏好）
  var reduceMotion = window.matchMedia && window.matchMedia('(prefers-reduced-motion: reduce)').matches;
  document.querySelectorAll('a[href^="#"]').forEach(function (link) {
    link.addEventListener('click', function (e) {
      var id = link.getAttribute('href');
      if (!id || id === '#') return;
      var target = document.querySelector(id);
      if (!target) return;
      e.preventDefault();
      target.scrollIntoView({ behavior: reduceMotion ? 'auto' : 'smooth', block: 'start' });
      if (history.replaceState) history.replaceState(null, '', id);
    });
  });

  if (els.year) els.year.textContent = String(new Date().getFullYear());

  deal();
})();
