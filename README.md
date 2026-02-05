<p align="center">
  <img src="docs/screenshots/main-screen.png" alt="WakaScribe" width="600" />
</p>

<h1 align="center">WakaScribe</h1>

<p align="center">
  <strong>Dictée vocale intelligente, locale et privée</strong>
</p>

<p align="center">
  <a href="#-fonctionnalités">Fonctionnalités</a> •
  <a href="#-moteurs-de-transcription">Moteurs</a> •
  <a href="#-installation">Installation</a> •
  <a href="#-utilisation">Utilisation</a> •
  <a href="#-paramètres">Paramètres</a> •
  <a href="#-faq">FAQ</a>
</p>

<p align="center">
  <img src="https://img.shields.io/badge/macOS-Intel%20%7C%20Apple%20Silicon-blue?logo=apple" alt="macOS" />
  <img src="https://img.shields.io/badge/Windows-10%20%7C%2011-0078D6?logo=windows" alt="Windows" />
  <img src="https://img.shields.io/badge/Linux-X11%20%7C%20Wayland-FCC624?logo=linux&logoColor=black" alt="Linux" />
  <img src="https://img.shields.io/badge/License-Freeware-green" alt="License" />
</p>

---

## Présentation

**WakaScribe** est une application de dictée vocale nouvelle génération qui transforme votre voix en texte avec une précision remarquable. Contrairement aux solutions cloud, WakaScribe fonctionne **100% en local** sur votre machine, garantissant une confidentialité totale de vos données.

### Points forts

| | |
|---|---|
| **100% Local** | Aucune donnée n'est envoyée sur Internet. Votre vie privée est préservée. |
| **Ultra rapide** | Transcription en temps réel grâce à des moteurs optimisés |
| **Multi-moteurs** | Whisper, Vosk ou Parakeet selon vos besoins |
| **Multilingue** | Support de 99 langues avec détection automatique |
| **IA Intégrée** | Amélioration du texte via LLM (optionnel, Groq) |
| **Cross-platform** | macOS, Windows et Linux |
| **Gratuit** | Freeware, usage illimité |

---

## Fonctionnalités

### Dictée vocale

#### Mode Push-to-Talk (PTT)
Maintenez une touche pour parler, relâchez pour transcrire et coller automatiquement.

```
Maintenir ⌘+Shift+Espace → Parler → Relâcher → Texte collé automatiquement
```

#### Mode Toggle
Cliquez pour démarrer/arrêter l'enregistrement via l'interface.

#### Streaming temps réel
Voyez le texte apparaître en temps réel pendant que vous parlez.

---

### Transcription de fichiers audio

<p align="center">
  <img src="docs/screenshots/files-screen.png" alt="Transcription de fichiers" width="500" />
</p>

Transcrivez vos fichiers audio existants :

| Format | Extension |
|--------|-----------|
| WAV | `.wav` |
| MP3 | `.mp3` |
| M4A/AAC | `.m4a` |
| FLAC | `.flac` |
| OGG Vorbis | `.ogg` |
| WebM | `.webm` |

- Glissez-déposez vos fichiers ou utilisez le sélecteur
- Transcription par lot (plusieurs fichiers à la fois)
- Rééchantillonnage automatique vers 16kHz

---

### Modes de dictée

WakaScribe adapte la transcription selon le contexte :

| Mode | Description | Optimisation |
|------|-------------|--------------|
| **Général** | Texte standard, emails, notes | Ponctuation naturelle |
| **Email** | Optimisé pour les courriels | Formules de politesse, structure |
| **Code** | Pour les développeurs | Préserve la syntaxe technique |
| **Notes** | Prise de notes rapide | Format concis, bullet points |

---

### Amélioration par IA (LLM)

Activez l'amélioration par intelligence artificielle pour :

- Corriger automatiquement la grammaire et l'orthographe
- Ajouter la ponctuation manquante
- Reformuler pour plus de clarté
- Adapter le style au mode de dictée

> **Note** : Le LLM utilise l'API Groq (gratuite) et nécessite une connexion Internet.

---

### Commandes vocales

Contrôlez la ponctuation et le formatage avec votre voix :

| Commande vocale | Résultat |
|-----------------|----------|
| "Nouveau paragraphe" | ↵ (saut de ligne) |
| "Point" | . |
| "Virgule" | , |
| "Point d'interrogation" | ? |
| "Point d'exclamation" | ! |
| "Deux points" | : |
| "Ouvrir les guillemets" | « |
| "Fermer les guillemets" | » |

