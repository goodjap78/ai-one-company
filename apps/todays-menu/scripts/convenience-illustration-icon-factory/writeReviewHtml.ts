/**
 * Sprint 56-A–56-B — convenience illustration pilot review pages.
 */
import fs from 'node:fs';
import path from 'node:path';
import {
  analyzeIngredientPng,
  type IngredientPngMetrics,
} from './analyzeIngredientPng';
import type { ConvenienceIconAuditGrade } from './auditConvenienceIconReview';
import { HANKKI_CONVENIENCE_ILLUSTRATION_ICON_STYLE_VERSION } from './convenienceIconStyleLock';
import {
  COMPARE_INGREDIENT_KEYS,
  CUP_RAMEN_V1_FILE,
  CUP_RAMEN_V15_FILE,
  CUP_RAMEN_V2_FILE,
  CUP_RICE_V1_FILE,
  CUP_RICE_V11_FILE,
  PATHS,
  REVIEW_PORT,
  TRIANGLE_KIMBAP_V1_FILE,
  TRIANGLE_KIMBAP_V11_FILE,
  TRIANGLE_KIMBAP_V12_FILE,
  MILK_V1_FILE,
  MILK_REVIEW_REF_INGREDIENT_KEYS,
  SALAD_V1_FILE,
  SALAD_REVIEW_REF_INGREDIENT_KEYS,
  LUNCHBOX_V1_FILE,
  SANDWICH_V1_FILE,
  HAMBURGER_V1_FILE,
  HOT_BAR_V1_FILE,
  CUP_UDON_V1_FILE,
} from './config';

const DISPLAY_SIZES = [128, 64, 48, 40] as const;
const CARD_BG = '#FFFCF7';

const MASTER_RAMEN_WEB_PATH =
  '/generated/convenience-illustration-icon-factory/masters/cup_ramen.png';
const MASTER_RICE_WEB_PATH =
  '/generated/convenience-illustration-icon-factory/masters/cup_rice.png';
const MASTER_KIMBAP_WEB_PATH =
  '/generated/convenience-illustration-icon-factory/masters/triangle_kimbap.png';
const MASTER_MILK_WEB_PATH =
  '/generated/convenience-illustration-icon-factory/masters/milk.png';
const MASTER_SALAD_WEB_PATH =
  '/generated/convenience-illustration-icon-factory/masters/salad.png';
const MASTER_LUNCHBOX_WEB_PATH =
  '/generated/convenience-illustration-icon-factory/masters/lunchbox.png';
const MASTER_SANDWICH_WEB_PATH =
  '/generated/convenience-illustration-icon-factory/masters/sandwich.png';
const MASTER_HAMBURGER_WEB_PATH =
  '/generated/convenience-illustration-icon-factory/masters/hamburger.png';
const MASTER_HOT_BAR_WEB_PATH =
  '/generated/convenience-illustration-icon-factory/masters/hot_bar.png';
const MASTER_CUP_UDON_WEB_PATH =
  '/generated/convenience-illustration-icon-factory/masters/cup_udon.png';

const APPROVED_MASTER_BADGE = ' <span class="approved-master">APPROVED MASTER</span>';

function metricsBlock(m: IngredientPngMetrics): string {
  return [
    '<dl class="metrics">',
    `<dt>Size</dt><dd>${m.width}x${m.height} (${m.fileBytes.toLocaleString()} bytes)</dd>`,
    `<dt>Background</dt><dd>rgb(${m.backgroundRgb.r},${m.backgroundRgb.g},${m.backgroundRgb.b}) alpha~${m.backgroundAlphaMean.toFixed(0)} · ${m.backgroundPolicy}</dd>`,
    `<dt>Bbox fill</dt><dd>${(m.bboxAreaRatio * 100).toFixed(1)}% area · fg pixels ${(m.foregroundPixelRatio * 100).toFixed(1)}%</dd>`,
    `<dt>Padding</dt><dd>T${m.paddingTopPct.toFixed(1)}% L${m.paddingLeftPct.toFixed(1)}% R${m.paddingRightPct.toFixed(1)}% B${m.paddingBottomPct.toFixed(1)}%</dd>`,
    `<dt>Shadow band</dt><dd>y>=${m.shadowBand.bottomRowStart} · ${m.shadowBand.pixelCount}px · delta${m.shadowBand.meanDarkening.toFixed(1)}</dd>`,
    '</dl>',
  ].join('\n');
}

function iconCard(
  title: string,
  srcRel: string,
  m: IngredientPngMetrics,
  highlight?: boolean,
  auditGrade?: ConvenienceIconAuditGrade,
): string {
  const sizes = DISPLAY_SIZES.map(
    (sz) =>
      `<div class="size-cell"><span class="sz-label">${sz}px</span><img src="${srcRel}" width="${sz}" height="${sz}" alt="${title} ${sz}px"/></div>`,
  ).join('');

  const onCard = DISPLAY_SIZES.map(
    (sz) =>
      `<div class="size-cell card-bg"><span class="sz-label">${sz}px card</span><img src="${srcRel}" width="${sz}" height="${sz}" alt="${title} on card ${sz}px"/></div>`,
  ).join('');

  return [
    `<section class="panel${highlight ? ' highlight' : ''}">`,
    `<h2>${title}${auditGrade ? ` <span class="audit ${auditGrade}">${auditGrade}</span>` : ''}</h2>`,
    metricsBlock(m),
    '<div class="row-label">Plain</div>',
    `<div class="sizes">${sizes}</div>`,
    '<div class="row-label">On app card bg (' + CARD_BG + ')</div>',
    `<div class="sizes card-row">${onCard}</div>`,
    '</section>',
  ].join('\n');
}

