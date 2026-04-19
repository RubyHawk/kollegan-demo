export const PUBLIC_OFFER_DOCUMENT_STYLES_PART_2 = `      html.offer-mobile .public-offer-primary .offer-item-card__metric--total {
        grid-column: 1 / -1 !important;
        display: flex !important;
        align-items: center !important;
        justify-content: space-between !important;
        gap: 16px !important;
        min-height: 0 !important;
        margin-top: 2px !important;
        padding: 18px 0 0 !important;
        border: none !important;
        border-radius: 0 !important;
        border-top: 1px solid rgba(180, 196, 223, 0.24) !important;
        background: transparent !important;
      }
      html.offer-mobile .public-offer-primary .offer-item-card__metric--total dt {
        color: #586b88 !important;
      }
      html.offer-mobile .public-offer-primary .offer-item-card__metric--total dd {
        text-align: left !important;
        font-size: 22px !important;
        letter-spacing: -0.04em !important;
        color: #10203c !important;
      }
      html.offer-mobile .public-offer-primary .offer-item-card:first-child .offer-item-card__metric--total {
        border-top-color: rgba(255, 255, 255, 0.12) !important;
      }
      html.offer-mobile .public-offer-primary .offer-item-card:first-child .offer-item-card__metric--total dt {
        color: rgba(220, 232, 251, 0.78) !important;
      }
      html.offer-mobile .public-offer-primary .offer-item-card:first-child .offer-item-card__metric--total dd {
        color: #ffffff !important;
      }
      @media (max-width: 640px) {
        .page-block { margin: 0 !important; min-height: 0 !important; height: auto !important; }
        .page-content,
        .page-content--edge-to-edge,
        .page-content--document { min-height: 0 !important; height: auto !important; }
        .page-block--document { margin: 0 !important; border-radius: 0 !important; }
        .page-content--document { padding: 20px 14px 18px !important; }
        .offer-shell__header, .offer-shell__topline { grid-template-columns: 1fr !important; gap: 12px !important; }
        .offer-shell__header { padding-bottom: 16px !important; }
        .offer-shell__sender { gap: 10px !important; }
        .offer-shell__logo { width: 44px !important; height: 44px !important; }
        .offer-shell__meta { justify-items: stretch !important; text-align: left !important; padding: 14px !important; }
        .offer-shell__meta dl div { grid-template-columns: minmax(0, 1fr) auto !important; gap: 8px !important; align-items: end !important; }
        .offer-shell__meta .offer-shell__meta-row--recipient { grid-template-columns: 1fr !important; gap: 4px !important; }
        .offer-shell__meta dt { font-size: 10.5px !important; line-height: 1.35 !important; }
        .offer-shell__meta dd { font-size: 13px !important; line-height: 1.35 !important; text-align: right !important; white-space: nowrap !important; }
        .offer-shell__meta dd small { font-size: 11px !important; }
        .offer-shell__meta .offer-shell__meta-row--recipient dd { text-align: left !important; white-space: normal !important; }
        .offer-shell__customer { padding-left: 10px !important; font-size: 13px !important; line-height: 1.55 !important; }
        .offer-shell__sender-copy { font-size: 12.5px !important; line-height: 1.55 !important; }
        .offer-section p { font-size: 14px !important; line-height: 1.76 !important; }
        .offer-table-header h2 { font-size: 22px !important; line-height: 1.2 !important; }
        .offer-item-card__top { gap: 4px !important; padding: 14px 14px 12px !important; }
        .offer-item-card__eyebrow { font-size: 9.5px !important; }
        .offer-item-card__title { font-size: 18px !important; line-height: 1.32 !important; }
        .offer-item-card__detail { display: block !important; font-size: 12.5px !important; line-height: 1.62 !important; }
        .offer-items__table { display: none !important; }
        .offer-items__cards { display: grid !important; gap: 14px !important; }
        .offer-item-card { border-color: #d9e3ee !important; box-shadow: none !important; background: #ffffff !important; }
        .offer-item-card__metric { padding: 12px 14px !important; background: #ffffff !important; }
        .offer-item-card__metric dt { font-size: 11px !important; }
        .offer-item-card__metric dd { font-size: 14px !important; }
        .offer-item-card__metric:nth-child(even) { background: #fbfdff !important; }
        .offer-item-card__metric--total { border-top: 1px solid rgba(255,255,255,0.16) !important; }
        .offer-item-card__metric--total dd { font-size: 20px !important; font-weight: 800 !important; color: #ffffff !important; }
        .offer-shell__footer { grid-template-columns: repeat(3, minmax(0, 1fr)) !important; gap: 10px !important; text-align: center !important; }
        .offer-shell__footer div { font-size: 11.5px !important; gap: 6px !important; }
        .offer-shell__footer-icon { width: 14px !important; height: 14px !important; flex: 0 0 14px !important; }
        .offer-summary { width: 100% !important; border-radius: 14px !important; padding: 0 !important; margin-top: 18px !important; border-color: #d9e3ee !important; box-shadow: none !important; }
        .offer-summary--below { width: 100% !important; margin-top: 18px !important; }
        .offer-summary__row { font-size: 13.5px !important; padding: 12px 14px !important; line-height: 1.55 !important; border-bottom: 1px solid #e5ecf3 !important; }
        .offer-summary__row span { font-weight: 600 !important; }
        .offer-summary__row--total { font-size: 16px !important; padding: 14px !important; }
      .offer-summary__row--total span { font-size: 11.5px !important; }
      .offer-summary__row--total strong { font-size: 22px !important; color: #ffffff !important; }
      .offer-shell__footer div { font-size: 14px !important; line-height: 1.6 !important; }
      }
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
      }
      html.offer-mobile .doc-wrapper.doc-wrapper--with-promo .public-offer-primary {
        margin-top: -72px !important;
      }
      html.offer-mobile .doc-wrapper:not(.doc-wrapper--with-promo) .public-offer-primary {
        margin-top: 0 !important;
      }
      html.offer-mobile .public-offer-primary .page-content,
      html.offer-mobile .public-offer-primary .page-content--document {
        position: relative !important;
        padding: 28px 18px 20px !important;
        border-radius: 0 !important;
        background: transparent !important;
        border-top: none !important;
        box-shadow: none !important;
      }
      html.offer-mobile .doc-wrapper.doc-wrapper--with-promo .public-offer-primary .page-content::before,
      html.offer-mobile .doc-wrapper.doc-wrapper--with-promo .public-offer-primary .page-content--document::before {
        content: none !important;
      }
      html.offer-mobile .doc-wrapper:not(.doc-wrapper--with-promo) .public-offer-primary .page-content::before,
      html.offer-mobile .doc-wrapper:not(.doc-wrapper--with-promo) .public-offer-primary .page-content--document::before {
        content: none !important;
      }
      html.offer-mobile .public-offer-primary .offer-shell {
        gap: 24px !important;
      }
      html.offer-mobile .public-offer-primary .offer-shell__header {
        grid-template-columns: minmax(0, 1.14fr) minmax(118px, 0.86fr) !important;
        gap: 14px !important;
        align-items: start !important;
        padding: 16px 16px 15px !important;
        border: 1px solid rgba(178, 194, 219, 0.34) !important;
        border-radius: 22px !important;
        background: linear-gradient(180deg, rgba(255, 255, 255, 0.98), rgba(244, 248, 253, 0.94)) !important;
        box-shadow: 0 14px 30px rgba(15, 23, 42, 0.05) !important;
        backdrop-filter: blur(10px) !important;
      }
      html.offer-mobile .public-offer-primary .offer-shell__sender {
        display: grid !important;
        grid-template-columns: 1fr !important;
        min-width: 0 !important;
        align-items: flex-start !important;
        align-content: start !important;
        gap: 8px !important;
      }
      html.offer-mobile .public-offer-primary .offer-shell__logo {
        display: block !important;
        width: 46px !important;
        height: 46px !important;
        border-radius: 14px !important;
        object-fit: cover !important;
        box-shadow: 0 10px 22px rgba(125, 148, 178, 0.18) !important;
      }
      html.offer-mobile .public-offer-primary .offer-shell__sender-copy {
        gap: 3px !important;
        font-size: 13.5px !important;
        line-height: 1.36 !important;
        color: #5b6f88 !important;
      }
      html.offer-mobile .public-offer-primary .offer-shell__sender-name {
        font-size: 15.5px !important;
        line-height: 1.22 !important;
        color: #142846 !important;
      }
      html.offer-mobile .public-offer-primary .offer-shell__meta {
        align-self: stretch !important;
        justify-items: stretch !important;
        text-align: left !important;
        gap: 0 !important;
      }
      html.offer-mobile .public-offer-primary .offer-shell__meta dl {
        width: 100% !important;
        display: grid !important;
        grid-template-columns: 1fr !important;
        gap: 0 !important;
      }
      html.offer-mobile .public-offer-primary .offer-shell__meta dl div {
        display: grid !important;
        grid-template-columns: 1fr !important;
        align-items: start !important;
        gap: 3px !important;
        padding: 8px 0 9px !important;
        border-top: 1px solid rgba(145, 166, 201, 0.16) !important;
        border-bottom: none !important;
      }
      html.offer-mobile .public-offer-primary .offer-shell__meta dl div:first-child {
        padding-top: 0 !important;
        border-top: none !important;
      }
      html.offer-mobile .public-offer-primary .offer-shell__meta dl div:nth-child(3) {
        grid-column: auto !important;
      }
      html.offer-mobile .public-offer-primary .offer-shell__meta dl div:last-child {
        padding-bottom: 0 !important;
      }
      html.offer-mobile .public-offer-primary .offer-shell__meta dt {
        font-size: 10.5px !important;
        line-height: 1.28 !important;
        letter-spacing: 0.05em !important;
        text-transform: uppercase !important;
        color: #7e94b2 !important;
      }
      html.offer-mobile .public-offer-primary .offer-shell__meta dd {
        font-size: 14px !important;
        line-height: 1.2 !important;
        font-weight: 700 !important;
        color: #142846 !important;
        white-space: normal !important;
      }
      html.offer-mobile .public-offer-primary .offer-shell__topline {
        grid-template-columns: minmax(0, 1fr) !important;
        gap: 14px !important;
        padding: 2px 2px 6px !important;
        border-bottom: none !important;
      }
      html.offer-mobile .public-offer-primary .offer-shell__topline h1 {
        font-family: 'Times New Roman', Times, serif !important;
        font-size: 32px !important;
        line-height: 0.96 !important;
        letter-spacing: -0.04em !important;
        max-width: none !important;
        color: #19355d !important;
      }
      html.offer-mobile .public-offer-primary .offer-shell__customer,
      html.offer-mobile .public-offer-primary .offer-shell__customer-card {
        display: grid !important;
        gap: 5px !important;
        padding-left: 0 !important;
        border-left: none !important;
        padding-top: 0 !important;
        border-top: none !important;
        min-width: 0 !important;
        justify-self: start !important;
        text-align: left !important;
        font-size: 15px !important;
        line-height: 1.62 !important;
        color: #5b6f88 !important;
      }
      html.offer-mobile .public-offer-primary .offer-shell__customer-primary,
      html.offer-mobile .public-offer-primary .offer-shell__customer-name {
        font-size: 19px !important;
        line-height: 1.25 !important;
        font-weight: 700 !important;
        color: #142846 !important;
      }
      html.offer-mobile .public-offer-primary .offer-shell__customer-secondary,
      html.offer-mobile .public-offer-primary .offer-shell__customer p:not(.offer-shell__customer-name) {
        font-size: 15px !important;
        line-height: 1.58 !important;
        color: #5b6f88 !important;
      }
      html.offer-mobile .public-offer-primary .offer-section {
        gap: 12px !important;
      }
      html.offer-mobile .public-offer-primary .offer-section p {
        font-size: 15px !important;
        line-height: 1.78 !important;
        color: #546783 !important;
      }
      html.offer-mobile .public-offer-primary .offer-section--terms,
      html.offer-mobile .public-offer-primary .offer-section--notes {
        padding: 18px 18px 19px !important;
        border: 1px solid rgba(178, 194, 219, 0.3) !important;
        border-radius: 22px !important;
        background: rgba(255, 255, 255, 0.94) !important;
        box-shadow: 0 16px 30px rgba(15, 23, 42, 0.05) !important;
      }
      html.offer-mobile .public-offer-primary .offer-section h2,
      html.offer-mobile .public-offer-primary .offer-items > h2 {
        font-family: 'Times New Roman', Times, serif !important;
        font-size: 31px !important;
        line-height: 1.02 !important;
        letter-spacing: -0.04em !important;
        color: #19355d !important;
      }
      html.offer-mobile .public-offer-primary .offer-summary {
        position: relative !important;
        width: 100% !important;
        margin-top: 24px !important;
        margin-left: 0 !important;
        padding: 12px 0 0 !important;
        border: 1px solid rgba(174, 191, 219, 0.28) !important;
        border-radius: 24px !important;
        background: linear-gradient(180deg, rgba(255, 255, 255, 0.98), rgba(247, 250, 254, 0.95)) !important;
        box-shadow: 0 18px 34px rgba(15, 23, 42, 0.06) !important;
      }
      html.offer-mobile .public-offer-primary .offer-summary::before {
        content: 'Summering' !important;
        display: block !important;
        padding: 0 18px 10px !important;
        font-size: 11.5px !important;
        font-weight: 700 !important;
        letter-spacing: 0.08em !important;
        text-transform: uppercase !important;
        color: #7c91ae !important;
      }
      html.offer-mobile .public-offer-primary .offer-summary__row {
        padding: 14px 18px !important;
        font-size: 15px !important;
        line-height: 1.55 !important;
        color: #5b6f88 !important;
      }
      html.offer-mobile .public-offer-primary .offer-summary__row span {
        font-weight: 600 !important;
        color: #5f738d !important;
      }
      html.offer-mobile .public-offer-primary .offer-summary__row strong {
        font-size: 17px !important;
        color: #142846 !important;
        font-variant-numeric: tabular-nums !important;
      }
      html.offer-mobile .public-offer-primary .offer-summary__row + .offer-summary__row {
        border-top: 1px solid rgba(174, 191, 219, 0.18) !important;
      }
      html.offer-mobile .public-offer-primary .offer-summary__row--total {
        margin-top: 10px !important;
        padding: 16px 18px 18px !important;
        background: linear-gradient(135deg, #13233a 0%, #223b63 100%) !important;
        color: #e8f0fc !important;
        border-top: none !important;
      }
      html.offer-mobile .public-offer-primary .offer-summary__row--total span {
        font-size: 11.5px !important;
        letter-spacing: 0.08em !important;
        text-transform: uppercase !important;
        color: rgba(232, 240, 252, 0.78) !important;
      }
      html.offer-mobile .public-offer-primary .offer-summary__row--total strong {
        font-size: 23px !important;
        letter-spacing: -0.04em !important;
        color: #ffffff !important;
      }
      html.offer-mobile .public-offer-primary .offer-items {
        gap: 20px !important;
      }
      html.offer-mobile .public-offer-primary .offer-items__table {
        display: none !important;
      }
      html.offer-mobile .public-offer-primary .offer-items__cards {
        display: grid !important;
        gap: 18px !important;
      }
      html.offer-mobile .public-offer-primary .offer-item-card {
        border: 1px solid rgba(174, 191, 219, 0.26) !important;
        border-radius: 24px !important;
        background: rgba(255, 255, 255, 0.98) !important;
        box-shadow: 0 18px 34px rgba(15, 23, 42, 0.06) !important;
      }
      html.offer-mobile .public-offer-primary .offer-item-card:first-child {
        border-color: rgba(174, 191, 219, 0.26) !important;
        background: rgba(255, 255, 255, 0.98) !important;
      }
      html.offer-mobile .public-offer-primary .offer-item-card__top {
        gap: 10px !important;
        padding: 20px 20px 18px !important;
        background: linear-gradient(180deg, #fcfdff 0%, #f4f8fd 100%) !important;
        border-bottom: 1px solid rgba(174, 191, 219, 0.18) !important;
      }
      html.offer-mobile .public-offer-primary .offer-item-card__eyebrow {
        font-size: 11px !important;
        font-weight: 700 !important;
        letter-spacing: 0.08em !important;
        color: #7e94b2 !important;
      }
      html.offer-mobile .public-offer-primary .offer-item-card__title {
        font-family: 'Times New Roman', Times, serif !important;
        font-size: 24px !important;
        line-height: 1.06 !important;
        letter-spacing: -0.03em !important;
        color: #19355d !important;
      }
      html.offer-mobile .public-offer-primary .offer-item-card__detail {
        display: block !important;
        font-size: 14.5px !important;
        line-height: 1.72 !important;
        color: #5b6f88 !important;
      }
      html.offer-mobile .public-offer-primary .offer-item-card:first-child .offer-item-card__eyebrow,
      html.offer-mobile .public-offer-primary .offer-item-card:first-child .offer-item-card__detail {
        color: #5b6f88 !important;
      }
      html.offer-mobile .public-offer-primary .offer-item-card:first-child .offer-item-card__title {
        color: #19355d !important;
      }
      html.offer-mobile .public-offer-primary .offer-item-card__grid {
        display: grid !important;
        grid-template-columns: repeat(2, minmax(0, 1fr)) !important;
        gap: 0 !important;
        margin: 0 20px 18px !important;
        padding: 6px 0 0 !important;
        border-top: 1px solid rgba(174, 191, 219, 0.18) !important;
      }
      html.offer-mobile .public-offer-primary .offer-item-card__metric {
        display: flex !important;
        flex-direction: column !important;
        align-items: center !important;
        justify-content: center !important;
        gap: 5px !important;
        min-height: 0 !important;
        padding: 14px 10px 16px !important;
        border: none !important;
        border-bottom: 1px solid rgba(180, 196, 223, 0.22) !important;
        border-radius: 0 !important;
        background: transparent !important;
        text-align: center !important;
      }
      html.offer-mobile .public-offer-primary .offer-item-card__metric:not(.offer-item-card__metric--total):nth-child(odd) {
`;
