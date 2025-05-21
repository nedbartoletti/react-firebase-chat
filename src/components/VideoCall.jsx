import { useEffect, useRef, useState } from 'react';
import Peer from 'simple-peer';
import { db } from '../lib/firebase';
import { doc, setDoc, onSnapshot, updateDoc, deleteDoc } from 'firebase/firestore';
import useAuthStore from '../store/useAuthStore';

const VideoCall = ({ contactId, onEndCall }) => {
  const { user } = useAuthStore();
  const [stream, setStream] = useState(null);
  const [receivingCall, setReceivingCall] = useState(false);
  const [callAccepted, setCallAccepted] = useState(false);
  const [callEnded, setCallEnded] = useState(false);
  
  const myVideo = useRef();
  const userVideo = useRef();
  const connectionRef = useRef();

  useEffect(() => {
    navigator.mediaDevices.getUserMedia({ video: true, audio: true })
      .then((currentStream) => {
        setStream(currentStream);
        if (myVideo.current) {
          myVideo.current.srcObject = currentStream;
        }
      });

    const callDoc = doc(db, 'calls', `${user.uid}-${contactId}`);
    
    const unsubscribe = onSnapshot(callDoc, (snapshot) => {
      const data = snapshot.data();
      if (data?.signal && !callAccepted) {
        setReceivingCall(true);
        answerCall(data.signal);
      }
    });

    return () => {
      unsubscribe();
      if (stream) {
        stream.getTracks().forEach(track => track.stop());
      }
    };
  }, []);

  const callUser = async () => {
    const peer = new Peer({
      initiator: true,
      trickle: false,
      stream: stream
    });

    peer.on('signal', async (data) => {
      await setDoc(doc(db, 'calls', `${user.uid}-${contactId}`), {
        signal: data,
        from: user.uid,
        to: contactId
      });
    });

    peer.on('stream', (currentStream) => {
      userVideo.current.srcObject = currentStream;
    });

    connectionRef.current = peer;
  };

  const answerCall = (signal) => {
    const peer = new Peer({
      initiator: false,
      trickle: false,
      stream: stream
    });

    peer.on('signal', async (data) => {
      await updateDoc(doc(db, 'calls', `${user.uid}-${contactId}`), {
        signal: data
      });
    });

    peer.on('stream', (currentStream) => {
      userVideo.current.srcObject = currentStream;
    });

    peer.signal(signal);
    setCallAccepted(true);
    connectionRef.current = peer;
  };

  const leaveCall = async () => {
    setCallEnded(true);
    if (connectionRef.current) {
      connectionRef.current.destroy();
    }
    await deleteDoc(doc(db, 'calls', `${user.uid}-${contactId}`));
    onEndCall();
  };

  return (
    <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center">
      <div className="bg-white p-4 rounded-lg shadow-lg">
        <div className="grid grid-cols-2 gap-4">
          <div>
            <video
              playsInline
              muted
              ref={myVideo}
              autoPlay
              className="w-full rounded"
            />
          </div>
          <div>
            {callAccepted && !callEnded && (
              <video
                playsInline
                ref={userVideo}
                autoPlay
                className="w-full rounded"
              />
            )}
          </div>
        </div>
        <div className="mt-4 flex justify-center space-x-4">
          {!callAccepted && !callEnded && (
            <button
              onClick={callUser}
              className="bg-green-500 text-white px-4 py-2 rounded"
            >
              Call
            </button>
          )}
          {(callAccepted || receivingCall) && (
            <button
              onClick={leaveCall}
              className="bg-red-500 text-white px-4 py-2 rounded"
            >
              End Call
            </button>
          )}
        </div>
      </div>
    </div>
  );
};

export default VideoCall