function buildHtmlShell(title: string, profileBlock: string, gridPanels: string): string {
  return [
    '<!DOCTYPE html>',
    '<html lang="ko">',
    '<head>',
    '<meta charset="utf-8"/>',
    '<title>' + title + '</title>',
    '<style>',
    ':root { font-family: system-ui, sans-serif; background: #f5f0ea; color: #1e1e1e; }',
    'body { margin: 0; padding: 24px; max-width: 1200px; }',
    'h1 { font-size: 1.35rem; }',
    '.profile { background: #fff; border-radius: 12px; padding: 16px; margin-bottom: 20px; font-size: 14px; }',
    '.grid { display: grid; gap: 20px; }',
    '.panel { background: #fff; border-radius: 16px; padding: 16px; border: 1px solid #efe8e2; }',
    '.panel.highlight { border-color: #ff6b35; box-shadow: 0 4px 20px rgba(255,107,53,.12); }',
    '.metrics { display: grid; grid-template-columns: auto 1fr; gap: 4px 12px; font-size: 13px; margin: 12px 0; }',
    '.metrics dt { font-weight: 700; color: #6b6b6b; }',
    '.sizes { display: flex; flex-wrap: wrap; gap: 16px; align-items: flex-end; }',
    '.size-cell { text-align: center; }',
    '.sz-label { display: block; font-size: 11px; color: #9a9a9a; margin-bottom: 4px; }',
  ].join('\n') +
    '\n.card-row .size-cell.card-bg { background: ' +
    CARD_BG +
    '; padding: 8px; border-radius: 12px; border: 1px solid #efe8e2; }\n' +
    [
      '.row-label { font-size: 12px; font-weight: 700; color: #7a7268; margin: 12px 0 8px; }',
      '.audit { font-size: 11px; font-weight: 700; padding: 2px 8px; border-radius: 6px; margin-left: 8px; }',
      '.audit.PASS_CANDIDATE { background: #e8f5e9; color: #2e7d32; }',
      '.audit.MANUAL_REVIEW { background: #fff3e0; color: #e65100; }',
      '.audit.REGENERATE { background: #ffebee; color: #c62828; }',
      '.approved-master { font-size: 11px; font-weight: 700; padding: 2px 8px; border-radius: 6px; background: #e3f2fd; color: #1565c0; }',
      'img { display: block; image-rendering: auto; }',
      'code { background: #fff8ef; padding: 2px 6px; border-radius: 4px; }',
      '</style>',
      '</head>',
      '<body>',
      '<h1>' + title + '</h1>',
      `<p>Serve: <code>http://127.0.0.1:${REVIEW_PORT}/index.html</code></p>`,
      profileBlock,
      '<div class="grid">',
      gridPanels,
      '</div>',
      '</body>',
      '</html>',
    ].join('\n');
}

function profileBlock(profile: ConvenienceIconRenderProfile, extra?: string): string {
  const lines = [
    '<div class="profile">',
    `<strong>Style Lock ${HANKKI_CONVENIENCE_ILLUSTRATION_ICON_STYLE_VERSION}</strong> (${profile.version})<br/>`,
    `Master ${profile.masterSpec.width}x${profile.masterSpec.height} PNG · bbox target 33-38%<br/>`,
    `Background: <strong>${profile.background.policy}</strong> rgb(${profile.background.rgb.r},${profile.background.rgb.g},${profile.background.rgb.b})<br/>`,
    `Ref bbox mean: ${(profile.layout.bboxAreaRatioMean * 100).toFixed(1)}% (${profile.derivedFrom.join(', ')})`,
  ];
  if (extra) {
    lines.push(`<br/>${extra}`);
  }
  lines.push('</div>');
  return lines.join('');
}

