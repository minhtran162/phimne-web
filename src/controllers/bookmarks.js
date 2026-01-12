import * as userSettings from '../scripts/settings/userSettings';
import { ServerConnections } from 'lib/jellyfin-apiclient';
import globalize from '../lib/globalize';

class Bookmarks {
  constructor(view, params) {
    this.view = view;
    this.params = params;
  }

  /* ---- Optional lifecycle methods to match old interface ---- */
  onResume() { /* no-op, content is auto-rendered */ }
  onPause() { /* no-op */ }
  destroy() { /* no-op */ }
}

export default Bookmarks;
