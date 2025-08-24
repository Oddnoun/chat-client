import { Injectable, inject } from '@angular/core';
import * as signalR from '@microsoft/signalr';
import { signal } from '@angular/core';
import { DomSanitizer, SafeHtml } from '@angular/platform-browser';
import { Marked, Renderer } from 'marked';
import { Subject } from 'rxjs';

export type Message = {
  text: string;
  parsedText: SafeHtml;
  type: 'sent' | 'received';
  timestamp: Date;
};

@Injectable({
  providedIn: 'root',
})
export class ChatService {
  messages = signal<Message[]>([]);
  responseReceived = signal(false);
  connectionStatus = new Subject<string>();
  sanitizer = inject(DomSanitizer);

  #hubConnection: signalR.HubConnection;
  private markedInstance: Marked;

  streamingInProgress = signal(false);
  currentStreamMessage = signal('');

  constructor() {
    this.#hubConnection = new signalR.HubConnectionBuilder()
      .withUrl('https://localhost:7243/chat')
      .configureLogging(signalR.LogLevel.Trace)
      .build();

    // Configure marked to open links in a new tab
    const renderer = new Renderer();
    renderer.link = ({ href, title, text }) => {
      const titleAttr = title ? ` title="${title}"` : '';
      return `<a href="${href}"${titleAttr} target="_blank">${text}</a>`;
    };

    renderer.image = ({ href, title, text }) => {
      const titleAttr = title ? ` title="${title}"` : '';
      return `<img src="${href}" alt="${text}"${titleAttr} style="max-width: 100%; height: auto;">`;
    };

    this.markedInstance = new Marked({ renderer, async: false });

    this.#hubConnection.on('receivemessage', (message) => {
      this.messages.update((messages) => [
        ...messages,
        {
          text: message,
          parsedText: this.getParsedHtml(message),
          type: 'received',
          timestamp: new Date(),
        },
      ]);
      this.responseReceived.set(true);
    });

    this.#hubConnection.on(
      'receivemessagestream',
      (data: { message: string; inProgress: boolean }) => {
        // If a new stream is starting (streamingInProgress was false, now true)
        if (!this.streamingInProgress() && data.inProgress) {
          this.currentStreamMessage.set(''); // Clear previous stream content
        }

        this.streamingInProgress.set(data.inProgress);

        if (data.inProgress) {
          this.currentStreamMessage.update((current) => current + data.message);
        } else {
          const fullMessage = this.currentStreamMessage();
          if (fullMessage.trim()) {
            // Only add if the full message has content
            this.messages.update((messages) => [
              ...messages,
              {
                text: fullMessage,
                parsedText: this.getParsedHtml(fullMessage),
                type: 'received',
                timestamp: new Date(),
              },
            ]);
          }
          this.currentStreamMessage.set(''); // Always clear after stream ends
          this.responseReceived.set(true);
        }
      }
    );

    this.#hubConnection
      .start()
      .then(() => {
        console.log('Connection Started');
        this.connectionStatus.next('Connected');
      })
      .catch((err) => {
        console.error(err);
        this.connectionStatus.next('Disconnected');
      });

    this.#hubConnection.onclose(() => {
      this.connectionStatus.next('Disconnected');
    });
  }

  sendMessage(text: string) {
    this.#hubConnection.send('sendmessageasync', text);
    this.messages.update((messages) => [
      ...messages,
      {
        text,
        parsedText: this.getParsedHtml(text),
        type: 'sent',
        timestamp: new Date(),
      },
    ]);
  }

  public getParsedHtml(text: string): SafeHtml {
    return this.sanitizer.bypassSecurityTrustHtml(this.markedInstance.parse(text) as string);
  }
}
