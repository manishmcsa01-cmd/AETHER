/* ═══════════════════════════════════════════════════════════════
   AETHER Trust Console Page
   Enterprise AI Workforce Platform — Trust Layer
   Identity · Delegation · Reputation · Recourse
   Embeds the standalone trust console (trust.html), which talks to
   the /api/trust/* endpoints served by server.py.
   ═══════════════════════════════════════════════════════════════ */

window.AETHER = window.AETHER || {};
AETHER.pages = AETHER.pages || {};

AETHER.pages.trust = {

  render: function () {
    var html = '<div class="page-content" style="padding:0;height:100%;display:flex;flex-direction:column;">';
    html += '<iframe src="trust.html" title="AETHER Trust Console" ';
    html += 'style="flex:1;width:100%;min-height:calc(100vh - 120px);border:0;display:block;background:#0d1117;"></iframe>';
    html += '</div>';
    return html;
  },

  init: function () {
    /* The embedded console manages its own state and API calls. */
  }
};
