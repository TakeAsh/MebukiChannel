// ==UserScript==
// @name         Mebuki On The Mebukichi
// @namespace    https://TakeAsh.net/
// @version      2026-04-11_19:00
// @description  call Mebukichi on Mebuki
// @author       TakeAsh
// @match        https://mebuki.moe/app
// @match        https://mebuki.moe/app/*
// @require      https://raw.githubusercontent.com/TakeAsh/js-Modules/main/modules/Util.js
// @require      https://raw.githubusercontent.com/TakeAsh/js-Modules/main/modules/PrepareElement.js
// @require      https://raw.githubusercontent.com/TakeAsh/js-Modules/main/modules/CyclicEnum.js
// @require      https://raw.githubusercontent.com/TakeAsh/js-Modules/main/modules/AutoSaveConfig.js
// @icon         https://www.google.com/s2/favicons?sz=64&domain=mebuki.moe
// @grant        none
// ==/UserScript==

(async (w, d) => {
  'use strict';
  const urlSpritesBase = 'https://www.takeash.net/MebukiChannel/Mebukichi/img';
  const Sprites = new CyclicEnum(
    'Mebukichi3', 'Mebukichi2', 'Mebukichi1', 'Mebukichi0',
    'Ballom1', 'Ballom2', 'KoitoFukumaru0',
  );
  class PageFilter {
    Pages = {
      All: {
        Label: 'すべて',
        Value: false,
      },
      Catalog: {
        Label: 'カタログ',
        Value: true,
        Match: () => location.pathname == '/app',
      },
      Settings: {
        Label: '設定',
        Value: false,
        Match: () => location.pathname == '/app/settings',
      },
      Blog: {
        Label: 'お知らせ',
        Value: false,
        Match: () => location.pathname.startsWith('/app/blog'),
      },
    };
    Tags = {};
    constructor(src) {
      this.assign(src);
    }
    toJSON() {
      return {
        Pages: Object.keys(this.Pages).reduce((acc, cur) => {
          acc[cur] = this.Pages[cur].Value;
          return acc;
        }, {}),
        Tags: this.Tags,
      };
    }
    assign(src) {
      if (!src || !src.Pages || !src.Tags) { return; }
      Object.keys(src.Pages)
        .filter(key => this.Pages.hasOwnProperty(key))
        .forEach(key => { this.Pages[key].Value = src.Pages[key]; });
      Object.assign(this.Tags, src.Tags);
    }
    valueOf() { return this.toJSON(); }
    get match() {
      if (this.Pages.All.Value) { return 'All'; }
      const keyPages = Object.keys(this.Pages).filter(key => key != 'All');
      for (const key of keyPages) {
        const page = this.Pages[key];
        if (page.Value && page.Match()) {
          return key;
        }
      }
      const headerTags = Array.from(d.body.querySelectorAll('main > main > div > div > div > a'))
        .map(a => a.textContent);
      for (const tag of Object.keys(this.Tags)) {
        if (this.Tags[tag] && headerTags.includes(tag)) {
          return tag;
        }
      }
      return '';
    }
    addPageOptions(div) {
      div.replaceChildren();
      Object.keys(this.Pages)
        .map(key => prepareElement({
          tag: 'label',
          children: [
            {
              tag: 'input',
              type: 'checkbox',
              checked: this.Pages[key].Value,
              events: {
                change: (ev) => { this.Pages[key].Value = ev.currentTarget.checked; },
              },
            },
            {
              tag: 'span',
              textContent: this.Pages[key].Label,
            },
          ],
        })).forEach(item => { div.appendChild(item); });
    }
    addTagOptions(div) {
      div.replaceChildren();
      Object.keys(this.Tags)
        .map(key => prepareElement({
          tag: 'label',
          children: [
            {
              tag: 'input',
              type: 'checkbox',
              checked: this.Tags[key],
              events: {
                change: (ev) => { this.Tags[key] = ev.currentTarget.checked; },
              },
            },
            {
              tag: 'span',
              textContent: key,
            },
          ],
        })).forEach(item => { div.appendChild(item); });
    }
  }
  const settings = new AutoSaveConfig({
    Sprite: Sprites.Mebukichi3,
    PageFilter: new PageFilter({
      Pages: { All: false, Catalog: true, Settings: false, Blog: false, },
      Tags: { 'めぶきち': true, 'バロム': true, 'いもげ': true, 'コイトフクマル': true, },
    }),
  }, 'MebukichiSettings');
  class Mebukichi {
    static #directions = new CyclicEnum(
      'Front', 'Back', 'UpLeft', 'Up', 'UpRight',
      'Left', 'Right', 'DownLeft', 'Down', 'DownRight'
    );
    static #sizeSprite = 128;
    static #sprites = {};
    static #cycleMax = 4;
    static #roughness = 16;
    static #stride = 16;
    #elmMebukichi = prepareElement({
      tag: 'div',
      id: 'Mebukichi',
      children: [
        {
          tag: 'img',
          id: 'MebukichiImg'
        },
      ],
    });
    #img;
    #mebX = w.innerWidth / 2;
    #mebY = w.innerHeight / 2;
    #targetX = 0;
    #targetY = 0;
    #cycle = 0;

    static {
      Mebukichi.setSprite(settings.Sprite);
    }
    static setSprite(name) {
      const cvsSrc = d.createElement('canvas');
      const ctxSrc = cvsSrc.getContext('2d', { willReadFrequently: true, });
      const cvsDst = d.createElement('canvas');
      const ctxDst = cvsDst.getContext('2d');
      cvsDst.width = cvsDst.height = this.#sizeSprite;
      const img = new Image();
      img.crossOrigin = 'anonymous';
      img.addEventListener('load', () => {
        cvsSrc.width = img.width;
        cvsSrc.height = img.height;
        ctxSrc.drawImage(img, 0, 0);
        this.#directions.forEach((dir, i) => {
          this.#sprites[dir] = [];
          for (var cycle = 0; cycle < this.#cycleMax; ++cycle) {
            const sprite = ctxSrc.getImageData(cycle * this.#sizeSprite, i * this.#sizeSprite, this.#sizeSprite, this.#sizeSprite);
            ctxDst.putImageData(sprite, 0, 0);
            this.#sprites[dir][cycle] = cvsDst.toDataURL();
          }
        });
      });
      img.src = `${urlSpritesBase}/${name}.png`;
    }
    static #getDirection = (dx, dy) => {
      return dy < 0 && dx < 0 ? this.#directions.UpLeft :
        dy < 0 && dx > 0 ? this.#directions.UpRight :
          dy < 0 ? this.#directions.Up :
            dy > 0 && dx < 0 ? this.#directions.DownLeft :
              dy > 0 && dx > 0 ? this.#directions.DownRight :
                dy > 0 ? this.#directions.Down :
                  dx < 0 ? this.#directions.Left :
                    dx > 0 ? this.#directions.Right :
                      (new Date()).getMinutes() % 2 ? this.#directions.Back :
                        this.#directions.Front;
    };
    #getPointer = (ev) => {
      this.#targetX = ev.clientX;
      this.#targetY = ev.clientY;
    };
    #move = () => {
      if (!settings.PageFilter.match) {
        if (!this.#elmMebukichi.classList.contains('Mebukichi_hide')) {
          this.#elmMebukichi.classList.add('Mebukichi_hide');
        }
        return;
      }
      if (this.#elmMebukichi.classList.contains('Mebukichi_hide')) {
        this.#elmMebukichi.classList.remove('Mebukichi_hide');
      }
      const dx = Math.floor(((this.#targetX + 64) - this.#mebX) / Mebukichi.#roughness);
      const dy = Math.floor((this.#targetY - this.#mebY) / Mebukichi.#roughness);
      const length = Math.sqrt(dx * dx + dy * dy);
      if (length > 0) {
        this.#mebX += Mebukichi.#stride * dx / length;
        this.#mebY += Mebukichi.#stride * dy / length;
        this.#elmMebukichi.animate(
          { left: `${this.#mebX}px`, top: `${this.#mebY}px`, },
          { duration: 1000, fill: 'forwards' }
        );
      }
      const sprite = Mebukichi.#sprites[Mebukichi.#getDirection(dx, dy)];
      if (!sprite) { return; }
      this.#cycle = (this.#cycle + 1) % Mebukichi.#cycleMax;
      this.#img.src = sprite[this.#cycle];
    };

    constructor() {
      addStyle({
        '#Mebukichi': {
          height: '5em',
          aspectRatio: 1,
          top: '50%', left: '50%',
          transform: 'translate(-50%, -50%)',
          position: 'fixed',
        },
        '#MebukichiImg': {
          width: '100%', height: '100%',
        },
      });
      this.#img = this.#elmMebukichi.querySelector('#MebukichiImg');
      d.body.appendChild(this.#elmMebukichi);
      d.body.addEventListener('pointermove', this.#getPointer);
      setInterval(this.#move, 300);
    }
  }
  await sleep(2000);
  addStyle({
    '#panelMebukichiSettings': {
      background: 'var(--card)',
      position: 'fixed',
      zIndex: 20,
    },
    '#panelMebukichiSettings fieldset': {
      border: 'solid 0.15em',
      padding: '0.1em 0.3em',
    },
    '#panelMebukichiSettings button': {
      backgroundColor: 'buttonface',
      borderWidth: '1px',
      borderColor: 'buttonborder',
    },
    '#panelMebukichiSettings div': {
      display: 'grid',
    },
    '.Mebukichi_hide': {
      display: 'none',
    },
  });
  d.body.appendChild(prepareElement({
    tag: 'div',
    id: 'panelMebukichiSettings',
    classes: ['Mebukichi_hide'],
    children: [
      {
        tag: 'fieldset',
        children: [
          {
            tag: 'legend',
            children: [
              {
                tag: 'button',
                type: 'button',
                textContent: '×',
                events: {
                  click: () => {
                    d.body.querySelector('#panelMebukichiSettings').classList.add('Mebukichi_hide');
                  },
                },
              },
              {
                tag: 'span',
                textContent: 'めぶきち',
              },
            ],
          },
          {
            tag: 'div',
            children: [
              {
                tag: 'fieldset',
                children: [
                  {
                    tag: 'legend',
                    textContent: 'スプライト',
                  },
                  {
                    tag: 'div',
                    children: Sprites.map(s => {
                      return {
                        tag: 'label',
                        children: [
                          {
                            tag: 'input',
                            type: 'radio',
                            name: 'Sprite',
                            checked: settings.Sprite == s,
                            events: {
                              change: () => { Mebukichi.setSprite(settings.Sprite = s); },
                            },
                          },
                          {
                            tag: 'span',
                            textContent: s,
                          },
                        ],
                      };
                    }),
                  },
                ],
              },
              {
                tag: 'fieldset',
                children: [
                  {
                    tag: 'legend',
                    textContent: 'ページ',
                  },
                  {
                    tag: 'div',
                    id: 'MebukichiSettings_divPages',
                  },
                ],
              },
              {
                tag: 'fieldset',
                children: [
                  {
                    tag: 'legend',
                    textContent: 'タグ',
                  },
                  {
                    tag: 'div',
                    id: 'MebukichiSettings_divTags',
                  },
                ],
              },
            ],
          },
        ],
      },
    ],
  }));
  d.body.addEventListener('dblclick', (ev) => {
    // doesn't show menu in message-container
    let elm = ev.target;
    while (elm && !elm.classList.contains('message-container')) {
      elm = elm.parentElement;
    }
    if (elm) { return; }
    const panelMebukichiSettings = d.body.querySelector('#panelMebukichiSettings');
    panelMebukichiSettings.classList.remove('Mebukichi_hide');
    panelMebukichiSettings.style.left = `${ev.clientX}px`;
    panelMebukichiSettings.style.top = `${ev.clientY}px`;
    settings.PageFilter.addPageOptions(panelMebukichiSettings.querySelector('#MebukichiSettings_divPages'));
    settings.PageFilter.addTagOptions(panelMebukichiSettings.querySelector('#MebukichiSettings_divTags'));
  });
  const mebukichi = new Mebukichi();
})(window, document);
