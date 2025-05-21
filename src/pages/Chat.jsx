import { useState, useEffect } from 'react';
import useAuthStore from '../store/useAuthStore';
import { db, storage } from '../lib/firebase';
import {
  collection,
  query,
  orderBy,
  onSnapshot,
  addDoc,
  serverTimestamp,
  where
} from 'firebase/firestore';
import { ref, uploadBytes, getDownloadURL } from 'firebase/storage';
import { v4 as uuidv4 } from 'uuid';
import Sidebar from '../components/Sidebar';
import VideoCall from '../components/VideoCall';

const Chat = () => {
  const { user, signOut } = useAuthStore();
  const [messages, setMessages] = useState([]);
  const [newMessage, setNewMessage] = useState('');
  const [file, setFile] = useState(null);
  const [selectedContact, setSelectedContact] = useState(null);
  const [isVideoCallActive, setIsVideoCallActive] = useState(false);

  useEffect(() => {
    if (!selectedContact) return;

    const q = query(
      collection(db, 'messages'),
      where('participants', 'array-contains', user.uid),
      orderBy('createdAt')
    );

    const unsubscribe = onSnapshot(q, (snapshot) => {
      const messages = [];
      snapshot.forEach((doc) => {
        const messageData = doc.data();
        if (messageData.participants.includes(selectedContact.uid)) {
          messages.push({ id: doc.id, ...messageData });
        }
      });
      setMessages(messages);
    });

    return () => unsubscribe();
  }, [selectedContact, user.uid]);

  const handleSubmit = async (e) => {
    e.preventDefault();
    if ((!newMessage.trim() && !file) || !selectedContact) return;

    try {
      let fileUrl = null;
      if (file) {
        const fileRef = ref(storage, `attachments/${uuidv4()}-${file.name}`);
        await uploadBytes(fileRef, file);
        fileUrl = await getDownloadURL(fileRef);
      }

      await addDoc(collection(db, 'messages'), {
        text: newMessage,
        fileUrl,
        participants: [user.uid, selectedContact.uid],
        recipientId: selectedContact.uid,
        fileName: file?.name,
        senderId: user.uid,
        senderEmail: user.email,
        createdAt: serverTimestamp(),
      });

      setNewMessage('');
      setFile(null);
    } catch (error) {
      console.error('Error sending message:', error);
    }
  };

  const startVideoCall = () => {
    setIsVideoCallActive(true);
  };

  const endVideoCall = () => {
    setIsVideoCallActive(false);
  };

  return (
    <div className="flex h-screen">
      <Sidebar onSelectContact={setSelectedContact} />
      <div className="flex-1 flex flex-col">
        <header className="bg-blue-500 text-white p-4 flex justify-between items-center">
          <h1 className="text-xl font-bold">{selectedContact ? selectedContact.displayName : 'Select a contact'}</h1>
          <button
          onClick={signOut}
          className="bg-red-500 text-white px-4 py-2 rounded hover:bg-red-600"
        >
          Sign Out
        </button>
      </header>

      {selectedContact ? (
        <>
          <div className="flex-1 overflow-y-auto p-4 space-y-4">
            {messages.map((message) => (
              <div
                key={message.id}
                className={`flex flex-col ${
                  message.senderId === user.uid ? 'items-end' : 'items-start'
                }`}
              >
                <div
                  className={`max-w-xs md:max-w-md p-3 rounded-lg ${
                    message.senderId === user.uid
                      ? 'bg-blue-500 text-white'
                      : 'bg-gray-200'
                  }`}
                >
                  <p className="text-sm font-semibold">{message.senderEmail}</p>
                  <p>{message.text}</p>
                  {message.fileUrl && (
                    <a
                      href={message.fileUrl}
                      target="_blank"
                      rel="noopener noreferrer"
                      className="text-sm underline"
                    >
                      {message.fileName}
                    </a>
                  )}
                </div>
              </div>
            ))}
          </div>

          <form onSubmit={handleSubmit} className="p-4 border-t">
            <div
              className="flex items-center space-x-2"
            >
              <input
                type="text"
                value={newMessage}
                onChange={(e) => setNewMessage(e.target.value)}
                placeholder="Type a message..."
                className="flex-1 p-2 border rounded"
              />
              <button
                type="button"
                onClick={startVideoCall}
                className="bg-green-500 text-white p-2 rounded hover:bg-green-600"
              >
                📹
              </button>
              <input
                type="file"
                onChange={(e) => setFile(e.target.files[0])}
                className="hidden"
                id="file-input"
              />
              <label
                htmlFor="file-input"
                className="bg-gray-200 p-2 rounded cursor-pointer hover:bg-gray-300"
              >
                📎
              </label>
              <button
                type="submit"
                className="bg-blue-500 text-white px-4 py-2 rounded hover:bg-blue-600"
              >
                Send
              </button>
            </div>
          </form>
        </>
      ) : (
        <div className="flex-1 flex items-center justify-center text-gray-500">
          Select a contact to start chatting
        </div>
      )}
      </div>

      {isVideoCallActive && selectedContact && (
        <VideoCall
          contactId={selectedContact.uid}
          onEndCall={endVideoCall}
        />
      )}
    </div>
  );
};

export default Chat;