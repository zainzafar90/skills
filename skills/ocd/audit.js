(() => {
  const LIMIT = 40;
  const rootSelector = window.ocdRoot || 'body';
  const root = document.querySelector(rootSelector);
  if (!root) return { error: `ocdRoot "${rootSelector}" matched nothing` };

  const vw = window.innerWidth;
  const vh = window.innerHeight;
  const CONTROL = 'button,[role=button],input[type=button],input[type=submit],a[class*=btn],a[class*=button]';
  const TARGET = `${CONTROL},a[href],summary,[role=link],[role=tab],[role=menuitem],[role=option],[role=switch],[role=checkbox],[role=radio],input[type=checkbox],input[type=radio]`;
  const INTERACTIVE = `${TARGET},input:not([type=hidden]),select,textarea,label,[onclick],[tabindex]:not([tabindex="-1"]),[contenteditable=""],[contenteditable=true]`;
  const CLICK_PROPS = ['onClick', 'onDoubleClick', 'onMouseDown', 'onMouseUp', 'onPointerDown', 'onPointerUp'];

  const cs = (el) => getComputedStyle(el);
  const rect = (el) => el.getBoundingClientRect();
  const px = (n) => Math.round(n * 10) / 10;

  const visible = (el) => {
    const r = rect(el);
    if (r.width <= 0 || r.height <= 0) return false;
    if (el.checkVisibility) return el.checkVisibility({ opacityProperty: true, visibilityProperty: true });
    const s = cs(el);
    return s.visibility !== 'hidden' && Number(s.opacity) > 0;
  };

  const label = (el) => {
    const cls = typeof el.className === 'string'
      ? el.className.trim().split(/\s+/).filter(Boolean).slice(0, 3).map((c) => `.${c}`).join('')
      : '';
    const text = (el.innerText || el.getAttribute('aria-label') || el.getAttribute('alt') || '')
      .trim().replace(/\s+/g, ' ').slice(0, 40);
    return `${el.tagName.toLowerCase()}${el.id ? `#${el.id}` : ''}${cls}${text ? ` "${text}"` : ''}`;
  };

  const tag = (el) => label(el).split(' "')[0];

  const box = (el) => {
    const r = rect(el);
    return `${Math.round(r.left)},${Math.round(r.top)} ${Math.round(r.width)}x${Math.round(r.height)}`;
  };

  // ponytail: only inline handlers and React props are visible from the page; addEventListener,
  // Vue and Svelte handlers are not. Use DevTools getEventListeners() when a lead looks wrong.
  const hasHandler = (el) => {
    if (el.onclick || el.onmousedown || el.onpointerdown || el.ondblclick) return true;
    const key = Object.keys(el).find((k) => k.startsWith('__reactProps$'));
    return Boolean(key) && CLICK_PROPS.some((p) => typeof el[key][p] === 'function');
  };
  const isInteractive = (el) => el.matches(INTERACTIVE) || hasHandler(el);
  const insideInteractive = (el) => {
    for (let p = el; p && p !== document.documentElement; p = p.parentElement) if (isInteractive(p)) return true;
    return false;
  };

  const hasOwnText = (el) => [...el.childNodes].some((n) => n.nodeType === 3 && n.textContent.trim());

  const textRects = (el) => {
    const out = [];
    const walker = document.createTreeWalker(el, NodeFilter.SHOW_TEXT);
    for (let n = walker.nextNode(); n; n = walker.nextNode()) {
      if (!n.textContent.trim()) continue;
      const range = document.createRange();
      range.selectNodeContents(n);
      out.push(...[...range.getClientRects()].filter((r) => r.width > 0 && r.height > 0));
    }
    return out;
  };

  const union = (rects) => rects.length === 0 ? null : {
    left: Math.min(...rects.map((r) => r.left)),
    right: Math.max(...rects.map((r) => r.right)),
    top: Math.min(...rects.map((r) => r.top)),
    bottom: Math.max(...rects.map((r) => r.bottom)),
  };

  const lineCount = (rects) => {
    const tops = rects.map((r) => r.top).sort((a, b) => a - b);
    return tops.filter((t, i) => i === 0 || t - tops[i - 1] > 4).length;
  };

  const overlapOf = (a, b) => ({
    w: Math.min(a.right, b.right) - Math.max(a.left, b.left),
    h: Math.min(a.bottom, b.bottom) - Math.max(a.top, b.top),
  });

  const hoverSelectors = [];
  const focusSelectors = [];
  const outlineKillSelectors = [];
  let unreadableSheets = 0;

  const valid = (sel) => {
    try { document.querySelector(sel); return true; } catch { return false; }
  };
  const subjectBefore = (sel, pseudo) => {
    const i = sel.indexOf(pseudo);
    return i > 0 ? sel.slice(0, i).trim() : null;
  };
  const collectRule = (rule) => {
    const props = [...rule.style];
    const killsOutline = rule.style.outlineStyle === 'none' || rule.style.outlineWidth === '0px';
    const stylesFocus = props.some((p) => !p.startsWith('outline')) || (props.length > 0 && !killsOutline);
    // ponytail: naive comma split; selectors with commas inside :is()/:not() are dropped by valid().
    for (const sel of rule.selectorText.split(',').map((s) => s.trim())) {
      const hover = subjectBefore(sel, ':hover');
      if (hover && valid(hover)) hoverSelectors.push(hover);
      const focus = subjectBefore(sel, ':focus');
      if (focus && stylesFocus && valid(focus)) focusSelectors.push(focus);
      if (killsOutline) {
        const bare = sel.replace(/:focus(-visible|-within)?/g, '') || '*';
        if (valid(bare)) outlineKillSelectors.push(bare);
      }
    }
  };
  const walkRules = (rules) => {
    for (const rule of rules) {
      if (rule.selectorText && rule.style) collectRule(rule);
      if (rule.cssRules && rule.cssRules.length) walkRules(rule.cssRules);
    }
  };
  for (const sheet of document.styleSheets) {
    try { walkRules(sheet.cssRules); } catch { unreadableSheets += 1; }
  }
  const matcher = (list) => {
    const joined = list.join(',');
    return (el) => joined !== '' && el.closest(joined) !== null;
  };
  const hasHoverStyle = matcher(hoverSelectors);
  const hasFocusStyle = matcher(focusSelectors);
  const outlineKilled = (() => {
    const joined = outlineKillSelectors.join(',');
    return (el) => joined !== '' && el.matches(joined);
  })();

  const findings = {};
  const counts = {};
  const add = (check, el, why) => {
    counts[check] = (counts[check] || 0) + 1;
    findings[check] = findings[check] || [];
    if (findings[check].length < LIMIT) findings[check].push({ el: el ? label(el) : 'page', at: el ? box(el) : '', why });
  };

  const all = [...root.querySelectorAll('*')].filter((el) => !el.ownerSVGElement && visible(el));
  const controls = all.filter((el) => el.matches(CONTROL));
  const targets = all.filter((el) => (el.matches(TARGET) || hasHandler(el)) && !el.disabled);

  for (const el of all) {
    if (!hasOwnText(el)) continue;
    const s = cs(el);
    if (s.display === 'inline') continue;
    const overX = el.scrollWidth - el.clientWidth;
    const overY = el.scrollHeight - el.clientHeight;
    const hidesX = s.overflowX === 'hidden' || s.overflowX === 'clip';
    const hidesY = s.overflowY === 'hidden' || s.overflowY === 'clip';
    if (overX > 1 && hidesX) add('textOverflow', el, s.textOverflow === 'ellipsis' ? `truncated with ellipsis, ${overX}px hidden` : `cut off, ${overX}px hidden, no ellipsis`);
    else if (overX > 1 && s.overflowX === 'visible') add('textOverflow', el, `spills ${overX}px out of its box`);
    if (overY > 1 && hidesY) add('textOverflow', el, `cut off vertically, ${overY}px hidden`);
  }

  for (const el of all.filter((e) => e.matches(`${CONTROL},[role=tab],[role=menuitem]`))) {
    const lines = lineCount(textRects(el));
    if (lines > 1) add('wrappedLabel', el, `label wraps onto ${lines} lines`);
  }

  const offsets = new Map();
  for (const el of controls) {
    const content = union([...textRects(el), ...[...el.children].filter(visible).map(rect)]);
    if (!content) continue;
    const r = rect(el);
    offsets.set(el, {
      dx: (content.left + content.right) / 2 - (r.left + r.right) / 2,
      dy: (content.top + content.bottom) / 2 - (r.top + r.bottom) / 2,
    });
  }
  const centred = (o) => Math.abs(o.dx) <= 2 && Math.abs(o.dy) <= 3;
  for (const [el, o] of offsets) {
    if (centred(o)) continue;
    const siblings = [...el.parentElement.children].filter((c) => c !== el && offsets.has(c));
    const note = siblings.some((c) => centred(offsets.get(c))) ? '; a sibling button is centred' : '';
    const side = Math.abs(o.dx) > 2 ? `${px(Math.abs(o.dx))}px ${o.dx < 0 ? 'left' : 'right'}` : '';
    const lift = Math.abs(o.dy) > 3 ? `${px(Math.abs(o.dy))}px ${o.dy < 0 ? 'high' : 'low'}` : '';
    add('offCentreLabel', el, `content sits ${[side, lift].filter(Boolean).join(', ')} of centre${note}`);
  }

  const groups = new Map();
  for (const el of controls) groups.set(el.parentElement, [...(groups.get(el.parentElement) || []), el]);
  for (const group of groups.values()) {
    if (group.length < 2) continue;
    const props = {
      height: (el) => Math.round(rect(el).height),
      'font-size': (el) => cs(el).fontSize,
      'font-weight': (el) => cs(el).fontWeight,
      radius: (el) => cs(el).borderTopLeftRadius,
    };
    const diffs = Object.entries(props)
      .map(([prop, read]) => [prop, [...new Set(group.map(read))]])
      .filter(([, values]) => values.length > 1)
      .map(([prop, values]) => `${prop} ${values.join(' vs ')}`);
    if (diffs.length) add('siblingMismatch', group[0], `${group.length} sibling buttons differ: ${diffs.join('; ')}`);
  }

  for (const el of all) {
    if (el === document.body || insideInteractive(el)) continue;
    const ownPointer = cs(el).cursor === 'pointer' && cs(el.parentElement).cursor !== 'pointer';
    const ownHover = hoverSelectors.length > 0 && el.matches(hoverSelectors.join(',')) && !el.querySelector(INTERACTIVE);
    if (ownPointer || ownHover) add('fakeAffordance', el, `${[ownPointer && 'pointer cursor', ownHover && 'hover style'].filter(Boolean).join(' + ')} but no click handler or role found`);
  }
  for (const el of targets) {
    if (!hasHoverStyle(el)) add('noHoverStyle', el, 'clickable but no :hover rule reaches it');
    if (outlineKilled(el) && !hasFocusStyle(el)) add('noFocusStyle', el, 'outline removed and no :focus rule replaces it');
  }

  const sideScroll = document.documentElement.scrollWidth - vw;
  if (sideScroll > 1) add('outsideViewport', null, `page scrolls sideways by ${sideScroll}px`);
  const clipped = [];
  for (const el of all) {
    const s = cs(el);
    const outOfFlow = s.position === 'absolute' || s.position === 'fixed';
    if (!(hasOwnText(el) || outOfFlow || el.matches(`${INTERACTIVE},img,svg`))) continue;
    const r = rect(el);
    if (r.width <= 2 || r.height <= 2) continue;
    const partlyX = (r.right > vw + 1 && r.left < vw) || (r.left < -1 && r.right > 0);
    const partlyY = s.position === 'fixed' && ((r.bottom > vh + 1 && r.top < vh) || (r.top < -1 && r.bottom > 0));
    if (partlyX || partlyY) add('outsideViewport', el, 'partly outside the viewport');
    if (clipped.some((c) => c.contains(el))) continue;
    for (let p = el.parentElement; p && p !== document.documentElement; p = p.parentElement) {
      const ps = cs(p);
      const pr = rect(p);
      const hitsX = (ps.overflowX === 'hidden' || ps.overflowX === 'clip') && (r.left < pr.left - 1 || r.right > pr.right + 1);
      const hitsY = (ps.overflowY === 'hidden' || ps.overflowY === 'clip') && (r.top < pr.top - 1 || r.bottom > pr.bottom + 1);
      const o = overlapOf(r, pr);
      if ((hitsX || hitsY) && o.w > 0 && o.h > 0) {
        clipped.push(el);
        add('clippedByAncestor', el, `cut off by ${tag(p)} (overflow hidden)`);
        break;
      }
    }
  }

  for (const el of targets) {
    const r = rect(el);
    if (cs(el).display !== 'inline' && (r.width < 24 || r.height < 24)) add('smallTarget', el, `${Math.round(r.width)}x${Math.round(r.height)}px, under 24px`);
  }

  for (const el of root.querySelectorAll('img,svg')) {
    if (!visible(el)) continue;
    const r = rect(el);
    const isImg = el.tagName === 'IMG';
    const natural = isImg
      ? (el.naturalWidth && el.naturalHeight ? el.naturalWidth / el.naturalHeight : 0)
      : (el.viewBox && el.viewBox.baseVal && el.viewBox.baseVal.height ? el.viewBox.baseVal.width / el.viewBox.baseVal.height : 0);
    if (!natural || (isImg && cs(el).objectFit !== 'fill')) continue;
    const drift = Math.abs(r.width / r.height - natural) / natural;
    if (drift > (isImg ? 0.03 : 0.05)) add('offRatio', el, `${isImg ? 'image stretched' : 'icon box squashed'}: drawn ${px(r.width / r.height)}:1, natural ${px(natural)}:1`);
  }

  for (const el of targets) {
    const r = rect(el);
    const x = r.left + r.width / 2;
    const y = r.top + r.height / 2;
    if (x < 0 || y < 0 || x > vw || y > vh) continue;
    const top = document.elementFromPoint(x, y);
    if (top && top !== el && !el.contains(top) && !top.contains(el)) add('overlap', el, `covered at its centre by ${tag(top)}`);
  }
  const carriesContent = (el) => isInteractive(el) || (el.innerText || '').trim() !== '';
  for (const parent of all) {
    const kids = [...parent.children].filter((k) => visible(k) && !k.ownerSVGElement && carriesContent(k));
    if (kids.length < 2 || kids.length > 30) continue;
    for (let i = 0; i < kids.length; i += 1) {
      for (let j = i + 1; j < kids.length; j += 1) {
        const o = overlapOf(rect(kids[i]), rect(kids[j]));
        if (o.w > 2 && o.h > 2) add('overlap', kids[i], `overlaps sibling ${tag(kids[j])} by ${Math.round(o.w)}x${Math.round(o.h)}px`);
      }
    }
  }

  for (const anim of document.getAnimations()) {
    const el = anim.effect && anim.effect.target;
    if (!el || !root.contains(el) || anim.playState !== 'running') continue;
    if (anim.effect.getComputedTiming().iterations !== Infinity) continue;
    add('endlessAnimation', el, `"${anim.animationName || anim.id || 'unnamed'}" runs forever; fine only for real loading`);
  }

  const result = {
    url: location.href,
    viewport: `${vw}x${vh}`,
    dark: matchMedia('(prefers-color-scheme: dark)').matches,
    root: rootSelector,
    counts,
    findings,
    notes: [
      'Leads, not verdicts: look at the screenshot before reporting any of these.',
      'Click handlers added with addEventListener (or by Vue/Svelte) are invisible here, so fakeAffordance can be wrong.',
      'Shadow DOM and iframes are not scanned. Run again inside them if the UI lives there.',
      ...(unreadableSheets ? [`${unreadableSheets} cross-origin stylesheet(s) could not be read; hover/focus leads may be wrong.`] : []),
    ],
  };
  window.__ocdAudit = result;
  return result;
})()
