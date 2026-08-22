// ==UserScript==
// @name         Iwara Thumbnail
// @namespace    https://TakeAsh.net/
// @version      2026-08-23_02:00
// @description  show Iwara thumbnail on Mebuki channel
// @author       TakeAsh
// @match        https://mebuki.moe/app
// @match        https://mebuki.moe/app/*
// @require      https://raw.githubusercontent.com/TakeAsh/js-Modules/main/modules/Util.js
// @require      https://raw.githubusercontent.com/TakeAsh/js-Modules/main/modules/PrepareElement.js
// @require      https://raw.githubusercontent.com/TakeAsh/js-Modules/main/modules/CyclicEnum.js
// @require      https://raw.githubusercontent.com/TakeAsh/js-Modules/main/modules/AutoSaveConfig.js
// @icon         https://www.google.com/s2/favicons?sz=64&domain=mebuki.moe
// @grant        GM.xmlHttpRequest
// @connect      iwara.tv
// ==/UserScript==

(async (w, d) => {
  'use strict';
  const winIwara = 'iwara';
  if ((typeof GM == 'undefined') || (typeof GM.xmlHttpRequest != 'function')) { return; }
  await sleep(2500);
  const CheckTiming = new CyclicEnum({
    NoWait: { Label: '即時' },
    OnDemand: { Label: '要求時' },
  });
  const settings = new AutoSaveConfig({
    CheckTiming: CheckTiming.NoWait,
  }, 'IwaraThumbnail');
  addStyle({
    '.IwaraAvatar': {
      height: '3em',
      display: 'inline',
    },
    '.IwaraAvatar:hover': {
      height: '8em',
    },
    '.IwaraThumbnail': {
      height: '16em',
    },
    '.IwaraCheckButton': {
      backgroundColor: 'ButtonFace',
      borderWidth: '2px',
      borderStyle: 'outset',
      borderColor: 'ButtonBorder',
    },
    '.IwaraCheckButton:hover': {
      backgroundColor: 'lightgray',
    },
    '.IwaraCheckButton:active': {
      backgroundColor: 'darkgray',
    },
    '#IwaraThumbnailSettings label': {
      margin: '0.3em',
    },
  });
  watchTarget(checkLinks, d.body);

  function checkLinks(node) {
    if (!node) { return; }
    if (d.body.querySelector('.thread-messages')) {
      // Thread
      const action = settings.CheckTiming == CheckTiming.OnDemand ?
        async (link, m) => {
          link.parentNode.insertBefore(prepareElement({
            tag: 'button',
            classes: ['IwaraCheckButton'],
            type: 'button',
            innerHTML: '&#x1F441;&#xFE0F;',
            title: 'check thumbnail',
            events: {
              click: async (ev) => {
                link.parentNode.removeChild(ev.currentTarget);
                await showThumbnail(link, m);
              },
            },
          }), link);
        } :
        async (link, m) => { await showThumbnail(link, m); };
      Array.from(node.querySelectorAll('a[href*="iwara.tv"]'))
        .filter(link => !link.dataset.iwaraInformed && link.parentNode.classList.contains('message-content'))
        .forEach(async (link) => {
          link.dataset.iwaraInformed = 1;
          link.target = winIwara;
          const m = link.href.match(/(?<type>video|profile)\/(?<id>[^\/\?]+)/);
          if (!m) { return; }
          await action(link, m);
        });
    } else if (location.pathname == '/app/settings') {
      // Settings
      modifyExperimentalSettings(node);
    }
  }
  async function showThumbnail(link, m) {
    const r = await GM.xmlHttpRequest({
      url: `https://api.iwara.tv/${m[0]}`,
    }).catch(e => console.error(e));
    const info = JSON.parse(r.responseText);
    console.log(info);
    if (info.message) {
      link.title = info.message;
      return;
    }
    if (m.groups.type == 'video') {
      link.textContent = info.title;
      const urlThumbnail = info.customThumbnail
        ? `https://i.iwara.tv/image/original/${info.customThumbnail.id}/${info.customThumbnail.name}`
        : `https://i.iwara.tv/image/original/${info.file.id}/thumbnail-${String(info.thumbnail).padStart(2, '0')}.jpg`;
      link.parentNode.insertBefore(prepareElement({
        tag: `a`,
        dataset: { iwaraInformed: 1, },
        href: link.href,
        target: winIwara,
        children: [
          {
            tag: 'img',
            classes: ['IwaraThumbnail'],
            src: urlThumbnail,
            title: info.body,
          },
        ],
      }), link.nextSibling);
      const linkProfile = decorateProfile(prepareElement({
        tag: 'a',
        dataset: { iwaraInformed: 1, },
        href: `https://www.iwara.tv/profile/${info.user.username}`,
        target: winIwara,
        textContent: info.user.name,
      }), info.user);
      link.parentNode.insertBefore(linkProfile, link.nextSibling);
      link.parentNode.insertBefore(d.createTextNode(' / '), link.nextSibling)
    } else if (m.groups.type == 'profile') {
      decorateProfile(link, info.user);
    }
  }
  function decorateProfile(link, user) {
    link.textContent = user.name;
    if (!user.avatar) { return link; }
    link.appendChild(d.createTextNode(' '));
    link.appendChild(prepareElement({
      tag: 'img',
      classes: ['IwaraAvatar'],
      src: `https://i.iwara.tv/image/avatar/${user.avatar.id}/${user.avatar.name}`,
      title: user.name,
    }));
    return link;
  }
  function modifyExperimentalSettings(node) {
    const divExperimental = getNodesByXpath('.//div[text()="実験的機能"]', node)[0]?.parentNode?.nextElementSibling;
    if (!divExperimental || divExperimental.dataset.iwaraSettingsAdded) { return; }
    divExperimental.dataset.iwaraSettingsAdded = 1;
    divExperimental.appendChild(prepareElement({
      tag: 'fieldset',
      classes: ['grid', 'grid-cols-1', 'gap-1.5',],
      children: [
        {
          tag: 'legend',
          classes: ['inline-flex', 'items-center', 'gap-0.5', 'font-bold', 'text-foreground',],
          textContent: 'Iwara Thumbnail',
        },
        {
          tag: 'div',
          id: 'IwaraThumbnailSettings',
          children: [
            {
              tag: 'div',
              children: [
                {
                  tag: 'span',
                  textContent: 'サムネイル表示:',
                },
                ...CheckTiming.map(item => {
                  return {
                    tag: 'label',
                    children: [
                      {
                        tag: 'input',
                        type: 'radio',
                        name: 'CheckTiming',
                        checked: item == settings.CheckTiming,
                        events: { change: (ev) => { settings.CheckTiming = item; }, },
                      },
                      {
                        tag: 'span',
                        textContent: item.Label,
                      },
                    ],
                  };
                }),
              ],
            },
          ],
        },
      ],
    }));
  }
})(window, document);