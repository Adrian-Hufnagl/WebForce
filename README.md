# WebForce


Ausführen: npm start
Exportieren: npm run build
webforce.dmg wird in /dist erstellt

Wichtiges:
CSS funktioniert nur mit Internetverbindung
Einmal hat nichts mehr funktioniert, habe gepackegete version ausprobiert und irgendwann ging es wieder



Error Handling:

no CSS
    -> Internet Connection

vision_wasm_internal.js:281 Uncaught (in promise) RuntimeError: Aborted(LinkError: WebAssembly.instantiate(): Import #228 module="a" function="md" error: function import requires a callable). Build with -sASSERTIONS for more info.
    -> Rename Repository in package.json: "name":