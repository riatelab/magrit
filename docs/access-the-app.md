# Accéder à l'application / Installation

Magrit est une application Web qu'il est possible d'utiliser de plusieurs manières différentes : 

- en utilisant la version en ligne (hébergée sur un serveur distant), dans le navigateur Web de votre choix,
- en utilisant la version *Desktop* (installable sur votre ordinateur), qui est une version autonome de l'application.

## Version en ligne

Vous pouvez accéder à Magrit sur [https://magrit.cnrs.fr](https://magrit.cnrs.fr).
Lorsque vous utilisez la version en ligne, vous êtes automatiquement dirigé vers la dernière version stable de l'application.

## Version *Desktop*

Il est possible de télécharger la version correspondant à votre système d'exploitation à l'adresse [https://magrit.cnrs.fr/download/](https://magrit.cnrs.fr/download/).

### Systèmes d'exploitation supportés

Les trois systèmes d'exploitation supportés pour la version *Desktop* de Magrit sont :

- Windows 64 bits,
- GNU/Linux 64 bits,
- macOS 64 bits.

#### Windows

La version Windows est une application dite [*portable*](https://fr.wikipedia.org/wiki/Application_portable){target=_blank}, c'est-à-dire qu'elle n'a pas besoin d'être installée sur votre système.
Il suffit de télécharger le fichier l'exécutable puis de lancer l'application en double-cliquant sur le fichier `Magrit-Windows-2.x.x-portable.exe`.

#### GNU/Linux

La version Linux est également une application [*portable*](https://fr.wikipedia.org/wiki/Application_portable){target=_blank}, c'est-à-dire qu'elle n'a pas besoin d'être installée sur votre système.
Pour cela, le format d'application *AppImage* a été choisi.

Après le téléchargement de l'application, il suffit de la rendre exécutable en tapant la commande suivante dans le terminal :

```bash
chmod +x Magrit-Linux-2.x.x.AppImage
```

Puis, vous pouvez lancer l'application en double-cliquant sur le fichier `Magrit-Linux-2.x.x-portable.AppImage` ou en tapant la commande suivante dans le terminal :

```bash
./Magrit-Linux-2.x.x.AppImage
```

En cas d'erreur (c'est notamment le cas avec Ubuntu >= 23.10), il est nécessaire d'utiliser le paramètre `--no-sandbox` pour démarrer l'application :

```bash
./Magrit-Linux-2.x.x.AppImage --no-sandbox
```

#### macOS

Une version pour macOS est disponible, toutefois nous ne sommes pas en mesure de "signer" l'application pour le moment.
Vous devrez donc autoriser l'installation de l'application dans les paramètres de sécurité de votre Mac,
par exemple en tapant la commande suivante dans le terminal :

```bash
xattr -cr Magrit-Mac-2.x.x-Installer.dmg 
```

Pour plus d'informations sur l'installation de l'application sur macOS ou pour rapporter un problème relatif au démarrage de l'application sur macOS, merci de consulter l'[issue GitHub dédiee](https://github.com/riatelab/magrit/issues/136).

### Mise à jour

Pour mettre à jour l'application, il suffit de télécharger la dernière version disponible sur le site Web de Magrit et de remplacer l'ancienne version par la nouvelle.

Une procédure de mise à jour automatique sera proposée dans une prochaine version de l'application.

## Quid de l'ancienne version de Magrit ?

La v1 de Magrit a été disponible de 2017 à juillet 2024 à l'URL [https://magrit.cnrs.fr/](https://magrit.cnrs.fr/).

À compter du 04 juillet 2024, cette version n'est plus maintenue mais reste accessible en ligne, pour une durée indéterminée, à l'adresse <a target="_self" href="https://magrit.cnrs.fr:9999/">https://magrit.cnrs.fr:9999/</a>.