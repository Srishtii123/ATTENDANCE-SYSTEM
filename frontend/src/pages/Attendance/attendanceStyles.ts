export const attendanceShell =
  'relative bg-[var(--ams-bg)] p-3 text-[var(--ams-text)] sm:p-4 lg:p-5 md:h-[calc(100vh-145px)] md:overflow-hidden';

export const attendanceShellInner = 'relative mx-auto flex h-full max-w-[1500px] flex-col gap-3 md:min-h-0';

export const attendanceHeaderCard =
  'rounded-2xl border border-[var(--ams-border)] bg-[var(--ams-panel)] p-3 shadow-[0_18px_60px_rgba(15,23,42,0.10)] sm:p-4';

export const attendancePanel =
  'rounded-2xl border border-[var(--ams-border)] bg-[var(--ams-panel)] p-3 shadow-[0_16px_52px_rgba(15,23,42,0.10)]';

export const attendanceGridPanel =
  'relative w-full flex-1 rounded-2xl border border-[var(--ams-border)] bg-[var(--ams-panel)] p-2 shadow-[0_16px_52px_rgba(15,23,42,0.10)] md:min-h-0';

export const attendanceIconBox =
  'flex h-10 w-10 shrink-0 items-center justify-center rounded-xl bg-[rgba(93,202,165,0.14)] text-lg text-[#6fe2bd] ring-1 ring-[#254239]';

export const attendanceTitle = 'text-xl font-bold text-[var(--ams-text)]';

export const attendanceSubtitle = 'text-xs text-[var(--ams-muted)]';

export const attendancePrimaryButton =
  'border-[#1D9E75] bg-[#0F6E56] text-[#E1F5EE] shadow-[0_12px_34px_rgba(15,110,86,0.25)]';

export const attendancePageBackdrop =
  'pointer-events-none absolute inset-0 bg-[radial-gradient(circle_at_16%_8%,rgba(93,202,165,0.10),transparent_30%),radial-gradient(circle_at_88%_18%,rgba(133,183,235,0.10),transparent_26%)]';

export const attendanceGridTheme = (windowWidth: number) => `
  .ag-theme-alpine {
    --ag-font-size: 11px;
    --ag-font-family: -apple-system, system-ui, sans-serif;
    --ag-background-color: var(--ams-panel);
    --ag-foreground-color: var(--ams-text);
    --ag-header-background-color: var(--ams-panel-soft);
    --ag-header-foreground-color: var(--ams-text);
    --ag-odd-row-background-color: var(--ams-panel);
    --ag-row-hover-color: var(--ams-panel-soft);
    --ag-selected-row-background-color: rgba(93, 202, 165, 0.14);
    --ag-row-border-color: var(--ams-border);
    --ag-border-color: var(--ams-border);
    --ag-cell-horizontal-padding: ${windowWidth < 768 ? '3px' : '8px'};
    --ag-header-height: ${windowWidth < 768 ? '35px' : '30px'};
    --ag-row-height: ${windowWidth < 768 ? '40px' : '25px'};
    border: 1px solid var(--ams-border);
    border-radius: 12px;
    overflow: hidden;
  }

  .ag-theme-alpine .ag-header-cell-menu-button {
    opacity: 1 !important;
    visibility: visible !important;
    pointer-events: all !important;
    cursor: pointer !important;
  }

  .ag-theme-alpine .ag-menu {
    z-index: 10002 !important;
    position: absolute !important;
    background: var(--ams-panel);
    color: var(--ams-text);
    border: 1px solid var(--ams-border);
    border-radius: 10px;
    box-shadow: 0 18px 50px rgba(0, 0, 0, 0.35);
  }

  .ag-theme-alpine .ag-filter-body-wrapper {
    min-width: 200px;
    padding: 8px;
  }

  .ag-theme-alpine .ag-filter-apply-panel {
    border-top: 1px solid var(--ams-border);
    padding: 8px;
    background: var(--ams-panel-soft);
  }

  .ag-theme-alpine .ag-header-cell-text {
    font-weight: 700;
    font-size: ${windowWidth < 768 ? '10px' : '12px'};
    color: var(--ams-text);
  }

  .ag-theme-alpine .ag-popup {
    z-index: 10003 !important;
    position: fixed !important;
  }

  .ag-theme-alpine .ag-filter-wrapper {
    z-index: 10004 !important;
  }

  .ag-theme-alpine .ag-paging-panel {
    color: var(--ams-muted);
    border-top-color: var(--ams-border);
  }

  @media (max-width: 768px) {
    .ag-theme-alpine {
      border-radius: 10px;
    }

    .ag-theme-alpine .ag-menu {
      min-width: 250px;
      max-width: 90vw;
    }
  }
`;
