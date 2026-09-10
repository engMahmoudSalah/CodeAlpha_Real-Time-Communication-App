import React from 'react';
import { Participant, MediaDeviceSettings } from '../types';
import { VideoTile } from './VideoTile';

interface VideoGridProps {
  localParticipant: Participant;
  localStream: MediaStream | null;
  remoteParticipants: Participant[];
  remoteStreams: Map<string, MediaStream>;
  pinnedSocketId: string | null;
  onTogglePin: (socketId: string) => void;
  deviceSettings: MediaDeviceSettings;
  isWhiteboardOpen?: boolean;
}

export const VideoGrid: React.FC<VideoGridProps> = ({
  localParticipant,
  localStream,
  remoteParticipants,
  remoteStreams,
  pinnedSocketId,
  onTogglePin,
  deviceSettings,
}) => {
  // Combine all participants (local first)
  const allParticipants = [localParticipant, ...remoteParticipants];

  // Check if any participant is currently screen sharing
  const screenSharer = allParticipants.find((p) => p.isScreenSharing);
  const activeSpotlightId = screenSharer ? screenSharer.socketId : pinnedSocketId;

  const spotlightParticipant = activeSpotlightId
    ? allParticipants.find((p) => p.socketId === activeSpotlightId)
    : null;

  // Get appropriate stream for a participant
  const getParticipantStream = (p: Participant): MediaStream | undefined => {
    if (p.socketId === localParticipant.socketId) {
      return localStream || undefined;
    }
    return remoteStreams.get(p.socketId);
  };

  // If there is a spotlight (pinned or screen-sharing)
  if (spotlightParticipant) {
    const spotlightStream = getParticipantStream(spotlightParticipant);
    const secondaryParticipants = allParticipants.filter(
      (p) => p.socketId !== spotlightParticipant.socketId
    );

    return (
      <div className="w-full h-full flex flex-col lg:grid lg:grid-cols-4 gap-3 sm:gap-4 p-2 sm:p-4 min-h-0 overflow-hidden">
        {/* Main Spotlight Card (Span 3 on Desktop) */}
        <div className="flex-1 lg:col-span-3 h-full min-h-[220px] sm:min-h-[300px] relative rounded-xl overflow-hidden shadow-sm">
          <VideoTile
            participant={spotlightParticipant}
            stream={spotlightStream}
            isLocal={spotlightParticipant.socketId === localParticipant.socketId}
            isPinned={true}
            onTogglePin={() => onTogglePin(spotlightParticipant.socketId)}
            virtualBlur={
              spotlightParticipant.socketId === localParticipant.socketId
                ? deviceSettings.virtualBackgroundBlur
                : false
            }
          />
        </div>

        {/* Secondary Participants Carousel/Strip */}
        {secondaryParticipants.length > 0 && (
          <div className="lg:col-span-1 flex lg:flex-col gap-2.5 sm:gap-3 overflow-x-auto lg:overflow-y-auto shrink-0 py-1 lg:py-0">
            {secondaryParticipants.map((p) => {
              const stream = getParticipantStream(p);
              return (
                <div key={p.socketId} className="w-40 sm:w-48 lg:w-full h-28 sm:h-36 lg:h-44 shrink-0 rounded-xl overflow-hidden shadow-sm">
                  <VideoTile
                    participant={p}
                    stream={stream}
                    isLocal={p.socketId === localParticipant.socketId}
                    isPinned={false}
                    onTogglePin={() => onTogglePin(p.socketId)}
                    virtualBlur={
                      p.socketId === localParticipant.socketId
                        ? deviceSettings.virtualBackgroundBlur
                        : false
                    }
                  />
                </div>
              );
            })}
          </div>
        )}
      </div>
    );
  }

  // Standard Adaptive Video Grid
  const totalCount = allParticipants.length;

  let gridClass = 'grid-cols-1 max-w-4xl';
  if (totalCount === 2) {
    gridClass = 'grid-cols-1 sm:grid-cols-2 max-w-5xl';
  } else if (totalCount === 3) {
    gridClass = 'grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 max-w-6xl';
  } else if (totalCount === 4) {
    gridClass = 'grid-cols-2 max-w-5xl';
  } else if (totalCount >= 5 && totalCount <= 6) {
    gridClass = 'grid-cols-2 lg:grid-cols-3 max-w-6xl';
  } else if (totalCount >= 7) {
    gridClass = 'grid-cols-2 sm:grid-cols-3 lg:grid-cols-4 max-w-7xl';
  }

  return (
    <div className="w-full h-full flex items-center justify-center p-2 sm:p-4 overflow-y-auto">
      <div className={`w-full grid gap-3 sm:gap-4 transition-all duration-300 ${gridClass}`}>
        {allParticipants.map((p) => {
          const stream = getParticipantStream(p);
          return (
            <div key={p.socketId} className="aspect-video w-full rounded-xl overflow-hidden shadow-sm">
              <VideoTile
                participant={p}
                stream={stream}
                isLocal={p.socketId === localParticipant.socketId}
                isPinned={false}
                onTogglePin={() => onTogglePin(p.socketId)}
                virtualBlur={
                  p.socketId === localParticipant.socketId
                    ? deviceSettings.virtualBackgroundBlur
                    : false
                }
              />
            </div>
          );
        })}
      </div>
    </div>
  );
};