/** Sprint 56-C / 56-C.1 — masters + optional triangle review copy + production refs. */
export function writeMastersReviewHtml(input: {
  profile: ConvenienceIconRenderProfile;
  triangleKimbapAbs?: string;
}): void {
  const { profile, triangleKimbapAbs } = input;
  fs.mkdirSync(PATHS.reviewDir, { recursive: true });

  const productionPanels = COMPARE_INGREDIENT_KEYS.map((key) => {
    const prodAbs = path.join(PATHS.ingredientsDir, `${key}.png`);
    const m = analyzeIngredientPng(prodAbs, key);
    return iconCard(`${key} (production)`, `/assets/ingredients/${key}.png`, m);
  }).join('\n');

  const ramenMetrics = analyzeIngredientPng(PATHS.cupRamenMaster, 'cup_ramen_master');
  const ramenPanel = iconCard(
    'cup_ramen (approved master · Style Lock v1.0)',
    MASTER_RAMEN_WEB_PATH,
    ramenMetrics,
  );

  const riceMetrics = analyzeIngredientPng(PATHS.cupRiceMaster, 'cup_rice_master');
  const ricePanel = iconCard(
    'cup_rice (approved master · Style Lock v1.0)',
    MASTER_RICE_WEB_PATH,
    riceMetrics,
  );

  const masterPanels = [ramenPanel, ricePanel];

  if (fs.existsSync(PATHS.triangleKimbapMaster)) {
    const kimMasterMetrics = analyzeIngredientPng(
      PATHS.triangleKimbapMaster,
      'triangle_kimbap_master',
    );
    masterPanels.push(
      iconCard(
        'triangle_kimbap (approved master · Style Lock v1.0)',
        MASTER_KIMBAP_WEB_PATH,
        kimMasterMetrics,
      ),
    );
  } else {
    const triangleResolved =
      triangleKimbapAbs && fs.existsSync(triangleKimbapAbs)
        ? triangleKimbapAbs
        : fs.existsSync(path.join(PATHS.reviewDir, TRIANGLE_KIMBAP_V1_FILE))
          ? path.join(PATHS.reviewDir, TRIANGLE_KIMBAP_V1_FILE)
          : undefined;

    if (triangleResolved) {
      masterPanels.push(
        iconCard(
          'triangle_kimbap v1 (pilot review)',
          path.basename(triangleResolved),
          analyzeIngredientPng(triangleResolved, 'triangle_kimbap_v1'),
          true,
        ),
      );
    }
  }

  const title = fs.existsSync(PATHS.triangleKimbapMaster)
    ? 'Sprint 56-C.1 approved masters (3)'
    : 'Sprint 56-C masters + triangle_kimbap pilot';

  const html = buildHtmlShell(
    title,
    profileBlock(
      profile,
      fs.existsSync(PATHS.triangleKimbapMaster)
        ? 'Three approved convenience illustration masters. bbox target 33-38%.'
        : 'Compare triangle_kimbap pilot vs cup_ramen and cup_rice masters. bbox target 33-38%.',
    ),
    `${productionPanels}\n${masterPanels.join('\n')}`,
  );

  fs.writeFileSync(PATHS.reviewIndex, html, 'utf8');
}

/** Sprint 56-C.2 — v1 (wrong top kim) vs v1.1 + approved masters. */
export function writeTriangleKimbapV11ReviewHtml(input: {
  profile: ConvenienceIconRenderProfile;
}): void {
  const { profile } = input;
  fs.mkdirSync(PATHS.reviewDir, { recursive: true });

  const ramenMetrics = analyzeIngredientPng(PATHS.cupRamenMaster, 'cup_ramen_master');
  const ramenPanel = iconCard(
    'cup_ramen (approved master · Style Lock v1.0)',
    MASTER_RAMEN_WEB_PATH,
    ramenMetrics,
  );

  const riceMetrics = analyzeIngredientPng(PATHS.cupRiceMaster, 'cup_rice_master');
  const ricePanel = iconCard(
    'cup_rice (approved master · Style Lock v1.0)',
    MASTER_RICE_WEB_PATH,
    riceMetrics,
  );

  const v1HistoryAbs = path.join(PATHS.triangleKimbapHistoryDir, TRIANGLE_KIMBAP_V1_FILE);
  const v1WebPath = `/generated/convenience-illustration-icon-factory/history/triangle_kimbap/${TRIANGLE_KIMBAP_V1_FILE}`;
  const v1Panel = fs.existsSync(v1HistoryAbs)
    ? iconCard(
        'triangle_kimbap v1 (rejected — top seaweed cap)',
        v1WebPath,
        analyzeIngredientPng(v1HistoryAbs, 'triangle_kimbap_v1_history'),
      )
    : '';

  const v11Abs = path.join(PATHS.reviewDir, TRIANGLE_KIMBAP_V11_FILE);
  const v11Panel = fs.existsSync(v11Abs)
    ? iconCard(
        'triangle_kimbap v1.1 (review — bottom/side seaweed wrap)',
        TRIANGLE_KIMBAP_V11_FILE,
        analyzeIngredientPng(v11Abs, 'triangle_kimbap_v11'),
        true,
      )
    : '';

  const html = buildHtmlShell(
    'Sprint 56-C.2 triangle_kimbap v1 vs v1.1',
    profileBlock(
      profile,
      'Compare rejected v1 (top kim cap) vs v1.1 (rice top, kim bottom/sides). bbox target 33-38%.',
    ),
    [ramenPanel, ricePanel, v1Panel, v11Panel].filter(Boolean).join('\n'),
  );

  fs.writeFileSync(PATHS.reviewIndex, html, 'utf8');
}

