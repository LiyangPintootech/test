/*!
 * 速算 24 点求解器（精确分数运算，无浮点误差）
 * 同时支持浏览器全局 Solver24 与 CommonJS 引入（便于 node 单测）。
 */
(function (root, factory) {
  var api = factory();
  if (typeof module === 'object' && module.exports) {
    module.exports = api;
  } else {
    root.Solver24 = api;
  }
})(typeof self !== 'undefined' ? self : this, function () {
  'use strict';

  var TARGET = 24;

  function gcd(a, b) {
    a = Math.abs(a);
    b = Math.abs(b);
    while (b) {
      var t = a % b;
      a = b;
      b = t;
    }
    return a || 1;
  }

  /** 生成最简分数 { n, d }，d > 0 */
  function frac(n, d) {
    if (d === 0) return null;
    if (d < 0) {
      n = -n;
      d = -d;
    }
    var g = gcd(n, d);
    return { n: n / g, d: d / g };
  }

  var OPS = [
    { sym: '+', apply: function (a, b) { return frac(a.n * b.d + b.n * a.d, a.d * b.d); } },
    { sym: '-', apply: function (a, b) { return frac(a.n * b.d - b.n * a.d, a.d * b.d); } },
    { sym: '×', apply: function (a, b) { return frac(a.n * b.n, a.d * b.d); } },
    { sym: '÷', apply: function (a, b) { return frac(a.n * b.d, a.d * b.n); } }
  ];

  function isTarget(v) {
    return v.n === TARGET * v.d;
  }

  /** 去掉最外层多余括号 */
  function stripOuterParens(expr) {
    if (expr.charAt(0) !== '(' || expr.charAt(expr.length - 1) !== ')') return expr;
    var depth = 0;
    for (var i = 0; i < expr.length; i++) {
      var ch = expr.charAt(i);
      if (ch === '(') depth++;
      else if (ch === ')') {
        depth--;
        if (depth === 0 && i !== expr.length - 1) return expr; // 括号没有包住整体
      }
    }
    return expr.slice(1, -1);
  }

  /**
   * 在 items 上做穷举：items = [{ v: 分数, e: 表达式字符串 }]
   * 返回第一个等于 24 的表达式，否则 null。
   */
  function search(items) {
    if (items.length === 1) {
      return isTarget(items[0].v) ? stripOuterParens(items[0].e) : null;
    }
    for (var i = 0; i < items.length; i++) {
      for (var j = 0; j < items.length; j++) {
        if (i === j) continue;
        var a = items[i];
        var b = items[j];
        var rest = [];
        for (var k = 0; k < items.length; k++) {
          if (k !== i && k !== j) rest.push(items[k]);
        }
        for (var o = 0; o < OPS.length; o++) {
          var op = OPS[o];
          var v = op.apply(a.v, b.v);
          if (!v) continue; // 除数为 0
          rest.push({ v: v, e: '(' + a.e + op.sym + b.e + ')' });
          var found = search(rest);
          rest.pop();
          if (found) return found;
        }
      }
    }
    return null;
  }

  /** 给定 4 个数字，返回一个解（表达式字符串）或 null */
  function solve(nums) {
    if (!Array.isArray(nums) || nums.length !== 4) return null;
    var items = nums.map(function (n) {
      return { v: frac(n, 1), e: String(n) };
    });
    return search(items);
  }

  function solvable(nums) {
    return solve(nums) !== null;
  }

  /** 随机发一手 1..13 且有解的四张牌 */
  function randomHand(rand) {
    rand = rand || Math.random;
    for (var attempt = 0; attempt < 500; attempt++) {
      var nums = [];
      for (var i = 0; i < 4; i++) nums.push(1 + Math.floor(rand() * 13));
      var expr = solve(nums);
      if (expr) return { nums: nums, expr: expr };
    }
    // 兜底：必定有解的牌型
    var fallback = [3, 3, 8, 8];
    return { nums: fallback, expr: solve(fallback) };
  }

  return {
    TARGET: TARGET,
    solve: solve,
    solvable: solvable,
    randomHand: randomHand,
    _frac: frac
  };
});
