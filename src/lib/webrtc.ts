import { Socket } from 'socket.io-client';

const ICE_SERVERS: RTCConfiguration = {
  iceServers: [
    { urls: 'stun:stun.l.google.com:19302' },
    { urls: 'stun:stun1.l.google.com:19302' },
    { urls: 'stun:stun2.l.google.com:19302' },
  ],
};

export interface WebRTCManagerCallbacks {
  onRemoteStream: (peerSocketId: string, stream: MediaStream) => void;
  onPeerDisconnected: (peerSocketId: string) => void;
  onDataChannelMessage?: (peerSocketId: string, data: any) => void;
  onConnectionStateChange?: (peerSocketId: string, state: RTCPeerConnectionState) => void;
}

export class WebRTCManager {
  private peers = new Map<string, RTCPeerConnection>();
  private dataChannels = new Map<string, RTCDataChannel>();
  private pendingCandidates = new Map<string, RTCIceCandidateInit[]>();
  private localStream: MediaStream | null = null;
  private socket: Socket;
  private callbacks: WebRTCManagerCallbacks;

  constructor(socket: Socket, callbacks: WebRTCManagerCallbacks) {
    this.socket = socket;
    this.callbacks = callbacks;
    this.setupSignalingListeners();
  }

  public setLocalStream(stream: MediaStream) {
    this.localStream = stream;

    // Update all existing peer connections with the new stream's tracks
    this.peers.forEach((pc, peerSocketId) => {
      const senders = pc.getSenders();
      const audioTrack = stream.getAudioTracks()[0];
      const videoTrack = stream.getVideoTracks()[0];

      senders.forEach((sender) => {
        if (sender.track?.kind === 'audio' && audioTrack) {
          sender.replaceTrack(audioTrack).catch(console.warn);
        } else if (sender.track?.kind === 'video' && videoTrack) {
          sender.replaceTrack(videoTrack).catch(console.warn);
        }
      });
    });
  }

  public replaceVideoTrack(newTrack: MediaStreamTrack | null) {
    this.peers.forEach((pc) => {
      const videoSender = pc.getSenders().find((s) => s.track?.kind === 'video');
      if (videoSender) {
        videoSender.replaceTrack(newTrack).catch(console.warn);
      }
    });
  }

  /**
   * Called when a new peer joins the room: initiate offer to them
   */
  public async initiateConnectionToPeer(targetSocketId: string) {
    if (this.peers.has(targetSocketId)) {
      this.closePeerConnection(targetSocketId);
    }

    const pc = this.createPeerConnection(targetSocketId);

    // Create reliable RTCDataChannel for P2P data/file transfers
    try {
      const dc = pc.createDataChannel('collaboration-channel', {
        ordered: true,
      });
      this.setupDataChannel(targetSocketId, dc);
    } catch (err) {
      console.warn('DataChannel creation notice:', err);
    }

    // Add local tracks to peer connection
    if (this.localStream) {
      this.localStream.getTracks().forEach((track) => {
        pc.addTrack(track, this.localStream!);
      });
    }

    try {
      const offer = await pc.createOffer({
        offerToReceiveAudio: true,
        offerToReceiveVideo: true,
      });
      await pc.setLocalDescription(offer);

      this.socket.emit('signal:offer', {
        toSocketId: targetSocketId,
        offer,
      });
    } catch (err) {
      console.error(`Failed to create offer for ${targetSocketId}:`, err);
    }
  }

  private createPeerConnection(peerSocketId: string): RTCPeerConnection {
    const pc = new RTCPeerConnection(ICE_SERVERS);
    this.peers.set(peerSocketId, pc);

    // Handle ICE candidates
    pc.onicecandidate = (event) => {
      if (event.candidate) {
        this.socket.emit('signal:ice-candidate', {
          toSocketId: peerSocketId,
          candidate: event.candidate,
        });
      }
    };

    // Handle remote streams
    const remoteStream = new MediaStream();
    pc.ontrack = (event) => {
      event.streams[0]?.getTracks().forEach((track) => {
        remoteStream.addTrack(track);
      });
      if (event.track && !remoteStream.getTracks().includes(event.track)) {
        remoteStream.addTrack(event.track);
      }
      this.callbacks.onRemoteStream(peerSocketId, remoteStream);
    };

    // Handle data channel from remote
    pc.ondatachannel = (event) => {
      this.setupDataChannel(peerSocketId, event.channel);
    };

    // Handle connection state changes
    pc.onconnectionstatechange = () => {
      this.callbacks.onConnectionStateChange?.(peerSocketId, pc.connectionState);
      if (pc.connectionState === 'disconnected' || pc.connectionState === 'failed' || pc.connectionState === 'closed') {
        this.callbacks.onPeerDisconnected(peerSocketId);
      }
    };

    return pc;
  }