/** Sprint 56-C.3 — v1 / v1.1 / v1.2 + approved masters. */
export function writeTriangleKimbapV12ReviewHtml(input: {
  profile: ConvenienceIconRenderProfile;
}): void {
  const { profile } = input;
  fs.mkdirSync(PATHS.reviewDir, { recursive: true });

  const ramenMetrics = analyzeIngredientPng(PATHS.cupRamenMaster, 'cup_ramen_master');
  const ramenPanel = iconCard(
    'cup_ramen (approved master · Style Lock v1.0)',
    MASTER_RAMEN_WEB_PATH,
    ramenMetrics,
  );

  const riceMetrics = analyzeIngredientPng(PATHS.cupRiceMaster, 'cup_rice_master');
  const ricePanel = iconCard(
    'cup_rice (approved master · Style Lock v1.0)',
    MASTER_RICE_WEB_PATH,
    riceMetrics,
  );

  const v1HistoryAbs = path.join(PATHS.triangleKimbapHistoryDir, TRIANGLE_KIMBAP_V1_FILE);
  const v1WebPath = `/generated/convenience-illustration-icon-factory/history/triangle_kimbap/${TRIANGLE_KIMBAP_V1_FILE}`;
  const v1Panel = fs.existsSync(v1HistoryAbs)
    ? iconCard(
        'triangle_kimbap v1 (rejected — top seaweed cap)',
        v1WebPath,
        analyzeIngredientPng(v1HistoryAbs, 'triangle_kimbap_v1_history'),
      )
    : '';

  const v11Abs = path.join(PATHS.reviewDir, TRIANGLE_KIMBAP_V11_FILE);
  const v11Panel = fs.existsSync(v11Abs)
    ? iconCard(
        'triangle_kimbap v1.1 (rejected — bottom kim + face)',
        TRIANGLE_KIMBAP_V11_FILE,
        analyzeIngredientPng(v11Abs, 'triangle_kimbap_v11'),
      )
    : '';

  const v12Abs = path.join(PATHS.reviewDir, TRIANGLE_KIMBAP_V12_FILE);
  const v12Panel = fs.existsSync(v12Abs)
    ? iconCard(
        'triangle_kimbap v1.2 (review — center vertical kim band)',
        TRIANGLE_KIMBAP_V12_FILE,
        analyzeIngredientPng(v12Abs, 'triangle_kimbap_v12'),
        true,
      )
    : '';

  const html = buildHtmlShell(
    'Sprint 56-C.3 triangle_kimbap v1 / v1.1 / v1.2',
    profileBlock(
      profile,
      'Compare v1 (top kim), v1.1 (bottom kim + face), v1.2 (center vertical kim band). No face. bbox 33-38%.',
    ),
    [ramenPanel, ricePanel, v1Panel, v11Panel, v12Panel].filter(Boolean).join('\n'),
  );

  fs.writeFileSync(PATHS.reviewIndex, html, 'utf8');
}

/** Sprint 56-E.1 — five approved masters + salad v1 source panel. */
export function writeApprovedMastersReviewHtml(input: {
  profile: ConvenienceIconRenderProfile;
}): void {
  const { profile } = input;
  fs.mkdirSync(PATHS.reviewDir, { recursive: true });

  const ramenMetrics = analyzeIngredientPng(PATHS.cupRamenMaster, 'cup_ramen_master');
  const ramenPanel = iconCard(
    'cup_ramen (approved master · Style Lock v1.0)',
    MASTER_RAMEN_WEB_PATH,
    ramenMetrics,
  );

  const riceMetrics = analyzeIngredientPng(PATHS.cupRiceMaster, 'cup_rice_master');
  const ricePanel = iconCard(
    'cup_rice (approved master · Style Lock v1.0)',
    MASTER_RICE_WEB_PATH,
    riceMetrics,
  );

  const kimMasterMetrics = analyzeIngredientPng(
    PATHS.triangleKimbapMaster,
    'triangle_kimbap_master',
  );
  const kimPanel = iconCard(
    'triangle_kimbap (approved master · Style Lock v1.0)',
    MASTER_KIMBAP_WEB_PATH,
    kimMasterMetrics,
  );

  const milkMasterMetrics = analyzeIngredientPng(PATHS.milkMaster, 'milk_master');
  const milkPanel = iconCard(
    'milk (approved master · Style Lock v1.0)',
    MASTER_MILK_WEB_PATH,
    milkMasterMetrics,
  );

  const saladMasterMetrics = analyzeIngredientPng(PATHS.saladMaster, 'salad_master');
  const saladPanel = iconCard(
    'salad (approved master · Style Lock v1.0)',
    MASTER_SALAD_WEB_PATH,
    saladMasterMetrics,
  );

  const v1HistoryAbs = path.join(PATHS.triangleKimbapHistoryDir, TRIANGLE_KIMBAP_V1_FILE);
  const v1WebPath = `/generated/convenience-illustration-icon-factory/history/triangle_kimbap/${TRIANGLE_KIMBAP_V1_FILE}`;
  const v1Panel = fs.existsSync(v1HistoryAbs)
    ? iconCard(
        'triangle_kimbap v1 (history — top seaweed cap)',
        v1WebPath,
        analyzeIngredientPng(v1HistoryAbs, 'triangle_kimbap_v1_history'),
      )
    : '';

  const v11Abs = path.join(PATHS.reviewDir, TRIANGLE_KIMBAP_V11_FILE);
  const v11Panel = fs.existsSync(v11Abs)
    ? iconCard(
        'triangle_kimbap v1.1 (rejected reference — bottom kim + face)',
        TRIANGLE_KIMBAP_V11_FILE,
        analyzeIngredientPng(v11Abs, 'triangle_kimbap_v11_ref'),
      )
    : '';

  const v12Abs = path.join(PATHS.reviewDir, TRIANGLE_KIMBAP_V12_FILE);
  const v12Panel = fs.existsSync(v12Abs)
    ? iconCard(
        'triangle_kimbap v1.2 (approved source)',
        TRIANGLE_KIMBAP_V12_FILE,
        analyzeIngredientPng(v12Abs, 'triangle_kimbap_v12_source'),
      )
    : '';

  const milkV1Abs = path.join(PATHS.reviewDir, MILK_V1_FILE);
  const milkV1Panel = fs.existsSync(milkV1Abs)
    ? iconCard(
        'milk v1 (approved source)',
        MILK_V1_FILE,
        analyzeIngredientPng(milkV1Abs, 'milk_v1_source'),
      )
    : '';

  const saladV1Abs = path.join(PATHS.reviewDir, SALAD_V1_FILE);
  const saladV1Panel = fs.existsSync(saladV1Abs)
    ? iconCard(
        'salad v1 (approved source)',
        SALAD_V1_FILE,
        analyzeIngredientPng(saladV1Abs, 'salad_v1_source'),
      )
    : '';

  const html = buildHtmlShell(
    'Sprint 56-E.1 approved masters (5)',
    profileBlock(
      profile,
      'Five approved convenience illustration masters. salad low-wide pack green rim. bbox 33-38%.',
    ),
    [
      ramenPanel,
      ricePanel,
      kimPanel,
      milkPanel,
      saladPanel,
      v1Panel,
      v11Panel,
      v12Panel,
      milkV1Panel,
      saladV1Panel,
    ]
      .filter(Boolean)
      .join('\n'),
  );

  fs.writeFileSync(PATHS.reviewIndex, html, 'utf8');
}

