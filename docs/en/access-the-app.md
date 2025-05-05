# Access the application / Installation

Magrit is a Web application that can be used in several different ways:

- by using the online version (hosted on a remote server), in the Web browser of your choice,
- by using the *Desktop* version (installable on your own computer), which is a stand-alone version of the application.

## Online version

You can access Magrit at [https://magrit.cnrs.fr](https://magrit.cnrs.fr).
When using the online version, you are automatically directed to the latest stable version of the application.

## *Desktop* version

You can download the version corresponding to your operating system at [https://magrit.cnrs.fr/download/](https://magrit.cnrs.fr/download/).

### Supported operating systems

The three supported operating systems for Magrit's *Desktop* version are:

- Windows 64-bit,
- GNU/Linux 64-bit,
- macOS 64-bit.

#### Windows

The Windows version is a [*portable*](https://en.wikipedia.org/wiki/Portable_application){target=_blank} application, meaning it doesn't need to be installed on your system.
Simply download the executable file, then launch the application by double-clicking on the `Magrit-Windows-2.x.x-portable.exe` file.

#### GNU/Linux

The Linux version is also a [*portable*](https://en.wikipedia.org/wiki/Portable_application){target=_blank} application, meaning it doesn't need to be installed on your system.
For this reason, the *AppImage* application format has been chosen.

After downloading the application, simply make it executable by typing the following command in the terminal:

```bash
chmod +x Magrit-Linux-2.x.x.AppImage
```

Then you can launch the application by double-clicking on the `Magrit-Linux-2.x.x-portable.AppImage` file or by typing the following command in the terminal:

```bash
./Magrit-Linux-2.x.x.AppImage
```

If you get an error (especially with Ubuntu >= 23.10), you need to use the `--no-sandbox` parameter to start the application:

```bash
./Magrit-Linux-2.x.x.AppImage --no-sandbox
```

#### macOS

A version for macOS is also available, but we are unable to “sign” the application at this time. You will therefore need to authorize installation of the application in your Mac's security settings,
for example, by typing the following command in the terminal:

```bash
xattr -cr Magrit-Mac-2.x.x-Installer.dmg 
```

For more information on installing the application on macOS, or to report a problem with starting the application on macOS, please consult the [dedicated GitHub issue](https://github.com/riatelab/magrit/issues/136).

### Installation

The application requires no special installation, simply download the file corresponding to your operating system, unzip it and run the executable.

### Update

To update the application, simply download the latest version available on the Magrit website and replace the old version with the new one.

An automatic update procedure will be proposed in a future version of the application.

## What about the old version of Magrit?

Magrit v1 was available from 2017 to July 2024 at the URL [https://magrit.cnrs.fr/](https://magrit.cnrs.fr/).

As of July 4, 2024, this version is no longer maintained but remains accessible online, for an indefinite period, at the address <a target="_self" href="https://magrit.cnrs.fr:9999/">https://magrit.cnrs.fr:9999/</a>.
