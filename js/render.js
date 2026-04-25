// Renderer Engine
(function() {
    function decodeBase64(str) {
        return decodeURIComponent(escape(window.atob(str)));
    }
    document.addEventListener('DOMContentLoaded', function() {
        var rootApp = document.getElementById('root-app');
        var rootModals = document.getElementById('root-modals');
        if (rootApp) rootApp.innerHTML = decodeBase64(APP_LAYOUT_ENCODED);
        if (rootModals) rootModals.innerHTML = decodeBase64(APP_MODALS_ENCODED);
    });
})();