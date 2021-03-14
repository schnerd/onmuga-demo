import { useCallback, useEffect, useState } from "react";
import SdkClient from '@onmuga/sdk';
import qs from 'query-string';

let sdk;

function getRoomFromUrl() {
  return qs.parse(window.location.search).roomId || null;
}

const DEFAULT = 'default';

export function Game() {
  const [isMounted, setIsMounted] = useState(false);
  const [roomId, setRoomId] = useState(null);
  const [gameState, setGameState] = useState({count: 0});
  const [_, forceUpdate] = useState({});

  useEffect(() => {
    sdk = new SdkClient({
      apiKey: 'rBxErZBlOhLALMQJXnZebWFyQ6riJAsYHOpzEP76',
      game: 'demo',
      server: 'https://d3c4f42a158b.ngrok.io',
    });

    sdk.on('gameStateChanged', (stateKey, state) => {
      if (stateKey === DEFAULT) {
        setGameState(state);
      }
    });

    sdk.on('usersChanged', () => {
      // Just re-render if connected players changes
      forceUpdate({});
    });

    let username = sdk.getUsername();

    if (!username) {
      username = window.prompt('Select a username');
      sdk.setUsername(username);
    }

    // Up to you to decide on how room IDs are stored in URL, then extract them appropriately
    let roomId = getRoomFromUrl(window.location);
    if (!roomId) {
      roomId = window.prompt('Enter a room ID or leave blank to create a new room');
    }

    if (!roomId) {
      sdk.createRoom(username).then(onJoinRoom);
    } else {
      sdk.joinRoom(roomId, username).then(onJoinRoom);
    }

    function onJoinRoom(response) {
      setRoomId(response.roomId);
      window.history.pushState(null, null, `/?roomId=${response.roomId}`);
    }

    setIsMounted(true);
  }, []);

  const handleClick = useCallback(() => {
    const nextGameState = {...gameState, count: (gameState.count || 0) + 1};
    sdk.updateGameState(DEFAULT, nextGameState);
  }, [gameState]);

  const users = (sdk ? sdk.getUsers() : null) || [];

  return (
    <div className="game">
      <div className="lobby">
        <p>
          Room ID: <strong>{roomId}</strong>
        </p>
        <p>
          Players:<br/>
          {users.map(u => (
            <span className="user" key={u.username}>{u.username}</span>
          ))}
        </p>
        <p className="share">
          Share with a friend:<br/>{isMounted && <a href={window.location.href} target="_blank">{window.location.href}</a>}
        </p>
      </div>
      <div className="content">
        This button will synchronize the number of clicks by all players:<br/>
        <button onClick={handleClick}>Clicked {gameState.count} times(s)</button>
      </div>
      <style jsx>{`
        .game {
          display: flex;
          align-items: stretch;
          margin: 20px;
        }
        .lobby {
          background: #eee;
          border-top-left-radius: 6px;
          border-bottom-left-radius: 6px;
          padding: 20px;
        }
        .lobby p:first-child {
          margin-top: 0;
        }
        .user {
          display: block;
          font-family: monospace;
          font-weight: bold;
        }
        .share {
          font-size: 12px;
          color: #777;
        }
        .share a {
          color: #777;
        }
        .share a:visited {
          color: #777;
        }
        .content {
          background: #f6f6f6;
          padding: 20px;
          border-top-right-radius: 6px;
          border-bottom-right-radius: 6px;
        }
        button {
          margin-top: 10px;
        }
      `}</style>
    </div>
  );
}