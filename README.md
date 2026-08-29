# WebRTC Chat App

Live at https://dollhouse-sg.github.io/webrtc-chat-app/

A static, serverless group chat for up to 8 people. 

## Development

```
npm install
npm run dev
```

## Build

```
npm run build
```

Outputs a static site to `dist/`, deployable to any static host.

## Configuration

By default the app signals through the free public PeerJS Cloud broker.
To use your own [PeerServer](https://github.com/peers/peerjs-server) instead, copy `.env.example`
to `.env` and set `VITE_PEER_HOST`, `VITE_PEER_PORT`, and `VITE_PEER_PATH`.
