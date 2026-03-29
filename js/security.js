// Anti-DevTools / Security script
(function() {
    document.addEventListener('contextmenu', e => e.preventDefault());
    document.addEventListener('keydown', function(e) {
        if (e.keyCode === 123) { e.preventDefault(); return false; }
        if (e.ctrlKey && e.shiftKey && e.keyCode === 73) { e.preventDefault(); return false; }
        if (e.ctrlKey && e.shiftKey && e.keyCode === 74) { e.preventDefault(); return false; }
        if (e.ctrlKey && e.keyCode === 85) { e.preventDefault(); return false; }
    });
    console.log('%cÂ¡Alto ahÃ­!', 'color: red; font-size: 40px; font-weight: bold;');
    console.log('%cEl cÃ³digo fuente estÃ¡ protegido. Acceso no autorizado.', 'color: gray; font-size: 14px;');
})();