import {
  app, dialog, BrowserWindow, shell,
} from 'electron';

// Since we only support two languages for now, and use only a few strings here,
// we can hardcode the translations here.
const translations = {
  fr: {
    'Close the application?': 'Fermer l\'application ?',
    'All unsaved changes will be lost.': 'Toutes les modifications non enregistrées seront perdues.',
    Warning: 'Attention',
    Cancel: 'Annuler',
    Exit: 'Quitter',
    'Magrit documentation': 'Documentation de Magrit',
  },
};

const localize = (
  message: string,
  locale: string,
) => {
  if (translations[locale] && translations[locale][message]) {
    return translations[locale][message];
  }
  return message;
};

function createWindow() {
  const win = new BrowserWindow({
    show: false,
    autoHideMenuBar: true,
    title: 'Magrit',
    icon: 'dist/assets/favicon.ico',
  });

  const currentLocale = app.getLocale();

  win.maximize();
  win.show();

  // Open external links in the browser, not inside the application
  win.webContents.setWindowOpenHandler(({ url }) => {
    if (url.startsWith('https:')) shell.openExternal(url);
    if (url === 'file:///docs/') {
      // Create a new BrowserWindow to display the documentation
      const docWin = new BrowserWindow({
        show: false,
        autoHideMenuBar: true,
        title: localize('Magrit Documentation', currentLocale),
        icon: 'dist/assets/favicon.ico',
      });
      docWin.maximize();
      docWin.show();
      docWin.loadURL('dist/docs/index.html');
    }
    return { action: 'deny' };
  });

  win.on('close', (event) => {
    event.preventDefault();
    dialog.showMessageBox({
      title: localize('Warning', currentLocale),
      message: localize('Close the application?', currentLocale),
      detail: localize('All unsaved changes will be lost.', currentLocale),
      type: 'warning',
      buttons: [
        localize('Cancel', currentLocale),
        localize('Exit', currentLocale),
      ],
      cancelId: 1,
      defaultId: 0,
    }).then(({ response }) => {
      if (response) {
        win.destroy();
      }
    });
  });

  if (process.env.VITE_DEV_SERVER_URL) {
    win.loadURL(process.env.VITE_DEV_SERVER_URL);
  } else {
    win.loadFile('dist/index.html');
  }
}

app.on('window-all-closed', () => {
  if (process.platform !== 'darwin') app.quit();
});

app.whenReady().then(() => {
  createWindow();
  app.on('activate', () => {
    // On macOS it's common to re-create a window in the app when the
    // dock icon is clicked and there are no other windows open.
    if (BrowserWindow.getAllWindows().length === 0) createWindow();
  });
});