---

### Historique

<p align="center">
  <img src="docs/screenshots/history-screen.png" alt="Historique" width="500" />
</p>

Accédez facilement à vos transcriptions passées :

- **50 dernières transcriptions** conservées
- Accès rapide depuis l'onglet Historique
- **Copie en un clic** dans le presse-papier
- Affichage de la durée et du temps de traitement
- Suppression individuelle ou totale

---

### Traduction instantanée

Traduisez le texte sélectionné dans n'importe quelle application :

1. Sélectionnez du texte
2. Appuyez sur `⌘+Shift+T` (ou votre raccourci personnalisé)
3. Le texte traduit remplace la sélection

**Langues cibles disponibles** : Français, Anglais, Allemand, Espagnol, Italien, Portugais, Néerlandais, Russe, Chinois, Japonais, Coréen, Arabe

---

## Moteurs de transcription

<p align="center">
  <img src="docs/screenshots/settings-panel.png" alt="Paramètres - Moteurs" width="400" />
</p>

WakaScribe propose trois moteurs de transcription :

### Whisper (OpenAI)

| Modèle | Taille | Qualité | Recommandé pour |
|--------|--------|---------|-----------------|
| **Tiny** | 75 Mo | ⭐⭐ | Tests rapides |
| **Small** | 466 Mo | ⭐⭐⭐ | Usage quotidien |
| **Medium** | 1.5 Go | ⭐⭐⭐⭐ | Qualité maximale |

- 99 langues supportées
- Haute précision
- Fonctionne sur tous les systèmes

### Vosk

- Modèles légers et rapides
- Idéal pour les machines moins puissantes
- Langues principales : Français, Anglais, Allemand, Espagnol, etc.

### Parakeet (Apple Silicon)

| Variante | Technologie | Plateforme |
|----------|-------------|------------|
| **Parakeet TDT 0.6B v3 CoreML** | CoreML | macOS (Apple Silicon) |
| **Parakeet TDT 0.6B v3 ONNX** | ONNX Runtime | Windows, Linux |