  private setupDataChannel(peerSocketId: string, dc: RTCDataChannel) {
    this.dataChannels.set(peerSocketId, dc);

    dc.onopen = () => {
      console.log(`P2P DataChannel open with ${peerSocketId}`);
    };

    dc.onmessage = (event) => {
      try {
        const parsed = JSON.parse(event.data);
        this.callbacks.onDataChannelMessage?.(peerSocketId, parsed);
      } catch {
        this.callbacks.onDataChannelMessage?.(peerSocketId, event.data);
      }
    };

    dc.onclose = () => {
      this.dataChannels.delete(peerSocketId);
    };
  }

  public sendDataChannelBroadcast(payload: any): void {
    const serialized = JSON.stringify(payload);
    this.dataChannels.forEach((dc) => {
      if (dc.readyState === 'open') {
        try {
          dc.send(serialized);
        } catch (e) {
          console.warn('Failed to send on data channel:', e);
        }
      }
    });
  }

  private setupSignalingListeners() {
    // Receive Offer
    this.socket.on('signal:offer', async ({ fromSocketId, offer }) => {
      try {
        let pc = this.peers.get(fromSocketId);
        if (!pc) {
          pc = this.createPeerConnection(fromSocketId);
          if (this.localStream) {
            this.localStream.getTracks().forEach((track) => {
              pc!.addTrack(track, this.localStream!);
            });
          }
        }

        await pc.setRemoteDescription(new RTCSessionDescription(offer));

        // Process buffered ICE candidates
        const pending = this.pendingCandidates.get(fromSocketId) || [];
        for (const cand of pending) {
          await pc.addIceCandidate(new RTCIceCandidate(cand));
        }
        this.pendingCandidates.delete(fromSocketId);

        const answer = await pc.createAnswer();
        await pc.setLocalDescription(answer);

        this.socket.emit('signal:answer', {
          toSocketId: fromSocketId,
          answer,
        });
      } catch (err) {
        console.error('Error handling offer:', err);
      }
    });

    // Receive Answer
    this.socket.on('signal:answer', async ({ fromSocketId, answer }) => {
      try {
        const pc = this.peers.get(fromSocketId);
        if (pc) {
          await pc.setRemoteDescription(new RTCSessionDescription(answer));

          // Process buffered ICE candidates
          const pending = this.pendingCandidates.get(fromSocketId) || [];
          for (const cand of pending) {
            await pc.addIceCandidate(new RTCIceCandidate(cand));
          }
          this.pendingCandidates.delete(fromSocketId);
        }
      } catch (err) {
        console.error('Error handling answer:', err);
      }
    });

    // Receive ICE candidate
    this.socket.on('signal:ice-candidate', async ({ fromSocketId, candidate }) => {
      try {
        const pc = this.peers.get(fromSocketId);
        if (pc && pc.remoteDescription && pc.remoteDescription.type) {
          await pc.addIceCandidate(new RTCIceCandidate(candidate));
        } else {
          // Buffer candidate until remote description is set
          const current = this.pendingCandidates.get(fromSocketId) || [];
          current.push(candidate);
          this.pendingCandidates.set(fromSocketId, current);
        }
      } catch (err) {
        console.error('Error adding ICE candidate:', err);
      }
    });
  }

  public closePeerConnection(peerSocketId: string) {
    const pc = this.peers.get(peerSocketId);
    if (pc) {
      pc.close();
      this.peers.delete(peerSocketId);
    }
    const dc = this.dataChannels.get(peerSocketId);
    if (dc) {
      dc.close();
      this.dataChannels.delete(peerSocketId);
    }
    this.pendingCandidates.delete(peerSocketId);
  }

  public destroy() {
    this.peers.forEach((pc) => pc.close());
    this.peers.clear();
    this.dataChannels.clear();
    this.pendingCandidates.clear();
    this.socket.off('signal:offer');
    this.socket.off('signal:answer');
    this.socket.off('signal:ice-candidate');
  }
}
