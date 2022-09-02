import React, { useMemo, useState, useEffect } from 'react';
import { Register, Client } from 'mq-web3';
// import { onRpcRequest } from 'web3-mq-snap/dist/snap.js';

const Child = (props) => {
  const { client } = props;

  const [list, setList] = useState(null);
  const [activeChannel, setActiveChannel] = useState(null);
  const [text, setText] = useState('');
  const [messageList, setMessageList] = useState([]);

  const handleEvent = (event) => {
    if (event.type === 'channel.getList') {
      setList(client.channel.channelList);
    }
    if (event.type === 'channel.activeChange') {
      setActiveChannel(client.channel.activeChannel);
      client.message.getMessageList({
        page: 1,
        size: 20,
      });
    }
    if (event.type === 'message.getList') {
      setMessageList(client.message.messageList);
    }
    if (event.type === 'message.new') {
      setText('');
      const list = client.message.messageList || [];
      client.message.messageList = [
        ...list,
        { content: text, id: list.length + 1 },
      ];
      setMessageList([...list, { content: text, id: list.length + 1 }]);
    }
  };

  useEffect(() => {
    client.on('channel.getList', handleEvent);
    client.on('channel.activeChange', handleEvent);
    client.on('message.getList', handleEvent);
    client.on('message.new', handleEvent);
    return () => {
      client.off('channel.getList');
      client.off('channel.activeChange');
      client.off('message.getList');
      client.off('message.new');
    };
  }, [text]);

  useEffect(() => {
    client.channel.queryChannels({ page: 1, size: 100 });
  }, []);

  const handleChangeActive = (channel) => {
    client.channel.setActiveChannel(channel);
  };

  const handleSendMessage = () => {
    client.message.sendMessage(text);
  };

  const List = () => {
    if (!list) {
      return null;
    }
    return (
      <ul>
        {list.map((item, idx) => {
          return (
            <li
              style={{ cursor: 'pointer' }}
              key={item.topic}
              onClick={() => handleChangeActive(item)}
            >
              {idx}-{item.topic}
            </li>
          );
        })}
      </ul>
    );
  };

  return (
    <div>
      <h1>room list</h1>
      <List />
      <h1>message list</h1>
      {activeChannel && (
        <div>
          <div>
            <b>activeChannel:</b>
            <span style={{ color: 'blue' }}>{activeChannel.topic}</span>
          </div>
          <div style={{ minHeight: 300, border: '1px solid #000' }}>
            {messageList.map((item) => {
              return <div key={item.id}>message: {item.content}</div>;
            })}
          </div>
          <div>
            <input
              value={text}
              type="text"
              onChange={(e) => {
                setText(e.target.value);
              }}
            />
            <button onClick={handleSendMessage}>send Message</button>
          </div>
        </div>
      )}
    </div>
  );
};

// Root components
const App = () => {
  const hasKeys = useMemo(() => {
    const PrivateKey = localStorage.getItem('PRIVATE_KEY') || '';
    const PublicKey = localStorage.getItem('PUBLICKEY') || '';
    if (PrivateKey && PublicKey) {
      return { PrivateKey, PublicKey };
    }
    return null;
  }, []);

  const [keys, setKeys] = useState(hasKeys);

  const signMetaMask = async () => {
    const { PrivateKey, PublicKey } = await new Register(
      'vAUJTFXbBZRkEDRE',
    ).signMetaMask('https://www.web3mq.com');
    localStorage.setItem('PRIVATE_KEY', PrivateKey);
    localStorage.setItem('PUBLICKEY', PublicKey);
    setKeys({ PrivateKey, PublicKey });
  };

  if (!keys) {
    return (
      <div>
        <button onClick={signMetaMask}>signMetaMask</button>
      </div>
    );
  }
  Client.init();
  const client = Client.getInstance(keys);

  return (
    <div>
      <button
        onClick={() => {
          client.channel.createRoom();
        }}
      >
        create Room
      </button>
      <button
        onClick={async () => {
          // const res = await onRpcRequest({ request: { method: 'web3-mq' } });
          // console.log(res);
        }}
      >
        console.log
      </button>
      <Child client={client} />
    </div>
  );
};

export default App;
