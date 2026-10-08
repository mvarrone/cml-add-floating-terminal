/*
 * CML Floating Console Panel
 * ---------------------------
 * Toggle bookmarklet that turns the Cisco Modeling Labs (CML2) console
 * panel into a floating window. The first click activates it, the
 * second click deactivates it and restores the original layout.
 *
 * To use as a browser bookmark: minify this to a single line and
 * prefix it with "javascript:" as the bookmark's URL. The minified
 * one liner is available in bookmarklet-url.txt in this folder.
 *
 * Runs entirely client side. Does not modify anything on the CML
 * server.
 */
(function () {
  var panel = document.getElementById('footerArea');
  if (!panel) {
    alert('Console panel not found. Open a console first (right click a node > Console).');
    return;
  }

  // --- DEACTIVATE: if already active, restore state and exit ---
  if (window.__cmlPanelState) {
    var s = window.__cmlPanelState;
    if (s.observer) s.observer.disconnect();
    if (s.onMouseMove) window.removeEventListener('mousemove', s.onMouseMove);
    if (s.onMouseUp) window.removeEventListener('mouseup', s.onMouseUp);
    if (s.handle && s.onMouseDown) s.handle.removeEventListener('mousedown', s.onMouseDown);

    var po = s.panelOriginal;
    Object.keys(po).forEach(function (k) {
      panel.style[k] = po[k];
    });
    delete panel.dataset.userHeight;

    if (s.canvasPane) s.canvasPane.style.height = s.canvasPaneOriginalHeight;
    if (s.splitter) s.splitter.style.display = s.splitterOriginalDisplay;
    if (s.handle) s.handle.style.cursor = s.handleOriginalCursor;

    window.__cmlPanelState = null;
    return;
  }

  // --- ACTIVATE ---
  var cnv = document.querySelector('.splitpanes.splitpanes--horizontal.cnv');
  var canvasPane = cnv ? cnv.querySelector('.splitpanes__pane.bg-cml-background') : null;
  var splitter = cnv ? cnv.querySelector('.splitpanes__splitter') : null;
  var handle = panel.querySelector('.v-toolbar');

  // Save the original state before making any changes, so it can be
  // restored exactly on deactivation.
  var panelOriginal = {
    position: panel.style.position,
    top: panel.style.top,
    left: panel.style.left,
    width: panel.style.width,
    height: panel.style.height,
    zIndex: panel.style.zIndex,
    resize: panel.style.resize,
    overflow: panel.style.overflow,
    boxShadow: panel.style.boxShadow
  };
  var canvasPaneOriginalHeight = canvasPane ? canvasPane.style.height : null;
  var splitterOriginalDisplay = splitter ? splitter.style.display : null;
  var handleOriginalCursor = handle ? handle.style.cursor : null;

  // Re-applies the floating layout if CML's reactive framework resets
  // the canvas/splitter styles, for example when toggling PANES.
  function enforceLayout() {
    if (canvasPane && canvasPane.style.height !== '100%') canvasPane.style.height = '100%';
    if (splitter && splitter.style.display !== 'none') splitter.style.display = 'none';
    var h = panel.style.height;
    if (h && h.indexOf('%') !== -1) {
      // CML reset the height to a percentage value: this is a reset,
      // not a user intent, so restore the last known pixel height.
      panel.style.height = panel.dataset.userHeight;
    } else if (h) {
      // Genuine pixel height (user drag/resize, or ours): remember it.
      panel.dataset.userHeight = h;
    }
  }

  // Default size and position.
  var vw = window.innerWidth,
    vh = window.innerHeight;
  var w = Math.round(vw * 0.48); // 48% of window width
  var h = Math.round(vh * 0.72); // 72% of window height

  panel.style.position = 'fixed';
  panel.style.top = '130px'; // distance from the top toolbar
  panel.style.left = vw - w - 20 + 'px'; // 20px from the right edge
  panel.style.width = w + 'px';
  panel.style.height = h + 'px';
  panel.dataset.userHeight = h + 'px';
  panel.style.zIndex = 9999;
  panel.style.resize = 'both';
  panel.style.overflow = 'auto';
  panel.style.boxShadow = '0 0 20px rgba(0,0,0,0.6)';
  enforceLayout();

  var observer = new MutationObserver(enforceLayout);
  if (canvasPane) observer.observe(canvasPane, { attributes: true, attributeFilter: ['style'] });
  if (splitter) observer.observe(splitter, { attributes: true, attributeFilter: ['style'] });
  observer.observe(panel, { attributes: true, attributeFilter: ['style'] });

  // Drag support, using addEventListener (does not overwrite
  // window.onmousemove/onmouseup).
  var dragging = false,
    offX = 0,
    offY = 0;

  function onMouseDown(e) {
    if (e.target.closest('button, .tab')) return;
    dragging = true;
    var r = panel.getBoundingClientRect();
    offX = e.clientX - r.left;
    offY = e.clientY - r.top;
    e.preventDefault();
  }
  function onMouseMove(e) {
    if (!dragging) return;
    panel.style.left = e.clientX - offX + 'px';
    panel.style.top = e.clientY - offY + 'px';
  }
  function onMouseUp() {
    dragging = false;
  }

  if (handle) {
    handle.style.cursor = 'move';
    handle.addEventListener('mousedown', onMouseDown);
  }
  window.addEventListener('mousemove', onMouseMove);
  window.addEventListener('mouseup', onMouseUp);

  // All state lives in a single global object, so it can be cleanly
  // torn down on the next click.
  window.__cmlPanelState = {
    panel: panel,
    canvasPane: canvasPane,
    splitter: splitter,
    handle: handle,
    observer: observer,
    onMouseDown: onMouseDown,
    onMouseMove: onMouseMove,
    onMouseUp: onMouseUp,
    panelOriginal: panelOriginal,
    canvasPaneOriginalHeight: canvasPaneOriginalHeight,
    splitterOriginalDisplay: splitterOriginalDisplay,
    handleOriginalCursor: handleOriginalCursor
  };
})();
