// ==UserScript==
// @name         3 Aho
// @namespace    https://TakeAsh.net/
// @version      2026-07-27_21:30
// @description  Become Aho when 3
// @author       TakeAsh
// @match        https://mebuki.moe/app/t/*
// @icon         https://www.google.com/s2/favicons?sz=64&domain=mebuki.moe
// @grant        none
// ==/UserScript==

(async function(d) {
  'use strict';
  await sleep(2000);
  aho(d);
  const observer = new MutationObserver(
    (mutations) => mutations.forEach(
      (mutation) => aho(mutation.target)));
  observer.observe(d, { childList: true, subtree: true, });

  function aho(target) {
    Array.from(target.querySelectorAll('div[class~="message-container"]'))
      .filter(div => !div.dataset.ahoChecked)
      .forEach(div => {
        div.dataset.ahoChecked = 1;
        const elmResNo = div.querySelector('div > span[class="text-destructive"]');
        if (!elmResNo) { return; }
        const resNo = elmResNo.textContent;
        if (!(parseInt(resNo) % 3)) { elmResNo.innerHTML += '&#x1f61c;'; }
        if (resNo.indexOf('3') >= 0) { elmResNo.innerHTML += '&#x1f92a;'; }
      });
  }

  function sleep(ms, resolve) {
    return new Promise((resolve) => setTimeout(resolve, ms));
  }
})(document);
