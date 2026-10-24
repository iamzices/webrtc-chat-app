# WebRTC Chat App

WebRTC Chat App is a peer-to-peer chat built with React, TypeScript, and PeerJS.

## Features

- Group chats
- Shareable room links
- No chat history saved

## Configuration

By default, the app signals through the free public PeerJS Cloud broker. To use your own [PeerServer](https://github.com/peers/peerjs-server) instead, copy `.env.example` to `.env` and set `VITE_PEER_HOST`, `VITE_PEER_PORT`, and `VITE_PEER_PATH`. For the GitHub Pages deploy, set the same names as repository variables instead.