- Modèle NVIDIA NeMo optimisé
- Excellente qualité pour le français et l'anglais
- Accélération matérielle native sur Mac M1/M2/M3/M4
- Source : [FluidInference/parakeet-tdt-0.6b-v3-coreml](https://huggingface.co/FluidInference/parakeet-tdt-0.6b-v3-coreml)

---

## Installation

### macOS

1. **Téléchargez** le fichier `.dmg` correspondant à votre Mac :
   - **Mac Intel** : `WakaScribe_x64.dmg`
   - **Mac M1/M2/M3/M4** : `WakaScribe_arm64.dmg`

2. **Ouvrez** le fichier `.dmg`

3. **Glissez** WakaScribe dans le dossier Applications

4. **Premier lancement** : Clic droit → Ouvrir (contournement Gatekeeper)

5. **Autorisez les permissions** :
   ```
   Réglages Système → Confidentialité et sécurité → Microphone → ✅ WakaScribe
   Réglages Système → Confidentialité et sécurité → Accessibilité → ✅ WakaScribe
   ```

### Windows

1. **Téléchargez** `WakaScribe_Setup.exe`
2. **Exécutez** l'installateur
3. **Suivez** les instructions à l'écran
4. **Lancez** WakaScribe depuis le menu Démarrer

### Linux

1. **Téléchargez** le paquet correspondant :
   - `.deb` pour Ubuntu/Debian
   - `.rpm` pour Fedora/RHEL
   - `.AppImage` pour toutes distributions

2. **Installez** les dépendances pour l'auto-paste :

   **X11 (Ubuntu/Debian):**
   ```bash
   sudo apt install xclip xdotool
   ```

   **Wayland (Ubuntu/Debian):**
   ```bash
   sudo apt install wl-clipboard wtype
   ```

3. **Installez** l'application :
   ```bash
   # Debian/Ubuntu
   sudo dpkg -i wakascribe_*.deb

   # Ou AppImage
   chmod +x WakaScribe_*.AppImage
   ./WakaScribe_*.AppImage
   ```

---

## Utilisation

### Premier lancement

#### Étape 1 : Choisir un moteur

Sélectionnez le moteur de transcription adapté à votre configuration :

- **Mac M1/M2/M3/M4** : Parakeet CoreML (recommandé)
- **Mac Intel / Windows / Linux** : Whisper Small
- **Machine peu puissante** : Vosk

#### Étape 2 : Télécharger le modèle

Le premier téléchargement peut prendre quelques minutes selon votre connexion.

#### Étape 3 : Configurer le microphone

Si vous avez plusieurs microphones, sélectionnez celui que vous souhaitez utiliser dans les paramètres.

#### Étape 4 : Tester la dictée

Cliquez sur le bouton micro central et parlez !

---

### Workflow quotidien

```
1. Placez votre curseur là où vous voulez écrire (email, document, chat...)
2. Maintenez ⌘+Shift+Espace (ou votre raccourci personnalisé)
3. Parlez naturellement
4. Relâchez la touche
5. Le texte apparaît automatiquement !
```

### Conseils pour de meilleurs résultats

- **Parlez clairement** mais naturellement
- **Évitez le bruit de fond** excessif
- **Phrases complètes** : la ponctuation est mieux détectée
- **Une seule langue** par enregistrement pour de meilleurs résultats

---

## Paramètres

Accédez aux paramètres via le bouton ⚙️ ou `⌘+,`

### Audio

| Paramètre | Description |
|-----------|-------------|
| **Microphone** | Périphérique d'entrée audio |
| **Streaming** | Affichage temps réel pendant l'enregistrement |

### Moteur de transcription

| Paramètre | Description |
|-----------|-------------|
| **Whisper** | Moteur OpenAI, haute précision |
| **Vosk** | Moteur léger et rapide |
| **Parakeet** | Moteur NVIDIA NeMo, optimisé Apple Silicon |

### Langue

| Paramètre | Description |
|-----------|-------------|
| **Langue** | Langue parlée (99 langues + Auto) |
| **Détection auto** | Laisse le moteur détecter la langue |

### LLM (Intelligence Artificielle)

| Paramètre | Description |
|-----------|-------------|
| **Activer LLM** | Amélioration par IA |
| **Clé API Groq** | Authentification (gratuite) |

#### Obtenir une clé API Groq (gratuite)

1. Rendez-vous sur [console.groq.com](https://console.groq.com)
2. Créez un compte gratuit
3. Allez dans **API Keys**
4. Cliquez sur **Create API Key**
5. Copiez la clé et collez-la dans WakaScribe

### Raccourcis

| Paramètre | Défaut |
|-----------|--------|
| **Push-to-Talk** | `⌘+Shift+Espace` |
| **Toggle Record** | `⌘+Shift+R` |
| **Traduction** | `⌘+Shift+T` |

---

## Raccourcis clavier

### Raccourcis globaux

Ces raccourcis fonctionnent même quand WakaScribe n'est pas au premier plan :

| Raccourci macOS | Raccourci Windows/Linux | Action |
|-----------------|------------------------|--------|
| `⌘+Shift+Espace` | `Ctrl+Shift+Espace` | Push-to-Talk (maintenir) |
| `⌘+Shift+R` | `Ctrl+Shift+R` | Toggle enregistrement |
| `⌘+Shift+T` | `Ctrl+Shift+T` | Traduire la sélection |
| `⌥+⌘+V` | `Alt+Ctrl+V` | Coller dernière transcription |

### Dans l'application

| Raccourci macOS | Raccourci Windows/Linux | Action |
|-----------------|------------------------|--------|
| `⌘+,` | `Ctrl+,` | Ouvrir les paramètres |
| `⌘+1` | `Ctrl+1` | Onglet Dictée |
| `⌘+2` | `Ctrl+2` | Onglet Historique |
| `⌘+3` | `Ctrl+3` | Onglet Fichiers |
| `⌘+Q` | `Alt+F4` | Quitter |

---

## Dépannage

<details>
<summary><strong>Le microphone n'est pas détecté</strong></summary>

1. Vérifiez que le microphone est correctement branché
2. **macOS** : Réglages Système → Confidentialité → Microphone → ✅ WakaScribe
3. **Windows** : Paramètres → Confidentialité → Microphone → Autoriser les applications
4. Redémarrez WakaScribe
</details>

<details>
<summary><strong>L'auto-paste ne fonctionne pas</strong></summary>

**macOS :**
```
Réglages Système → Confidentialité et sécurité → Accessibilité
→ Activez WakaScribe
```

**Windows :**
- Exécutez WakaScribe en tant qu'administrateur (pour certaines applications)

**Linux :**
```bash
# X11
sudo apt install xdotool xclip

# Wayland
sudo apt install wtype wl-clipboard
```
</details>

<details>
<summary><strong>La transcription est lente</strong></summary>

1. Utilisez un modèle plus léger (Tiny ou Vosk)
2. Sur Mac Apple Silicon, utilisez Parakeet CoreML
3. Fermez les applications gourmandes en ressources
4. Redémarrez l'application
</details>

<details>
<summary><strong>Le LLM ne fonctionne pas</strong></summary>

1. Vérifiez votre connexion Internet
2. Dans Paramètres → LLM :
   - Vérifiez que "Activer LLM" est coché
   - Cliquez sur "Valider" pour tester votre clé API
3. Si la clé est invalide, générez-en une nouvelle sur [console.groq.com](https://console.groq.com)
</details>

---

## FAQ

<details>
<summary><strong>WakaScribe est-il vraiment gratuit ?</strong></summary>

Oui ! WakaScribe est un freeware 100% gratuit. Pas d'abonnement, pas de limite d'utilisation, pas de publicité.
</details>

<details>
<summary><strong>Mes données vocales sont-elles envoyées sur Internet ?</strong></summary>

**Non.** La transcription est effectuée **100% en local** sur votre machine. Vos enregistrements audio ne quittent jamais votre ordinateur.

**Exception** : Si vous activez le LLM, le **texte transcrit** (pas l'audio) est envoyé à l'API Groq pour amélioration. Cette fonctionnalité est optionnelle.
</details>

<details>
<summary><strong>Quel moteur choisir ?</strong></summary>

| Votre configuration | Moteur recommandé |
|---------------------|-------------------|
| Mac M1/M2/M3/M4 | Parakeet CoreML |
| Mac Intel | Whisper Small |
| PC moderne | Whisper Small |
| PC ancien | Vosk |
</details>

<details>
<summary><strong>Puis-je utiliser WakaScribe hors ligne ?</strong></summary>

**Oui !** Toutes les fonctionnalités principales (transcription, commandes vocales, historique, transcription de fichiers) fonctionnent **sans connexion Internet**.

Seuls le LLM et la traduction nécessitent une connexion.
</details>

<details>
<summary><strong>Quelles langues sont supportées ?</strong></summary>

Avec Whisper, WakaScribe supporte **99 langues**, dont :
Français, Anglais, Allemand, Espagnol, Italien, Portugais, Néerlandais, Polonais, Russe, Chinois, Japonais, Coréen, Arabe, Hindi, et bien d'autres.
</details>

---

## Performances

### Vitesse de transcription

| Configuration | Whisper Small | Parakeet CoreML |
|--------------|---------------|-----------------|
| Mac M1/M2/M3/M4 | ~12x temps réel | ~15x temps réel |
| Mac Intel i7+ | ~6x temps réel | N/A |
| Windows (CPU moderne) | ~5x temps réel | ~8x temps réel (ONNX) |

> **Exemple** : Un audio de 10 secondes est transcrit en moins d'1 seconde sur Mac M2.

### Latence bout-en-bout

| Étape | Durée typique |
|-------|---------------|
| Capture audio | Temps réel |
| Transcription | < 1 sec |
| LLM (si activé) | 0.5-2 sec |
| Auto-paste | < 100 ms |
| **Total** | **< 3 sec** |

---

## Confidentialité & Sécurité

WakaScribe a été conçu avec la vie privée comme priorité absolue :

| Aspect | Garantie |
|--------|----------|
| **Audio** | Traité 100% localement, jamais envoyé |
| **Télémétrie** | Aucune collecte de données |
| **Historique** | Stocké uniquement sur votre machine |
| **Clés API** | Stockées dans le trousseau sécurisé du système |
| **LLM** | Optionnel - seul le texte est envoyé (pas l'audio) |

---

## Stack technique

```
Frontend: React 18 + TypeScript + TailwindCSS + Zustand
Backend:  Rust/Tauri 2.x + cpal + reqwest + keyring
Moteurs:  Whisper.cpp (whisper-rs), Vosk, Parakeet (CoreML/ONNX)
UI:       Design Frosted Touch (glassmorphism)
```

---

## Support & Communauté

| Canal | Lien |
|-------|------|
| Email | support@wakascribe.com |
| Signaler un bug | [GitHub Issues](https://github.com/cyprienbrisset/scribe/issues) |

---

## Licence

WakaScribe est un **freeware** distribué gratuitement.

- Usage personnel et professionnel autorisé
- Distribution gratuite autorisée
- Revente interdite
- Modification du code source interdite

---

<p align="center">
  Fait avec ❤️ par <strong>Cyprien Brisset</strong>
</p>

<p align="center">
  <sub>© 2024-2026 Tous droits réservés.</sub>
</p>
