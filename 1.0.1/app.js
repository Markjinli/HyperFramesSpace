(function (global) {
  'use strict';

  var CATALOG = [
    {
      id: 'claw8ex-g3e-spec-film',
      name: 'Claw 8 EX · 规格表电影',
      path: 'C:\\Users\\M\\claw8ex-g3e-spec-film',
      workflow: 'general-video',
      flow: 'automation',
      duration: 80,
      aspect: '1920×1080',
      fps: 30,
      pin: '0.7.109',
      status: 'ready',
      collection: '掌机芯片',
      language: 'zh',
      destination: 'youtube',
      narration: true,
      brief: 'Claw 8 EX AI+ CG3EM 把 Intel Arc G3 Extreme 放进一台完整掌机，Extreme 卡在 Ultra X7 358H 和普通 Arc G3 中间。',
      thumb: null,
      poster: 'instrument',
      createdAt: '2026-08-17',
      compositions: 1,
      tracks: 4,
      hasStoryboard: true,
      hasScript: true,
      findings: 0,
      tags: ['掌机', '规格表', '口播']
    },
    {
      id: 'hx370-g3e-lineage',
      name: 'HX370 → Arc G3 Extreme',
      path: 'C:\\Users\\M\\Videos\\hx370-g3e-lineage',
      workflow: 'motion-graphics',
      flow: 'automation',
      duration: 8,
      aspect: '1920×1080',
      fps: 30,
      pin: '0.8.3',
      status: 'findings',
      collection: '掌机芯片',
      language: 'zh',
      destination: 'youtube',
      narration: false,
      brief: 'HX370 定制为 Z2 Extreme，同样的手法落到 Panther Lake 的 Arc G3 Extreme。',
      thumb: 'assets/thumbs/hx370.jpg',
      createdAt: '2026-08-19',
      compositions: 1,
      tracks: 2,
      hasStoryboard: false,
      hasScript: false,
      findings: 10,
      tags: ['kinetic', '芯片', '无旁白']
    },
    {
      id: 'changestyle5',
      name: 'changestyle5 · 红黑重装甲',
      path: 'C:\\Users\\M\\Documents\\转转视觉优化\\changestyle5',
      workflow: 'general-video',
      flow: 'companion',
      duration: 10,
      aspect: '1920×1080',
      fps: 60,
      pin: '0.7.68',
      status: 'ready',
      collection: '转转笔记本',
      language: 'zh-CN',
      destination: 'zhuan',
      narration: false,
      brief: '以 changestyle4 为底稿，迁入 changestyle1 的红黑金属风格、排版、字体与动画。',
      thumb: 'assets/thumbs/cs5.png',
      createdAt: '2026-08-10',
      compositions: 1,
      tracks: 3,
      findings: 0,
      tags: ['转转', '红黑', '配置速览']
    },
    {
      id: 'image-faithful-v3',
      name: 'image-faithful-v3 · 暗影骑士擎',
      path: 'C:\\Users\\M\\Documents\\转转视觉优化\\image-faithful-v3',
      workflow: 'general-video',
      flow: 'companion',
      duration: 10,
      aspect: '1920×1080',
      fps: 60,
      pin: '0.7.68',
      status: 'ready',
      collection: '转转笔记本',
      language: 'zh-CN',
      destination: 'zhuan',
      narration: false,
      brief: '按参考图重做 Acer 暗影骑士·擎 2022 的二手笔记本配置速览画面。',
      thumb: 'assets/thumbs/faithful.png',
      createdAt: '2026-08-08',
      compositions: 1,
      tracks: 3,
      findings: 0,
      tags: ['转转', 'Acer', '参考图']
    },
    {
      id: 'changestyle4typeset',
      name: 'changestyle4 · 排版定稿',
      path: 'C:\\Users\\M\\Documents\\转转视觉优化\\changestyle4typeset',
      workflow: 'general-video',
      flow: 'companion',
      duration: 10,
      aspect: '1920×1080',
      fps: 60,
      pin: '0.7.68',
      status: 'rendered',
      collection: '转转笔记本',
      language: 'zh-CN',
      destination: 'zhuan',
      narration: false,
      brief: '蓝黑科技风配置速览：摘要栏含适合人群，底部留字幕安全区。已渲 8 台成片。',
      thumb: 'assets/thumbs/typeset.jpg',
      createdAt: '2026-08-06',
      compositions: 1,
      tracks: 3,
      findings: 0,
      tags: ['转转', '系列母版', '已渲染']
    },
    {
      id: 'changestyle4canvas-design',
      name: 'changestyle4 · Canvas 哲学',
      path: 'C:\\Users\\M\\Documents\\转转视觉优化\\changestyle4canvas-design',
      workflow: 'general-video',
      flow: 'companion',
      duration: 10,
      aspect: '1920×1080',
      fps: 60,
      pin: '0.7.68',
      status: 'ready',
      collection: '字体实验',
      language: 'zh-CN',
      destination: 'zhuan',
      narration: false,
      brief: '同一套笔记本数据，换成 Canvas 哲学向的构图与字体节奏。',
      thumb: 'assets/thumbs/canvas.png',
      createdAt: '2026-08-07',
      compositions: 1,
      tracks: 3,
      findings: 0,
      tags: ['字体', '变体']
    },
    {
      id: 'changestyle4ui-ux-pro-max',
      name: 'changestyle4 · UI/UX Pro Max',
      path: 'C:\\Users\\M\\Documents\\转转视觉优化\\changestyle4ui-ux-pro-max',
      workflow: 'general-video',
      flow: 'companion',
      duration: 10,
      aspect: '1920×1080',
      fps: 60,
      pin: '0.7.68',
      status: 'stale-pin',
      collection: '字体实验',
      language: 'zh-CN',
      destination: 'zhuan',
      narration: false,
      brief: 'UI 层级更硬的配置速览变体，CLI pin 停在 0.7.68。',
      thumb: 'assets/thumbs/uiux.png',
      createdAt: '2026-08-07',
      compositions: 1,
      tracks: 3,
      findings: 0,
      tags: ['字体', 'pin落后']
    },
    {
      id: 'changestyle4font-pairing',
      name: 'changestyle4 · 字体配对',
      path: 'C:\\Users\\M\\Documents\\转转视觉优化\\changestyle4font-pairing',
      workflow: 'general-video',
      flow: 'companion',
      duration: 10,
      aspect: '1920×1080',
      fps: 60,
      pin: '0.7.68',
      status: 'ready',
      collection: '字体实验',
      language: 'zh-CN',
      destination: 'zhuan',
      narration: false,
      brief: '专门跑字体配对的 10 秒配置速览变体。',
      thumb: 'assets/thumbs/fontpair.png',
      createdAt: '2026-08-07',
      compositions: 1,
      tracks: 3,
      findings: 0,
      tags: ['字体配对']
    },
    {
      id: 'predator-neo',
      name: 'Acer 掠夺者擎 Neo',
      path: 'C:\\Users\\M\\Documents\\转转视觉优化\\changestyle4typeset-其他笔记本\\Acer 掠夺者擎 Neo',
      workflow: 'general-video',
      flow: 'companion',
      duration: 10,
      aspect: '1920×1080',
      fps: 60,
      pin: '0.7.68',
      status: 'rendered',
      collection: '转转笔记本',
      language: 'zh-CN',
      destination: 'zhuan',
      narration: false,
      brief: '同一 typeset 母版套到掠夺者擎 Neo 的产品数据。',
      thumb: 'assets/thumbs/typeset.jpg',
      createdAt: '2026-08-06',
      compositions: 1,
      tracks: 3,
      findings: 0,
      tags: ['转转', 'Acer', '批量']
    },
    {
      id: 'macbook-air-m2',
      name: 'MacBook Air 13″ M2',
      path: 'C:\\Users\\M\\Documents\\转转视觉优化\\changestyle4typeset-其他笔记本\\Macbook Air 13寸M2版',
      workflow: 'general-video',
      flow: 'companion',
      duration: 10,
      aspect: '1920×1080',
      fps: 60,
      pin: '0.7.68',
      status: 'rendered',
      collection: '转转笔记本',
      language: 'zh-CN',
      destination: 'zhuan',
      narration: false,
      brief: '同一 typeset 母版套到 MacBook Air 13 寸 M2 的产品数据。',
      thumb: 'assets/thumbs/typeset.jpg',
      createdAt: '2026-08-06',
      compositions: 1,
      tracks: 3,
      findings: 0,
      tags: ['转转', 'Apple', '批量']
    }
  ];

  var CLI_ACTIONS = {
    preview: { label: 'Studio 预览', hint: '打开时间线审片', cmd: 'preview' },
    play: { label: '轻量播放', hint: 'embed player', cmd: 'play' },
    lint: { label: 'Lint', hint: '静态结构检查', cmd: 'lint' },
    check: { label: 'Check 门禁', hint: 'lint + runtime + layout + contrast', cmd: 'check' },
    snapshot: { label: '抽帧 Snapshot', hint: '联系表 / 封面', cmd: 'snapshot' },
    render: { label: '渲染成片', hint: 'quality high', cmd: 'render' },
    'render-draft': { label: '渲染草稿', hint: 'quality draft', cmd: 'render-draft' },
    doctor: { label: 'Doctor', hint: '环境诊断', cmd: 'doctor' },
    init: { label: '新建 init', hint: '脚手架', cmd: 'init' },
    compositions: { label: '列出合成', hint: 'compositions --json', cmd: 'compositions' },
    upgrade: { label: '升级探针', hint: 'pin vs latest', cmd: 'upgrade' },
    info: { label: '工程 info', hint: '时长 / 轨道 / 体积', cmd: 'info' }
  };

  var FRAME_BANK = {
    'hx370-g3e-lineage': [
      'assets/thumbs/frames/hx370/0.png',
      'assets/thumbs/frames/hx370/1.png',
      'assets/thumbs/frames/hx370/2.png',
      'assets/thumbs/frames/hx370/3.png',
      'assets/thumbs/frames/hx370/4.png',
      'assets/thumbs/frames/hx370/5.png',
      'assets/thumbs/frames/hx370/6.png',
      'assets/thumbs/frames/hx370/7.png',
      'assets/thumbs/frames/hx370/8.png'
    ],
    changestyle5: [
      'assets/thumbs/frames/cs5/0.png',
      'assets/thumbs/frames/cs5/1.png',
      'assets/thumbs/frames/cs5/2.png',
      'assets/thumbs/frames/cs5/3.png',
      'assets/thumbs/frames/cs5/4.png'
    ],
    'image-faithful-v3': [
      'assets/thumbs/frames/faithful/0.png',
      'assets/thumbs/frames/faithful/1.png',
      'assets/thumbs/frames/faithful/2.png',
      'assets/thumbs/frames/faithful/3.png',
      'assets/thumbs/frames/faithful/4.png'
    ],
    'changestyle4canvas-design': [
      'assets/thumbs/frames/canvas/0.png',
      'assets/thumbs/frames/canvas/1.png',
      'assets/thumbs/frames/canvas/2.png',
      'assets/thumbs/frames/canvas/3.png'
    ],
    'changestyle4ui-ux-pro-max': [
      'assets/thumbs/frames/uiux/0.png',
      'assets/thumbs/frames/uiux/1.png',
      'assets/thumbs/frames/uiux/2.png',
      'assets/thumbs/frames/uiux/3.png',
      'assets/thumbs/frames/uiux/4.png'
    ],
    'changestyle4font-pairing': [
      'assets/thumbs/frames/fontpair/0.png',
      'assets/thumbs/frames/fontpair/1.png',
      'assets/thumbs/frames/fontpair/2.png',
      'assets/thumbs/frames/fontpair/3.png',
      'assets/thumbs/frames/fontpair/4.png'
    ],
    changestyle4typeset: [
      'assets/thumbs/frames/canvas/0.png',
      'assets/thumbs/frames/canvas/1.png',
      'assets/thumbs/frames/canvas/2.png',
      'assets/thumbs/frames/canvas/3.png'
    ],
    'predator-neo': [
      'assets/thumbs/frames/cs5/0.png',
      'assets/thumbs/frames/cs5/1.png',
      'assets/thumbs/frames/cs5/2.png',
      'assets/thumbs/frames/cs5/3.png',
      'assets/thumbs/frames/cs5/4.png'
    ],
    'macbook-air-m2': [
      'assets/thumbs/frames/faithful/0.png',
      'assets/thumbs/frames/faithful/1.png',
      'assets/thumbs/frames/faithful/2.png',
      'assets/thumbs/frames/faithful/3.png',
      'assets/thumbs/frames/faithful/4.png'
    ]
  };

  var DEFAULT_SKILL_CATALOG_URL = 'https://raw.githubusercontent.com/framespace-skills/index/main/catalog.json';

  var SKILL_SEED = [
    { id: 'hyperframes', name: 'hyperframes', source: 'hyperframes', version: '0.8.3', path: '%USERPROFILE%\\.agents\\skills\\hyperframes', repo: 'heygen-com/hyperframes', summary: 'HyperFrames 总入口与路由', rating: 5, note: '' },
    { id: 'hyperframes-core', name: 'hyperframes-core', source: 'hyperframes', version: '0.8.3', path: '%USERPROFILE%\\.agents\\skills\\hyperframes-core', repo: 'heygen-com/hyperframes', summary: 'composition 合同与 data-*', rating: 5, note: '' },
    { id: 'hyperframes-cli', name: 'hyperframes-cli', source: 'hyperframes', version: '0.8.3', path: '%USERPROFILE%\\.agents\\skills\\hyperframes-cli', repo: 'heygen-com/hyperframes', summary: 'lint / check / preview / render', rating: 4, note: '' },
    { id: 'hyperframes-animation', name: 'hyperframes-animation', source: 'hyperframes', version: '0.8.3', path: '%USERPROFILE%\\.agents\\skills\\hyperframes-animation', repo: 'heygen-com/hyperframes', summary: 'GSAP 与运动蓝图', rating: 4, note: '' },
    { id: 'media-use', name: 'media-use', source: 'hyperframes', version: '0.8.3', path: '%USERPROFILE%\\.agents\\skills\\media-use', repo: 'heygen-com/hyperframes', summary: 'TTS / 配乐 / 素材解析', rating: 4, note: '口播走本地 Kokoro' },
    { id: 'motion-graphics', name: 'motion-graphics', source: 'hyperframes', version: '0.8.3', path: '%USERPROFILE%\\.agents\\skills\\motion-graphics', repo: 'heygen-com/hyperframes', summary: '短动态图形工作流', rating: 3, note: '' },
    { id: 'faceless-explainer', name: 'faceless-explainer', source: 'hyperframes', version: '0.8.3', path: '%USERPROFILE%\\.agents\\skills\\faceless-explainer', repo: 'heygen-com/hyperframes', summary: '无出镜讲解片', rating: 3, note: '' },
    { id: 'imagine', name: 'imagine', source: 'grok', version: 'bundled', path: '%USERPROFILE%\\.grok\\bundled\\skills\\imagine', repo: '', summary: '出图 / 改图', rating: 4, note: '' }
  ];

  var HOT_SKILL_CATALOG = {
    updated: '2026-08-21',
    source: DEFAULT_SKILL_CATALOG_URL,
    skills: [
      { id: 'product-launch-video', name: 'product-launch-video', version: '0.8.4', repo: 'heygen-com/hyperframes', downloads: 8420, stars: 310, summary: '从产品站 URL 做发布片' },
      { id: 'talking-head-recut', name: 'talking-head-recut', version: '0.8.4', repo: 'heygen-com/hyperframes', downloads: 2104, stars: 88, summary: '口播素材加信息卡' },
      { id: 'hyperframes-cli', name: 'hyperframes-cli', version: '0.8.4', repo: 'heygen-com/hyperframes', downloads: 12011, stars: 410, summary: 'CLI 闭环（比本机 0.8.3 新）' },
      { id: 'zhuan-laptop-pack', name: 'zhuan-laptop-pack', version: '1.0.0', repo: 'you/zhuan-laptop-pack', downloads: 36, stars: 4, summary: '转转笔记本配置速览技能包' },
      { id: 'spec-table-film', name: 'spec-table-film', version: '0.2.0', repo: 'you/spec-table-film', downloads: 12, stars: 2, summary: '规格表变形电影（Claw / G3E）' }
    ]
  };

  var HOST_RESOURCES = { ramMb: 32768, cpuThreads: 16, name: '本机' };

  var PROCESS_SEED = [
    { pid: 4188, name: 'node', kind: 'preview', project: 'hx370-g3e-lineage', cmd: 'npx hyperframes@0.8.3 preview', port: 3002, ageMin: 187, orphan: true, cpu: 3, memMb: 220, gpu: 0 },
    { pid: 5120, name: 'chrome', kind: 'studio-chrome', project: 'hx370-g3e-lineage', cmd: 'chrome --user-data-dir=.hf-preview', port: 3002, ageMin: 187, orphan: true, cpu: 8, memMb: 1400, gpu: 12 },
    { pid: 6704, name: 'node', kind: 'preview', project: 'claw8ex-g3e-spec-film', cmd: 'npx hyperframes@0.7.109 preview', port: 3017, ageMin: 42, orphan: true, cpu: 2, memMb: 180, gpu: 0 },
    { pid: 8901, name: 'chrome', kind: 'render-chrome', project: 'changestyle5', cmd: 'chrome --headless --disable-gpu', port: null, ageMin: 8, orphan: false, cpu: 28, memMb: 2200, gpu: 48 },
    { pid: 8902, name: 'ffmpeg', kind: 'encode', project: 'changestyle5', cmd: 'ffmpeg -i pipe:0 out.mp4', port: null, ageMin: 8, orphan: false, cpu: 18, memMb: 400, gpu: 22 },
    { pid: 2210, name: 'node', kind: 'play', project: 'changestyle4typeset', cmd: 'npx hyperframes play --port 3003', port: 3003, ageMin: 960, orphan: true, cpu: 1, memMb: 150, gpu: 0 }
  ];

  function cloneProcesses(list) {
    return (list || PROCESS_SEED).map(function (p) {
      var n = {};
      for (var k in p) n[k] = p[k];
      return n;
    });
  }

  function equalFrameTimes(durationSec, count) {
    count = count == null ? 9 : Number(count);
    durationSec = Number(durationSec);
    if (!(count >= 2)) return [0];
    var out = [];
    var dur = durationSec > 0 ? durationSec : 0;
    for (var i = 0; i < count; i++) {
      out.push(Math.round((dur * i) / (count - 1) * 1000) / 1000);
    }
    out[0] = 0;
    out[count - 1] = Math.round(dur * 1000) / 1000;
    return out;
  }

  function oddSecondTimes(durationSec) {
    var dur = Number(durationSec);
    var out = [];
    if (!(dur > 0)) return out;
    for (var t = 1; t < dur; t += 2) out.push(t);
    return out;
  }

  function coverIndexPlan(layout) {
    var k = String(layout || '1');
    if (k === '4') return [0, 3, 5, 8];
    if (k === '9') return [0, 1, 2, 3, 4, 5, 6, 7, 8];
    return [4];
  }

  function pickBankSrc(bank, index9) {
    if (!bank || !bank.length) return null;
    if (bank.length === 1) return bank[0];
    return bank[Math.round(index9 * (bank.length - 1) / 8)];
  }

  function coverCells(project, layout) {
    if (!project) return [];
    var times = equalFrameTimes(project.duration, 9);
    var plan = coverIndexPlan(layout);
    var bank = (project.frameSrcs && project.frameSrcs.length)
      ? project.frameSrcs
      : (FRAME_BANK[project.id] || (project.thumb ? [project.thumb] : []));
    return plan.map(function (i) {
      return { index: i, t: times[i], src: pickBankSrc(bank, i) };
    });
  }

  function collectionsFromCatalog(projects) {
    var groups = {};
    var order = [];
    (projects || []).forEach(function (p) {
      var key = p.collection || '未分组';
      if (!groups[key]) {
        groups[key] = [];
        order.push(key);
      }
      groups[key].push(p);
    });
    return order.map(function (key) {
      return { id: key, name: key, projects: groups[key], count: groups[key].length };
    });
  }

  function seedCustomCollections(projects) {
    return collectionsFromCatalog(projects).map(function (g) {
      return {
        id: g.id,
        name: g.name,
        projectIds: g.projects.map(function (p) { return p.id; })
      };
    });
  }

  function addCustomCollection(collections, name) {
    var list = (collections || []).slice();
    var label = String(name || '').trim() || ('新分组 ' + (list.length + 1));
    var id = 'col-' + label + '-' + (list.length + 1);
    var i = 2;
    while (list.some(function (c) { return c.id === id; })) {
      id = 'col-' + label + '-' + i;
      i++;
    }
    list.push({ id: id, name: label, projectIds: [] });
    return { collections: list, id: id };
  }

  function assignProjectToCollection(collections, collectionId, projectId) {
    return (collections || []).map(function (c) {
      if (c.id !== collectionId) return c;
      if ((c.projectIds || []).indexOf(projectId) !== -1) {
        return { id: c.id, name: c.name, projectIds: (c.projectIds || []).slice() };
      }
      return { id: c.id, name: c.name, projectIds: (c.projectIds || []).concat([projectId]) };
    });
  }

  function findCollection(collections, collectionId) {
    collections = collections || [];
    for (var i = 0; i < collections.length; i++) {
      if (collections[i].id === collectionId) return collections[i];
    }
    return null;
  }

  function normalizePath(p) {
    return String(p || '').replace(/\//g, '\\').replace(/\\+$/, '');
  }

  function pathIsUnder(child, parent) {
    var c = normalizePath(child).toLowerCase();
    var p = normalizePath(parent).toLowerCase();
    if (!p) return true;
    if (c === p) return true;
    return c.indexOf(p + '\\') === 0;
  }

  function projectsUnderFolder(projects, folderPath) {
    return (projects || []).filter(function (p) {
      return pathIsUnder(p.path, folderPath);
    });
  }

  function commonPathPrefix(paths) {
    if (!paths || !paths.length) return '';
    var parts = paths.map(function (p) { return normalizePath(p).split('\\'); });
    var first = parts[0];
    var i = 0;
    while (i < first.length) {
      var ok = true;
      for (var n = 1; n < parts.length; n++) {
        if (parts[n][i] !== first[i]) { ok = false; break; }
      }
      if (!ok) break;
      i++;
    }
    return first.slice(0, Math.max(i, 1)).join('\\');
  }

  function buildFolderTree(projects) {
    var list = projects || [];
    var nodes = {};
    var rootPrefix = commonPathPrefix(list.map(function (p) { return p.path; }));
    function ensure(folderPath) {
      folderPath = normalizePath(folderPath);
      if (nodes[folderPath]) return nodes[folderPath];
      var parts = folderPath.split('\\');
      var node = {
        path: folderPath,
        name: folderPath === rootPrefix ? folderPath : (parts[parts.length - 1] || folderPath),
        children: [],
        projectCount: 0
      };
      nodes[folderPath] = node;
      if (folderPath !== rootPrefix && folderPath.indexOf(rootPrefix) === 0) {
        var parent = parts.slice(0, -1).join('\\');
        if (parent && parent.length >= rootPrefix.length) {
          var pNode = ensure(parent);
          pNode.children.push(node);
        }
      }
      return node;
    }
    if (rootPrefix) ensure(rootPrefix);
    list.forEach(function (p) {
      var dir = normalizePath(p.path);
      var cur = dir;
      while (cur && cur.length >= rootPrefix.length) {
        ensure(cur).projectCount += 1;
        if (cur === rootPrefix) break;
        var next = cur.split('\\').slice(0, -1).join('\\');
        if (next === cur) break;
        cur = next;
      }
    });
    Object.keys(nodes).forEach(function (k) {
      nodes[k].children.sort(function (a, b) {
        return a.name.localeCompare(b.name, 'zh');
      });
    });
    return { rootPrefix: rootPrefix, root: nodes[rootPrefix] || null, nodes: nodes };
  }

  function folderDisplayName(folderPath) {
    var n = normalizePath(folderPath);
    return n.split('\\').pop() || n;
  }

  function normalizePinnedFolder(entry) {
    if (!entry) return null;
    if (typeof entry === 'string') {
      return { path: normalizePath(entry), alias: '' };
    }
    return {
      path: normalizePath(entry.path),
      alias: String(entry.alias || '')
    };
  }

  function pinnedFolderPath(entry) {
    var n = normalizePinnedFolder(entry);
    return n ? n.path : '';
  }

  function pinnedFolderLabel(entry) {
    var n = normalizePinnedFolder(entry);
    if (!n) return '';
    var alias = String(n.alias || '').trim();
    return alias || folderDisplayName(n.path);
  }

  function isFolderPinned(pinned, folderPath) {
    var path = normalizePath(folderPath);
    return (pinned || []).some(function (e) {
      return pinnedFolderPath(e) === path;
    });
  }

  function togglePinnedFolder(pinned, folderPath) {
    var path = normalizePath(folderPath);
    var list = (pinned || []).map(normalizePinnedFolder).filter(Boolean);
    var i = -1;
    for (var k = 0; k < list.length; k++) {
      if (list[k].path === path) { i = k; break; }
    }
    if (i >= 0) list.splice(i, 1);
    else list.push({ path: path, alias: '' });
    return list;
  }

  function renamePinnedFolder(pinned, folderPath, alias) {
    var path = normalizePath(folderPath);
    var label = String(alias == null ? '' : alias).trim();
    return (pinned || []).map(normalizePinnedFolder).filter(Boolean).map(function (e) {
      if (e.path !== path) return e;
      return { path: e.path, alias: label };
    });
  }

  function hoverHideDelayMs() {
    return 1000;
  }

  function clampHoverSize(width, height) {
    var w = Number(width) || 520;
    var h = Number(height) || 340;
    if (w < 360) w = 360;
    if (h < 200) h = 200;
    if (w > 900) w = 900;
    if (h > 720) h = 720;
    return { width: w, height: h };
  }

  function cardMinPx(size) {
    return ({ s: 176, m: 220, l: 268, xl: 340 })[size] || 220;
  }

  function parseScanInterval(value) {
    var n = Number(value);
    if (!n || n < 0) return 0;
    return n;
  }

  function nextScanAt(lastScanMs, intervalSec, nowMs) {
    var interval = Number(intervalSec) || 0;
    if (interval <= 0) return null;
    var last = Number(lastScanMs) || 0;
    var now = nowMs == null ? Date.now() : nowMs;
    return last + interval * 1000;
  }

  function listOrphans(procs) {
    return (procs || []).filter(function (p) { return !!p.orphan; });
  }

  function clampPct(n) {
    n = Number(n);
    if (!(n > 0)) return 0;
    if (n > 100) return 100;
    return Math.round(n);
  }

  function isRenderProcess(proc) {
    if (!proc) return false;
    var k = String(proc.kind || '');
    return k === 'encode' || k === 'render-chrome' || k === 'snapshot';
  }

  function hasActiveRender(procs) {
    return (procs || []).some(function (p) { return isRenderProcess(p) && !p.paused; });
  }

  function hasPausedRender(procs) {
    return (procs || []).some(function (p) { return isRenderProcess(p) && p.paused; });
  }

  function pauseRenderProcesses(procs) {
    return (procs || []).map(function (p) {
      var n = {};
      for (var k in p) n[k] = p[k];
      if (!isRenderProcess(n) || n.paused) return n;
      n.paused = true;
      n.cpuBefore = n.cpu;
      n.gpuBefore = n.gpu;
      n.cpu = 0;
      n.gpu = 0;
      return n;
    });
  }

  function resumeRenderProcesses(procs) {
    return (procs || []).map(function (p) {
      var n = {};
      for (var k in p) n[k] = p[k];
      if (!n.paused) return n;
      n.paused = false;
      if (n.cpuBefore != null) n.cpu = n.cpuBefore;
      if (n.gpuBefore != null) n.gpu = n.gpuBefore;
      return n;
    });
  }

  function cloneSkills(list) {
    return (list || SKILL_SEED).map(function (s) {
      var n = {};
      for (var k in s) n[k] = s[k];
      return n;
    });
  }

  function isValidCatalogUrl(url) {
    var s = String(url || '');
    return /^https:\/\/(raw\.githubusercontent\.com|github\.com)\//i.test(s) && /catalog\.json(\?|$)/i.test(s);
  }

  function parseSkillCatalog(payload) {
    var data = payload;
    if (typeof payload === 'string') data = JSON.parse(payload);
    if (!data || !Array.isArray(data.skills)) throw new Error('catalog missing skills[]');
    return data.skills.map(function (s, i) {
      if (!s || !s.id) throw new Error('catalog skill missing id at ' + i);
      return {
        id: String(s.id),
        name: String(s.name || s.id),
        version: String(s.version || ''),
        repo: String(s.repo || ''),
        downloads: Number(s.downloads) || 0,
        stars: Number(s.stars) || 0,
        summary: String(s.summary || '')
      };
    });
  }

  function filterSkills(skills, query) {
    var q = String(query || '').trim().toLowerCase();
    if (!q) return (skills || []).slice();
    return (skills || []).filter(function (s) {
      return [s.id, s.name, s.summary, s.repo, s.source, s.note].join(' ').toLowerCase().indexOf(q) !== -1;
    });
  }

  function findSkill(skills, id) {
    skills = skills || [];
    for (var i = 0; i < skills.length; i++) if (skills[i].id === id) return skills[i];
    return null;
  }

  function rateSkill(skills, id, score) {
    var n = Math.round(Number(score));
    if (!(n >= 1 && n <= 5)) throw new Error('rating must be 1-5');
    return (skills || []).map(function (s) {
      if (s.id !== id) return s;
      var c = {};
      for (var k in s) c[k] = s[k];
      c.rating = n;
      return c;
    });
  }

  function annotateSkill(skills, id, note) {
    return (skills || []).map(function (s) {
      if (s.id !== id) return s;
      var c = {};
      for (var k in s) c[k] = s[k];
      c.note = String(note || '');
      return c;
    });
  }

  function removeSkill(skills, id) {
    return (skills || []).filter(function (s) { return s.id !== id; });
  }

  function skillNeedsUpdate(local, remote) {
    if (!local || !remote) return false;
    if (!local.version || !remote.version) return false;
    if (local.version === 'bundled') return false;
    return String(local.version) !== String(remote.version);
  }

  function mergeHotWithInstalled(hot, installed) {
    return (hot || []).map(function (h) {
      var loc = findSkill(installed, h.id);
      var c = {};
      for (var k in h) c[k] = h[k];
      c.installed = !!loc;
      c.updateAvailable = skillNeedsUpdate(loc, h);
      c.localVersion = loc ? loc.version : '';
      return c;
    }).sort(function (a, b) { return (b.downloads || 0) - (a.downloads || 0); });
  }

  function skillUpdateCommand(skill) {
    if (!skill) throw new Error('skill required');
    if (skill.source === 'hyperframes') return 'npx hyperframes skills update ' + skill.id;
    if (skill.path) return 'git -C ' + quotePath(skill.path) + ' pull';
    return 'npx hyperframes skills update ' + skill.id;
  }

  function skillDeleteCommand(skill) {
    if (!skill || !skill.path) throw new Error('skill path required');
    return 'rmdir /s /q ' + quotePath(skill.path);
  }

  function skillInstallCommand(hot) {
    if (!hot || !hot.repo) throw new Error('repo required');
    var repo = String(hot.repo).replace(/^https:\/\/github\.com\//, '');
    return 'git clone https://github.com/' + repo + '.git "%USERPROFILE%\\.agents\\skills\\' + hot.id + '"';
  }

  function catalogCheckCommand(url) {
    url = String(url || DEFAULT_SKILL_CATALOG_URL);
    return 'curl -fsSL ' + url;
  }

  function installHotSkill(installed, hot) {
    if (!hot || !hot.id) throw new Error('hot skill required');
    if (findSkill(installed, hot.id)) return (installed || []).slice();
    var next = (installed || []).slice();
    next.push({
      id: hot.id,
      name: hot.name || hot.id,
      source: 'github',
      version: hot.version || '',
      path: '%USERPROFILE%\\.agents\\skills\\' + hot.id,
      repo: hot.repo || '',
      summary: hot.summary || '',
      rating: 0,
      note: ''
    });
    return next;
  }

  function summarizeHyperFramesLoad(procs, host) {
    host = host || HOST_RESOURCES;
    var cpu = 0;
    var memMb = 0;
    var gpu = 0;
    (procs || []).forEach(function (p) {
      memMb += Number(p.memMb) || 0;
      if (p.paused) return;
      cpu += Number(p.cpu) || 0;
      gpu += Number(p.gpu) || 0;
    });
    var ram = Number(host.ramMb) || 32768;
    return {
      cpu: clampPct(cpu),
      mem: clampPct((memMb / ram) * 100),
      gpu: clampPct(gpu),
      memMb: Math.round(memMb),
      processCount: (procs || []).length,
      orphanCount: listOrphans(procs).length,
      rendering: hasActiveRender(procs),
      paused: hasPausedRender(procs)
    };
  }

  function buildKillCommand(proc) {
    if (!proc || proc.pid == null) throw new Error('pid required');
    return 'taskkill /PID ' + proc.pid + ' /F';
  }

  function killProcesses(procs, picker) {
    var killed = [];
    var remaining = [];
    (procs || []).forEach(function (p) {
      if (picker(p)) killed.push(p);
      else remaining.push(p);
    });
    return { remaining: remaining, killed: killed };
  }

  function buildSnapshotCommand(project, opts) {
    opts = opts || {};
    var count = opts.count || 9;
    var dir = project && project.path ? quotePath(project.path) : '.';
    if (opts.at && opts.at.length) {
      return 'npx hyperframes snapshot ' + dir + ' --at ' + opts.at.join(',');
    }
    return 'npx hyperframes snapshot ' + dir + ' --frames ' + count;
  }

  function haystack(project) {
    if (!project) return '';
    return [
      project.id,
      project.name,
      project.path,
      project.workflow,
      project.flow,
      project.brief,
      project.pin,
      project.status,
      project.collection,
      project.destination,
      project.language,
      (project.tags || []).join(' ')
    ].join(' ').toLowerCase();
  }

  function filterCatalog(projects, opts) {
    if (!Array.isArray(projects)) return [];
    if (typeof opts === 'string') opts = { query: opts };
    opts = opts || {};
    var query = String(opts.query || '');
    var workflow = opts.workflow || 'all';
    var status = opts.status || 'all';
    var collection = opts.collection || 'all';
    var folder = opts.folder || '';
    var customCollections = opts.customCollections;
    var tokens = query.trim().toLowerCase().split(/\s+/).filter(Boolean);
    var memberSet = null;
    if (collection !== 'all' && customCollections) {
      var col = findCollection(customCollections, collection);
      if (col) {
        memberSet = {};
        (col.projectIds || []).forEach(function (id) { memberSet[id] = true; });
      }
    }
    var out = [];
    for (var i = 0; i < projects.length; i++) {
      var p = projects[i];
      if (workflow !== 'all' && p.workflow !== workflow) continue;
      if (status !== 'all' && p.status !== status) continue;
      if (folder && !pathIsUnder(p.path, folder)) continue;
      if (collection !== 'all') {
        if (memberSet) {
          if (!memberSet[p.id]) continue;
        } else if (p.collection !== collection) continue;
      }
      if (tokens.length) {
        var hay = haystack(p);
        var miss = false;
        for (var t = 0; t < tokens.length; t++) {
          if (hay.indexOf(tokens[t]) === -1) {
            miss = true;
            break;
          }
        }
        if (miss) continue;
      }
      out.push(p);
    }
    return out;
  }

  function createViewState(partial) {
    var base = {
      view: 'library',
      selectedId: null,
      query: '',
      workflow: 'all',
      status: 'all',
      collection: 'all',
      folder: '',
      sidebarMode: 'custom',
      customCollections: seedCustomCollections(CATALOG),
      pinnedFolders: [],
      hoverWidth: 520,
      hoverHeight: 340,
      layout: 'grid',
      tab: 'overview',
      lastCommand: null,
      agentModal: null,
      coverLayout: '9',
      cardSize: 'm',
      scanIntervalSec: 60,
      lastScanAt: 0,
      autoSnapshot: true,
      processes: cloneProcesses(PROCESS_SEED),
      skills: cloneSkills(SKILL_SEED),
      hotSkills: parseSkillCatalog(HOT_SKILL_CATALOG),
      skillTab: 'installed',
      skillQuery: '',
      catalogUrl: DEFAULT_SKILL_CATALOG_URL,
      lastCatalogAt: 0,
      jobs: [],
      doctor: null,
      load: null
    };
    if (!partial) return base;
    var next = {};
    for (var k in base) next[k] = base[k];
    for (var k2 in partial) next[k2] = partial[k2];
    return next;
  }

  function selectProject(state, id) {
    if (!state) state = createViewState();
    var next = createViewState(state);
    next.view = 'project';
    next.selectedId = id;
    next.tab = state && state.tab ? state.tab : 'overview';
    return next;
  }

  function goLibrary(state) {
    var next = createViewState(state);
    next.view = 'library';
    return next;
  }

  function setView(state, view) {
    var next = createViewState(state);
    next.view = view;
    if (view === 'library') {
      /* keep selectedId so 调整修改 can resume */
    }
    if (view === 'project' && next.selectedId) {
      next.view = 'project';
    }
    if (view === 'project' && !next.selectedId) {
      next.view = 'library';
    }
    return next;
  }

  function getProject(projects, id) {
    projects = projects || CATALOG;
    for (var i = 0; i < projects.length; i++) {
      if (projects[i].id === id) return projects[i];
    }
    return null;
  }

  function quotePath(path) {
    var s = String(path || '');
    if (!s) return '""';
    if (/[\s&()^<>|"']/.test(s) || /[^\x00-\x7F]/.test(s)) return '"' + s + '"';
    return s;
  }

  function buildAgentCommand(agent, project) {
    if (!project || !project.path) {
      throw new Error('project path required');
    }
    var a = String(agent || '').toLowerCase().replace(/\s+/g, '-');
    var path = quotePath(project.path);
    if (a === 'grok' || a === 'grok-build' || a === 'grokbuild') {
      return 'grok --cwd ' + path;
    }
    if (a === 'codex') {
      return 'codex --cd ' + path;
    }
    if (a === 'cursor') {
      return 'cursor ' + path;
    }
    if (a === 'claude' || a === 'claude-code') {
      return 'wt -d ' + path + ' claude';
    }
    if (a === 'code' || a === 'vscode' || a === 'vs-code') {
      return 'code ' + path;
    }
    throw new Error('unknown agent: ' + agent);
  }

  function buildCliCommand(action, project) {
    var key = String(action || '');
    var dir = project && project.path ? quotePath(project.path) : '.';
    switch (key) {
      case 'preview':
        return 'npx hyperframes preview ' + dir;
      case 'play':
        return 'npx hyperframes play ' + dir;
      case 'lint':
        return 'npx hyperframes lint ' + dir;
      case 'check':
        return 'npx hyperframes check ' + dir;
      case 'snapshot':
        return 'npx hyperframes snapshot ' + dir;
      case 'snapshot-9':
        return 'npx hyperframes snapshot ' + dir + ' --frames 9';
      case 'render':
        return 'npx hyperframes render ' + dir + ' --quality high --output out.mp4';
      case 'render-draft':
        return 'npx hyperframes render ' + dir + ' --quality draft';
      case 'doctor':
        return 'npx hyperframes doctor --json';
      case 'init':
        return 'npx hyperframes init my-video --non-interactive --example blank';
      case 'compositions':
        return 'npx hyperframes compositions ' + dir + ' --json';
      case 'upgrade':
        return 'npx hyperframes@latest upgrade --project ' + dir + ' --check';
      case 'info':
        return 'npx hyperframes info ' + dir + ' --json';
      case 'capture':
        return 'npx hyperframes capture https://example.com -o my-video';
      default:
        throw new Error('unknown action: ' + action);
    }
  }

  var api = {
    CATALOG: CATALOG,
    CLI_ACTIONS: CLI_ACTIONS,
    FRAME_BANK: FRAME_BANK,
    PROCESS_SEED: PROCESS_SEED,
    HOST_RESOURCES: HOST_RESOURCES,
    isRenderProcess: isRenderProcess,
    pauseRenderProcesses: pauseRenderProcesses,
    resumeRenderProcesses: resumeRenderProcesses,
    summarizeHyperFramesLoad: summarizeHyperFramesLoad,
    SKILL_SEED: SKILL_SEED,
    HOT_SKILL_CATALOG: HOT_SKILL_CATALOG,
    DEFAULT_SKILL_CATALOG_URL: DEFAULT_SKILL_CATALOG_URL,
    parseSkillCatalog: parseSkillCatalog,
    isValidCatalogUrl: isValidCatalogUrl,
    filterSkills: filterSkills,
    rateSkill: rateSkill,
    annotateSkill: annotateSkill,
    removeSkill: removeSkill,
    skillNeedsUpdate: skillNeedsUpdate,
    mergeHotWithInstalled: mergeHotWithInstalled,
    skillUpdateCommand: skillUpdateCommand,
    skillDeleteCommand: skillDeleteCommand,
    skillInstallCommand: skillInstallCommand,
    catalogCheckCommand: catalogCheckCommand,
    installHotSkill: installHotSkill,
    filterCatalog: filterCatalog,
    createViewState: createViewState,
    selectProject: selectProject,
    goLibrary: goLibrary,
    setView: setView,
    getProject: getProject,
    quotePath: quotePath,
    buildAgentCommand: buildAgentCommand,
    buildCliCommand: buildCliCommand,
    equalFrameTimes: equalFrameTimes,
    oddSecondTimes: oddSecondTimes,
    coverIndexPlan: coverIndexPlan,
    coverCells: coverCells,
    collectionsFromCatalog: collectionsFromCatalog,
    seedCustomCollections: seedCustomCollections,
    addCustomCollection: addCustomCollection,
    assignProjectToCollection: assignProjectToCollection,
    findCollection: findCollection,
    normalizePath: normalizePath,
    pathIsUnder: pathIsUnder,
    projectsUnderFolder: projectsUnderFolder,
    buildFolderTree: buildFolderTree,
    togglePinnedFolder: togglePinnedFolder,
    renamePinnedFolder: renamePinnedFolder,
    pinnedFolderLabel: pinnedFolderLabel,
    isFolderPinned: isFolderPinned,
    folderDisplayName: folderDisplayName,
    hoverHideDelayMs: hoverHideDelayMs,
    clampHoverSize: clampHoverSize,
    cardMinPx: cardMinPx,
    parseScanInterval: parseScanInterval,
    nextScanAt: nextScanAt,
    listOrphans: listOrphans,
    buildKillCommand: buildKillCommand,
    killProcesses: killProcesses,
    buildSnapshotCommand: buildSnapshotCommand,
    cloneProcesses: cloneProcesses,
    mount: mount,
    setCatalog: setCatalog,
    getUi: function () { return ui; },
    applyDesktopState: applyDesktopState,
    render: render,
    setViewTo: function (view) {
      if (!ui.state) return;
      ui.state = setView(ui.state, view);
      render();
    }
  };

  global.Framespace = api;
  if (typeof module !== 'undefined' && module.exports) {
    module.exports = api;
  }

  var ui = {
    state: null,
    root: null
  };

  function $(sel, root) {
    return (root || document).querySelector(sel);
  }
  function $all(sel, root) {
    return Array.prototype.slice.call((root || document).querySelectorAll(sel));
  }

  function statusLabel(s) {
    return ({
      ready: '可预览',
      findings: '有 finding',
      rendered: '已渲染',
      'stale-pin': 'pin 落后',
      draft: '草稿'
    })[s] || s;
  }

  function badgeClass(s) {
    if (s === 'findings') return 'badge bad';
    if (s === 'stale-pin') return 'badge warn';
    if (s === 'rendered' || s === 'ready') return 'badge ok';
    return 'badge';
  }

  function coverHtml(project, layout, extraClass) {
    var cells = coverCells(project, layout);
    var cls = 'cover layout-' + String(layout || '1') + (extraClass ? ' ' + extraClass : '');
    var inner = cells.map(function (c) {
      var style = c.src ? "background-image:url('" + c.src.replace(/'/g, '%27') + "')" : '';
      var poster = c.src ? '' : ' poster-instrument';
      return '<span class="cell' + poster + '" style="' + style + '"><em>' + formatTime(c.t) + '</em></span>';
    }).join('');
    return '<div class="' + cls + '">' + inner + '</div>';
  }

  function formatTime(t) {
    if (t == null) return '';
    var n = Math.round(Number(t) * 10) / 10;
    return (n % 1 === 0 ? n.toFixed(0) : n.toFixed(1)) + 's';
  }

  function visibleProjects() {
    return filterCatalog(CATALOG, {
      query: ui.state.query,
      workflow: ui.state.workflow,
      status: ui.state.status,
      collection: ui.state.collection,
      customCollections: ui.state.customCollections,
      folder: ui.state.folder
    });
  }

  function canDragProjects() {
    return ui.state.collection === 'all' && !ui.state.folder;
  }

  function renderLibrary() {
    var list = visibleProjects();
    var grid = $('#project-list');
    var rows = $('#project-rows');
    var count = $('#lib-count');
    var layout = ui.state.coverLayout || '9';
    if (count) {
      var ctx = '全部';
      if (ui.state.folder) ctx = ui.state.folder.split('\\').pop() || ui.state.folder;
      else if (ui.state.collection !== 'all') {
        var cc = findCollection(ui.state.customCollections, ui.state.collection);
        ctx = cc ? cc.name : ui.state.collection;
      }
      count.textContent = list.length + ' 个工程 · ' + ctx;
    }
    var gridEl = $('#library-grid');
    if (gridEl) gridEl.style.setProperty('--card-min', cardMinPx(ui.state.cardSize) + 'px');
    if (grid) {
      if (!list.length) {
        grid.innerHTML = '<div class="empty">没有匹配的 HyperFrames 工程。换个关键词，或清空过滤。</div>';
      } else {
        grid.innerHTML = list.map(function (p) {
          var sel = ui.state.selectedId === p.id ? ' is-sel' : '';
          var drag = canDragProjects() ? ' draggable="true" data-drag-project="' + p.id + '"' : '';
          return (
            '<button class="card' + sel + '" type="button" data-open-project="' + p.id + '" data-hover-project="' + p.id + '"' + drag + '>' +
              coverHtml(p, layout) +
              '<div class="card-body">' +
                '<div class="badge-row in-body">' +
                  '<span class="badge">' + p.workflow + '</span>' +
                  '<span class="' + badgeClass(p.status) + '">' + statusLabel(p.status) + '</span>' +
                '</div>' +
                '<h3>' + escapeHtml(p.name) + '</h3>' +
                '<div class="meta">' + p.duration + 's · ' + p.aspect + ' · 9 帧</div>' +
                '<div class="path" title="' + escapeHtml(p.path) + '">' + escapeHtml(p.path) + '</div>' +
              '</div>' +
            '</button>'
          );
        }).join('');
      }
    }
    if (rows) {
      rows.innerHTML = list.map(function (p) {
        var drag = canDragProjects() ? ' draggable="true" data-drag-project="' + p.id + '"' : '';
        return (
          '<button class="row" type="button" data-open-project="' + p.id + '" data-hover-project="' + p.id + '"' + drag + '>' +
            coverHtml(p, layout, 'mini-cover') +
            '<div><b>' + escapeHtml(p.name) + '</b><div class="meta">' + escapeHtml(p.brief) + '</div></div>' +
            '<div>' + p.workflow + '</div>' +
            '<div>' + p.duration + 's</div>' +
            '<div>' + p.pin + '</div>' +
            '<div>' + statusLabel(p.status) + '</div>' +
            '<div class="path">' + escapeHtml(p.path) + '</div>' +
          '</button>'
        );
      }).join('');
    }
    var listEl = $('#library-list');
    if (gridEl && listEl) {
      if (ui.state.layout === 'list') {
        gridEl.classList.add('is-off');
        listEl.classList.add('is-on');
      } else {
        gridEl.classList.remove('is-off');
        listEl.classList.remove('is-on');
      }
    }
    $all('[data-layout]').forEach(function (b) {
      b.classList.toggle('is-on', b.getAttribute('data-layout') === ui.state.layout);
    });
    $all('[data-card-size]').forEach(function (b) {
      b.classList.toggle('is-on', b.getAttribute('data-card-size') === ui.state.cardSize);
    });
    $all('[data-cover-layout]').forEach(function (b) {
      b.classList.toggle('is-on', b.getAttribute('data-cover-layout') === ui.state.coverLayout);
    });
    renderSidebar();
  }

  function mosaicFromProjects(projects) {
    var cells = (projects || []).slice(0, 4).map(function (p) {
      var c = coverCells(p, '1')[0];
      return c;
    });
    var html = cells.map(function (c) {
      var style = c && c.src ? "background-image:url('" + c.src.replace(/'/g, '%27') + "')" : '';
      return '<span class="cell' + (c && c.src ? '' : ' poster-instrument') + '" style="' + style + '"></span>';
    }).join('');
    while ((html.match(/class="cell/g) || []).length < 4) {
      html += '<span class="cell poster-instrument"></span>';
    }
    return '<div class="cover layout-4 series-mosaic">' + html + '</div>';
  }

  function renderSidebar() {
    $all('[data-sidebar-mode]').forEach(function (b) {
      b.classList.toggle('is-on', b.getAttribute('data-sidebar-mode') === ui.state.sidebarMode);
    });
    var customPane = $('#custom-pane');
    var folderPane = $('#folder-pane');
    if (customPane) customPane.style.display = ui.state.sidebarMode === 'custom' ? '' : 'none';
    if (folderPane) folderPane.style.display = ui.state.sidebarMode === 'folders' ? '' : 'none';
    renderPinned();
    renderCustomCollections();
    renderFolderTree();
  }

  function renderPinned() {
    var host = $('#pinned-folders');
    if (!host) return;
    var pins = (ui.state.pinnedFolders || []).map(normalizePinnedFolder).filter(Boolean);
    if (!pins.length) {
      host.innerHTML = '';
      host.style.display = 'none';
      return;
    }
    host.style.display = '';
    host.innerHTML = '<h4>钉住的文件夹</h4>' + pins.map(function (pin) {
      var members = projectsUnderFolder(CATALOG, pin.path);
      var label = pinnedFolderLabel(pin);
      var on = ui.state.folder === pin.path ? ' is-active' : '';
      var hoverId = members[0] && members[0].id;
      var hover = hoverId ? ' data-hover-project="' + hoverId + '"' : '';
      return (
        '<div class="pinned-card' + on + '">' +
          '<button class="series-card' + on + '" type="button" data-folder="' + escapeHtml(pin.path) + '"' + hover + ' title="' + escapeHtml(pin.path) + '">' +
            mosaicFromProjects(members) +
            '<div class="series-meta"><b>' + escapeHtml(label) + '</b><span>' + members.length + ' 个工程 · 文件夹</span></div>' +
          '</button>' +
          '<div class="pin-actions">' +
            '<button type="button" class="rename-btn" data-rename-pin="' + escapeHtml(pin.path) + '" title="改别名">改名</button>' +
            '<button type="button" class="pin-btn is-on" data-pin-folder="' + escapeHtml(pin.path) + '" title="取消钉住">📌</button>' +
          '</div>' +
        '</div>'
      );
    }).join('');
  }

  function renderCustomCollections() {
    var host = $('#series-list');
    if (!host) return;
    var cols = ui.state.customCollections || [];
    var allCells = mosaicFromProjects(CATALOG);
    var items = [
      { id: 'all', name: '全部', count: CATALOG.length, mosaic: allCells, hoverId: CATALOG[0] && CATALOG[0].id, drop: false }
    ].concat(cols.map(function (c) {
      var members = filterCatalog(CATALOG, { collection: c.id, customCollections: cols });
      return {
        id: c.id,
        name: c.name,
        count: members.length,
        mosaic: mosaicFromProjects(members),
        hoverId: members[0] && members[0].id,
        drop: true
      };
    }));
    host.innerHTML = items.map(function (it) {
      var on = !ui.state.folder && ui.state.collection === it.id ? ' is-active' : '';
      var hover = it.hoverId ? ' data-hover-project="' + it.hoverId + '"' : '';
      var drop = it.drop ? ' data-drop-collection="' + escapeHtml(it.id) + '"' : '';
      return (
        '<button class="series-card' + on + '" type="button" data-collection="' + escapeHtml(it.id) + '"' + hover + drop + '>' +
          it.mosaic +
          '<div class="series-meta"><b>' + escapeHtml(it.name) + '</b><span>' + it.count + ' 个工程' + (it.drop ? ' · 可拖入' : '') + '</span></div>' +
        '</button>'
      );
    }).join('');
  }

  function renderFolderTree() {
    var host = $('#folder-tree');
    if (!host) return;
    var tree = buildFolderTree(CATALOG);
    function nodeHtml(node, depth) {
      if (!node) return '';
      var on = ui.state.folder === node.path ? ' is-active' : '';
      var pinned = isFolderPinned(ui.state.pinnedFolders, node.path);
      var kids = (node.children || []).map(function (ch) {
        return nodeHtml(ch, depth + 1);
      }).join('');
      return (
        '<div class="folder-node" style="--d:' + depth + '">' +
          '<div class="folder-row' + on + '">' +
            '<button type="button" class="folder-name" data-folder="' + escapeHtml(node.path) + '" title="' + escapeHtml(node.path) + '" style="padding-left:' + (8 + depth * 12) + 'px">' +
              '<span class="folder-ico">📁</span> ' + escapeHtml(node.name) +
              '<em>' + node.projectCount + '</em></button>' +
            '<button type="button" class="pin-btn' + (pinned ? ' is-on' : '') + '" data-pin-folder="' + escapeHtml(node.path) + '" title="' + (pinned ? '取消钉住' : '钉在左侧') + '">' + (pinned ? '📌' : '📍') + '</button>' +
          '</div>' + kids +
        '</div>'
      );
    }
    host.innerHTML = nodeHtml(tree.root, 0);
  }

  function escapeHtml(s) {
    return String(s || '').replace(/[&<>"']/g, function (c) {
      return ({ '&': '&amp;', '<': '&lt;', '>': '&gt;', '"': '&quot;', "'": '&#39;' })[c];
    });
  }

  function clipsFor(project) {
    if (!project) return [];
    if (project.clips && project.clips.length) return project.clips;
    if (project.id === 'hx370-g3e-lineage') {
      return [
        { id: 'hx370', label: 'HX370', start: 0, dur: 0.5, track: 1 },
        { id: 'arrow-1', label: '箭头 1 + 定制', start: 0.5, dur: 1.2, track: 1 },
        { id: 'z2e', label: 'Z2 Extreme', start: 1.7, dur: 1.5, track: 1 },
        { id: 'ptl', label: 'Panther Lake', start: 3.6, dur: 1.2, track: 2 },
        { id: 'g3e', label: 'Arc G3 Extreme', start: 5.2, dur: 2.8, track: 2 }
      ];
    }
    if (project.id === 'claw8ex-g3e-spec-film') {
      return [
        { id: 't1', label: '整机表 · 电池/屏/内存', start: 0, dur: 26, track: 1 },
        { id: 't2', label: '两列芯片坐标', start: 26, dur: 19, track: 1 },
        { id: 't3', label: '表往下长出差异', start: 45, dur: 18, track: 1 },
        { id: 't4', label: '三列定位 Extreme', start: 63, dur: 17, track: 1 }
      ];
    }
    return [
      { id: 'in', label: '入场分层', start: 0, dur: 2.2, track: 1 },
      { id: 'hold', label: '参数表稳定', start: 2.2, dur: 5.6, track: 1 },
      { id: 'out', label: '反向离场', start: 7.8, dur: 2.2, track: 1 }
    ];
  }

  function renderProject() {
    var p = getProject(CATALOG, ui.state.selectedId);
    var empty = $('#project-empty');
    var filled = $('#project-filled');
    if (!p) {
      if (empty) empty.style.display = 'block';
      if (filled) filled.style.display = 'none';
      return;
    }
    if (empty) empty.style.display = 'none';
    if (filled) filled.style.display = 'block';

    setText('#project-kicker', p.collection + ' · ' + p.workflow);
    setText('#project-title', p.name);
    setText('#project-brief', p.brief);
    setText('#stat-dur', p.duration + 's');
    setText('#stat-aspect', p.aspect);
    setText('#stat-pin', 'hyperframes@' + p.pin);
    setText('#stat-status', statusLabel(p.status));
    setText('#insp-brief', p.brief);
    setText('#insp-brief-main', p.brief);
    setText('#insp-path', p.path);
    setText('#file-tree-name', p.name);

    var cmdBox = $('#cmd-box');
    if (cmdBox) {
      cmdBox.textContent = ui.state.lastCommand || '在工作台点一个动作，这里会出现对应的 HyperFrames / agent 命令。';
    }

    var clips = clipsFor(p);
    var tl = $('#timeline');
    if (tl) {
      tl.innerHTML = clips.map(function (c) {
        var left = Math.round((c.start / p.duration) * 100);
        var width = Math.max(6, Math.round((c.dur / p.duration) * 100));
        return (
          '<div class="clip">' +
            '<div>T' + c.track + '</div>' +
            '<div><b>' + escapeHtml(c.label) + '</b><div class="bar"><i style="width:' + width + '%;margin-left:' + left + '%"></i></div></div>' +
            '<div class="meta">' + c.start + '–' + (c.start + c.dur) + 's</div>' +
          '</div>'
        );
      }).join('');
    }

    var shots = $('#shots');
    if (shots) {
      var frames = coverCells(p, '9');
      shots.innerHTML = frames.map(function (c) {
        var img = c.src
          ? '<img src="' + c.src + '" alt="">'
          : '<div class="mini poster-instrument" style="width:100%;aspect-ratio:16/9"></div>';
        return '<figure>' + img + '<figcaption>' + formatTime(c.t) + ' · 等距</figcaption></figure>';
      }).join('');
    }
    var hero = $('#project-hero');
    if (hero) {
      hero.innerHTML = coverHtml(p, ui.state.coverLayout || '9', 'hero-cover');
      hero.className = 'hero';
      hero.style.backgroundImage = '';
    }

    var files = $('#file-list');
    if (files) {
      var names = (p.files && p.files.length)
        ? p.files
        : ['hyperframes.json', 'package.json', 'index.html', 'BRIEF.md', 'meta.json'];
      files.innerHTML = names.map(function (n) {
        return '<div class="file-item" data-open-file="' + escapeHtml(n) + '">' + escapeHtml(n) + '</div>';
      }).join('');
    }

    $all('.tabs button').forEach(function (b) {
      b.classList.toggle('is-on', b.getAttribute('data-tab') === ui.state.tab);
    });
    $all('.tab-panel').forEach(function (panel) {
      panel.classList.toggle('is-on', panel.id === 'tab-' + ui.state.tab);
    });
  }

  function setText(sel, text) {
    var el = $(sel);
    if (el) el.textContent = text;
  }

  function renderChrome() {
    var view = ui.state.view;
    $all('.view').forEach(function (v) {
      v.classList.toggle('is-on', v.getAttribute('data-view') === view);
    });
    $all('.rail button[data-nav]').forEach(function (b) {
      b.classList.toggle('is-active', b.getAttribute('data-nav') === view);
    });
    $all('.chip[data-collection]').forEach(function (b) {
      b.classList.toggle('is-active', b.getAttribute('data-collection') === ui.state.collection);
    });
    $all('.chip[data-workflow]').forEach(function (b) {
      b.classList.toggle('is-active', b.getAttribute('data-workflow') === ui.state.workflow);
    });
    $all('.chip[data-status]').forEach(function (b) {
      b.classList.toggle('is-active', b.getAttribute('data-status') === ui.state.status);
    });
    var search = $('#global-search');
    if (search && search.value !== ui.state.query) search.value = ui.state.query;
    setText('#status-view', viewName(view));
    setText('#status-sel', ui.state.selectedId || '未选中工程');
    setText('#status-count', CATALOG.length + ' 入库');
    var orphanN = listOrphans(ui.state.processes).length;
    setText('#status-proc', orphanN ? (orphanN + ' 个残留进程') : '无残留进程');
    var next = nextScanAt(ui.state.lastScanAt, ui.state.scanIntervalSec, Date.now());
    if (!ui.state.scanIntervalSec) setText('#status-scan', '扫描：手动');
    else if (!ui.state.lastScanAt) setText('#status-scan', '扫描：每 ' + (ui.state.scanIntervalSec / 60 >= 1 && ui.state.scanIntervalSec % 60 === 0 ? (ui.state.scanIntervalSec / 60) + ' 分钟' : ui.state.scanIntervalSec + ' 秒'));
    else if (next) {
      var sec = Math.max(0, Math.round((next - Date.now()) / 1000));
      setText('#status-scan', '下次扫描 ' + sec + 's');
    }
    var selCover = $('#set-cover-layout');
    if (selCover && selCover.value !== String(ui.state.coverLayout)) selCover.value = ui.state.coverLayout;
    var selScan = $('#set-scan-interval');
    if (selScan && selScan.value !== String(ui.state.scanIntervalSec)) selScan.value = String(ui.state.scanIntervalSec);
    var autoSnap = $('#set-auto-snapshot');
    if (autoSnap) autoSnap.checked = !!ui.state.autoSnapshot;
    renderOccupancy();
  }

  function meterClass(pct) {
    if (pct >= 80) return 'hot';
    if (pct >= 50) return 'warm';
    return '';
  }

  function renderOccupancy() {
    var load = ui.state.load || summarizeHyperFramesLoad(ui.state.processes, HOST_RESOURCES);
    function fill(barId, pctId, pct) {
      var bar = $(barId);
      if (bar) {
        bar.style.width = pct + '%';
        bar.parentNode.className = 'load-bar ' + meterClass(pct);
      }
      setText(pctId, pct + '%');
    }
    fill('#bar-cpu', '#pct-cpu', load.cpu);
    fill('#bar-mem', '#pct-mem', load.mem);
    fill('#bar-gpu', '#pct-gpu', load.gpuKnown === false ? 0 : load.gpu);
    setText('#chip-cpu', 'CPU ' + load.cpu + '%');
    setText('#chip-mem', '内存 ' + load.mem + '%');
    setText('#chip-gpu', load.gpuKnown === false ? '显卡 —' : ('显卡 ' + load.gpu + '%'));
    var kicker = load.rendering
      ? ('渲染中 · ' + load.processCount + ' 进程 · ' + load.orphanCount + ' 残留')
      : (load.paused
        ? ('渲染已暂停 · ' + load.processCount + ' 进程')
        : (load.processCount ? (load.processCount + ' 进程 · ' + load.orphanCount + ' 残留') : '空闲'));
    setText('#load-kicker', kicker);
    setText('#status-proc', 'CPU ' + load.cpu + '% · 内存 ' + load.mem + '% · GPU ' + load.gpu + '%');
    var pauseLabel = load.paused && !load.rendering ? '继续渲染' : '暂停渲染';
    $all('[data-pause-render]').forEach(function (b) { b.textContent = pauseLabel; });
  }

  function viewName(v) {
    return ({
      library: '项目库',
      project: '调整修改',
      jobs: '任务队列',
      processes: '进程',
      skills: 'Skills',
      doctor: '环境诊断',
      plan: '功能规划',
      settings: '设置'
    })[v] || v;
  }

  function renderProcesses() {
    var host = $('#process-rows');
    if (!host) return;
    var list = ui.state.processes || [];
    var orphans = listOrphans(list);
    setText('#proc-summary', list.length + ' 个相关进程 · ' + orphans.length + ' 个残留');
    if (!list.length) {
      host.innerHTML = '<div class="empty">没有 HyperFrames 相关进程。</div>';
      return;
    }
    renderOccupancy();
    host.innerHTML = list.map(function (p) {
      return (
        '<div class="proc' + (p.orphan ? ' is-orphan' : '') + (p.paused ? ' is-paused' : '') + '">' +
          '<div><b>' + escapeHtml(p.name) + ' · ' + escapeHtml(p.kind) + (p.paused ? ' · 已暂停' : '') + '</b>' +
            '<div class="meta">' + escapeHtml(p.cmd) + '</div></div>' +
          '<div class="meta">' + escapeHtml(p.project || '—') + '</div>' +
          '<div class="meta">pid ' + p.pid + (p.port ? ' · :' + p.port : '') + '</div>' +
          '<div class="meta">' + (p.orphan ? '残留 ' : '') + p.ageMin + ' min</div>' +
          '<button class="btn" type="button" data-kill-pid="' + p.pid + '">结束</button>' +
        '</div>'
      );
    }).join('');
  }

  function starsHtml(id, rating) {
    var r = Number(rating) || 0;
    var out = '';
    for (var i = 1; i <= 5; i++) {
      out += '<button type="button" class="star' + (i <= r ? ' is-on' : '') + '" data-rate-skill="' + escapeHtml(id) + '" data-rate="' + i + '">★</button>';
    }
    return '<span class="stars">' + out + '</span>';
  }

  function renderSkills() {
    var host = $('#skill-list');
    if (!host) return;
    $all('[data-skill-tab]').forEach(function (b) {
      b.classList.toggle('is-on', b.getAttribute('data-skill-tab') === ui.state.skillTab);
    });
    var urlInput = $('#skill-catalog-url');
    if (urlInput && urlInput.value !== ui.state.catalogUrl) urlInput.value = ui.state.catalogUrl;
    var q = ui.state.skillQuery || '';
    var search = $('#skill-search');
    if (search && search.value !== q) search.value = q;
    if (ui.state.skillTab === 'hot') {
      var merged = mergeHotWithInstalled(ui.state.hotSkills, ui.state.skills);
      merged = filterSkills(merged, q);
      setText('#skill-count', merged.length + ' 个热门 · catalog ' + (ui.state.lastCatalogAt ? '已检查' : '未检查'));
      if (!merged.length) {
        host.innerHTML = '<div class="empty">还没有热门列表。点「检查热门」读取 GitHub 上的 catalog.json。</div>';
        return;
      }
      host.innerHTML = merged.map(function (s) {
        var status = s.installed
          ? (s.updateAvailable ? '<span class="badge warn">可更新 ' + escapeHtml(s.localVersion) + ' → ' + escapeHtml(s.version) + '</span>' : '<span class="badge ok">已安装</span>')
          : '<span class="badge">未安装</span>';
        var action = s.installed
          ? (s.updateAvailable
            ? '<button class="btn-amber" type="button" data-update-skill="' + escapeHtml(s.id) + '">更新</button>'
            : '')
          : '<button class="btn-amber" type="button" data-install-skill="' + escapeHtml(s.id) + '">下载</button>';
        return (
          '<div class="skill-card">' +
            '<div><b>' + escapeHtml(s.name) + '</b>' +
              '<div class="meta">' + escapeHtml(s.summary) + '</div>' +
              '<div class="path">' + escapeHtml(s.repo) + ' · v' + escapeHtml(s.version) + ' · ★' + s.stars + ' · ' + s.downloads + ' 次</div></div>' +
            '<div>' + status + '</div>' +
            '<div class="skill-actions">' + action + '</div>' +
          '</div>'
        );
      }).join('');
      return;
    }
    var list = filterSkills(ui.state.skills, q);
    setText('#skill-count', list.length + ' 个已安装');
    if (!list.length) {
      host.innerHTML = '<div class="empty">没有匹配的 skill。</div>';
      return;
    }
    host.innerHTML = list.map(function (s) {
      return (
        '<div class="skill-card">' +
          '<div><b>' + escapeHtml(s.name) + '</b>' +
            '<div class="meta">' + escapeHtml(s.summary) + (s.note ? ' · 备注：' + escapeHtml(s.note) : '') + '</div>' +
            '<div class="path">' + escapeHtml(s.source) + ' · ' + escapeHtml(s.path) + ' · v' + escapeHtml(s.version) + '</div></div>' +
          starsHtml(s.id, s.rating) +
          '<div class="skill-actions">' +
            '<button class="btn-ghost" type="button" data-note-skill="' + escapeHtml(s.id) + '">备注</button>' +
            '<button class="btn" type="button" data-update-skill="' + escapeHtml(s.id) + '">更新</button>' +
            '<button class="btn" type="button" data-delete-skill="' + escapeHtml(s.id) + '">删除</button>' +
          '</div>' +
        '</div>'
      );
    }).join('');
  }

  function renderModal() {
    var back = $('#agent-modal');
    if (!back) return;
    var modal = ui.state.agentModal;
    back.classList.toggle('is-on', !!modal);
    if (!modal) return;
    setText('#agent-modal-title', modal.title);
    setText('#agent-modal-copy', modal.note);
    var pre = $('#agent-modal-cmd');
    if (pre) pre.textContent = modal.command;
  }

  function showHover(id, rect) {
    var pop = $('#hover-preview');
    var inner = $('#hover-preview-inner');
    if (!pop || !inner) return;
    var p = getProject(CATALOG, id);
    if (!p) { pop.classList.remove('is-on'); return; }
    if (pop.getAttribute('data-for') !== id) {
      pop.setAttribute('data-for', id);
      var hero = coverCells(p, '1')[0];
      var strip = coverCells(p, '9');
      var img = hero && hero.src
        ? '<div class="hover-hero" style="background-image:url(\'' + hero.src.replace(/'/g, '%27') + '\')"></div>'
        : '<div class="hover-hero poster-instrument"></div>';
      inner.innerHTML =
        img +
        '<div class="hover-body">' +
          '<b>' + escapeHtml(p.name) + '</b>' +
          '<div class="meta">' + p.duration + 's · 等距 9 帧（含首尾）</div>' +
          '<div class="hover-strip">' + strip.map(function (c) {
            var st = c.src ? "background-image:url('" + c.src.replace(/'/g, '%27') + "')" : '';
            return '<span style="' + st + '"><em>' + formatTime(c.t) + '</em></span>';
          }).join('') + '</div>' +
          '<div class="meta hover-hint">拖右下角可调大小 · 离开后 1 秒关闭</div>' +
        '</div>';
    }
    var size = clampHoverSize(ui.state.hoverWidth, ui.state.hoverHeight);
    pop.style.width = size.width + 'px';
    pop.style.height = size.height + 'px';
    var w = size.width;
    var left = rect ? rect.right + 12 : 80;
    if (typeof window !== 'undefined') {
      if (left + w > window.innerWidth - 16) left = (rect ? rect.left - w - 12 : 16);
      if (left < 8) left = 8;
    }
    var top = rect ? rect.top : 64;
    if (typeof window !== 'undefined' && top + size.height > window.innerHeight) {
      top = window.innerHeight - size.height - 16;
    }
    if (top < 48) top = 48;
    pop.style.left = left + 'px';
    pop.style.top = top + 'px';
    pop.classList.add('is-on');
  }

  function hideHover() {
    var pop = $('#hover-preview');
    if (pop) pop.classList.remove('is-on');
  }

  function hoverContains(el) {
    var pop = $('#hover-preview');
    return !!(pop && el && pop.contains(el));
  }

  function setCatalog(projects) {
    CATALOG.length = 0;
    (projects || []).forEach(function (item) { CATALOG.push(item); });
    return CATALOG;
  }

  function applyDesktopState(payload) {
    payload = payload || {};
    if (!ui.state) ui.state = createViewState();
    if (payload.projects) setCatalog(payload.projects);
    if (payload.processes) ui.state.processes = payload.processes;
    if (payload.skills) ui.state.skills = payload.skills;
    if (payload.hotSkills) ui.state.hotSkills = payload.hotSkills;
    if (payload.jobs) ui.state.jobs = payload.jobs;
    if (payload.doctor) ui.state.doctor = payload.doctor;
    if (payload.load) ui.state.load = payload.load;
    if (payload.lastCommand) ui.state.lastCommand = payload.lastCommand;
    if (payload.lastScanAt) ui.state.lastScanAt = payload.lastScanAt;
    render();
  }

  function renderJobs() {
    var host = $('#job-rows');
    if (!host) return;
    var list = ui.state.jobs || [];
    if (!list.length) {
      host.innerHTML = '<div class="empty">还没有任务。在工程里点预览 / check / 渲染即可加入队列。</div>';
      return;
    }
    host.innerHTML = list.map(function (j) {
      var cls = 'job' + (j.status === 'error' ? ' is-error' : '') + (j.status === 'done' ? ' is-done' : '');
      var label = j.status === 'running' ? '进行中' : (j.status === 'done' ? '完成' : (j.status === 'error' ? '失败' : j.status));
      return '<div class="' + cls + '">' +
        '<div><b>' + escapeHtml(j.title || j.action) + '</b><div class="meta">' + escapeHtml(j.command || '') + '</div></div>' +
        '<div>' + escapeHtml(j.action || '') + '</div>' +
        '<div class="bar-lg"><i style="width:' + (j.progress || 0) + '%"></i></div>' +
        '<div class="meta">' + escapeHtml(label) + '</div>' +
        (j.log ? '<pre>' + escapeHtml(j.log.slice(-800)) + '</pre>' : '') +
      '</div>';
    }).join('');
  }

  function renderDoctor() {
    var host = $('#doctor-grid');
    if (!host) return;
    var cards = (ui.state.doctor && ui.state.doctor.cards) || [];
    if (!cards.length) {
      host.innerHTML = '<div class="doc-card"><b>环境诊断</b><div class="meta">打开本页时会探测 Node / CLI / FFmpeg</div></div>';
      return;
    }
    host.innerHTML = cards.map(function (card) {
      var kind = card.ok ? 'ok' : (card.warn ? 'warn' : 'bad');
      return '<div class="doc-card"><b>' + escapeHtml(card.title) + '</b><div class="' + kind + '">' + escapeHtml(card.detail || '') + '</div></div>';
    }).join('');
  }

  function runScan(reason) {
    if (global.FramespaceDesktop && global.FramespaceDesktop.scan) {
      global.FramespaceDesktop.scan(reason);
      return;
    }
    ui.state.lastScanAt = Date.now();
    var cmds = CATALOG.map(function (p) {
      return buildSnapshotCommand(p, { count: 9 });
    });
    ui.state.lastCommand = ui.state.autoSnapshot
      ? cmds.slice(0, 2).join('\n') + '\n# …共 ' + CATALOG.length + ' 个工程 --frames 9'
      : '# scan only';
    render();
    toast(reason === 'timer'
      ? '定时扫描完成' + (ui.state.autoSnapshot ? ' · 已等距抽 9 帧' : '')
      : '扫描完成' + (ui.state.autoSnapshot ? ' · 已等距抽 9 帧' : ''));
  }

  function armScanTimer() {
    if (ui.scanTimer && global.clearInterval) global.clearInterval(ui.scanTimer);
    ui.scanTimer = null;
    if (!ui.state || !ui.state.scanIntervalSec) return;
    if (typeof global.setInterval !== 'function') return;
    ui.scanTimer = global.setInterval(function () {
      runScan('timer');
    }, ui.state.scanIntervalSec * 1000);
  }

  function render() {
    renderChrome();
    renderLibrary();
    renderProject();
    renderProcesses();
    renderSkills();
    renderJobs();
    renderDoctor();
    renderModal();
    syncLivePreview();
  }

  function syncLivePreview() {
    var d = global.FramespaceDesktop;
    if (!d || !d.syncPreview) return;
    if (ui.state && ui.state.view === 'project' && ui.state.selectedId) {
      d.syncPreview(getProject(CATALOG, ui.state.selectedId));
    } else {
      d.syncPreview(null);
    }
  }

  function openProject(id) {
    ui.state = selectProject(ui.state, id);
    render();
  }

  function runAgent(agent) {
    var p = getProject(CATALOG, ui.state.selectedId);
    if (!p) {
      toast('先在项目库里选一个工程');
      return;
    }
    var cmd = buildAgentCommand(agent, p);
    ui.state.lastCommand = cmd;
    if (global.FramespaceDesktop && global.FramespaceDesktop.runAgent) {
      global.FramespaceDesktop.runAgent(agent, p);
      render();
      return;
    }
    ui.state.agentModal = {
      agent: agent,
      command: cmd,
      title: agent === 'claude' ? '在此工程打开 Claude Code' : (agent === 'cursor' ? '在此工程打开 Cursor' : (agent.indexOf('chatgpt') === 0 ? '打开 ChatGPT 桌面' : '在此工程打开 Grok Build')),
      note: '工作目录会切到该 HyperFrames 工程根（hyperframes.json 所在层）。确认后会真正启动。'
    };
    render();
  }

  function runCli(action) {
    var p = getProject(CATALOG, ui.state.selectedId);
    if (action !== 'init' && action !== 'doctor' && !p) {
      toast('先选一个工程再跑 CLI');
      return;
    }
    var cmd = buildCliCommand(action, p);
    ui.state.lastCommand = cmd;
    if (global.FramespaceDesktop && global.FramespaceDesktop.runCli) {
      global.FramespaceDesktop.runCli(action, p);
      render();
      return;
    }
    render();
    toast('已生成命令（未执行）：' + action);
  }

  function toast(msg) {
    var el = $('#toast');
    if (!el) return;
    el.textContent = msg;
    el.classList.add('is-on');
    global.clearTimeout(toast._t);
    toast._t = global.setTimeout(function () {
      el.classList.remove('is-on');
    }, 2200);
  }

  function bind() {
    var root = ui.root;
    root.addEventListener('click', function (ev) {
      var t = ev.target;
      if (!t || !t.closest) return;
      var nav = t.closest('[data-nav]');
      if (nav) {
        ui.state = setView(ui.state, nav.getAttribute('data-nav'));
        render();
        return;
      }
      var open = t.closest('[data-open-project]');
      if (open) {
        hideHover();
        openProject(open.getAttribute('data-open-project'));
        return;
      }
      var renamePin = t.closest('[data-rename-pin]');
      if (renamePin) {
        ev.preventDefault();
        ev.stopPropagation();
        var renamePath = renamePin.getAttribute('data-rename-pin');
        var current = (ui.state.pinnedFolders || []).map(normalizePinnedFolder).filter(function (e) {
          return e.path === normalizePath(renamePath);
        })[0];
        var currentLabel = pinnedFolderLabel(current || renamePath);
        var nextName = currentLabel;
        if (typeof global.prompt === 'function') {
          var typed = global.prompt('文件夹别名（留空则用目录名）', currentLabel);
          if (typed === null) return;
          nextName = typed;
        }
        ui.state.pinnedFolders = renamePinnedFolder(ui.state.pinnedFolders, renamePath, nextName);
        render();
        toast('别名：' + pinnedFolderLabel({ path: renamePath, alias: String(nextName || '').trim() }));
        return;
      }
      var pinF = t.closest('[data-pin-folder]');
      if (pinF) {
        ev.preventDefault();
        ev.stopPropagation();
        var pinPath = pinF.getAttribute('data-pin-folder');
        var willPin = !isFolderPinned(ui.state.pinnedFolders, pinPath);
        ui.state.pinnedFolders = togglePinnedFolder(ui.state.pinnedFolders, pinPath);
        render();
        toast((willPin ? '已钉住 ' : '已取消钉住 ') + folderDisplayName(pinPath));
        return;
      }
      var folderBtn = t.closest('[data-folder]');
      if (folderBtn) {
        ui.state.folder = folderBtn.getAttribute('data-folder');
        ui.state.collection = 'all';
        ui.state.view = 'library';
        render();
        return;
      }
      var modeBtn = t.closest('[data-sidebar-mode]');
      if (modeBtn) {
        ui.state.sidebarMode = modeBtn.getAttribute('data-sidebar-mode');
        render();
        return;
      }
      var addCol = t.closest('[data-add-collection]');
      if (addCol) {
        var name = '新分组';
        if (typeof global.prompt === 'function') {
          var typed = global.prompt('自定义项目名称', '新分组');
          if (typed === null) return;
          name = typed;
        }
        var added = addCustomCollection(ui.state.customCollections, name);
        ui.state.customCollections = added.collections;
        ui.state.collection = added.id;
        ui.state.folder = '';
        ui.state.sidebarMode = 'custom';
        render();
        toast('已新建自定义项目：' + (findCollection(added.collections, added.id) || {}).name);
        return;
      }
      var col = t.closest('[data-collection]');
      if (col) {
        ui.state.collection = col.getAttribute('data-collection');
        ui.state.folder = '';
        ui.state.view = 'library';
        render();
        return;
      }
      var wf = t.closest('[data-workflow]');
      if (wf) {
        ui.state.workflow = wf.getAttribute('data-workflow');
        render();
        return;
      }
      var st = t.closest('[data-status]');
      if (st) {
        ui.state.status = st.getAttribute('data-status');
        render();
        return;
      }
      var layout = t.closest('[data-layout]');
      if (layout) {
        ui.state.layout = layout.getAttribute('data-layout');
        render();
        return;
      }
      var cardSize = t.closest('[data-card-size]');
      if (cardSize) {
        ui.state.cardSize = cardSize.getAttribute('data-card-size');
        render();
        return;
      }
      var coverLay = t.closest('[data-cover-layout]');
      if (coverLay) {
        ui.state.coverLayout = coverLay.getAttribute('data-cover-layout');
        render();
        return;
      }
      var scanBtn = t.closest('[data-run-scan]');
      if (scanBtn) {
        runScan('manual');
        return;
      }
      var skillTab = t.closest('[data-skill-tab]');
      if (skillTab) {
        ui.state.skillTab = skillTab.getAttribute('data-skill-tab');
        render();
        return;
      }
      var rateBtn = t.closest('[data-rate-skill]');
      if (rateBtn) {
        ui.state.skills = rateSkill(ui.state.skills, rateBtn.getAttribute('data-rate-skill'), rateBtn.getAttribute('data-rate'));
        render();
        return;
      }
      var noteBtn = t.closest('[data-note-skill]');
      if (noteBtn) {
        var sid = noteBtn.getAttribute('data-note-skill');
        var cur = findSkill(ui.state.skills, sid);
        var typed = cur && cur.note ? cur.note : '';
        if (typeof global.prompt === 'function') {
          var nextNote = global.prompt('给这个 skill 写备注', typed);
          if (nextNote === null) return;
          typed = nextNote;
        }
        ui.state.skills = annotateSkill(ui.state.skills, sid, typed);
        render();
        toast('已保存备注');
        return;
      }
      var delBtn = t.closest('[data-delete-skill]');
      if (delBtn) {
        var ds = findSkill(ui.state.skills, delBtn.getAttribute('data-delete-skill'));
        if (!ds) return;
        ui.state.lastCommand = skillDeleteCommand(ds);
        ui.state.skills = removeSkill(ui.state.skills, ds.id);
        render();
        toast('已删除 ' + ds.name + '（设计稿）');
        return;
      }
      var updBtn = t.closest('[data-update-skill]');
      if (updBtn) {
        var us = findSkill(ui.state.skills, updBtn.getAttribute('data-update-skill'));
        if (!us) {
          var hotU = findSkill(ui.state.hotSkills, updBtn.getAttribute('data-update-skill'));
          us = hotU;
        }
        if (!us) return;
        ui.state.lastCommand = skillUpdateCommand(us);
        var remote = findSkill(ui.state.hotSkills, us.id);
        if (remote && remote.version) {
          ui.state.skills = (ui.state.skills || []).map(function (s) {
            if (s.id !== us.id) return s;
            var c = {};
            for (var k in s) c[k] = s[k];
            c.version = remote.version;
            return c;
          });
        }
        render();
        toast('已更新 ' + us.id + '（设计稿）');
        return;
      }
      var instBtn = t.closest('[data-install-skill]');
      if (instBtn) {
        var hot = findSkill(ui.state.hotSkills, instBtn.getAttribute('data-install-skill'));
        if (!hot) return;
        ui.state.lastCommand = skillInstallCommand(hot);
        ui.state.skills = installHotSkill(ui.state.skills, hot);
        render();
        toast('已下载 ' + hot.id + '（设计稿）');
        return;
      }
      var checkCat = t.closest('[data-check-catalog]');
      if (checkCat) {
        var url = ui.state.catalogUrl || DEFAULT_SKILL_CATALOG_URL;
        if (!isValidCatalogUrl(url)) {
          toast('catalog URL 需要是 GitHub 上的 catalog.json');
          return;
        }
        ui.state.lastCommand = catalogCheckCommand(url);
        if (global.FramespaceDesktop && global.FramespaceDesktop.fetchCatalog) {
          global.FramespaceDesktop.fetchCatalog(url).then(function (payload) {
            try {
              ui.state.hotSkills = parseSkillCatalog(payload);
              ui.state.lastCatalogAt = Date.now();
              ui.state.skillTab = 'hot';
              render();
              toast('已读取 GitHub catalog.json');
            } catch (err) {
              toast(err.message || 'catalog 无法解析');
            }
          }).catch(function (err) {
            ui.state.hotSkills = parseSkillCatalog(HOT_SKILL_CATALOG);
            ui.state.skillTab = 'hot';
            render();
            toast('远程 catalog 失败，用内置列表：' + (err.message || err));
          });
          return;
        }
        ui.state.hotSkills = parseSkillCatalog(HOT_SKILL_CATALOG);
        ui.state.lastCatalogAt = Date.now();
        ui.state.skillTab = 'hot';
        render();
        toast('已读取 GitHub catalog.json（设计稿用内置热门列表）');
        return;
      }
      var killAll = t.closest('[data-kill-orphans]');
      if (killAll) {
        var orphans = listOrphans(ui.state.processes);
        if (global.FramespaceDesktop && global.FramespaceDesktop.kill) {
          global.FramespaceDesktop.kill(orphans.map(function (p) { return p.pid; }));
          ui.state.lastCommand = orphans.map(buildKillCommand).join('\n');
          return;
        }
        var result = killProcesses(ui.state.processes, function (p) { return !!p.orphan; });
        ui.state.processes = result.remaining;
        ui.state.lastCommand = result.killed.map(buildKillCommand).join('\n');
        render();
        toast('已清理 ' + result.killed.length + ' 个残留进程（设计稿）');
        return;
      }
      var pauseR = t.closest('[data-pause-render]');
      if (pauseR) {
        var renders = (ui.state.processes || []).filter(isRenderProcess);
        if (global.FramespaceDesktop && global.FramespaceDesktop.kill && renders.length) {
          global.FramespaceDesktop.kill(renders.map(function (p) { return p.pid; }));
          toast('已停止渲染相关进程');
          return;
        }
        if (hasActiveRender(ui.state.processes)) {
          ui.state.processes = pauseRenderProcesses(ui.state.processes);
          ui.state.lastCommand = '# pause HyperFrames render (chrome --headless / ffmpeg)';
          toast('已暂停渲染（设计稿）');
        } else if (hasPausedRender(ui.state.processes)) {
          ui.state.processes = resumeRenderProcesses(ui.state.processes);
          toast('已继续渲染（设计稿）');
        } else {
          toast('没有正在渲染的任务');
        }
        render();
        return;
      }
      var killOne = t.closest('[data-kill-pid]');
      if (killOne) {
        var pid = Number(killOne.getAttribute('data-kill-pid'));
        if (global.FramespaceDesktop && global.FramespaceDesktop.kill) {
          global.FramespaceDesktop.kill([pid]);
          return;
        }
        var one = killProcesses(ui.state.processes, function (p) { return p.pid === pid; });
        ui.state.processes = one.remaining;
        ui.state.lastCommand = one.killed[0] ? buildKillCommand(one.killed[0]) : '';
        render();
        toast('已结束 pid ' + pid + '（设计稿）');
        return;
      }
      var tab = t.closest('[data-tab]');
      if (tab) {
        ui.state.tab = tab.getAttribute('data-tab');
        render();
        return;
      }
      var agent = t.closest('[data-agent]');
      if (agent) {
        runAgent(agent.getAttribute('data-agent'));
        return;
      }
      var cli = t.closest('[data-cli]');
      if (cli) {
        runCli(cli.getAttribute('data-cli'));
        return;
      }
      if (t.closest('[data-close-modal]')) {
        ui.state.agentModal = null;
        render();
        return;
      }
      if (t.closest('[data-run-modal]')) {
        var modal = ui.state.agentModal;
        if (modal && global.FramespaceDesktop && global.FramespaceDesktop.runAgent) {
          var proj = getProject(CATALOG, ui.state.selectedId);
          global.FramespaceDesktop.runAgent(modal.agent, proj);
        }
        ui.state.agentModal = null;
        render();
        return;
      }
      if (t.closest('[data-copy-cmd]')) {
        var cmd = ui.state.agentModal && ui.state.agentModal.command;
        if (cmd && navigator.clipboard && navigator.clipboard.writeText) {
          navigator.clipboard.writeText(cmd)['catch'](function () {});
        }
        toast('已复制启动命令');
        ui.state.agentModal = null;
        render();
        return;
      }
      if (t.closest('[data-preview-reload]')) {
        if (global.FramespaceDesktop && global.FramespaceDesktop.reloadPreview) global.FramespaceDesktop.reloadPreview();
        return;
      }
      if (t.closest('[data-preview-stop]')) {
        if (global.FramespaceDesktop && global.FramespaceDesktop.stopPreview) global.FramespaceDesktop.stopPreview();
        return;
      }
      var openFile = t.closest('[data-open-file]');
      if (openFile) {
        var proj2 = getProject(CATALOG, ui.state.selectedId);
        if (proj2 && global.FramespaceDesktop && global.FramespaceDesktop.openPath) {
          var name = openFile.getAttribute('data-open-file') || '';
          var full = proj2.path + '\\' + name.replace(/[\\/]$/, '');
          if (/[\\/]$/.test(name) && global.FramespaceDesktop.reveal) global.FramespaceDesktop.reveal(full);
          else global.FramespaceDesktop.openPath(full);
        }
        return;
      }
    });

    var search = $('#global-search', root);
    if (search) {
      search.addEventListener('input', function () {
        ui.state.query = search.value;
        ui.state.view = 'library';
        render();
      });
    }

    var coverSel = $('#set-cover-layout', root);
    if (coverSel) {
      coverSel.addEventListener('change', function () {
        ui.state.coverLayout = coverSel.value;
        render();
        if (global.FramespaceDesktop && global.FramespaceDesktop.persist) global.FramespaceDesktop.persist();
      });
    }
    var scanSel = $('#set-scan-interval', root);
    if (scanSel) {
      scanSel.addEventListener('change', function () {
        ui.state.scanIntervalSec = parseScanInterval(scanSel.value);
        armScanTimer();
        render();
        if (global.FramespaceDesktop && global.FramespaceDesktop.persist) global.FramespaceDesktop.persist();
      });
    }
    var autoSnap = $('#set-auto-snapshot', root);
    if (autoSnap) {
      autoSnap.addEventListener('change', function () {
        ui.state.autoSnapshot = !!autoSnap.checked;
        render();
        if (global.FramespaceDesktop && global.FramespaceDesktop.persist) global.FramespaceDesktop.persist();
      });
    }
    var rootsBox = $('#set-scan-roots', root);
    if (rootsBox) {
      rootsBox.addEventListener('change', function () {
        var roots = String(rootsBox.value || '').split(/\r?\n/).map(function (s) { return s.trim(); }).filter(Boolean);
        if (window.framespaceAPI) window.framespaceAPI.saveSettings({ scanRoots: roots });
      });
    }
    var agentSel = $('#set-agent', root);
    if (agentSel) {
      agentSel.addEventListener('change', function () {
        if (window.framespaceAPI) window.framespaceAPI.saveSettings({ defaultAgent: agentSel.value });
      });
    }
    var termSel = $('#set-terminal', root);
    if (termSel) {
      termSel.addEventListener('change', function () {
        if (window.framespaceAPI) window.framespaceAPI.saveSettings({ terminal: termSel.value });
      });
    }
    var skillSearch = $('#skill-search', root);
    if (skillSearch) {
      skillSearch.addEventListener('input', function () {
        ui.state.skillQuery = skillSearch.value;
        render();
      });
    }
    var catUrl = $('#skill-catalog-url', root);
    if (catUrl) {
      catUrl.addEventListener('change', function () {
        ui.state.catalogUrl = catUrl.value.trim();
      });
    }

    var hoverShowTimer = null;
    var hoverHideTimer = null;
    function cancelHoverTimers() {
      global.clearTimeout(hoverShowTimer);
      global.clearTimeout(hoverHideTimer);
    }
    function scheduleHideHover() {
      global.clearTimeout(hoverHideTimer);
      hoverHideTimer = global.setTimeout(function () {
        hideHover();
      }, hoverHideDelayMs());
    }
    root.addEventListener('mouseover', function (ev) {
      var card = ev.target && ev.target.closest && ev.target.closest('[data-hover-project]');
      if (!card || ui.state.view !== 'library') return;
      if (ev.target.closest('[data-drop-collection]') && ev.target.closest('[data-collection="all"]')) return;
      var id = card.getAttribute('data-hover-project');
      cancelHoverTimers();
      hoverShowTimer = global.setTimeout(function () {
        showHover(id, card.getBoundingClientRect());
      }, 180);
    });
    root.addEventListener('mouseout', function (ev) {
      var card = ev.target && ev.target.closest && ev.target.closest('[data-hover-project]');
      var rel = ev.relatedTarget;
      if (hoverContains(rel)) {
        cancelHoverTimers();
        return;
      }
      if (card && rel && card.contains(rel)) return;
      global.clearTimeout(hoverShowTimer);
      scheduleHideHover();
    });
    var pop = $('#hover-preview');
    if (pop) {
      pop.addEventListener('mouseenter', function () {
        cancelHoverTimers();
      });
      pop.addEventListener('mouseleave', function () {
        scheduleHideHover();
      });
      var handle = $('#hover-resizer');
      if (handle) {
        handle.addEventListener('mousedown', function (ev) {
          ev.preventDefault();
          ev.stopPropagation();
          cancelHoverTimers();
          var startX = ev.clientX;
          var startY = ev.clientY;
          var startW = pop.offsetWidth;
          var startH = pop.offsetHeight;
          function move(e) {
            var size = clampHoverSize(startW + (e.clientX - startX), startH + (e.clientY - startY));
            ui.state.hoverWidth = size.width;
            ui.state.hoverHeight = size.height;
            pop.style.width = size.width + 'px';
            pop.style.height = size.height + 'px';
          }
          function up() {
            document.removeEventListener('mousemove', move);
            document.removeEventListener('mouseup', up);
          }
          document.addEventListener('mousemove', move);
          document.addEventListener('mouseup', up);
        });
      }
    }

    root.addEventListener('dragstart', function (ev) {
      var card = ev.target && ev.target.closest && ev.target.closest('[data-drag-project]');
      if (!card) return;
      var id = card.getAttribute('data-drag-project');
      ev.dataTransfer.setData('text/plain', id);
      ev.dataTransfer.effectAllowed = 'copy';
      hideHover();
      root.classList.add('is-dragging');
    });
    root.addEventListener('dragend', function () {
      root.classList.remove('is-dragging');
      $all('.is-drop').forEach(function (el) { el.classList.remove('is-drop'); });
    });
    root.addEventListener('dragover', function (ev) {
      var zone = ev.target && ev.target.closest && ev.target.closest('[data-drop-collection]');
      if (!zone) return;
      ev.preventDefault();
      ev.dataTransfer.dropEffect = 'copy';
      zone.classList.add('is-drop');
    });
    root.addEventListener('dragleave', function (ev) {
      var zone = ev.target && ev.target.closest && ev.target.closest('[data-drop-collection]');
      if (zone) zone.classList.remove('is-drop');
    });
    root.addEventListener('drop', function (ev) {
      var zone = ev.target && ev.target.closest && ev.target.closest('[data-drop-collection]');
      if (!zone) return;
      ev.preventDefault();
      var projectId = ev.dataTransfer.getData('text/plain');
      var colId = zone.getAttribute('data-drop-collection');
      if (!projectId || !colId) return;
      ui.state.customCollections = assignProjectToCollection(ui.state.customCollections, colId, projectId);
      zone.classList.remove('is-drop');
      root.classList.remove('is-dragging');
      render();
      var col = findCollection(ui.state.customCollections, colId);
      var proj = getProject(CATALOG, projectId);
      toast('已放入「' + ((col && col.name) || colId) + '」：' + ((proj && proj.name) || projectId));
      if (global.FramespaceDesktop && global.FramespaceDesktop.persist) global.FramespaceDesktop.persist();
    });

    if (typeof document !== 'undefined') {
      document.addEventListener('keydown', function (ev) {
        if (ev.key === 'Escape' && ui.state.agentModal) {
          ui.state.agentModal = null;
          render();
        }
        if (ev.key === 'Escape') hideHover();
        if ((ev.ctrlKey || ev.metaKey) && ev.key.toLowerCase() === 'k') {
          ev.preventDefault();
          var box = $('#global-search');
          if (box) box.focus();
        }
      });
    }
  }

  function mount(root, initialState) {
    if (typeof document === 'undefined') return api;
    ui.root = root || document;
    ui.state = initialState || createViewState();
    if (!ui.bound) {
      bind();
      ui.bound = true;
    }
    render();
    armScanTimer();
    return api;
  }

  if (typeof document !== 'undefined' && !global.__FRAMESPACE_DESKTOP) {
    if (document.readyState === 'loading') {
      document.addEventListener('DOMContentLoaded', function () { mount(); });
    } else {
      mount();
    }
  }
})(typeof window !== 'undefined' ? window : typeof globalThis !== 'undefined' ? globalThis : this);
