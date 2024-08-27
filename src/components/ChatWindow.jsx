import React, { useState, useEffect, useCallback } from 'react';
import './assets/css/chatwindow.css';

const ChatWindow = ({ roomId, playername, socket }) => {
  const [isOpen, setIsOpen] = useState(false);
  const [message, setMessage] = useState('');
  const [chats, setChats] = useState([]);

  const getApiBaseUrl = () => {
    const baseUrl = process.env.REACT_APP_API_BASE_URL || 'http://localhost:5000';
    return baseUrl;
  };

  const fetchChatMessages = useCallback(async () => {
    try {
      const response = await fetch(`${getApiBaseUrl()}/api/getchat/${roomId}`);
      if (response.ok) {
        const data = await response.json();
        setChats(data);
      } else {
        console.error('Failed to fetch chat messages:', response.statusText);
      }
    } catch (error) {
      console.error('Error fetching chat messages:', error);
    }
  }, [roomId]);

  useEffect(() => {
    fetchChatMessages();

    socket.on('newChatMessage', (newMessage) => {
      setChats((prevChats) => [...prevChats, newMessage]);
    });

    return () => {
      socket.off('newChatMessage');
    };
  }, [roomId, socket, fetchChatMessages]);

  const toggleChatWindow = () => {
    setIsOpen(!isOpen);
  };

  const handleSendMessage = async () => {
    if (message.trim()) {
      const chatMessage = {
        roomId,
        sender: playername,
        message,
      };

      try {
        const response = await fetch(`${getApiBaseUrl()}/api/chat`, {
          method: 'POST',
          headers: {
            'Content-Type': 'application/json',
          },
          body: JSON.stringify(chatMessage),
        });

        if (response.ok) {
          socket.emit('sendChatMessage', chatMessage);
          setMessage('');
          await fetchChatMessages();
        } else {
          console.error('Failed to send message:', response.statusText);
        }
      } catch (error) {
        console.error('Error sending message:', error);
      }
    }
  };

  return (
    <>
      <button
        onClick={toggleChatWindow}
        style={{
          position: 'fixed',
          bottom: '20px',
          right: '20px',
          zIndex: 1000,
          backgroundColor: '#007bff',
          color: '#fff',
          border: 'none',
          borderRadius: '50%',
          width: '60px',
          height: '60px',
          fontSize: '30px',
        }}
      >
        💬
      </button>

      {isOpen && (
        <div
          style={{
            position: 'fixed',
            bottom: '80px',
            right: '20px',
            width: '300px',
            height: '400px',
            backgroundColor: '#fff',
            border: '1px solid #ccc',
            borderRadius: '10px',
            zIndex: 1000,
            display: 'flex',
            flexDirection: 'column',
          }}
        >
          <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', padding: '10px', backgroundColor: '#007bff', color: '#fff' }}>
            <h4 style={{ margin: 0 }}>Chat</h4>
            <button onClick={toggleChatWindow} style={{ background: 'none', border: 'none', color: '#fff', fontSize: '20px' }}>✖</button>
          </div>
          <div style={{ flex: 1, padding: '10px', overflowY: 'scroll' }}>
            {chats.map((chat, index) => (
              <div key={index} style={{ marginBottom: '10px' }}>
                <strong>{chat.sender}:</strong> {chat.message}
              </div>
            ))}
          </div>
          <div style={{ display: 'flex', padding: '10px', borderTop: '1px solid #ccc' }}>
            <input
              type="text"
              value={message}
              onChange={(e) => setMessage(e.target.value)}
              style={{ flex: 1, marginRight: '10px', padding: '5px' , color:"black"}}
            />
            <button onClick={handleSendMessage} style={{ padding: '5px 10px', backgroundColor: '#007bff', color: '#fff', border: 'none', borderRadius: '5px' }}>
              Send
            </button>
          </div>
        </div>
      )}
    </>
  );
};

export default ChatWindow;
