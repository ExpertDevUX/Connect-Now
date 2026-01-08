import type { Express } from "express";
import type { Server } from "http";
import { WebSocketServer, WebSocket } from "ws";
import { storage } from "./storage";
import { api } from "@shared/routes";
import { z } from "zod";

export async function registerRoutes(
  httpServer: Server,
  app: Express
): Promise<Server> {
  // Room API Routes
  app.post(api.rooms.create.path, async (req, res) => {
    try {
      const input = api.rooms.create.input.parse(req.body);
      const room = await storage.createRoom(input);
      res.status(201).json(room);
    } catch (err) {
      if (err instanceof z.ZodError) {
        return res.status(400).json({
          message: err.errors[0].message,
          field: err.errors[0].path.join('.'),
        });
      }
      throw err;
    }
  });

  app.get(api.rooms.get.path, async (req, res) => {
    const room = await storage.getRoomBySlug(req.params.slug);
    if (!room) {
      return res.status(404).json({ message: 'Room not found' });
    }
    res.json(room);
  });

  app.post(api.rooms.verifyPassword.path, async (req, res) => {
    const room = await storage.getRoomBySlug(req.params.slug);
    if (!room) {
      return res.status(404).json({ message: 'Room not found' });
    }
    if (room.password && room.password !== req.body.password) {
      return res.status(401).json({ message: 'Invalid password' });
    }
    res.json({ success: true });
  });

  app.get(api.rooms.list.path, async (req, res) => {
    const rooms = await storage.getRooms();
    res.json(rooms);
  });

  // WebSocket Signaling Server
  const wss = new WebSocketServer({ server: httpServer, path: '/ws' });

  // Map to store clients per room: roomId -> Set<WebSocket>
  const rooms = new Map<string, Set<WebSocket>>();

  wss.on('connection', (ws) => {
    let currentRoomId: string | null = null;

    ws.on('message', (rawMessage) => {
      try {
        const message = JSON.parse(rawMessage.toString());

        if (message.type === 'join') {
          const { roomId } = message;
          currentRoomId = roomId;

          if (!rooms.has(roomId)) {
            rooms.set(roomId, new Set());
          }
          const room = rooms.get(roomId)!;
          
          // Limit to 10 peers for a meeting
          if (room.size >= 10) {
             ws.send(JSON.stringify({ type: 'error', message: 'Room full' }));
             return;
          }

          // The first user to join is the "boss"
          const isBoss = room.size === 0;
          if (isBoss) {
            (ws as any).isBoss = true;
          }

          (ws as any).peerId = Math.random().toString(36).substring(7);
          room.add(ws);
          
          // Send back initial state
          ws.send(JSON.stringify({ type: 'init', isBoss, peerId: (ws as any).peerId }));

          // Notify others in room that a user joined
          room.forEach(client => {
            if (client !== ws && client.readyState === WebSocket.OPEN) {
              client.send(JSON.stringify({ type: 'join', roomId, peerId: (ws as any).peerId }));
            }
          });
        } else if (message.type === 'update-name' && currentRoomId) {
          (ws as any).nickname = message.payload;
          const room = rooms.get(currentRoomId);
          if (room) {
            const participants = Array.from(room)
              .filter(p => (p as any).nickname) // Only count participants who have set a nickname/joined
              .map(p => ({
                id: (p as any).peerId,
                name: (p as any).nickname
              }));
            room.forEach(client => {
              if (client.readyState === WebSocket.OPEN) {
                client.send(JSON.stringify({
                  type: 'participants-list',
                  payload: participants
                }));
              }
            });
          }
        } else if (currentRoomId) {
          // Relay signaling messages (offer, answer, candidate) to other peers in the room
          const room = rooms.get(currentRoomId);
          if (room) {
            room.forEach(client => {
              if (client !== ws && client.readyState === WebSocket.OPEN) {
                client.send(rawMessage.toString());
              }
            });
          }
        }
      } catch (err) {
        console.error('WebSocket message error:', err);
      }
    });

    ws.on('close', () => {
      if (currentRoomId) {
        const room = rooms.get(currentRoomId);
        if (room) {
          const wasBoss = (ws as any).isBoss;
          room.delete(ws);

          if (room.size === 0) {
            rooms.delete(currentRoomId);
          } else {
             // Notify remaining peer
             room.forEach(client => {
                if (client.readyState === WebSocket.OPEN) {
                   if (wasBoss) {
                     client.send(JSON.stringify({ type: 'meeting-finished' }));
                   } else {
                     client.send(JSON.stringify({ type: 'user-left' }));
                   }
                }
             });
          }
        }
      }
    });
  });

  return httpServer;
}
