# 🕹️ Zero-Ads Arcade Engine

[![License: MIT](https://img.shields.io/badge/License-MIT-yellow.svg)](https://opensource.org/licenses/MIT)
[![Open Source Love png1](https://badges.frapsoft.com/os/v1/open-source.png?v=103)](https://github.com/ellerbrock/open-source-badges/)

> A lightweight, open-source (MIT) engine for embedding ad-free games into any web application with built-in analytics, leaderboards, and mobile-ready controls.

## 🌟 Why this exists?
Most web games today are hidden behind intrusive ads and trackers. **Zero-Ads Arcade Engine** provide developers with a clean infrastructure to host high-quality web games while maintaining full control over the user experience.

## 🏗️ Technical Architecture
- **Core:** Vanilla TypeScript with **ESBuild** minification.
- **State Management:** Persistent **SessionManager** with analytics tracking.
- **Input System:** Unified Gamepad (Xbox/PS), Keyboard, and **Multi-touch HUD**.
- **Visuals:** CRT Scanline overlay with adjustable intensity.
- **Audio:** **SoundManager** with global volume and batch preloading.

## 📂 Folder Structure
- `src/core`: Game loop, Asset loader, and State management.
- `src/hud`: Customizable touchscreen controls (Virtual Joysticks/Buttons).
- `src/bridge`: API for communication between the engine and the hosted game (iframe).
- `docs/`: Full documentation and integration guides.

## 🚀 Key Features
- **Gamepad API Support:** Plug-and-play controller detection.
- **Haptic Feedback:** Physical vibration for virtual HUD buttons.
- **Session Analytics:** Tracking play time, session counts, and high scores.
- **Security Hardened:** Strict origin validation and iframe error boundaries.
- **Minified Builds:** Sub-50KB engine footprint for rapid loading.
 
## 🚀 Quick Start
 
### 1. Host Integration (Main Site)
Add the engine bridge to your main page to start capturing events.
 
```html
<script type="module">
  import { EngineBridge } from './EngineBridge.js';
  const arcade = new EngineBridge('my-game-id');
  
  // Listen for scores
  arcade.on('SCORE_UPDATE', (score) => {
    console.log("New High Score:", score);
  });
</script>
```
 
### 2. Game Integration (Inside Iframe)
Send events from your game to the parent engine.
 
```javascript
window.parent.postMessage({
  source: 'ARCADE_ENGINE_GAME',
  payload: { type: 'SCORE_UPDATE', value: 100 }
}, '*');
```

## 🛠️ Installation
```bash
npm install @unitybtw/arcade-engine
```

## 🎨 Branding & Social Previews
To maintain a professional look, we recommend using the following assets for your repository:
- **Social Preview Image**: Use a 1280x640 image with the HUD aesthetic.
- **Repository Topics**: `game-engine`, `arcade`, `open-source`, `typescript`, `gamedev`.

## 📄 License
This project is licensed under the MIT License - see the [LICENSE](LICENSE) file for details.