/** Sprint 56-F Final — ten approved masters on one page. */
export function writePhase1FinalApprovedReviewHtml(input: {
  profile: ConvenienceIconRenderProfile;
}): void {
  const { profile } = input;
  fs.mkdirSync(PATHS.reviewDir, { recursive: true });

  const masterDefs = [
    { key: 'cup_ramen', label: '컵라면', web: MASTER_RAMEN_WEB_PATH, abs: PATHS.cupRamenMaster },
    { key: 'cup_rice', label: '컵밥', web: MASTER_RICE_WEB_PATH, abs: PATHS.cupRiceMaster },
    {
      key: 'triangle_kimbap',
      label: '삼각김밥',
      web: MASTER_KIMBAP_WEB_PATH,
      abs: PATHS.triangleKimbapMaster,
    },
    { key: 'milk', label: '우유', web: MASTER_MILK_WEB_PATH, abs: PATHS.milkMaster },
    { key: 'salad', label: '샐러드', web: MASTER_SALAD_WEB_PATH, abs: PATHS.saladMaster },
    { key: 'lunchbox', label: '도시락', web: MASTER_LUNCHBOX_WEB_PATH, abs: PATHS.lunchboxMaster },
    { key: 'sandwich', label: '샌드위치', web: MASTER_SANDWICH_WEB_PATH, abs: PATHS.sandwichMaster },
    {
      key: 'hamburger',
      label: '햄버거',
      web: MASTER_HAMBURGER_WEB_PATH,
      abs: PATHS.hamburgerMaster,
    },
    { key: 'hot_bar', label: '핫바', web: MASTER_HOT_BAR_WEB_PATH, abs: PATHS.hotBarMaster },
    { key: 'cup_udon', label: '컵우동', web: MASTER_CUP_UDON_WEB_PATH, abs: PATHS.cupUdonMaster },
  ];

  const panels = masterDefs
    .filter((def) => fs.existsSync(def.abs))
    .map((def) =>
      iconCard(
        `${def.label} (${def.key})${APPROVED_MASTER_BADGE}`,
        def.web,
        analyzeIngredientPng(def.abs, def.key),
        true,
      ),
    )
    .join('\n');

  const summaryBlock = [
    '<div class="profile">',
    '<h3>Sprint 56-F Final — Phase 1 complete (10/10 APPROVED MASTER)</h3>',
    '<p style="font-size:13px;color:#6b6b6b;">Production / registry / UI not wired. Compare at 128/64/48/40px + card bg.</p>',
    '</div>',
  ].join('\n');

  const html = buildHtmlShell(
    'Sprint 56-F Final — 10 approved convenience illustration masters',
    summaryBlock +
      profileBlock(profile, 'All Phase 1 convenience illustration icons approved as masters.'),
    panels,
  );

  fs.writeFileSync(PATHS.reviewIndex, html, 'utf8');
}

