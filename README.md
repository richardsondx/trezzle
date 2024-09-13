# Trezzle

Trezzle is a daily treasure hunt puzzle game where you use clues and a map to find the hidden country.

## Features

- Daily challenges that reset at midnight.
- Clues are generated dynamically using real-world data.
- Multiple pages: Today's Challenge, Previous Challenges, How to Play.
- Shareable results to compete with friends.
- Responsive design with Bootstrap styling.

## Folder Structure

- `public/` - Contains the `index.html` file.
- `src/` - Contains all the source code.
  - `App.js` - Main application component.
  - `index.js` - Entry point.
  - `components/` - Contains all React components.
  - `styles/` - Contains CSS files.
- `package.json` - Project configuration and dependencies.
- `README.md` - Project documentation.

## Getting Started

### Prerequisites

node v21.2.0 (npm v10.2.3)

- Node.js and npm installed on your machine.

### Installation

1. Clone the repository:

```bash
  git clone https://github.com/yourusername/trezzle.git
  cd trezzle
```

### Install dependencies:

```bash
npm install
```

### Running the Application Locally

```bash
npm start
```

Open http://localhost:3000 to view it in the browser.

### Building for Production

```bash
npm run build
```

### Deploying to Netlify

Install the Netlify CLI:

```bash
npm install netlify-cli -g
```

Build the project:

```bash
npm run build
```
Deploy to Netlify:

```bash
netlify deploy
Follow the prompts to log in and select your site.
```

## Contributing
Contributions are welcome! Please open an issue or submit a pull request.

### License
This project is licensed under the MIT License.