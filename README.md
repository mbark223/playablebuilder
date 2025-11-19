# Playable Ad Builder

A specialized web-based tool for creating high-performance playable slot game ads with drag-and-drop functionality, comprehensive export options, and platform-specific optimizations for major ad networks.

## Features

- 🎰 **Slot Game Engine** - Built with PixiJS for smooth 60fps animations
- 📤 **Multi-Platform Export** - Snapchat, Facebook, Google, Unity, IronSource, AppLovin
- 🎨 **Drag & Drop Interface** - Easy symbol upload and management
- 🗂️ **Project Management** - Create and manage multiple slot projects
- ⚡ **Performance Optimized** - Sub-2MB exports with automatic optimization
- 🎯 **Platform Compliance** - Built-in validation for each ad network

## Tech Stack

- **Framework**: Next.js 16 with App Router
- **Language**: TypeScript
- **Game Engine**: PixiJS
- **State Management**: Zustand
- **UI Components**: Radix UI + Tailwind CSS
- **File Handling**: React Dropzone

## Getting Started

1. Clone the repository:
```bash
git clone https://github.com/mbark223/playablebuilder.git
cd playablebuilder
```

2. Install dependencies:
```bash
npm install
```

3. Run the development server:
```bash
npm run dev
```

4. Open [http://localhost:3000](http://localhost:3000) in your browser

## Project Structure

```
playablebuilder/
├── app/              # Next.js app directory
├── components/       # React components
├── lib/             # Utility functions and slot renderer
├── store/           # Zustand state management
├── types/           # TypeScript type definitions
└── public/          # Static assets
```

## Usage

1. **Create a Project**: Click "New Project" and enter project details
2. **Upload Symbols**: Use the drag-and-drop uploader to add slot symbols
3. **Preview**: See your slot game in action with the spin button
4. **Export**: Select target platforms and export your playable ad

## Platform Specifications

| Platform | Max Size | Format | Orientation |
|----------|----------|---------|-------------|
| Snapchat | 5MB | HTML | Portrait/Landscape |
| Facebook | 2MB | HTML | All |
| Google | 1MB | ZIP | Responsive |
| Unity Ads | 5MB | HTML | Universal |
| IronSource | 5MB | HTML | Universal |
| AppLovin | 3MB | HTML | Universal |

## Development

```bash
# Run development server
npm run dev

# Build for production
npm run build

# Run production server
npm start

# Lint code
npm run lint
```

## Contributing

1. Fork the repository
2. Create your feature branch (`git checkout -b feature/AmazingFeature`)
3. Commit your changes (`git commit -m 'Add some AmazingFeature'`)
4. Push to the branch (`git push origin feature/AmazingFeature`)
5. Open a Pull Request

## License

This project is licensed under the MIT License.

## Contact

Project Link: [https://github.com/mbark223/playablebuilder](https://github.com/mbark223/playablebuilder)