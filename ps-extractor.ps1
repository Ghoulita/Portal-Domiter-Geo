$html = [System.IO.File]::ReadAllText("index.html")

function Get-Block([string]$startTag, [string]$endTag) {
    if ($html.IndexOf($startTag) -eq -1) { Write-Output "Could not find $startTag"; return "" }
    $start = $html.IndexOf($startTag)
    $end = $html.IndexOf($endTag) + $endTag.Length
    return $html.Substring($start, $end - $start)
}

$header = Get-Block "<header" "</header>"
$main = Get-Block "<main" "</main>"
$footer = Get-Block "<footer" "</footer>"

$footerEnd = $html.IndexOf("</footer>") + 9
$scriptStart = $html.IndexOf("<script src=`"main.js`"></script>")
if ($footerEnd -ne -1 -and $scriptStart -ne -1) {
    $modals = $html.Substring($footerEnd, $scriptStart - $footerEnd).Trim()
} else {
    $modals = ""
}

$layout = $header + "`n" + $main + "`n" + $footer

# Base64 encode function (UTF-8)
function Encode-Base64([string]$text) {
    $bytes = [System.Text.Encoding]::UTF8.GetBytes($text)
    return [System.Convert]::ToBase64String($bytes)
}

$layoutB64 = Encode-Base64 $layout
$modalsB64 = Encode-Base64 $modals

$components = "// HTML Components (Obfuscated Base64)`nconst APP_LAYOUT_ENCODED = `"$layoutB64`";`nconst APP_MODALS_ENCODED = `"$modalsB64`";"

if (-not (Test-Path "js")) { New-Item -ItemType Directory -Force -Path "js" | Out-Null }
[System.IO.File]::WriteAllText("js\components.js", $components)

$render = "// Renderer Engine
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
})();"

[System.IO.File]::WriteAllText("js\render.js", $render)

$security = "// Anti-DevTools / Security script
(function() {
    document.addEventListener('contextmenu', e => e.preventDefault());
    document.addEventListener('keydown', function(e) {
        if (e.keyCode === 123) { e.preventDefault(); return false; }
        if (e.ctrlKey && e.shiftKey && e.keyCode === 73) { e.preventDefault(); return false; }
        if (e.ctrlKey && e.shiftKey && e.keyCode === 74) { e.preventDefault(); return false; }
        if (e.ctrlKey && e.keyCode === 85) { e.preventDefault(); return false; }
    });
    console.log('%c¡Alto ahí!', 'color: red; font-size: 40px; font-weight: bold;');
    console.log('%cEl código fuente está protegido. Acceso no autorizado.', 'color: gray; font-size: 14px;');
})();"

[System.IO.File]::WriteAllText("js\security.js", $security)

$newIndex = "<!DOCTYPE html>
<html lang=`"es`">
<head>
    <meta charset=`"UTF-8`">
    <meta name=`"viewport`" content=`"width=device-width, initial-scale=1.0`">
    <title>Domiter UCV - Portal Académico</title>
    <script src=`"https://cdn.tailwindcss.com`"></script>
    <link rel=`"stylesheet`" href=`"https://cdnjs.cloudflare.com/ajax/libs/font-awesome/6.0.0/css/all.min.css`">
    <link rel=`"stylesheet`" href=`"styles.css`">
    
    <!-- Security Module -->
    <script src=`"js/security.js`"></script>
</head>
<body class=`"antialiased`">

    <!-- SPA Application Mount Points -->
    <div id=`"root-app`"></div>
    <div id=`"root-modals`"></div>

    <!-- Obfuscated Logic -->
    <script src=`"js/components.js`"></script>
    <script src=`"js/render.js`"></script>

    <!-- Main JS Application -->
    <script src=`"main.js`"></script>
</body>
</html>"

[System.IO.File]::WriteAllText("index.html", $newIndex)

Write-Host "Done"
