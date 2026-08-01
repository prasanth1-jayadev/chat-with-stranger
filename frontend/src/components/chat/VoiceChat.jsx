import React, { useEffect, useRef, useState } from 'react';
import { socket } from '../../socket';


const VoiceChat = ({ remoteSocketId }) => {
  const [stream, setStream] = useState(null);
  const [receivingCall, setReceivingCall] = useState(false);
  const [caller, setCaller] = useState('');
  const [callerSignal, setCallerSignal] = useState(null);
  const [callAccepted, setCallAccepted] = useState(false);
  
  const myAudio = useRef();
  const remoteAudio = useRef();
  const connectionRef = useRef();

  useEffect(() => {
    // 1. Get Microphone Access
    navigator.mediaDevices.getUserMedia({ video: false, audio: true })
      .then((currentStream) => {
        setStream(currentStream);
        if (myAudio.current) myAudio.current.srcObject = currentStream;
      });

    // 2. Listen for incoming calls
    socket.on('receive_call', (data) => {
      setReceivingCall(true);
      setCaller(data.from);
      setCallerSignal(data.signal);
    });

    // 3. Listen for ICE candidates
    socket.on('ice_candidate', async (candidate) => {
      if (connectionRef.current) {
        await connectionRef.current.addIceCandidate(new RTCIceCandidate(candidate));
      }
    });

    // 4. Listen for call end
    socket.on('call_ended', () => {
      endCall(false);
    });

    return () => {
      socket.off('receive_call');
      socket.off('ice_candidate');
      socket.off('call_ended');
    };
  }, [socket]);

  // Helper to create the WebRTC connection
  const createPeer = (userId) => {
    const peer = new RTCPeerConnection({ iceServers: [{ urls: 'stun:stun.l.google.com:19302' }] });
    
    stream.getTracks().forEach(track => peer.addTrack(track, stream));
    
    peer.ontrack = (event) => {
      if (remoteAudio.current) remoteAudio.current.srcObject = event.streams[0];
    };
    
    peer.onicecandidate = (event) => {
      if (event.candidate) {
        socket.emit('ice_candidate', { to: userId, candidate: event.candidate });
      }
    };
    return peer;
  };

  // --- ACTIONS ---

  const callUser = async () => {
    const peer = createPeer(remoteSocketId);
    connectionRef.current = peer;

    const offer = await peer.createOffer();
    await peer.setLocalDescription(offer);

    socket.emit('call_user', { userToCall: remoteSocketId, signalData: offer });

    socket.once('call_accepted', async (signal) => {
      setCallAccepted(true);
      await peer.setRemoteDescription(new RTCSessionDescription(signal));
    });
  };

  const answerCall = async () => {
    setCallAccepted(true);
    const peer = createPeer(caller);
    connectionRef.current = peer;

    await peer.setRemoteDescription(new RTCSessionDescription(callerSignal));
    const answer = await peer.createAnswer();
    await peer.setLocalDescription(answer);

    socket.emit('answer_call', { signal: answer, to: caller });
  };

  const endCall = (emitEvent = true) => {
    setCallAccepted(false);
    setReceivingCall(false);
    if (connectionRef.current) connectionRef.current.close();
    if (emitEvent) socket.emit('end_call', { to: caller || remoteSocketId });
  };

  return (
    <div className="p-4 bg-gray-800 rounded-lg text-white">
      {/* Hidden audio tags to play the sound */}
      <audio ref={myAudio} autoPlay muted className="hidden" />
      <audio ref={remoteAudio} autoPlay className="hidden" />

      {callAccepted ? (
        <button onClick={() => endCall(true)} className="bg-red-500 hover:bg-red-600 px-4 py-2 rounded transition-colors">End Call</button>
      ) : (
        <button onClick={callUser} className="bg-green-500 hover:bg-green-600 px-4 py-2 rounded transition-colors">Call User</button>
      )}

      {receivingCall && !callAccepted && (
        <div className="mt-4 p-4 border rounded bg-gray-700">
          <p className="mb-2">Someone is calling...</p>
          <button onClick={answerCall} className="bg-blue-500 hover:bg-blue-600 px-4 py-2 rounded transition-colors">Answer</button>
        </div>
      )}
    </div>
  );
};

export default VoiceChat;
