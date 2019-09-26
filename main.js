const { app,dialog, BrowserWindow, Menu, ipcMain} = require("electron");
let dev;
const args = process.argv.slice(1);
dev = args.some(val => val === '--dev');
////uncomment below to hide security alert on console
process.env.ELECTRON_DISABLE_SECURITY_WARNINGS = "1";


// Keep a global reference of the window object, if you don't, the window will
// be closed automatically when the JavaScript object is garbage collected.
let browserWindow;

function sendStatusToWindow(event, data) {
  browserWindow.webContents.send(event, data);
}

function aboutApp() {
  dialog.showMessageBox({
    type: 'none',
    icon: __dirname + "/build/icon.png",
    message: 'Monkey to mock' ,
    detail: 'Author: Salil V Nair \nversion:'+app.getVersion()+'',
  });
}

function createWindow() {

  // Create the browser window.
  browserWindow = new BrowserWindow({
    width: 800,
    height: 600,
    icon: __dirname + "/build/icon.icns",
    webPreferences: {
      nodeIntegration: true,
      webSecurity: false
    },
    autoHideMenuBar: false //auto hiding menu bar
  });

  // toggle between the index.html of the app or localhost:4200.
  //browserWindow.loadURL(`file://${__dirname}/index.html`);
  if(dev){
    browserWindow.loadURL('http://localhost:3000');
  }
  else{
    browserWindow.loadURL(`file://${__dirname}/build/index.html`);
  }

  // Emitted when the window is closed.
  browserWindow.on("closed", () => {
    // Dereference the window object, usually you would store windows
    // in an array if your app supports multi windows, this is the time
    // when you should delete the corresponding element.
    browserWindow = null;
  });

  // Create the Application's main menu
  var template = [{
    label: "Application",
    submenu: [
        { label: "About Application", click: function() {
          aboutApp();
        } },
        { type: "separator" },
        { label: "Hide", accelerator: "CmdOrCtrl+H", click: function() {
          if(browserWindow.isMenuBarVisible()){
            browserWindow.setMenuBarVisibility(false);
          }
          else{
            browserWindow.setMenuBarVisibility(true);
          }
         }},
        { type: "separator" },
        { label: "Check for Updates", accelerator: "CmdOrCtrl+U", click: function() {
            sendStatusToWindow('checkForUpdate');
         }},
        { type: "separator" },
        { label: "Quit", accelerator: "CmdOrCtrl+Q", click: function() { app.quit(); }},
        { type: "separator" },
        { label: "Developer Mode", accelerator: "CmdOrCtrl+D", click: function() { browserWindow.webContents.openDevTools(); }}
    ]}, {
    label: "Edit",
    submenu: [
        { label: "Undo", accelerator: "CmdOrCtrl+Z", selector: "undo:" },
        { label: "Redo", accelerator: "CmdOrCtrl+Y", selector: "redo:" },
        { type: "separator" },
        { label: "Cut", accelerator: "CmdOrCtrl+X", selector: "cut:" },
        { label: "Copy", accelerator: "CmdOrCtrl+C", selector: "copy:" },
        { label: "Paste", accelerator: "CmdOrCtrl+V", selector: "paste:" },
        { label: "Select All", accelerator: "CmdOrCtrl+A", selector: "selectAll:" }
    ]}
  ];

  Menu.setApplicationMenu(Menu.buildFromTemplate(template));
}

// This method will be called when Electron has finished
// initialization and is ready to create browser windows.
// Some APIs can only be used after this event occurs.
app.on("ready", createWindow);


// Quit when all windows are closed.
app.on("window-all-closed", () => {
  // On macOS it is common for applications and their menu bar
  // to stay active until the user quits explicitly with Cmd + Q
  if (process.platform !== "darwin") {
    app.quit();
  }
  monkeyServer.close(function() {
    console.log('window got closed kill all servers');
  });
});

app.on("activate", () => {
  // On macOS it's common to re-create a window in the app when the
  // dock icon is clicked and there are no other windows open.
  if (browserWindow === null) {
    createWindow();
  }
});

// In this file you can include the rest of your app's specific main process
// code. You can also put them in separate files and require them here.
var monkeyServer;
var express = require('express');
var bodyParser = require('body-parser');
var monkey = express();
monkey.use(bodyParser.json()); // support json encoded bodies
monkey.use(bodyParser.urlencoded({ extended: true })); // support encoded bodies

ipcMain.on('monkeyData', (event, monkeyData)=> {
    const {monkeyActions, port} = monkeyData;
    let keys = Object.keys(monkeyActions);
    keys.forEach(key => {
      let monkeyExistingRoutes = monkey.routes;
        if(monkeyActions[key].httpMethod==='get'){
          if(monkeyExistingRoutes && monkeyExistingRoutes.get) {
            monkeyExistingRoutes.get.forEach((route, i, routes)=>{
              if(route.path==='/'+monkeyActions[key].endPointUrl){
                routes.splice(i,1);
              }
            })
          }
          monkey.get('/'+monkeyActions[key].endPointUrl, function (req, res, next) {
            let resp = {...monkeyActions[key].response}
            res.send(resp);
          });
        }
        else if(monkeyActions[key].httpMethod==='post'){
          if(monkeyExistingRoutes && monkeyExistingRoutes.post) {
            monkeyExistingRoutes.post.forEach((route, i, routes)=>{
              if(route.path==='/'+monkeyActions[key].endPointUrl){
                routes.splice(i,1);
              }
            })
          }
          monkey.post('/'+monkeyActions[key].endPointUrl, function(req, res){
            sendStatusToWindow('incomingRequest/'+monkeyActions[key].endPointUrl,req.body);
            let resp = {...monkeyActions[key].response}
            res.send(resp);
          });
        }

    })
    monkeyServer = monkey.listen(port, function() {
      console.log('Listening to port:'+port+' :)');
    });
})

ipcMain.on('shutdown', (event, arg)=> {
  console.log('going to close server');
  monkeyServer.close(function() {
    console.log('closed the server');
  });
});

ipcMain.on('killMonkeyActionHandler', (event, monkeyAction)=> {  
  let monkeyExistingRoutes = monkey.routes;       
  if(monkeyAction.httpMethod==='get'){
    if(monkeyExistingRoutes && monkeyExistingRoutes.get) {
      monkeyExistingRoutes.get.forEach((route, i, routes)=>{
        if(route.path==='/'+monkeyAction.endPointUrl){
          routes.splice(i,1);
        }
      })
    }
  }
  else if(monkeyAction.httpMethod==='post'){
    if(monkeyExistingRoutes && monkeyExistingRoutes.post) {
      monkeyExistingRoutes.post.forEach((route, i, routes)=>{
        if(route.path==='/'+monkeyAction.endPointUrl){
          routes.splice(i,1);
        }
      })
    }
  }
});

ipcMain.on('isPortAvailable', (event, arg)=> {  
  isPortAvailable(arg, function(returnValue) {
    browserWindow.webContents.send('isPortAvailable',returnValue);
  });
});

var net = require('net');

var isPortAvailable = (port, callback) => {
    var server = net.createServer();

    server.listen(port);
    server.on('error', function (e) {
	    callback(false);
    });
    server.on('listening', function (e) {
	    server.close();
	    callback(true);
    });
};