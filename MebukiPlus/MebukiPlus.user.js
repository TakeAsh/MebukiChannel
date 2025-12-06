// ==UserScript==
// @name         Mebuki Plus
// @namespace    https://TakeAsh.net/
// @version      2025-12-06_22:30
// @description  enhance Mebuki channel
// @author       TakeAsh
// @match        https://mebuki.moe/app
// @match        https://mebuki.moe/app/*
// @require      https://raw.githubusercontent.com/TakeAsh/js-Modules/main/modules/Util.js
// @require      https://raw.githubusercontent.com/TakeAsh/js-Modules/main/modules/PrepareElement.js
// @require      https://raw.githubusercontent.com/TakeAsh/js-Modules/main/modules/AutoSaveConfig.js
// @icon         https://www.google.com/s2/favicons?sz=64&domain=mebuki.moe
// @grant        none
// ==/UserScript==

(async (w, d) => {
  'use strict';
  const urlCustomEmoji = 'https://mebuki.moe/api/custom-emoji';
  const urlEmoji = 'https://mebuki.moe/assets/emoji-data-CJuCqmpZ.js';
  const urlFavion = `${location.origin}/favicon.ico`;
  const SpCmd = {
    '623': '\u{1f409}', '421': '\u{1f409}',
    '236': '\u{1f4a8}', '214': '\u{1f4a8}',
    '426': '\u{1f525}', '624': '\u{1f525}',
    '4.268': '\u{1f30c}', '6.248': '\u{1f30c}',
  };
  const keysSpCmd = Object.keys(SpCmd).map(cmd => quotemeta(cmd)).join('|');
  const regSpCmd = new RegExp(`([0-9\\:\\.]*?)(${keysSpCmd})$`);
  const settings = new AutoSaveConfig({
    PopupCatalog: true,
    PopupEmoji: true,
    DropTime: true,
    SelectToQuote: true,
    ZoromePicker: true,
    DiceHighlight: '#a0ffa0',
    Dice: {
      RGB: true,
      Candidate: true,
      Onigiri: true,
    },
  }, 'MebukiPlusSettings');
  const Dice = {
    RGB: {
      Reg: /(?<dice>RGB値?[\s\S]+?dice3d255=[\s\S]*?>(?<r>\d+)\s(?<g>\d+)\s(?<b>\d+)\s\(\d+\)<[^>]+>)/giu,
      Callback: (match, p1, p2, p3, p4) => `${p1} <span style="background-color: rgb(${p2},${p3},${p4});">　　　</span>`,
    },
    Candidate: {
      Reg: /(?<head>[\s\S]+?)(?<dice><span\sclass="message-dice"><span\sclass="formula">dice(?<num>\d+)d(?<faces>\d+)=<\/span><span\sclass="answer">(?<answers>[^<]+)<\/span><\/span>)/g,
      Callback: (match, p1, p2, p3, p4, p5) => {
        p5.replace(/\s+\(\d+\)$/, '').trim().split(/\s+/)
          .map(answer => parseInt(answer))
          .forEach(answer => {
            const after = p1.replace(
              /(?<=<br>|\s|\b)((\d+)-(\d+)\D[^0-9<]+)/gu,
              (match, q1, q2, q3) => {
                return answer < q2 || q3 < answer
                  ? q1
                  : `<span class="MebukiPlus_DiceHighlight">${q1}</span>`;
              });
            if (p1 != after) {
              p1 = after;
              return;
            }
            p1 = p1.replace(
              new RegExp(`(?<=<br>|\\s|\\b)(${answer}\\D[^0-9<]+)`, 'u'),
              '<span class="MebukiPlus_DiceHighlight">$1</span>'
            );
          });
        return `${p1}${p2}`;
      },
    },
    Onigiri: {
      Reg: /(?<dice>おにぎり[\s\S]+?dice\d+d\d+=[\s\S]*?>(?<answer>[^<]+)<[^>]+>)/giu,
      Callback: (match, p1, p2) => `${p1} ` + p2.replace(/\s+\(\d+\)$/, '').trim().split(/\s+/)
        .map(ans => `<span class="MebukiPlus_DiceHighlight">${ans ** 2}</span>個`)
        .join(' '),
    },
  };
  const emojis = await getEmojis();
  await sleep(2000);
  const cssDiceHighlight = d.createElement('style');
  d.head.appendChild(cssDiceHighlight);
  setDiceHighlight(settings.DiceHighlight);
  const cssPopupTitle = d.createElement('style');
  cssPopupTitle.textContent = [
    '@media (pointer: coarse) {',
    '  .popupTitle[title] { position:relative; }',
    '  .popupTitle[title]:hover::before {',
    '    content:attr(title); position:fixed; top:0%; right:0%',
    '    color:var(--foreground); background-color:var(--background);',
    '    border:1px solid; z-index:10;',
    '  }',
    '}',
  ].join('\n');
  d.head.appendChild(cssPopupTitle);
  addStyle({
    '#MebukiPlus_Main': {
      marginBottom: 'auto',
    },
    '#MebukiPlus_Summary': {
      textAlign: 'right',
    },
    '#MebukiPlus_Body': {
      background: 'var(--card)',
    },
    '#MebukiPlus_Body > fieldset': {
      border: 'solid 0.15em',
      margin: '0.5em',
      padding: '0em 0.5em',
    },
    '#MebukiPlus_Body > fieldset > div': {
      display: 'grid',
    },
    '#MebukiPlus_Body button': {
      color: 'ButtonText',
      backgroundColor: 'ButtonFace',
      border: '2px ButtonBorder solid',
    },
    '.MebukiPlus_Highlight': {
      color: '#ff0000', fontSize: '125%',
    },
  });
  if (settings.PopupCatalog) {
    addStyle({
      '.catalog-item:hover': {
        transform: 'translate(50%,50%) translate(-6em,-6em)', zIndex: 20,
      },
      '.catalog-image': {
        position: 'relative',
      },
      '.catalog-image:hover': {
        width: 'initial', height: '12em', position: 'absolute', zIndex: 20,
      },
    });
  }
  if (settings.PopupEmoji) {
    addStyle({
      '.custom-emoji': {
        pointerEvents: 'auto',
      },
      '.custom-emoji:hover > .custom-emoji-image': {
        width: 'initial', height: '6em', position: 'relative', zIndex: 10,
      },
    });
  }
  if (settings.DropTime) {
    addStyle({
      '#MebukiPlus_DropTime': {
        color: 'var(--muted-foreground)',
        fontSize: 'var(--text-xs)',
        marginBottom: 'auto',
      },
    });
  }
  if (settings.SelectToQuote) {
    d.body.addEventListener('pointerup', (ev) => {
      if (!settings.SelectToQuote) { return; }
      if (!isInMessageContainer(ev.target)) { return; }
      const selectedText = flattenNodes(d.getSelection()?.getRangeAt(0)?.cloneContents()?.childNodes);
      if (!selectedText) { return; }
      const textarea = d.querySelector('textarea[name="content"]');
      if (!textarea) { return; }
      textarea.value += `${selectedText.split(/\n+/).map(line => `>${line}`).join('\n')}\n`;
    });
  }
  watchTarget(modify, d.body);

  async function getEmojis() {
    const resCustomEmoji = await fetch(urlCustomEmoji);
    const customEmojis = (await resCustomEmoji.json()).categories[0].emojis.reduce(
      (acc, cur) => {
        acc[cur.keywords[0]] = cur.name;
        return acc;
      },
      {}
    );
    const resEmoji = await fetch(urlEmoji);
    const jsonEmoji = /JSON\.parse\(`([^`]+?)`\)/.exec(await resEmoji.text())[1];
    const emojisFull = JSON.parse(jsonEmoji);
    const emojis = Object.keys(emojisFull).reduce(
      (acc, cur) => {
        const e = emojisFull[cur];
        acc[e.skins[0].unified] = e.name;
        return acc;
      },
      customEmojis
    );
    return emojis;
  }
  function setDiceHighlight(color) {
    cssDiceHighlight.textContent =
      `.MebukiPlus_DiceHighlight { background-color: ${color}; }`;
  }
  function isInMessageContainer(elm) {
    while (elm && !elm.classList.contains('message-container')) {
      elm = elm.parentElement;
    }
    return elm;
  }
  function flattenNodes(nodes, isSpoiled) {
    if (!nodes || nodes.length <= 0) { return ''; }
    return Array.from(nodes).map(node => {
      const name = node.nodeName.toLowerCase();
      return node.nodeType == Node.TEXT_NODE ? (
        isSpoiled
          ? node.nodeValue.replace(/./g, '_')
          : node.nodeValue) :
        node.nodeType == Node.ELEMENT_NODE ? (
          name == 'span' ? flattenNodes(node.childNodes, isSpoiled || node.classList.contains('transition-opacity')) :
            name == 'div' ? `${flattenNodes(node.childNodes, isSpoiled)}\n` :
              name == 'a' && node.classList.contains('pspw-item') ? '' :
                name == 'img' ? imgToTag(node, isSpoiled) :
                  name == 'br' ? '\n' :
                    name == 'button' ? '' :
                      flattenNodes(node.childNodes, isSpoiled)) :
          '';
    }).join('');
  }
  function imgToTag(node, isSpoiled) {
    if (isSpoiled) { return '_'; }
    if (node.src.indexOf('twemoji') >= 0) { return node.alt; }
    const id = node.src.replace(/^.*\/emojis\//, '').replace(/\.[^\.]+$/, '');
    return `<:${node.alt}:${id}>`;
  }
  function modify(target) {
    const header = d.body.querySelector('main > header > div')
      || d.body.querySelector('main > form > header > div');
    addPanel(header);
    const elmMessageContainer = d.body.querySelector('.message-container');
    if (elmMessageContainer) {
      // Thread
      showDropTime(header, target);
      addEmojiTitlePopup(target);
      pickupZorome(target);
      modifyDice(target);
    } else {
      // Catalog
      addThreadTitlePopup(target);
    }
  }
  function addPanel(header) {
    if (!header) { return; }
    const elmLast = header.querySelector(':scope > div:last-child');
    if (elmLast && elmLast.children.length == 0) {
      elmLast.style.display = 'none';
    }
    const elmTitle = header.querySelector('.line-clamp-2');
    if (elmTitle) {
      const parent = elmTitle.parentNode;
      parent.classList.add('popupTitle');
      parent.title = elmTitle.textContent;
    }
    if (header.querySelector('#MebukiPlus_Main')) { return; }
    header.appendChild(prepareElement({
      tag: 'div',
      id: 'MebukiPlus_Main',
      children: [{
        tag: 'details',
        children: [
          {
            tag: 'summary',
            id: 'MebukiPlus_Summary',
            innerHTML: '&#x1f331;+',
            title: 'Mebuki Plus',
          },
          {
            tag: 'div',
            id: 'MebukiPlus_Body',
            children: [
              {
                tag: 'fieldset',
                children: [
                  {
                    tag: 'legend',
                    textContent: 'ポップアップ',
                  },
                  {
                    tag: 'div',
                    children: [
                      {
                        tag: 'label',
                        children: [
                          {
                            tag: 'input',
                            type: 'checkbox',
                            name: 'PopupCatalog',
                            checked: settings.PopupCatalog,
                            events: {
                              change: (ev) => { settings.PopupCatalog = ev.currentTarget.checked; },
                            },
                          },
                          {
                            tag: 'span',
                            textContent: 'カタログ',
                          },
                        ],
                      },
                      {
                        tag: 'label',
                        children: [
                          {
                            tag: 'input',
                            type: 'checkbox',
                            name: 'PopupEmoji',
                            checked: settings.PopupEmoji,
                            events: {
                              change: (ev) => { settings.PopupEmoji = ev.currentTarget.checked; },
                            },
                          },
                          {
                            tag: 'span',
                            textContent: '絵文字',
                          },
                        ],
                      },
                    ],
                  }
                ],
              },
              {
                tag: 'fieldset',
                children: [
                  {
                    tag: 'legend',
                    textContent: 'スレッド',
                  },
                  {
                    tag: 'div',
                    children: [
                      {
                        tag: 'label',
                        children: [
                          {
                            tag: 'input',
                            type: 'checkbox',
                            name: 'DropTime',
                            checked: settings.DropTime,
                            events: {
                              change: (ev) => { settings.DropTime = ev.currentTarget.checked; },
                            },
                          },
                          {
                            tag: 'span',
                            textContent: '落ち',
                          },
                        ],
                      },
                      {
                        tag: 'label',
                        children: [
                          {
                            tag: 'input',
                            type: 'checkbox',
                            name: 'SelectToQuote',
                            checked: settings.SelectToQuote,
                            events: {
                              change: (ev) => { settings.SelectToQuote = ev.currentTarget.checked; },
                            },
                          },
                          {
                            tag: 'span',
                            textContent: '選択引用',
                          },
                        ],
                      },
                    ],
                  },
                ],
              },
              {
                tag: 'fieldset',
                children: [
                  {
                    tag: 'legend',
                    textContent: 'ゾロ目',
                  },
                  {
                    tag: 'div',
                    children: [
                      {
                        tag: 'label',
                        children: [
                          {
                            tag: 'input',
                            type: 'checkbox',
                            name: 'ZoromePicker',
                            checked: settings.ZoromePicker,
                            events: {
                              change: (ev) => { settings.ZoromePicker = ev.currentTarget.checked; },
                            },
                          },
                          {
                            tag: 'span',
                            textContent: 'ピックアップ',
                          },
                        ],
                      },
                    ],
                  },
                ],
              },
              {
                tag: 'fieldset',
                children: [
                  {
                    tag: 'legend',
                    textContent: 'ダイス',
                  },
                  {
                    tag: 'div',
                    children: [
                      {
                        tag: 'label',
                        children: [
                          {
                            tag: 'input',
                            type: 'checkbox',
                            name: 'DiceRGB',
                            checked: settings.Dice.RGB,
                            events: {
                              change: (ev) => { settings.Dice.RGB = ev.currentTarget.checked; },
                            },
                          },
                          {
                            tag: 'span',
                            textContent: 'RGB',
                          },
                        ],
                      },
                      {
                        tag: 'label',
                        children: [
                          {
                            tag: 'input',
                            type: 'checkbox',
                            name: 'DiceCandidate',
                            checked: settings.Dice.Candidate,
                            events: {
                              change: (ev) => { settings.Dice.Candidate = ev.currentTarget.checked; },
                            },
                          },
                          {
                            tag: 'span',
                            textContent: '候補',
                          },
                          {
                            tag: 'input',
                            type: 'color',
                            value: settings.DiceHighlight,
                            events: {
                              input: (ev) => {
                                setDiceHighlight(settings.DiceHighlight = ev.currentTarget.value);
                              },
                            },
                          },
                        ],
                      },
                      {
                        tag: 'label',
                        children: [
                          {
                            tag: 'input',
                            type: 'checkbox',
                            name: 'DiceOnigiri',
                            checked: settings.Dice.Onigiri,
                            events: {
                              change: (ev) => { settings.Dice.Onigiri = ev.currentTarget.checked; },
                            },
                          },
                          {
                            tag: 'span',
                            textContent: 'おにぎり',
                          },
                        ],
                      },
                    ],
                  },
                ],
              },
              {
                tag: 'fieldset',
                children: [
                  {
                    tag: 'legend',
                    textContent: 'ピックアップ',
                  },
                  {
                    tag: 'div',
                    children: [
                      {
                        tag: 'button',
                        type: 'button',
                        textContent: 'エクスポート',
                        events: { click: exportPickupWords, },
                      },
                      {
                        tag: 'button',
                        type: 'button',
                        textContent: 'ソート',
                        events: { click: sortPickupWords, },
                      },
                    ],
                  },
                ],
              },
            ],
          },
        ],
      }],
    }));
  }
  function addThreadTitlePopup(target) {
    if (!settings.PopupCatalog) { return; }
    Array.from(target.querySelectorAll('.catalog-item'))
      .filter(elm => !elm.dataset.checkThreadThumbnail)
      .forEach(elm => {
        elm.dataset.checkThreadThumbnail = 1;
        elm.title = elm.querySelector('.text-sm').textContent;
      });
  }
  function showDropTime(header, target) {
    if (!settings.DropTime) { return; }
    const elmDropTimeSrc = d.querySelector('main > main > div:last-child > span');
    if (!elmDropTimeSrc) { return; }
    let elmDropTimeDst = header.querySelector('#MebukiPlus_DropTime');
    if (!elmDropTimeDst) {
      elmDropTimeDst = prepareElement({
        tag: 'div',
        id: 'MebukiPlus_DropTime',
        children: [
          {
            tag: 'span',
            id: 'MebukiPlus_DropTime_Time',
            title: 'スレ落ち時刻',
            classes: ['popupTitle'],
            textContent: '--/-- --:--',
          },
          {
            tag: 'br',
          },
          {
            tag: 'span',
            id: 'MebukiPlus_DropTime_Res',
            title: 'レス数',
            classes: ['popupTitle'],
            textContent: '0',
          },
        ],
      });
      header.insertBefore(elmDropTimeDst, header.querySelector('div[class*="md:justify-start"]').nextElementSibling);
    }
    const elmDropTimeTime = elmDropTimeDst.querySelector('#MebukiPlus_DropTime_Time');
    const m = /\((?<mon>\d+)月(?<day>\d+)日\s(?<hour>\d+):(?<min>\d+)\)/u.exec(elmDropTimeSrc.textContent);
    if (m) {
      const now = new Date();
      const timeDrop = new Date(`${now.getFullYear() + (now.getMonth() > parseInt(m.groups.mon) ? 1 : 0)}-${m.groups.mon}-${m.groups.day} ${m.groups.hour}:${m.groups.min}`);
      const strDrop = timeDrop.toLocaleString('ja-jp', { month: '2-digit', day: '2-digit', hour: '2-digit', minute: '2-digit', }).replace(/\s/, '<br>');
      if (elmDropTimeTime.innerHTML != strDrop) {
        elmDropTimeTime.innerHTML = strDrop;
      }
      if (!elmDropTimeTime.classList.contains('MebukiPlus_Highlight') && timeDrop - now < 30 * 60 * 1000) {
        elmDropTimeTime.classList.add('MebukiPlus_Highlight');
      }
    }
    const elmDropTimeRes = elmDropTimeDst.querySelector('#MebukiPlus_DropTime_Res');
    const elmLastRes = Array.from(target.querySelectorAll('.message-container')).pop();
    if (elmLastRes) {
      const elmLastResNo = elmLastRes.querySelector('.text-destructive');
      if (elmLastResNo) {
        const lastRes = parseInt(elmLastResNo.textContent);
        if (elmDropTimeRes.textContent != lastRes) {
          elmDropTimeRes.textContent = lastRes;
          if (lastRes >= 950) {
            elmDropTimeRes.classList.add('MebukiPlus_Highlight');
          }
        }
      }
    }
  }
  function addEmojiTitlePopup(target) {
    if (!settings.PopupEmoji) { return; }
    Array.from(target.querySelectorAll('.custom-emoji-image'))
      .filter(elm => !elm.dataset.checkEmoji)
      .forEach(elm => {
        elm.dataset.checkEmoji = 1;
        const key = elm.src.replace(/^[\s\S]+\/([^\/\.]+)\.\w+$/, '$1');
        elm.title = emojis[key] || key;
      });
  }
  function pickupZorome(target) {
    if (!settings.ZoromePicker) { return; }
    Array.from(target.querySelectorAll('.text-sm > .text-xs'))
      .filter(elm => !elm.dataset.checkZorome)
      .forEach(elm => {
        elm.dataset.checkZorome = 1;
        const after1 = elm.innerHTML.replace(
          regSpCmd,
          (match, p1, p2) => `${p1}<span class="MebukiPlus_Highlight">${p2}${SpCmd[p2]}</span>`
        );
        if (elm.innerHTML != after1) {
          elm.innerHTML = after1;
          return;
        }
        const after2 = elm.innerHTML.replace(
          /([0-9\:\.]*?)((\d)(\3|\:|\.)+)$/,
          '$1<span class="MebukiPlus_Highlight">$2</span>'
        );
        if (elm.innerHTML != after2) {
          elm.innerHTML = after2;
          return;
        }
      });
  }
  function modifyDice(target) {
    const keysDice = Object.keys(settings.Dice);
    if (keysDice.every(key => !settings.Dice[key])) { return; }
    Array.from(target.querySelectorAll('.message-content'))
      .filter(elm => !elm.dataset.checkDice)
      .forEach(elm => {
        elm.dataset.checkDice = 1;
        let m;
        keysDice.filter(key => settings.Dice[key])
          .forEach(key => {
            const after = elm.innerHTML.replace(Dice[key].Reg, Dice[key].Callback);
            if (elm.innerHTML != after) {
              elm.innerHTML = after;
            }
          });
      });
  }
  function getInputsPickupWord() {
    return Array.from(d.querySelectorAll('input[name^="catalogPickupWords["]'));
  }
  function exportPickupWords(ev) {
    const inputs = getInputsPickupWord();
    if (!inputs || inputs.length <= 0) { return; }
    const words = inputs.map(i => i.value);
    words.unshift('## カタログピックアップワード');
    alert(words.join('\n'));
  }
  function sortPickupWords(ev) {
    const inputs = getInputsPickupWord();
    if (!inputs || inputs.length <= 0) { return; }
    const words = inputs.map(i => i.value).sort((a, b) => a.localeCompare(b));
    inputs.forEach((inp, i) => { inp.value = words[i]; });
  }
})(window, document);
