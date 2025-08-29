# 🎯 AI-Powered Presentation Generator

An intelligent web application that automatically generates professional PowerPoint presentations from text input using Large Language Models (LLMs). Simply provide your content, upload a template, and let AI create a structured, visually appealing presentation.

![Presentation Generator Demo](https://img.shields.io/badge/Status-Live-brightgreen) ![Node.js](https://img.shields.io/badge/Node.js-18+-green) ![React](https://img.shields.io/badge/React-18+-blue) ![TypeScript](https://img.shields.io/badge/TypeScript-5+-blue)

## ✨ Features

- **🤖 AI-Powered Content Structuring**: Supports OpenAI GPT-4, Anthropic Claude, Google Gemini, and OpenRouter models
- **🎨 Template-Based Styling**: Upload existing PowerPoint templates to maintain brand consistency
- **📝 Smart Content Organization**: Automatically creates 6-10 slides with logical flow and bullet points
- **🗣️ Speaker Notes Generation**: Optional detailed speaker notes for presentation delivery
- **⚡ Real-time Processing**: Fast generation with progress tracking and error handling
- **📱 Responsive Design**: Works on desktop, tablet, and mobile devices
- **🔒 Secure API Key Handling**: Client-side API key management (never stored on servers)

## 🛠️ Prerequisites

- **Node.js** 18+ and npm 9+
- **LLM API Key** (one of):
  - OpenAI API key
  - Anthropic API key
  - Google Gemini API key
  - OpenRouter API key

## 🚀 Quick Start

### Local Development

1. **Clone the repository**
   ```bash
   git clone https://github.com/Shubham-Sharma-IITM/Online-presentation-generator.git
   cd presentation-generator
# Install all dependencies
npm run install:all

# Or install manually
cd client && npm install
cd ../server && npm install

# Start both client and server
npm run dev

# Or start separately
npm run client:dev  # React app on http://localhost:5173
npm run server:dev  # API server on http://localhost:3001