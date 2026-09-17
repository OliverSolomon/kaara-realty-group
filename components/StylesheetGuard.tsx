/**
 * Self-heals a page that loaded without its stylesheet.
 *
 * When a phone reopens a tab that was loaded before a deploy, the old page can
 * ask for a stylesheet file that no longer exists. The page then renders
 * unstyled: videos stacked full width and the footer QR code filling the
 * screen. globals.css sets `--site-css-loaded: 1`; if that variable is missing
 * once the page has loaded, this reloads the page once so it picks up the
 * current files. A timestamp guard prevents reload loops.
 *
 * It is an inline script, not a client component, so it still runs when the
 * page's JavaScript files are also out of date.
 */
const SCRIPT = `(function(){try{
var KEY="site-css-reload";
function loaded(){return getComputedStyle(document.documentElement).getPropertyValue("--site-css-loaded").trim()==="1";}
function check(){
if(loaded()){sessionStorage.removeItem(KEY);return;}
var last=Number(sessionStorage.getItem(KEY))||0;
if(Date.now()-last<60000)return;
sessionStorage.setItem(KEY,String(Date.now()));
location.reload();
}
function later(){setTimeout(check,400);}
if(document.readyState==="complete")later();else window.addEventListener("load",later);
}catch(e){}})();`;

export default function StylesheetGuard() {
  return <script dangerouslySetInnerHTML={{ __html: SCRIPT }} />;
}