/** Sprint 56-F — 5 approved masters + 5 batch review icons on one page. */
export function writePhase1BatchReviewHtml(input: {
  profile: ConvenienceIconRenderProfile;
  audits: Array<{
    iconKey: string;
    reviewFile: string;
    audit?: import('./auditConvenienceIconReview').ConvenienceIconAuditResult;
  }>;
}): void {
  const { profile, audits } = input;
  fs.mkdirSync(PATHS.reviewDir, { recursive: true });

  const masterPanels = [
    iconCard(
      'cup_ramen (approved master)',
      MASTER_RAMEN_WEB_PATH,
      analyzeIngredientPng(PATHS.cupRamenMaster, 'cup_ramen_master'),
    ),
    iconCard(
      'cup_rice (approved master)',
      MASTER_RICE_WEB_PATH,
      analyzeIngredientPng(PATHS.cupRiceMaster, 'cup_rice_master'),
    ),
    iconCard(
      'triangle_kimbap (approved master)',
      MASTER_KIMBAP_WEB_PATH,
      analyzeIngredientPng(PATHS.triangleKimbapMaster, 'triangle_kimbap_master'),
    ),
    iconCard(
      'milk (approved master)',
      MASTER_MILK_WEB_PATH,
      analyzeIngredientPng(PATHS.milkMaster, 'milk_master'),
    ),
    iconCard(
      'salad (approved master)',
      MASTER_SALAD_WEB_PATH,
      analyzeIngredientPng(PATHS.saladMaster, 'salad_master'),
    ),
  ];

  const batchDefs = [
    { file: LUNCHBOX_V1_FILE, key: 'lunchbox', label: '도시락' },
    { file: SANDWICH_V1_FILE, key: 'sandwich', label: '샌드위치' },
    { file: HAMBURGER_V1_FILE, key: 'hamburger', label: '햄버거' },
    { file: HOT_BAR_V1_FILE, key: 'hot_bar', label: '핫바' },
    { file: CUP_UDON_V1_FILE, key: 'cup_udon', label: '컵우동' },
  ];

  const batchPanels = batchDefs.map((def) => {
    const abs = path.join(PATHS.reviewDir, def.file);
    const auditEntry = audits.find((a) => a.iconKey === def.key);
    if (!fs.existsSync(abs)) return '';
    return iconCard(
      `${def.label} v1 (batch review · ${def.key})`,
      def.file,
      analyzeIngredientPng(abs, def.key),
      true,
      auditEntry?.audit?.grade,
    );
  });

  const gradeSummary = audits
    .filter((a) => a.audit)
    .map(
      (a) =>
        `<li><strong>${a.iconKey}</strong>: ${a.audit!.grade} · bbox ${a.audit!.bboxPct}% · scale ${a.audit!.linearScale}x</li>`,
    )
    .join('');

  const summaryBlock = [
    '<div class="profile">',
    '<h3>Sprint 56-F batch audit (no auto-approval)</h3>',
    '<ul style="margin:8px 0;font-size:14px;">',
    gradeSummary,
    '</ul>',
    '<p style="font-size:13px;color:#6b6b6b;">Compare 10 icons — one convenience meal family at 128/64/48/40px + card bg preview.</p>',
    '</div>',
  ].join('\n');

  const html = buildHtmlShell(
    'Sprint 56-F Phase 1 batch review (10 icons)',
    summaryBlock + profileBlock(profile, 'Five masters + five batch review icons. Human approval required.'),
    [...masterPanels, ...batchPanels].filter(Boolean).join('\n'),
  );

  fs.writeFileSync(PATHS.reviewIndex, html, 'utf8');
}

/** Sprint 56-D — three masters + milk v1 pilot + egg/onion refs. */
export function writeMilkPilotReviewHtml(input: {
  profile: ConvenienceIconRenderProfile;
}): void {
  const { profile } = input;
  fs.mkdirSync(PATHS.reviewDir, { recursive: true });

  const refPanels = MILK_REVIEW_REF_INGREDIENT_KEYS.map((key) => {
    const prodAbs = path.join(PATHS.ingredientsDir, `${key}.png`);
    const m = analyzeIngredientPng(prodAbs, key);
    return iconCard(`${key} (production reference)`, `/assets/ingredients/${key}.png`, m);
  }).join('\n');

  const ramenMetrics = analyzeIngredientPng(PATHS.cupRamenMaster, 'cup_ramen_master');
  const ramenPanel = iconCard(
    'cup_ramen (approved master · Style Lock v1.0)',
    MASTER_RAMEN_WEB_PATH,
    ramenMetrics,
  );

  const riceMetrics = analyzeIngredientPng(PATHS.cupRiceMaster, 'cup_rice_master');
  const ricePanel = iconCard(
    'cup_rice (approved master · Style Lock v1.0)',
    MASTER_RICE_WEB_PATH,
    riceMetrics,
  );

  const kimMetrics = analyzeIngredientPng(PATHS.triangleKimbapMaster, 'triangle_kimbap_master');
  const kimPanel = iconCard(
    'triangle_kimbap (approved master · Style Lock v1.0)',
    MASTER_KIMBAP_WEB_PATH,
    kimMetrics,
  );

  const milkAbs = path.join(PATHS.reviewDir, MILK_V1_FILE);
  const milkPanel = fs.existsSync(milkAbs)
    ? iconCard(
        'milk v1 (pilot review)',
        MILK_V1_FILE,
        analyzeIngredientPng(milkAbs, 'milk_v1'),
        true,
      )
    : '';

  const html = buildHtmlShell(
    'Sprint 56-D milk pilot + approved masters',
    profileBlock(
      profile,
      'Compare milk v1 pilot vs three approved masters. bbox target 33-38%.',
    ),
    `${refPanels}\n${ramenPanel}\n${ricePanel}\n${kimPanel}\n${milkPanel}`,
  );

  fs.writeFileSync(PATHS.reviewIndex, html, 'utf8');
}

