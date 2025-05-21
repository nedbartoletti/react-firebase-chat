import { useState, useEffect } from 'react';
import { collection, query, where, onSnapshot } from 'firebase/firestore';
import { db } from '../lib/firebase';
import useAuthStore from '../store/useAuthStore';
import { format } from 'date-fns';

const Sidebar = ({ onSelectContact }) => {
  const { user } = useAuthStore();
  const [contacts, setContacts] = useState([]);
  const [search, setSearch] = useState('');

  useEffect(() => {
    const q = query(
      collection(db, 'users'),
      where('uid', '!=', user.uid)
    );

    const unsubscribe = onSnapshot(q, (snapshot) => {
      const contactsList = [];
      snapshot.forEach((doc) => {
        contactsList.push({ id: doc.id, ...doc.data() });
      });
      setContacts(contactsList);
    });

    return () => unsubscribe();
  }, [user.uid]);

  const filteredContacts = contacts.filter((contact) =>
    contact.displayName.toLowerCase().includes(search.toLowerCase()) ||
    contact.email.toLowerCase().includes(search.toLowerCase())
  );

  return (
    <div className="w-80 h-screen bg-gray-100 border-r">
      <div className="p-4">
        <input
          type="text"
          placeholder="Search contacts..."
          className="w-full p-2 rounded border"
          value={search}
          onChange={(e) => setSearch(e.target.value)}
        />
      </div>
      <div className="overflow-y-auto h-[calc(100vh-80px)]">
        {filteredContacts.map((contact) => (
          <div
            key={contact.id}
            className="flex items-center p-4 hover:bg-gray-200 cursor-pointer"
            onClick={() => onSelectContact(contact)}
          >
            <div className="relative">
              <img
                src={contact.photoURL || '/avatar.png'}
                alt={contact.displayName}
                className="w-12 h-12 rounded-full"
              />
              <span
                className={`absolute bottom-0 right-0 w-3 h-3 rounded-full ${
                  contact.status === 'online' ? 'bg-green-500' : 'bg-gray-500'
                }`}
              />
            </div>
            <div className="ml-4">
              <h3 className="font-semibold">{contact.displayName}</h3>
              <p className="text-sm text-gray-600">{contact.status}</p>
              {contact.lastSeen && (
                <p className="text-xs text-gray-500">
                  Last seen: {format(new Date(contact.lastSeen), 'PP')}
                </p>
              )}
            </div>
          </div>
        ))}
      </div>
    </div>
  );
};

export default Sidebar