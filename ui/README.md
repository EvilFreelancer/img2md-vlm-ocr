# Markdown OCR UI

A simple React application for uploading images, sending them to an API, and displaying results with bounding boxes over the images.

## Quick Start

1. Create a `.env` file in the `ui` folder with the following content:
   ```
   REACT_APP_API_URL=http://localhost:8000/predict/objects
   ```
2. Run:
   ```bash
   cd ui
   npm install
   npm start
   ```

## Features
- Drag & Drop upload for one or multiple images (tile preview)
- API URL is configured via env
- Loading animation
- Display bounding boxes over images
- Repeat button
- Download image with boxes
- View JSON response

## Project Structure
- `src/components/` — React UI components
- `src/App.js` — Main application logic
- `.env` — API URL configuration

## API Endpoint
The backend endpoint for image upload and object detection must be available at:
```
POST http://localhost:8000/predict/objects
```