/** Sprint 56-E — four approved masters + salad v1 pilot + egg/onion refs. */
export function writeSaladPilotReviewHtml(input: {
  profile: ConvenienceIconRenderProfile;
}): void {
  const { profile } = input;
  fs.mkdirSync(PATHS.reviewDir, { recursive: true });

  const refPanels = SALAD_REVIEW_REF_INGREDIENT_KEYS.map((key) => {
    const prodAbs = path.join(PATHS.ingredientsDir, `${key}.png`);
    const m = analyzeIngredientPng(prodAbs, key);
    return iconCard(`${key} (production reference)`, `/assets/ingredients/${key}.png`, m);
  }).join('\n');

  const ramenMetrics = analyzeIngredientPng(PATHS.cupRamenMaster, 'cup_ramen_master');
  const ramenPanel = iconCard(
    'cup_ramen (approved master · Style Lock v1.0)',
    MASTER_RAMEN_WEB_PATH,
    ramenMetrics,
  );

  const riceMetrics = analyzeIngredientPng(PATHS.cupRiceMaster, 'cup_rice_master');
  const ricePanel = iconCard(
    'cup_rice (approved master · Style Lock v1.0)',
    MASTER_RICE_WEB_PATH,
    riceMetrics,
  );

  const kimMetrics = analyzeIngredientPng(PATHS.triangleKimbapMaster, 'triangle_kimbap_master');
  const kimPanel = iconCard(
    'triangle_kimbap (approved master · Style Lock v1.0)',
    MASTER_KIMBAP_WEB_PATH,
    kimMetrics,
  );

  const milkMetrics = analyzeIngredientPng(PATHS.milkMaster, 'milk_master');
  const milkPanel = iconCard(
    'milk (approved master · Style Lock v1.0)',
    MASTER_MILK_WEB_PATH,
    milkMetrics,
  );

  const saladAbs = path.join(PATHS.reviewDir, SALAD_V1_FILE);
  const saladPanel = fs.existsSync(saladAbs)
    ? iconCard(
        'salad v1 (pilot review)',
        SALAD_V1_FILE,
        analyzeIngredientPng(saladAbs, 'salad_v1'),
        true,
      )
    : '';

  const html = buildHtmlShell(
    'Sprint 56-E salad pilot + approved masters',
    profileBlock(
      profile,
      'Compare salad v1 pilot vs four approved masters. bbox target 33-38%. Convenience packaged salad — NOT bowl.',
    ),
    `${refPanels}\n${ramenPanel}\n${ricePanel}\n${kimPanel}\n${milkPanel}\n${saladPanel}`,
  );

  fs.writeFileSync(PATHS.reviewIndex, html, 'utf8');
}

/** Sprint 56-B / 56-B.1 — master + cup_rice variants + production refs. */
export function writeConveniencePilotReviewHtml(input: {
  profile: ConvenienceIconRenderProfile;
  cupRiceAbs?: string;
  cupRiceV1Abs?: string;
  cupRiceHighlightAbs?: string;
}): void {
  const { profile, cupRiceAbs, cupRiceV1Abs, cupRiceHighlightAbs } = input;
  fs.mkdirSync(PATHS.reviewDir, { recursive: true });

  const productionPanels = COMPARE_INGREDIENT_KEYS.map((key) => {
    const prodAbs = path.join(PATHS.ingredientsDir, `${key}.png`);
    const m = analyzeIngredientPng(prodAbs, key);
    return iconCard(`${key} (production)`, `/assets/ingredients/${key}.png`, m);
  }).join('\n');

  const masterMetrics = analyzeIngredientPng(PATHS.cupRamenMaster, 'cup_ramen_master');
  const masterPanel = iconCard(
    'cup_ramen (approved master · Style Lock v1.0)',
    MASTER_RAMEN_WEB_PATH,
    masterMetrics,
  );

  const v1Resolved =
    cupRiceV1Abs && fs.existsSync(cupRiceV1Abs)
      ? cupRiceV1Abs
      : cupRiceAbs && fs.existsSync(cupRiceAbs)
        ? cupRiceAbs
        : fs.existsSync(path.join(PATHS.reviewDir, CUP_RICE_V1_FILE))
          ? path.join(PATHS.reviewDir, CUP_RICE_V1_FILE)
          : undefined;

  const v11Resolved =
    cupRiceHighlightAbs && fs.existsSync(cupRiceHighlightAbs)
      ? cupRiceHighlightAbs
      : fs.existsSync(path.join(PATHS.reviewDir, CUP_RICE_V11_FILE))
        ? path.join(PATHS.reviewDir, CUP_RICE_V11_FILE)
        : undefined;

  const ricePanels: string[] = [];
  if (v1Resolved) {
    ricePanels.push(
      iconCard(
        'cup_rice v1 (pilot — reference)',
        path.basename(v1Resolved),
        analyzeIngredientPng(v1Resolved, 'cup_rice_v1'),
        !v11Resolved,
      ),
    );
  }
  if (v11Resolved) {
    ricePanels.push(
      iconCard(
        'cup_rice v1.1 (scale-up pilot)',
        path.basename(v11Resolved),
        analyzeIngredientPng(v11Resolved, 'cup_rice_v11'),
        true,
      ),
    );
  }

  const title = v11Resolved
    ? 'Sprint 56-B.1 cup_ramen master + cup_rice v1 / v1.1'
    : 'Sprint 56-B cup_ramen master + cup_rice pilot';

  const html = buildHtmlShell(
    title,
    profileBlock(
      profile,
      v11Resolved
        ? 'Compare cup_rice v1 vs v1.1 scale-up vs cup_ramen master. bbox target 33-38%.'
        : 'Compare cup_rice pilot vs approved cup_ramen master and production ingredient icons.',
    ),
    `${productionPanels}\n${masterPanel}\n${ricePanels.join('\n')}`,
  );

  fs.writeFileSync(PATHS.reviewIndex, html, 'utf8');
}

