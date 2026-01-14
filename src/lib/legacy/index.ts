import 'core-js/stable';
import 'regenerator-runtime/runtime';
import 'jquery';
import 'element-closest-polyfill';
import 'fast-text-encoding';
import 'intersection-observer';
import 'classlist.js';
import 'whatwg-fetch';
import 'abortcontroller-polyfill'; // requires fetch
import 'resize-observer-polyfill';
import 'proxy-polyfill';
import browser from '../../scripts/browser';

import './domParserTextHtml';
import './elementAppendPrepend';
import './focusPreventScroll';
import './htmlMediaElement';
import './keyboardEvent';
import './patchHeaders';
import './vendorStyles';

if (browser.mobile || browser.tablet || browser.tv || browser.iOS || browser.osx) {
    import('./EventEmitter');
    import('./nativeshell');
}

// Load config tweaks for developer and tizen
const protocol = window.location.protocol;
if (browser.tizen || protocol === 'http:') {
    import('./config-slide');
}