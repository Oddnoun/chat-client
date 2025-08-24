# Chat Client

A simple chat client application built with Angular, featuring real-time messaging and streaming responses from a SignalR backend.

## Quick Start

Follow these steps to get the chat client up and running on your local machine.

### Prerequisites

- Node.js (LTS version recommended)
- npm (comes with Node.js)
- Angular CLI (install globally: `npm install -g @angular/cli`)

### Installation

1. Clone the repository:

   ```bash
   git clone <repository-url>
   cd chat-client
   ```

2. Install the dependencies:

   ```bash
   npm install
   ```

### Running the Application

To start the development server:

```bash
ng serve
```

This will compile the application and open it in your default browser at `http://localhost:4200/`. The application will automatically reload if you change any of the source files.

## Features

- Real-time chat messaging
- Streaming responses from the server
- Markdown rendering for messages
- Automatic scrolling to the latest message

## Technologies Used

- Angular
- TypeScript
- SignalR (client-side)
- Marked.js (for Markdown parsing)
- SCSS (for styling)