function reviewTitle(hasV15: boolean, hasV2: boolean): string {
  if (hasV15 && hasV2) {
    return 'Sprint 56-A.2 cup_ramen v1 / v1.5 / v2';
  }
  if (hasV2) {
    return 'Sprint 56-A.1 cup_ramen v1 vs v2';
  }
  return 'Sprint 56-A cup_ramen pilot';
}

export function writePilotReviewHtml(input: {
  profile: ConvenienceIconRenderProfile;
  v1Abs: string;
  v15Abs?: string;
  v2Abs?: string;
}): void {
  const { profile, v1Abs, v15Abs, v2Abs } = input;
  fs.mkdirSync(PATHS.reviewDir, { recursive: true });

  const productionPanels = COMPARE_INGREDIENT_KEYS.map((key) => {
    const prodAbs = path.join(PATHS.ingredientsDir, `${key}.png`);
    const m = analyzeIngredientPng(prodAbs, key);
    return iconCard(`${key} (production)`, `/assets/ingredients/${key}.png`, m);
  }).join('\n');

  const v1Metrics = analyzeIngredientPng(v1Abs, 'cup_ramen_v1');
  const v1Rel = path.basename(v1Abs);

  const pilotPanels: string[] = [
    iconCard('cup_ramen v1 (original pilot / master)', v1Rel, v1Metrics),
  ];

  const v15Resolved =
    v15Abs && fs.existsSync(v15Abs)
      ? v15Abs
      : fs.existsSync(path.join(PATHS.reviewDir, CUP_RAMEN_V15_FILE))
        ? path.join(PATHS.reviewDir, CUP_RAMEN_V15_FILE)
        : undefined;

  if (v15Resolved) {
    const v15Metrics = analyzeIngredientPng(v15Resolved, 'cup_ramen_v15');
    pilotPanels.push(
      iconCard(
        'cup_ramen v1.5 (final candidate)',
        path.basename(v15Resolved),
        v15Metrics,
        true,
      ),
    );
  }

  const v2Resolved =
    v2Abs && fs.existsSync(v2Abs)
      ? v2Abs
      : fs.existsSync(path.join(PATHS.reviewDir, CUP_RAMEN_V2_FILE))
        ? path.join(PATHS.reviewDir, CUP_RAMEN_V2_FILE)
        : undefined;

  if (v2Resolved) {
    const v2Metrics = analyzeIngredientPng(v2Resolved, 'cup_ramen_v2');
    pilotPanels.push(
      iconCard(
        'cup_ramen v2 (simplified pilot — reference only)',
        path.basename(v2Resolved),
        v2Metrics,
      ),
    );
  }

  const title = reviewTitle(Boolean(v15Resolved), Boolean(v2Resolved));
  const html = buildHtmlShell(
    title,
    profileBlock(
      profile,
      `Padding mean: T${profile.layout.paddingTopPctMean.toFixed(1)}% B${profile.layout.paddingBottomPctMean.toFixed(1)}%`,
    ),
    `${productionPanels}\n${pilotPanels.join('\n')}`,
  );

  fs.writeFileSync(PATHS.reviewIndex, html, 'utf8');
}

/** Rebuild HTML from existing review files on disk. */
export function refreshPilotReviewHtml(profile: ConvenienceIconRenderProfile): void {
  const triangleAbs = path.join(PATHS.reviewDir, TRIANGLE_KIMBAP_V1_FILE);
  if (
    fs.existsSync(PATHS.cupRamenMaster) &&
    fs.existsSync(PATHS.cupRiceMaster) &&
    fs.existsSync(triangleAbs)
  ) {
    writeMastersReviewHtml({ profile, triangleKimbapAbs: triangleAbs });
    return;
  }

  const cupRiceV1Abs = path.join(PATHS.reviewDir, CUP_RICE_V1_FILE);
  const cupRiceV11Abs = path.join(PATHS.reviewDir, CUP_RICE_V11_FILE);
  if (fs.existsSync(PATHS.cupRamenMaster)) {
    if (fs.existsSync(cupRiceV1Abs) || fs.existsSync(cupRiceV11Abs)) {
      writeConveniencePilotReviewHtml({
        profile,
        cupRiceV1Abs: fs.existsSync(cupRiceV1Abs) ? cupRiceV1Abs : undefined,
        cupRiceHighlightAbs: fs.existsSync(cupRiceV11Abs) ? cupRiceV11Abs : undefined,
      });
      return;
    }
  }

  const v1Abs = path.join(PATHS.reviewDir, CUP_RAMEN_V1_FILE);
  const v15Abs = path.join(PATHS.reviewDir, CUP_RAMEN_V15_FILE);
  const v2Abs = path.join(PATHS.reviewDir, CUP_RAMEN_V2_FILE);
  if (!fs.existsSync(v1Abs)) {
    throw new Error(`Missing ${CUP_RAMEN_V1_FILE}`);
  }
  writePilotReviewHtml({
    profile,
    v1Abs,
    v15Abs: fs.existsSync(v15Abs) ? v15Abs : undefined,
    v2Abs: fs.existsSync(v2Abs) ? v2Abs : undefined,
  });
}
