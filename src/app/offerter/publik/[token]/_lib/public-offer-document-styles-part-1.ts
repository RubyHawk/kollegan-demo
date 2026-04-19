export const PUBLIC_OFFER_DOCUMENT_STYLES_PART_1 = `
      html, body {
        background: #ffffff !important;
        color: #14263f !important;
        font-family: Aptos, "Segoe UI", "Helvetica Neue", Arial, sans-serif !important;
      }
      *, *::before, *::after { box-sizing: border-box; }
      img { max-width: 100% !important; display: block; }
      img:not([style*="height:"]) { height: auto; }
      table { max-width: 100% !important; width: 100%; table-layout: fixed; }
      td, th { word-break: break-word; overflow-wrap: break-word; }
      pre, code { white-space: pre-wrap !important; word-break: break-word !important; overflow-x: hidden !important; }
      .doc-wrapper { padding-bottom: 0 !important; background: #ffffff !important; }
      .page-separator { display: none !important; }
      .page-block {
        margin: 0 !important;
        overflow: hidden !important;
        background: #ffffff !important;
      }
      .page-content--document {
        min-height: 920px !important;
        padding: 36px 40px 34px !important;
        background: #ffffff !important;
      }
      .page-block--document {
        border: none !important;
        border-radius: 0 !important;
        background: #ffffff !important;
        box-shadow: none !important;
      }
      .offer-shell {
        gap: 18px !important;
        color: #14263f !important;
        font-family: Aptos, "Segoe UI", "Helvetica Neue", Arial, sans-serif !important;
      }
      .offer-shell__header, .offer-shell__topline { display: grid !important; grid-template-columns: minmax(0, 1fr) minmax(208px, 244px) !important; gap: 16px !important; align-items: flex-start !important; }
      .offer-shell__header { padding-bottom: 18px !important; border-bottom: 1px solid #d9e3ee !important; }
      .offer-shell__sender { gap: 12px !important; align-items: flex-start !important; }
      .offer-shell__logo { width: 48px !important; height: 48px !important; }
      .offer-shell__sender-copy { display: grid !important; gap: 3px !important; font-size: 12.5px !important; line-height: 1.55 !important; color: #465a73 !important; }
      .offer-shell__sender-name { color: #10233b !important; font-weight: 700 !important; }
      .offer-shell__meta { min-width: 0 !important; display: grid !important; gap: 8px !important; justify-items: end !important; text-align: right !important; }
      .offer-shell__status { display: none !important; }
      .offer-shell__status--draft { background: #e2e8f0 !important; color: #334155 !important; }
      .offer-shell__status--sent, .offer-shell__status--viewed { background: #dbeafe !important; color: #1d4ed8 !important; }
      .offer-shell__status--accepted { background: #dcfce7 !important; color: #166534 !important; }
      .offer-shell__status--declined { background: #fee2e2 !important; color: #b91c1c !important; }
      .offer-shell__status--expired { background: #f3f4f6 !important; color: #6b7280 !important; }
      .offer-shell__meta dl { display: grid !important; gap: 6px !important; width: 100% !important; }
      .offer-shell__meta dl div { display: grid !important; grid-template-columns: minmax(0, 1fr) auto !important; justify-content: flex-end !important; gap: 10px !important; padding: 4px 0 !important; border-bottom: 1px solid #edf2f7 !important; }
      .offer-shell__meta dl div:first-child { padding-top: 0 !important; }
      .offer-shell__meta dl div:last-child { padding-bottom: 0 !important; border-bottom: none !important; }
      .offer-shell__meta dt { font-size: 10px !important; line-height: 1.35 !important; letter-spacing: 0.08em !important; text-transform: uppercase !important; color: #6b7e95 !important; }
      .offer-shell__meta dd { font-size: 12.5px !important; line-height: 1.35 !important; font-weight: 700 !important; color: #10233b !important; white-space: nowrap !important; }
      .offer-shell__meta dd small { display: block !important; margin-top: 2px !important; font-size: 11px !important; line-height: 1.35 !important; font-weight: 500 !important; color: #5f738a !important; }
      .offer-shell__meta .offer-shell__meta-row--recipient dd { white-space: normal !important; }
      .offer-shell__topline { padding-bottom: 18px !important; border-bottom: 1px solid #d9e3ee !important; }
      .offer-shell__topline h1 { font-size: 22px !important; line-height: 1.22 !important; color: #10233b !important; letter-spacing: -0.02em !important; }
      .offer-shell__customer { min-width: 0 !important; display: grid !important; gap: 4px !important; padding-left: 14px !important; border-left: 1px solid #dce6f0 !important; font-size: 13px !important; line-height: 1.6 !important; color: #465a73 !important; }
      .offer-section { gap: 10px !important; }
      .offer-section h2, .offer-section h3 { font-size: 12px !important; letter-spacing: 0.08em !important; text-transform: uppercase !important; color: #6b7e95 !important; }
      .offer-table-header h2 { font-size: 24px !important; line-height: 1.18 !important; letter-spacing: -0.03em !important; text-transform: none !important; color: #10233b !important; }
      .offer-section p { font-size: 14px !important; line-height: 1.8 !important; color: #34485f !important; }
      .offer-section--terms,
      .offer-section--notes {
        margin-top: 14px !important;
        padding: 16px 18px !important;
        border: 1px solid #d9e3ee !important;
        border-radius: 14px !important;
        background: #ffffff !important;
      }
      .offer-summary { width: min(272px, 100%) !important; border: 1px solid #d9e3ee !important; border-radius: 14px !important; background: #ffffff !important; padding: 0 !important; gap: 0 !important; overflow: hidden !important; box-shadow: none !important; }
      .offer-summary--below { width: min(388px, 100%) !important; margin-top: 16px !important; margin-left: auto !important; }
      .offer-summary__row { font-size: 13px !important; padding: 12px 16px !important; border-bottom: 1px solid #e5ecf3 !important; color: #465a73 !important; align-items: baseline !important; line-height: 1.55 !important; }
      .offer-summary__row span { font-weight: 600 !important; color: #5b7088 !important; }
      .offer-summary__row strong { color: #10233b !important; font-weight: 700 !important; white-space: nowrap !important; }
      .offer-summary__row--subtotal { background: linear-gradient(180deg, #f8fbff 0%, #fdfefe 100%) !important; }
      .offer-summary__row--subtotal span,
      .offer-summary__row--subtotal strong { color: #10233b !important; font-weight: 800 !important; }
      .offer-summary__row--discount { background: #fff6f5 !important; }
      .offer-summary__row--discount span,
      .offer-summary__row--discount strong { color: #b42318 !important; }
      .offer-summary__row--vat span { color: #42576f !important; }
      .offer-summary__row--total {
        margin-top: 0 !important;
        padding: 15px 16px 14px !important;
        border-top: 1px solid #142742 !important;
        border-bottom: none !important;
        background: linear-gradient(135deg, #13233a 0%, #223b63 100%) !important;
        color: #eff6ff !important;
        font-size: 15px !important;
      }
      .offer-summary__row--total,
      .offer-summary__row--total strong,
      .offer-summary__row--total span {
        color: #ffffff !important;
      }
      .offer-summary__row--total span { font-size: 12px !important; font-weight: 700 !important; letter-spacing: 0.02em !important; text-transform: uppercase !important; }
      .offer-summary__row--total strong { font-size: 22px !important; letter-spacing: -0.03em !important; }
      .offer-shell__footer { grid-template-columns: minmax(0, 1.35fr) repeat(2, minmax(0, 1fr)) !important; gap: 14px !important; padding-top: 16px !important; margin-top: 18px !important; border-top: 1px solid #dce6f0 !important; }
      .offer-shell__footer div { font-size: 13px !important; line-height: 1.6 !important; color: #465a73 !important; }
      .offer-shell__footer strong { color: #10233b !important; }
      .offer-items { display: grid !important; gap: 14px !important; }
      .offer-items__table { display: block !important; border: 1px solid #d9e3ee !important; border-radius: 14px !important; background: #ffffff !important; overflow: hidden !important; box-shadow: none !important; }
      .offer-items__head, .offer-item-row { display: grid !important; grid-template-columns: var(--offer-columns) !important; align-items: start !important; }
      .offer-items__head { gap: 14px !important; padding: 12px 16px !important; background: linear-gradient(180deg, #f7faff 0%, #edf3fb 100%) !important; border-bottom: 1px solid #d9e4ef !important; color: #6b7e95 !important; font-size: 10.5px !important; font-weight: 700 !important; letter-spacing: 0.08em !important; text-transform: uppercase !important; }
      .offer-item-row { gap: 14px !important; padding: 16px !important; border-bottom: 1px solid #edf2f7 !important; }
      .offer-item-row:last-child { border-bottom: none !important; }
      .offer-item-row__product { display: grid !important; gap: 6px !important; min-width: 0 !important; }
      .offer-item-row__title { font-size: 16px !important; line-height: 1.36 !important; font-weight: 700 !important; color: #10233b !important; }
      .offer-item-row__detail { font-size: 13px !important; line-height: 1.78 !important; color: #5f738a !important; }
      .offer-item-row__value { text-align: right !important; font-size: 14px !important; line-height: 1.55 !important; color: #42576f !important; }
      .offer-item-row__value--strong { font-weight: 700 !important; color: #10233b !important; }
      .offer-items__cards { display: none !important; }
      .offer-item-card { border: 1px solid #d7e2ee !important; border-radius: 20px !important; background: #ffffff !important; overflow: hidden !important; box-shadow: 0 14px 30px rgba(15, 23, 42, 0.06) !important; }
      .offer-item-card__top { display: grid !important; gap: 6px !important; padding: 16px 16px 14px !important; background: linear-gradient(180deg, #fcfdff 0%, #f5f9ff 100%) !important; border-bottom: 1px solid #edf2f7 !important; }
      .offer-item-card__eyebrow { font-size: 10px !important; font-weight: 700 !important; letter-spacing: 0.08em !important; text-transform: uppercase !important; color: #7d90a6 !important; }
      .offer-item-card__title { font-size: 16px !important; line-height: 1.35 !important; font-weight: 700 !important; color: #10233b !important; }
      .offer-item-card__detail { font-size: 13px !important; line-height: 1.72 !important; color: #5f738a !important; }
      .offer-item-card__grid { display: grid !important; grid-template-columns: repeat(2, minmax(0, 1fr)) !important; gap: 0 !important; margin: 0 !important; }
      .offer-item-card__metric { display: grid !important; justify-items: center !important; align-content: center !important; gap: 7px !important; min-height: 78px !important; padding: 14px 12px 13px !important; text-align: center !important; background: #ffffff !important; }
      .offer-item-card__metric dt, .offer-item-card__metric dd { margin: 0 !important; }
      .offer-item-card__metric dt { font-size: 11px !important; font-weight: 700 !important; letter-spacing: 0.06em !important; text-transform: uppercase !important; color: #7d90a6 !important; }
      .offer-item-card__metric dd { text-align: center !important; font-size: 14px !important; font-weight: 700 !important; color: #10233b !important; }
      .offer-item-card__metric:not(.offer-item-card__metric--total):not(.offer-item-card__metric--full):nth-child(odd) { border-right: 1px solid #edf2f7 !important; }
      .offer-item-card__metric:nth-child(n + 3):not(.offer-item-card__metric--total) { border-top: 1px solid #edf2f7 !important; }
      .offer-item-card__metric--full { grid-column: 1 / -1 !important; border-top: 1px solid #edf2f7 !important; }
      .offer-item-card__metric--total {
        grid-column: 1 / -1 !important;
        gap: 8px !important;
        min-height: 0 !important;
        padding: 16px 14px 15px !important;
        border-top: 1px solid #142742 !important;
        background: linear-gradient(135deg, #13233a 0%, #223b63 100%) !important;
      }
      .offer-item-card__metric--total dt,
      .offer-item-card__metric--total dd {
        color: #ffffff !important;
      }
      .offer-item-card__metric--total dd { font-size: 18px !important; font-weight: 800 !important; letter-spacing: -0.02em !important; }
      html.offer-mobile {
        background:
          radial-gradient(circle at top, #fefefe 0%, #eef3fb 46%, #e7eef8 100%) !important;
      }
      html.offer-mobile body {
        background: transparent !important;
      }
      html.offer-mobile .doc-wrapper {
        width: 100% !important;
        max-width: none !important;
        margin: 0 !important;
        padding: 0 !important;
        background: transparent !important;
      }
      html.offer-mobile .page-block {
        position: relative !important;
      }
      html.offer-mobile .public-offer-promo {
        margin: 0 !important;
        border: none !important;
        border-radius: 0 !important;
        overflow: hidden !important;
        background: #08162d !important;
        box-shadow: none !important;
      }
      html.offer-mobile .public-offer-promo .page-content,
      html.offer-mobile .public-offer-promo .page-content--edge-to-edge {
        position: relative !important;
        min-height: min(100dvh, 860px) !important;
        padding: 0 !important;
        overflow: hidden !important;
      }
      html.offer-mobile .public-offer-promo .page-content::after,
      html.offer-mobile .public-offer-promo .page-content--edge-to-edge::after {
        content: '' !important;
        position: absolute !important;
        inset: 0 !important;
        background:
          linear-gradient(180deg, rgba(7, 18, 37, 0.26) 0%, rgba(7, 18, 37, 0.06) 28%, rgba(7, 18, 37, 0.72) 84%, rgba(7, 18, 37, 0.92) 100%) !important;
        pointer-events: none !important;
      }
      html.offer-mobile .public-offer-promo .page-content > div[style*="position:absolute"],
      html.offer-mobile .public-offer-promo .page-content--edge-to-edge > div[style*="position:absolute"] {
        position: absolute !important;
        inset: 0 !important;
        width: 100% !important;
        height: 100% !important;
        max-width: none !important;
        line-height: 0 !important;
      }
      html.offer-mobile .public-offer-promo .page-content > div[style*="position:absolute"] img,
      html.offer-mobile .public-offer-promo .page-content--edge-to-edge > div[style*="position:absolute"] img {
        width: 100% !important;
        height: 100% !important;
        max-width: none !important;
        object-fit: cover !important;
        object-position: center !important;
        border-radius: 0 !important;
      }
      html.offer-mobile .public-offer-primary {
        position: relative !important;
        z-index: 2 !important;
        margin-top: -112px !important;
      }
      html.offer-mobile .public-offer-primary .page-content,
      html.offer-mobile .public-offer-primary .page-content--document {
        position: relative !important;
        padding: 32px 18px 30px !important;
        border-radius: 34px 34px 0 0 !important;
        background: linear-gradient(180deg, rgba(255, 255, 255, 0.96), #f6f9fd 100%) !important;
        border-top: 1px solid rgba(255, 255, 255, 0.92) !important;
        box-shadow: 0 -18px 48px rgba(8, 21, 45, 0.16) !important;
      }
      html.offer-mobile .public-offer-primary .page-content::before,
      html.offer-mobile .public-offer-primary .page-content--document::before {
        content: '' !important;
        position: absolute !important;
        top: -18px !important;
        left: 22px !important;
        right: 22px !important;
        height: 54px !important;
        border-radius: 999px !important;
        background: linear-gradient(180deg, rgba(255, 255, 255, 0.78), rgba(255, 255, 255, 0)) !important;
        opacity: 0.92 !important;
        pointer-events: none !important;
        filter: blur(6px) !important;
      }
      html.offer-mobile .public-offer-primary .offer-shell {
        gap: 18px !important;
      }
      html.offer-mobile .public-offer-primary .offer-shell__header,
      html.offer-mobile .public-offer-primary .offer-shell__topline {
        grid-template-columns: minmax(0, 1fr) !important;
        gap: 14px !important;
      }
      html.offer-mobile .public-offer-primary .offer-shell__sender {
        gap: 12px !important;
      }
      html.offer-mobile .public-offer-primary .offer-shell__logo {
        width: 54px !important;
        height: 54px !important;
        border-radius: 16px !important;
      }
      html.offer-mobile .public-offer-primary .offer-shell__sender-copy {
        gap: 3px !important;
        font-size: 14px !important;
        line-height: 1.55 !important;
        color: #5e7293 !important;
      }
      html.offer-mobile .public-offer-primary .offer-shell__meta {
        justify-items: start !important;
        text-align: left !important;
        gap: 10px !important;
      }
      html.offer-mobile .public-offer-primary .offer-shell__meta dl {
        width: 100% !important;
        gap: 10px !important;
      }
      html.offer-mobile .public-offer-primary .offer-shell__meta dl div {
        grid-template-columns: repeat(2, minmax(0, 1fr)) !important;
        align-items: end !important;
        gap: 10px !important;
        padding-bottom: 10px !important;
        border-bottom: 1px solid rgba(145, 166, 201, 0.18) !important;
      }
      html.offer-mobile .public-offer-primary .offer-shell__meta dl div:last-child {
        border-bottom: none !important;
        padding-bottom: 0 !important;
      }
      html.offer-mobile .public-offer-primary .offer-shell__meta dt {
        font-size: 11px !important;
        line-height: 1.4 !important;
        letter-spacing: 0.14em !important;
        text-transform: uppercase !important;
        color: #8ca0c0 !important;
      }
      html.offer-mobile .public-offer-primary .offer-shell__meta dd {
        font-size: 15px !important;
        line-height: 1.35 !important;
        font-weight: 700 !important;
        color: #10203c !important;
      }
      html.offer-mobile .public-offer-primary .offer-shell__topline {
        padding-bottom: 16px !important;
      }
      html.offer-mobile .public-offer-primary .offer-shell__topline h1 {
        font-size: 30px !important;
        line-height: 0.98 !important;
        letter-spacing: -0.04em !important;
        max-width: 11ch !important;
      }
      html.offer-mobile .public-offer-primary .offer-shell__customer {
        display: grid !important;
        gap: 4px !important;
        padding-left: 0 !important;
        border-left: none !important;
        padding-top: 14px !important;
        border-top: 1px solid rgba(145, 166, 201, 0.18) !important;
        font-size: 14px !important;
        line-height: 1.6 !important;
        color: #5e7293 !important;
      }
      html.offer-mobile .public-offer-primary .offer-section {
        gap: 10px !important;
      }
      html.offer-mobile .public-offer-primary .offer-section p {
        font-size: 14px !important;
        line-height: 1.78 !important;
        color: #546783 !important;
      }
      html.offer-mobile .public-offer-primary .offer-section h2,
      html.offer-mobile .public-offer-primary .offer-items > h2 {
        font-size: 30px !important;
        line-height: 1.02 !important;
        letter-spacing: -0.04em !important;
        color: #10203c !important;
      }
      html.offer-mobile .public-offer-primary .offer-summary {
        position: relative !important;
        width: 100% !important;
        margin-top: 20px !important;
        margin-left: 0 !important;
        padding: 14px 0 4px !important;
        border: 1px solid rgba(174, 191, 219, 0.32) !important;
        border-radius: 28px !important;
        background: linear-gradient(180deg, rgba(255, 255, 255, 0.98), rgba(248, 251, 255, 0.96)) !important;
        box-shadow: 0 22px 46px rgba(11, 24, 47, 0.1) !important;
      }
      html.offer-mobile .public-offer-primary .offer-summary::before {
        content: 'Summering' !important;
        display: block !important;
        padding: 0 18px 10px !important;
        font-size: 11px !important;
        font-weight: 800 !important;
        letter-spacing: 0.14em !important;
        text-transform: uppercase !important;
        color: #7890b3 !important;
      }
      html.offer-mobile .public-offer-primary .offer-summary__row {
        padding: 12px 18px !important;
        font-size: 15px !important;
        color: #5a6d8a !important;
      }
      html.offer-mobile .public-offer-primary .offer-summary__row strong {
        font-size: 17px !important;
        color: #10203c !important;
      }
      html.offer-mobile .public-offer-primary .offer-summary__row + .offer-summary__row {
        border-top: 1px solid rgba(174, 191, 219, 0.18) !important;
      }
      html.offer-mobile .public-offer-primary .offer-summary__row--total {
        margin-top: 10px !important;
        padding: 16px 18px 18px !important;
        background: #12213d !important;
        color: #dce8fb !important;
        border-top: none !important;
      }
      html.offer-mobile .public-offer-primary .offer-summary__row--total strong {
        font-size: 24px !important;
        letter-spacing: -0.04em !important;
        color: #ffffff !important;
      }
      html.offer-mobile .public-offer-primary .offer-items {
        gap: 18px !important;
      }
      html.offer-mobile .public-offer-primary .offer-items__cards {
        gap: 18px !important;
      }
      html.offer-mobile .public-offer-primary .offer-item-card {
        border: 1px solid rgba(174, 191, 219, 0.26) !important;
        border-radius: 30px !important;
        background: rgba(255, 255, 255, 0.97) !important;
        box-shadow: 0 18px 42px rgba(12, 24, 47, 0.08) !important;
      }
      html.offer-mobile .public-offer-primary .offer-item-card:first-child {
        border-color: rgba(35, 70, 129, 0.08) !important;
        background: linear-gradient(145deg, #162749 0%, #2f4a7f 100%) !important;
      }
      html.offer-mobile .public-offer-primary .offer-item-card__top {
        gap: 8px !important;
        padding: 20px 20px 0 !important;
        background: transparent !important;
        border-bottom: none !important;
      }
      html.offer-mobile .public-offer-primary .offer-item-card__eyebrow {
        font-size: 10px !important;
        font-weight: 800 !important;
        letter-spacing: 0.14em !important;
        color: #7c94ba !important;
      }
      html.offer-mobile .public-offer-primary .offer-item-card__title {
        font-size: 28px !important;
        line-height: 1.02 !important;
        letter-spacing: -0.04em !important;
        color: #10203c !important;
      }
      html.offer-mobile .public-offer-primary .offer-item-card__detail {
        display: block !important;
        font-size: 14px !important;
        line-height: 1.7 !important;
        color: #5e7293 !important;
      }
      html.offer-mobile .public-offer-primary .offer-item-card:first-child .offer-item-card__eyebrow,
      html.offer-mobile .public-offer-primary .offer-item-card:first-child .offer-item-card__detail {
        color: rgba(220, 232, 251, 0.76) !important;
      }
      html.offer-mobile .public-offer-primary .offer-item-card:first-child .offer-item-card__title {
        color: #ffffff !important;
      }
      html.offer-mobile .public-offer-primary .offer-item-card__grid {
        display: grid !important;
        grid-template-columns: repeat(3, minmax(0, 1fr)) !important;
        gap: 10px !important;
        padding: 18px 20px 20px !important;
      }
      html.offer-mobile .public-offer-primary .offer-item-card__metric {
        display: grid !important;
        align-content: start !important;
        gap: 8px !important;
        min-height: 92px !important;
        padding: 14px !important;
        border: 1px solid rgba(180, 196, 223, 0.28) !important;
        border-bottom: 1px solid rgba(180, 196, 223, 0.28) !important;
        border-radius: 22px !important;
        background: #f6f9fd !important;
      }
      html.offer-mobile .public-offer-primary .offer-item-card__metric dt {
        font-size: 10px !important;
        font-weight: 800 !important;
        letter-spacing: 0.14em !important;
        color: #7d93b7 !important;
      }
      html.offer-mobile .public-offer-primary .offer-item-card__metric dd {
        text-align: left !important;
        font-size: 15px !important;
        line-height: 1.35 !important;
        font-weight: 800 !important;
        color: #10203c !important;
      }
      html.offer-mobile .public-offer-primary .offer-item-card:first-child .offer-item-card__metric {
        border-color: rgba(255, 255, 255, 0.12) !important;
        background: rgba(255, 255, 255, 0.08) !important;
      }
      html.offer-mobile .public-offer-primary .offer-item-card:first-child .offer-item-card__metric dt {
        color: rgba(220, 232, 251, 0.7) !important;
      }
      html.offer-mobile .public-offer-primary .offer-item-card:first-child .offer-item-card__metric dd {
        color: #ffffff !important;
      }
`;
