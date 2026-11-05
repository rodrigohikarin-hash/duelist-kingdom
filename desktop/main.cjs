const {app,BrowserWindow,Menu,shell,dialog,session}=require('electron');
const path=require('node:path');const HOME='https://duel-arena-tcg-hikari.rodrigohikarin.chatgpt.site/';const site=new URL(HOME).hostname;
const smokeArg=process.argv.find(a=>a.startsWith('--smoke-test='));const smoke=smokeArg?smokeArg.slice('--smoke-test='.length):null;
if(smoke){require('node:fs').mkdirSync(smoke,{recursive:true});app.setPath('userData',path.join(smoke,'profile'));}
let mainWindow;
const domain=(host,root)=>host===root||host.endsWith('.'+root);
function isInternal(value){try{const u=new URL(value);return u.protocol==='https:'&&(u.hostname===site||['chatgpt.com','openai.com','accounts.google.com','login.microsoftonline.com','login.live.com','appleid.apple.com','accounts.apple.com'].some(d=>domain(u.hostname,d)));}catch{return false;}}
function external(value){try{const u=new URL(value);if(u.protocol!=='https:'||u.username||u.password)return;const roots=['yugioh-card.com','pokemon.com','disneylorcana.com','ravensburger.com','onepiece-cardgame.com','digimoncard.com'];if(roots.some(d=>domain(u.hostname,d))){shell.openExternal(u.href);return;}dialog.showMessageBox(mainWindow,{type:'question',message:'Abrir este link no navegador?',detail:u.origin,buttons:['Cancelar','Abrir'],defaultId:0,cancelId:0}).then(({response})=>{if(response===1)shell.openExternal(u.href);});}catch{}}
const preferences={nodeIntegration:false,contextIsolation:true,sandbox:true,webSecurity:true,allowRunningInsecureContent:false,partition:'persist:duel-arena'};
function protect(contents){
 contents.on('will-navigate',(event,url)=>{if(!isInternal(url)){event.preventDefault();external(url);}});
 contents.setWindowOpenHandler(({url})=>{if(isInternal(url))return {action:'allow',overrideBrowserWindowOptions:{width:1050,height:780,autoHideMenuBar:true,webPreferences:preferences}};external(url);return {action:'deny'};});
 contents.on('did-create-window',child=>protect(child.webContents));
}
function createWindow(){
 mainWindow=new BrowserWindow({width:1360,height:900,minWidth:800,minHeight:600,title:'Duelist Kingdom',backgroundColor:'#161321',icon:path.join(__dirname,'icon.ico'),show:false,webPreferences:preferences});
 protect(mainWindow.webContents);
 mainWindow.on('page-title-updated',event=>event.preventDefault());
 mainWindow.once('ready-to-show',()=>{if(!smoke)mainWindow.show();});
 if(smoke){let finished=false;const finish=reason=>{if(finished)return;finished=true;const url=mainWindow.webContents.getURL();let origin;try{origin=new URL(url).origin}catch{origin='unknown'}require('node:fs').writeFileSync(path.join(smoke,'result.json'),JSON.stringify({reason,origin,title:mainWindow.webContents.getTitle(),electron:process.versions.electron,nodeIntegration:mainWindow.webContents.getLastWebPreferences().nodeIntegration,sandbox:mainWindow.webContents.getLastWebPreferences().sandbox}));app.quit();};mainWindow.webContents.on('did-finish-load',()=>setTimeout(()=>finish('loaded'),1500));setTimeout(()=>finish('timeout'),25000);}
 mainWindow.webContents.on('did-fail-load',(_event,code,_desc,_url,isMainFrame)=>{if(isMainFrame&&code!==-3)mainWindow.loadFile('offline.html').catch(()=>{});});
 mainWindow.webContents.on('render-process-gone',()=>mainWindow.loadFile('offline.html').catch(()=>{}));
 mainWindow.loadURL(HOME).catch(()=>{});
 const home=()=>mainWindow.loadURL(HOME).catch(()=>{});
 Menu.setApplicationMenu(Menu.buildFromTemplate([
  {label:'Arquivo',submenu:[{label:'Página inicial',accelerator:'Alt+Home',click:home},{label:'Abrir no navegador',click:()=>shell.openExternal(HOME)},{type:'separator'},{role:'quit',label:'Sair'}]},
  {label:'Navegação',submenu:[{label:'Voltar',accelerator:'Alt+Left',click:()=>{if(mainWindow.webContents.navigationHistory.canGoBack())mainWindow.webContents.navigationHistory.goBack();}},{label:'Avançar',accelerator:'Alt+Right',click:()=>{if(mainWindow.webContents.navigationHistory.canGoForward())mainWindow.webContents.navigationHistory.goForward();}},{role:'reload',label:'Recarregar'},{role:'forceReload',label:'Recarregar sem cache'}]},
  {label:'Editar',submenu:[{role:'undo',label:'Desfazer'},{role:'redo',label:'Refazer'},{type:'separator'},{role:'cut',label:'Recortar'},{role:'copy',label:'Copiar'},{role:'paste',label:'Colar'},{role:'selectAll',label:'Selecionar tudo'}]},
  {label:'Visualizar',submenu:[{role:'resetZoom',label:'Zoom original'},{role:'zoomIn',label:'Aumentar zoom'},{role:'zoomOut',label:'Diminuir zoom'},{type:'separator'},{role:'togglefullscreen',label:'Tela cheia'}]},
  {label:'Ajuda',submenu:[{label:'Sobre o Duelist Kingdom',click:()=>dialog.showMessageBox(mainWindow,{type:'info',title:'Duelist Kingdom',message:'Duelist Kingdom para Windows · '+app.getVersion(),detail:'Torneios e rankings de Yu-Gi-Oh!, Pokémon, One Piece, Lorcana e Digimon.\n\nEsta versão conecta ao site e ao banco de dados na nuvem. Requer internet e login com uma conta autorizada no site.\n\nTema claro/escuro e sessão ficam salvos neste aplicativo. Projeto independente dos fabricantes.'})}]}
 ]));
}
if(!app.requestSingleInstanceLock())app.quit();else{
 app.on('second-instance',()=>{if(mainWindow){if(mainWindow.isMinimized())mainWindow.restore();mainWindow.show();mainWindow.focus();}});
 app.whenReady().then(()=>{
  app.setAppUserModelId('br.duelistkingdom.desktop');
  const ses=session.fromPartition('persist:duel-arena');ses.setPermissionRequestHandler((_wc,_permission,callback)=>callback(false));ses.setPermissionCheckHandler(()=>false);
  ses.on('will-download',(_event,item)=>{const safeName=path.basename(item.getFilename()).replace(/[<>:"/\\|?*]/g,'_');item.setSaveDialogOptions({title:'Salvar arquivo do Duelist Kingdom',defaultPath:path.join(app.getPath('downloads'),safeName)});});
  createWindow();
 });
 app.on('window-all-closed',()=>app.quit());
}
