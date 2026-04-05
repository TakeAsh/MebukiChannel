// ==UserScript==
// @name         Mebuki Plus
// @namespace    https://TakeAsh.net/
// @version      2026-04-06_01:00
// @description  enhance Mebuki channel
// @author       TakeAsh
// @match        https://mebuki.moe/app
// @match        https://mebuki.moe/app/*
// @require      https://raw.githubusercontent.com/TakeAsh/js-Modules/main/modules/Util.js
// @require      https://raw.githubusercontent.com/TakeAsh/js-Modules/main/modules/PrepareElement.js
// @require      https://raw.githubusercontent.com/TakeAsh/js-Modules/main/modules/AutoSaveConfig.js
// @icon         https://www.google.com/s2/favicons?sz=64&domain=mebuki.moe
// @resource     EmojiData https://cdn.jsdelivr.net/npm/emoji-datasource-twitter@latest/emoji.json
// @grant        GM.getResourceText
// ==/UserScript==

(async (w, d) => {
  'use strict';
  const urlCustomEmoji = 'https://mebuki.moe/api/custom-emoji';
  const urlFavion = `${location.origin}/favicon.ico`;
  const SpCmd = {
    '623': '\u{1f409}', '421': '\u{1f409}',
    '236': '\u{1f4a8}', '214': '\u{1f4a8}',
    '426': '\u{1f525}', '624': '\u{1f525}',
    '4.268': '\u{1f30c}', '6.248': '\u{1f30c}',
  };
  const keysSpCmd = Object.keys(SpCmd).map(cmd => quotemeta(cmd)).join('|');
  const regSpCmd = new RegExp(`([0-9\\:\\.]*?)(${keysSpCmd})$`);
  const omikujiAnswers = [
    [1, '超大凶<:vader_inv:jnxwnacqdbzvyokp9joultsb>'],
    [16, '大凶<:kawaisou:uen73fr5ehrwx2sp7e1ru8zr>'],
    [32, '凶<:pikachu:bjbtveeq88t6gtks4nin9i0e>'],
    [48, '末吉<:jcb_404_crying:nypqni0elb53pd76033p10ug>'],
    [64, '吉<:udegumi:oppz6ox70gdcwmxxxis8hoob>'],
    [82, '小吉<:Kamille_Re:ipiusm9aln9690m73vazwgfl>'],
    [98, '中吉<:yattaaa:qdpq7z3d6h5pniiuypm93rjd>'],
    [100, '超大吉(めぶ吉)<:sugoiwa:v4m03n19e0qecwze0ar82uup>'],
  ];
  const keyFavoriteEmojis = 'emoji-mart.favorites';
  const urlEmojiBase = {
    custom: 'https://storage.mebuki.moe/emojis',
    twitter: 'https://cdn.jsdelivr.net/npm/emoji-datasource-twitter@latest/img/twitter/64',
  };
  const settings = new AutoSaveConfig({
    PopupCatalog: true,
    PopupEmoji: true,
    DropTime: true,
    ResNumAnchor: true,
    ResNumAnchorOpen: true,
    FooterTags: true,
    SelectToQuote: true,
    ZoromePicker: true,
    DiceHighlight: '#a0ffa0',
    Dice: {
      RGB: true,
      Candidate: true,
      Onigiri: true,
      Ginga: true,
      MebukiShrine: true,
    },
    TagfyPickup: {
      Words: true,
      Tags: true,
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
            let after = p1.replace(
              /(?<=<br>|\s|\b)((ゾロ|ぞろ)[目メめ][^0-9<]+)/u,
              (match, q1) => {
                return isZorome(answer)
                  ? `<span class="MebukiPlus_DiceHighlight">${q1}</span>`
                  : q1;
              });
            if (p1 != after) {
              p1 = after;
              return;
            }
            after = p1.replace(
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
    Ginga: {
      Reg: /(ギンガ)([\s\S]+?dice4d4=[\s\S]*?>(?<answer1>[^<]+)<[^>]+>)([\s\S]+?dice3d4=[\s\S]*?>(?<answer2>[^<]+)<[^>]+>)([\s\S]+?dice5d4=[\s\S]*?>(?<answer3>[^<]+)<[^>]+>)/giu,
      Callback: (match, p1, p2, p3, p4, p5, p6, p7) => {
        const getAnswer = (ans) => ans.replace(/\s\(\d+\)$/, '')
          .split(/\s/)
          .map(a => parseInt(a));
        const ans1 = getAnswer(p3);
        const ans2 = getAnswer(p5);
        const ans3 = getAnswer(p7);
        const gingaMap = ['-', '', '', '', ''];
        const available = ['マ', 'ン', 'ギ', 'ガ'];
        let idx = -1;
        const getChar = (c) => (idx = available.indexOf(c)) >= 0
          ? available.splice(idx, 1)
          : available.shift();
        gingaMap[ans3[3]] = getChar('マ');
        gingaMap[ans3[4]] ||= getChar('ン');
        gingaMap[ans3[0]] ||= getChar('ギ');
        gingaMap[ans3[1]] ||= getChar('ン');
        gingaMap[ans3[2]] ||= getChar('ガ');
        gingaMap[ans1[0]] ||= getChar('ガ');
        gingaMap[ans1[1]] ||= getChar('ン');
        gingaMap[ans1[2]] ||= getChar('ガ');
        gingaMap[ans1[3]] ||= getChar('ン');
        gingaMap[ans2[0]] ||= getChar('ギ');
        gingaMap[ans2[1]] ||= getChar('ギ');
        gingaMap[ans2[2]] ||= getChar('ン');
        const decode = (p, a) => `${p.replace(/\(\d+\)/, '')}${a.map(x => gingaMap[x]).join('')}`;
        return [p1, decode(p2, ans1), decode(p4, ans2), decode(p6, ans3),].join('');
      },
    },
    MebukiShrine: {
      Reg: /めぶき神社[\s\S]+?dice(?:\d+)d100=[\s\S]*?>(?<answer>[^<]+)<[^>]+>/giu,
      Callback: (match, p1) => `${match} ` + p1.replace(/\s+\(\d+\)$/, '').trim().split(/\s+/)
        .map(ans => emojitagToImg(omikuji(ans)))
        .join(' '),
    },
  };
  const emojis = await getEmojis();
  await sleep(2000);
  const messageIds = [];
  const anchors = {};
  let prevTags = [];
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
      maxHeight: '95vh',
      overflowY: 'scroll',
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
    '.MebukiPlus_MenuSubItem': {
      margin: '0em 0em 0em 1em',
    },
    '.MebukiPlus_Highlight': {
      color: '#ff0000', fontSize: '125%',
    },
    '.MebukiPlus_Button': {
      color: 'var(--secondary-foreground)',
      backgroundColor: 'var(--secondary)',
      border: '2px solid',
      borderStyle: 'outset',
      borderColor: 'var(--border)',
      borderRadius: 'calc(var(--radius) - 2px)',
      margin: '0em 0.3em',
      paddingInline: 'calc(var(--spacing) * 2.5)',
    },
    '.MebukiPlus_Button:hover': {
      backgroundColor: 'color-mix(in oklab, var(--secondary) 50%, transparent)',
    },
    '#MebukiPlus_FavoriteEmojisList': {
      backgroundColor: 'color-mix(in oklab,var(--background) 70%,transparent)',
    },
    '.MebukiPlus_EmojiButton': {
      color: 'var(--secondary-foreground)',
      backgroundColor: 'var(--secondary)',
      border: '2px solid',
      borderStyle: 'outset',
      borderColor: 'var(--border)',
      borderRadius: 'calc(var(--radius) - 2px)',
      margin: '0.2em',
      width: '3em',
      height: '3em',
      verticalAlign: 'middle',
      wordWrap: 'break-word',
      lineHeight: 'normal',
      overflow: 'hidden',
    },
    '#MebukiPlus_textFavoriteEmojis': {
      width: '100%',
      height: '8em',
      backgroundColor: 'color-mix(in oklab,var(--popover) 50%,transparent)',
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
        width: '12em', height: '12em', position: 'absolute', zIndex: 20,
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
  if (settings.ResNumAnchor) {
    addStyle({
      '.MebukiPlus_ResNumAnchor': {
        display: 'inline-block',
      },
      '.MebukiPlus_ResNumAnchor > summary': {
        fontWeight: 'bold',
      },
      '.MebukiPlus_ResNumAnchor > div': {
        color: 'var(--foreground)',
        backgroundColor: 'color-mix(in oklab,var(--background)80%,transparent)',
      },
      '.MebukiPlus_panelReturnAnchors': {
        backgroundColor: 'color-mix(in oklab,var(--background)80%,transparent)',
        fontSize: 'calc(var(--message-content-font-size)*.75)',
        margin: '0em 0.3em',
      },
      '.MebukiPlus_ancReturn': {
        margin: '0em 0.2em',
      },
      '.MebukiPlus_ancReturn:hover': {
        color: '#ff0000',
      },
      '.message-container': {
        scrollMarginTop: '15vh',
      },
    });
  }
  if (settings.SelectToQuote) {
    d.body.addEventListener('pointerup', (ev) => {
      if (!settings.SelectToQuote
        || !isInMessageContainer(ev.target)
        || d.getSelection()?.rangeCount <= 0
      ) { return; }
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
        acc[cur.keywords[0]] = acc[cur.name] = {
          name: cur.name,
          type: 'custom',
          image: `${cur.keywords[0]}.webp`,
        };
        return acc;
      },
      {}
    );
    const emojis = (typeof GM == 'undefined') || (typeof GM.getResourceText != 'function')
      ? customEmojis
      : JSON.parse(await GM.getResourceText('EmojiData')).reduce(
        (acc, cur) => {
          acc[(cur.non_qualified || cur.unified).toLowerCase()] = acc[cur.short_name] = {
            name: cur.short_name || cur.name,
            type: 'twitter',
            image: cur.image,
          };
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
    const footer = d.body.querySelector('main > main > div:last-child');
    addPanel(header);
    const elmMessageContainer = d.body.querySelector('.message-container');
    if (elmMessageContainer) {
      // Thread
      showDropTime(header, footer, target);
      addFooterTags(footer);
      addEmojiTitlePopup(target);
      processAnchor(target);
      pickupZorome(target);
      modifyDice(target);
    } else {
      prevTags = [];
      if (location.pathname == '/app') {
        // Catalog
        addThreadTitlePopup(target);
      } else if (location.pathname == '/app/settings') {
        // Settings
        modifyCatalogSettings(target);
        modifyExperimentalSettings(target);
      } else {
        console.log(location.pathname);
      }
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
                            name: 'ResNumAnchor',
                            checked: settings.ResNumAnchor,
                            events: {
                              change: (ev) => { settings.ResNumAnchor = ev.currentTarget.checked; },
                            },
                          },
                          {
                            tag: 'span',
                            textContent: 'アンカー',
                          },
                        ],
                      },
                      {
                        tag: 'label',
                        classes: ['MebukiPlus_MenuSubItem',],
                        children: [
                          {
                            tag: 'input',
                            type: 'checkbox',
                            name: 'ResNumAnchorOpen',
                            checked: settings.ResNumAnchorOpen,
                            events: {
                              change: (ev) => { settings.ResNumAnchorOpen = ev.currentTarget.checked; },
                            },
                          },
                          {
                            tag: 'span',
                            textContent: 'オープン',
                          },
                        ],
                      },
                      {
                        tag: 'label',
                        children: [
                          {
                            tag: 'input',
                            type: 'checkbox',
                            name: 'FooterTags',
                            checked: settings.FooterTags,
                            events: {
                              change: (ev) => { settings.FooterTags = ev.currentTarget.checked; },
                            },
                          },
                          {
                            tag: 'span',
                            textContent: 'フッタータグ',
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
                      {
                        tag: 'label',
                        children: [
                          {
                            tag: 'input',
                            type: 'checkbox',
                            name: 'DiceGinga',
                            checked: settings.Dice.Ginga,
                            events: {
                              change: (ev) => { settings.Dice.Ginga = ev.currentTarget.checked; },
                            },
                          },
                          {
                            tag: 'span',
                            textContent: 'ギンガ',
                          },
                        ],
                      },
                      {
                        tag: 'label',
                        children: [
                          {
                            tag: 'input',
                            type: 'checkbox',
                            name: 'DiceMebukiShrine',
                            checked: settings.Dice.MebukiShrine,
                            events: {
                              change: (ev) => { settings.Dice.MebukiShrine = ev.currentTarget.checked; },
                            },
                          },
                          {
                            tag: 'span',
                            textContent: 'めぶき神社',
                          },
                        ],
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
  function modifyCatalogSettings(target) {
    const legendPickupWords = getNodesByXpath('.//label[text()="ピックアップワード"]', target)[0];
    if (legendPickupWords && !legendPickupWords.dataset.buttonsAdded) {
      legendPickupWords.dataset.buttonsAdded = 1;
      legendPickupWords.parentNode.insertBefore(prepareElement({
        tag: 'div',
        children: [
          {
            tag: 'button',
            classes: ['MebukiPlus_Button'],
            type: 'button',
            value: 'Words',
            textContent: 'エクスポート',
            events: { click: exportPickup, },
          },
          {
            tag: 'label',
            children: [
              {
                tag: 'input',
                type: 'checkbox',
                name: 'TagfyPickupWords',
                checked: settings.TagfyPickup.Words,
                events: {
                  change: (ev) => { settings.TagfyPickup.Words = ev.currentTarget.checked; },
                },
              },
              {
                tag: 'span',
                textContent: 'タグ化',
              },
            ],
          },
          {
            tag: 'button',
            classes: ['MebukiPlus_Button'],
            type: 'button',
            value: 'Words',
            textContent: 'ソート',
            events: { click: sortPickup, },
          },
        ],
      }), legendPickupWords.nextElementSibling.nextElementSibling);
    }
    const legendPickupTags = getNodesByXpath('.//label[text()="ピックアップタグ"]', target)[0];
    if (legendPickupTags && !legendPickupTags.dataset.buttonsAdded) {
      legendPickupTags.dataset.buttonsAdded = 1;
      legendPickupTags.parentNode.insertBefore(prepareElement({
        tag: 'div',
        children: [
          {
            tag: 'button',
            classes: ['MebukiPlus_Button'],
            type: 'button',
            value: 'Tags',
            textContent: 'エクスポート',
            events: { click: exportPickup, },
          },
          {
            tag: 'label',
            children: [
              {
                tag: 'input',
                type: 'checkbox',
                name: 'TagfyPickupTags',
                checked: settings.TagfyPickup.Tags,
                events: {
                  change: (ev) => { settings.TagfyPickup.Tags = ev.currentTarget.checked; },
                },
              },
              {
                tag: 'span',
                textContent: 'タグ化',
              },
            ],
          },
          {
            tag: 'button',
            classes: ['MebukiPlus_Button'],
            type: 'button',
            value: 'Tags',
            textContent: 'ソート',
            events: { click: sortPickup, },
          },
        ],
      }), legendPickupTags.nextElementSibling.nextElementSibling);
    }
  }
  function modifyExperimentalSettings(target) {
    const divExperimental = getNodesByXpath('.//div[text()="実験的機能"]', target)[0]?.parentNode?.nextElementSibling;
    if (!divExperimental || divExperimental.dataset.buttonsAdded) { return; }
    divExperimental.dataset.buttonsAdded = 1;
    divExperimental.appendChild(prepareElement({
      tag: 'fieldset',
      classes: ['grid', 'grid-cols-1', 'gap-1.5',],
      children: [
        {
          tag: 'legend',
          classes: ['inline-flex', 'items-center', 'gap-0.5', 'font-bold', 'text-foreground',],
          textContent: 'お気に入り絵文字',
        },
        {
          tag: 'div',
          id: 'MebukiPlus_FavoriteEmojisList',
        },
        {
          tag: 'span',
          children: [
            {
              tag: 'button',
              classes: ['MebukiPlus_Button'],
              type: 'button',
              textContent: 'エクスポート',
              events: {
                click: () => {
                  textFavoriteEmojis.value = localStorage.getItem(keyFavoriteEmojis);
                },
              },
            },
            {
              tag: 'button',
              classes: ['MebukiPlus_Button'],
              type: 'button',
              textContent: 'インポート',
              events: {
                click: () => {
                  try {
                    const textFavorites = textFavoriteEmojis.value;
                    const favoritesNew = JSON.parse(textFavorites);
                    if (!Array.isArray(favoritesNew)) { return; }
                    localStorage.setItem(keyFavoriteEmojis, JSON.stringify(favoritesNew));
                    makeEmojiButtons();
                  } catch (err) {
                    console.log(err);
                  }
                },
              },
            },
            {
              tag: 'button',
              classes: ['MebukiPlus_Button'],
              type: 'button',
              textContent: 'マージ',
              events: {
                click: () => {
                  try {
                    const textFavorites = textFavoriteEmojis.value;
                    const favoritesNew = JSON.parse(textFavorites);
                    if (!Array.isArray(favoritesNew)) { return; }
                    const favoritesOld = JSON.parse(localStorage.getItem(keyFavoriteEmojis));
                    const favorites = new Set([...favoritesNew, ...favoritesOld]);
                    localStorage.setItem(keyFavoriteEmojis, JSON.stringify(Array.from(favorites)));
                    makeEmojiButtons();
                  } catch (err) {
                    console.log(err);
                  }
                },
              },
            },
            {
              tag: 'button',
              classes: ['MebukiPlus_Button'],
              type: 'button',
              textContent: 'クリア',
              events: {
                click: () => { textFavoriteEmojis.value = ''; },
              },
            },
          ],
        },
        {
          tag: 'textarea',
          id: 'MebukiPlus_textFavoriteEmojis',
          title: 'エクスポート/インポート',
          placeholder: 'エクスポート/インポート',
        },
      ],
    }));
    const divFavoriteEmojisList = divExperimental.querySelector('#MebukiPlus_FavoriteEmojisList');
    const textFavoriteEmojis = divExperimental.querySelector('#MebukiPlus_textFavoriteEmojis');
    makeEmojiButtons();
    function makeEmojiButtons() {
      divFavoriteEmojisList.replaceChildren();
      JSON.parse(localStorage.getItem(keyFavoriteEmojis)).forEach(name => {
        const emoji = emojis[name];
        const surface = !emoji
          ? { tag: 'span', textContent: name, }
          : {
            tag: 'img',
            src: `${urlEmojiBase[emoji.type]}/${emoji.image}`,
          };
        const button = prepareElement({
          tag: 'button',
          type: 'button',
          classes: ['MebukiPlus_EmojiButton',],
          title: name,
          value: name,
          children: [surface],
          events: { click: moveEmojiTop },
        });
        divFavoriteEmojisList.appendChild(button);
      });
    }
    function moveEmojiTop(event) {
      const button = event.currentTarget;
      const name = button.value;
      const div = button.parentElement;
      div.insertBefore(button, div.firstElementChild);
      textFavoriteEmojis.value = '';
      const favorites = JSON.parse(localStorage.getItem(keyFavoriteEmojis));
      const index = favorites.indexOf(name);
      if (index >= 0) {
        favorites.splice(index, 1);
      }
      favorites.unshift(name);
      localStorage.setItem(keyFavoriteEmojis, JSON.stringify(favorites));
    }
  }
  function showDropTime(header, footer, target) {
    if (!settings.DropTime) { return; }
    const elmDropTimeSrc = footer.querySelector(':scope > span');
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
      if (timeDrop - now < 30 * 60 * 1000) {
        elmDropTimeTime.classList.add('MebukiPlus_Highlight');
      } else {
        elmDropTimeTime.classList.remove('MebukiPlus_Highlight');
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
  function addFooterTags(footer) {
    if (!settings.FooterTags) { return; }
    const headerTags = Array.from(d.body.querySelectorAll('main > main > div > div > div > a'));
    if (prevTags.length == headerTags.length
      && prevTags.every((a, i) => a.textContent == headerTags[i].textContent)
    ) { return; }
    prevTags = headerTags;
    let divFooterTags = d.body.querySelector('#MebukiPlus_FooterTags');
    if (!divFooterTags) {
      divFooterTags = prepareElement({
        tag: 'div',
        id: 'MebukiPlus_FooterTags',
        classes: ['flex', 'flex-wrap', 'gap-x-2',],
      });
      footer.appendChild(divFooterTags);
    }
    divFooterTags.replaceChildren();
    headerTags.forEach(a => {
      divFooterTags.appendChild(prepareElement({
        tag: 'a',
        classes: [
          'inline-flex', 'h-7', 'items-center', 'rounded-md', 'border', 'bg-card',
          'px-2', 'text-foreground', 'text-sm', 'px-2', 'hover:underline',
        ],
        href: a.href,
        textContent: a.textContent,
      }));
    });
  }
  function addEmojiTitlePopup(target) {
    if (!settings.PopupEmoji) { return; }
    Array.from(target.querySelectorAll('.custom-emoji-image'))
      .filter(elm => !elm.dataset.checkEmoji)
      .forEach(elm => {
        elm.dataset.checkEmoji = 1;
        const key = elm.src.replace(/^[\s\S]+\/([^\/\.]+)\.\w+$/, '$1');
        elm.title = emojis[key]?.name || key;
      });
  }
  function processAnchor(target) {
    if (!settings.ResNumAnchor) { return; }
    const idToContent = (id) => d.getElementById(id).querySelector('.message-content');
    Array.from(target.querySelectorAll('.message-container'))
      .filter(elm => !elm.dataset.checkAnchor)
      .forEach(elm => {
        elm.dataset.checkAnchor = 1;
        const elmResNum = elm.querySelector('.text-destructive');
        let resNum = 0;
        if (!elmResNum) {
          // スレ→スレ遷移の際にキャッシュをクリア
          messageIds.length = 0;
          for (const resNum of Object.getOwnPropertyNames(anchors)) {
            delete anchors[resNum];
          }
        } else {
          resNum = parseInt(elmResNum.textContent);
        }
        messageIds[resNum] = elm.id;
        let anchor;
        if (anchor = anchors[resNum]) {
          delete anchors[resNum];
          Object.keys(anchor).sort().forEach(resNum => {
            const id = anchor[resNum];
            linkAnchor(idToContent(id), resNum, id);
          });
        }
        linkAnchor(elm.querySelector('.message-content'), resNum, elm.id);
      });
  }
  function linkAnchor(content, resNum, id) {
    const after = content.innerHTML
      .replace(/(?<!&gt;)&gt;&gt;(\d+)/g,
        (match, p1) => {
          const resNumTo = parseInt(p1);
          if (resNumTo == resNum) {
            return match;
          }
          const messageId = messageIds[resNumTo] || '';
          if (!messageId) {
            if (!anchors[p1]) { anchors[p1] = {}; }
            anchors[p1][resNum] = id;
            return match;
          }
          const container = d.getElementById(messageId);
          let panelReturnAnchors = container.querySelector('.MebukiPlus_panelReturnAnchors');
          if (!panelReturnAnchors) {
            panelReturnAnchors = prepareElement({
              tag: 'span',
              classes: ['MebukiPlus_panelReturnAnchors'],
            });
            container.appendChild(panelReturnAnchors);
          }
          let anchored = (panelReturnAnchors.dataset.anchored || '').split(' ');
          if (!anchored.includes(id)) {
            anchored.push(id);
            panelReturnAnchors.dataset.anchored = anchored.join(' ');
            panelReturnAnchors.appendChild(prepareElement({
              tag: 'a',
              classes: ['MebukiPlus_ancReturn'],
              href: `#${id}`,
              textContent: `>>${resNum}`,
            }));
          }
          const content = container.querySelector('.message-content')
            .cloneNode(true);
          Array.from(content.querySelectorAll('.my-1'))
            .forEach(node => { node.parentNode.removeChild(node); });
          Array.from(content.querySelectorAll('div > button'))
            .forEach(node => { node.parentNode.parentNode.removeChild(node.parentNode); });
          return [
            `<details class="MebukiPlus_ResNumAnchor" ${settings.ResNumAnchorOpen ? 'open' : ''}>`,
            `<summary>${p1} <a href="#${messageId}" title="&gt;&gt;'${p1}'">&#x1f517;</a></summary>`,
            `<div>${content.innerHTML}</div>`,
            `</details>`
          ].join('');
        });
    if (content.innerHTML != after) {
      content.innerHTML = after;
    }
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
  function isZorome(num) {
    return String(num).match(/^(\d)\1+$/);
  }
  function emojitagToImg(text) {
    return text.replace(
      /<:([^:>]+):([^:>]+)>/giu,
      [
        '<span class="custom-emoji">',
        '<img alt="$1" class="custom-emoji-image" draggable="false" ',
        'src="https://storage.mebuki.moe/emojis/$2.webp" title="$1">',
        '</span>',
      ].join('')
    );
  }
  function omikuji(answer) {
    if (isZorome(answer)) {
      return '大吉<:hatanokokoro:n1k1hxy9agpsskkmrx0ibl95>';
    }
    answer = parseInt(answer);
    for (const ans of omikujiAnswers) {
      if (answer <= ans[0]) {
        return ans[1];
      }
    }
    return '';
  }
  function getInputsPickup(kind) {
    return Array.from(d.querySelectorAll(`input[name^="catalogPickup${kind}["]`));
  }
  function exportPickup(ev) {
    const kind = ev.target.value;
    const kindJ = {
      Words: 'ワード',
      Tags: 'タグ',
    }[kind];
    const inputs = getInputsPickup(kind);
    if (!inputs || inputs.length <= 0) { return; }
    const values = settings.TagfyPickup[kind]
      ? inputs.map(i => `#${i.value}`)
      : inputs.map(i => i.value);
    const table = [];
    let row = [];
    while ((row = values.splice(0, 3)) && row.length > 0) {
      table.push(row.join('\t'));
    }
    table.unshift(`## カタログピックアップ${kindJ}`);
    alert(table.join('\n'));
  }
  function sortPickup(ev) {
    const kind = ev.target.value;
    const inputs = getInputsPickup(kind);
    if (!inputs || inputs.length <= 0) { return; }
    const values = inputs.map(i => i.value).sort((a, b) => a.localeCompare(b));
    inputs.forEach((inp, i) => { inp.value = values[i]; });
  }
})(window, document);
