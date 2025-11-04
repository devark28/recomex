# Recomex Local Client

A TypeScript-based local client for GNOME remote control using CLI tools.

## Prerequisites

The client uses these CLI tools (install with apt):

```bash
sudo apt update
sudo apt install pamixer brightnessctl playerctl
```

## Setup

1. **Check dependencies:**
   ```bash
   npm run setup
   ```

2. **Build the client:**
   ```bash
   npm run build
   ```

3. **Register with server:**
   ```bash
   npm run register -- <registration-token>
   ```

4. **Start the client:**
   ```bash
   npm start
   ```

## Features

- **Media Control**: Uses `playerctl` for MPRIS media control
- **Volume Control**: Uses `pamixer` for PulseAudio volume control  
- **Brightness Control**: Uses `brightnessctl` for screen brightness
- **RSA Keys**: Generates proper RSA key pairs using `ssh-keygen`
- **Config Storage**: Stores config in `~/.config/recomex/client.json`
- **Key Storage**: Stores keys in `~/.ssh/recomex` and `~/.ssh/recomex.pub`

## CLI Tools Used

| Feature | Command Examples |
|---------|------------------|
| Volume | `pamixer --increase 5`, `pamixer --decrease 5` |
| Brightness | `sudo brightnessctl set +10%`, `sudo brightnessctl set 10%-` |
| Media | `playerctl next`, `playerctl previous`, `playerctl play-pause` |

## Development

```bash
# Watch mode for development
npm run dev

# Build for production
npm run build
```