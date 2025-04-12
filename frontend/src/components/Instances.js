import React, { useState, useEffect } from 'react';
import axios from 'axios';
import './Instances.css';

const Instances = ({ showPopup }) => {
  const [instances, setInstances] = useState([]);
  const [newInstance, setNewInstance] = useState({
    name: '',
    version: '',
    ram: 2048,
    account: ''
  });

  useEffect(() => {
    fetchInstances();
  }, []);

  const fetchInstances = async () => {
    try {
      const res = await axios.get('/api/instances');
      console.log('Wczytano instancje:', res.data);
      setInstances(res.data || []);
    } catch (error) {
      console.error('Błąd pobierania instancji:', error.message);
      showPopup('Błąd wczytywania instancji');
    }
  };

  const createInstance = async () => {
    if (!newInstance.name || !newInstance.version) {
      showPopup('Wpisz nazwę i wersję instancji');
      return;
    }
    try {
      const res = await axios.post('/api/instances', newInstance);
      console.log('Utworzono instancję:', res.data);
      setNewInstance({ name: '', version: '', ram: 2048, account: '' });
      await fetchInstances();
      showPopup(res.data.message);
    } catch (error) {
      console.error('Błąd tworzenia instancji:', error.message);
      showPopup(`Błąd tworzenia instancji: ${error.response?.data?.error || error.message}`);
    }
  };

  const deleteInstance = async (name) => {
    try {
      const res = await axios.delete('/api/instances', { data: { instanceName: name } });
      console.log('Usunięto instancję:', name);
      await fetchInstances();
      showPopup(res.data.message);
    } catch (error) {
      console.error('Błąd usuwania instancji:', error.message);
      showPopup(`Błąd usuwania instancji: ${error.response?.data?.error || error.message}`);
    }
  };

  const launchInstance = async (name) => {
    try {
      const source = new EventSource(`/api/minecraft/launch/${name}`);
      source.onmessage = (event) => {
        const data = JSON.parse(event.data);
        console.log('Progres uruchamiania:', data);
        showPopup(data.message);
        if (data.type === 'complete' || data.type === 'error') {
          source.close();
        }
      };
      source.onerror = () => {
        showPopup('Błąd uruchamiania instancji');
        source.close();
      };
    } catch (error) {
      console.error('Błąd uruchamiania instancji:', error.message);
      showPopup(`Błąd uruchamiania instancji: ${error.message}`);
    }
  };

  return (
    <div className="instances">
      <h2>Instancje</h2>
      <div className="add-instance">
        <input
          type="text"
          value={newInstance.name}
          onChange={e => setNewInstance({ ...newInstance, name: e.target.value })}
          placeholder="Nazwa instancji"
        />
        <input
          type="text"
          value={newInstance.version}
          onChange={e => setNewInstance({ ...newInstance, version: e.target.value })}
          placeholder="Wersja (np. 1.21.4)"
        />
        <input
          type="number"
          value={newInstance.ram}
          onChange={e => setNewInstance({ ...newInstance, ram: Number(e.target.value) })}
          placeholder="RAM (MB)"
        />
        <input
          type="text"
          value={newInstance.account}
          onChange={e => setNewInstance({ ...newInstance, account: e.target.value })}
          placeholder="Konto (opcjonalne)"
        />
        <button onClick={createInstance}>Utwórz instancję</button>
      </div>
      <table>
        <thead>
          <tr>
            <th>Nazwa</th>
            <th>Wersja</th>
            <th>RAM</th>
            <th>Konto</th>
            <th>Akcje</th>
          </tr>
        </thead>
        <tbody>
          {instances.length > 0 ? (
            instances.map(instance => (
              <tr key={instance.name}>
                <td>{instance.name}</td>
                <td>{instance.version}</td>
                <td>{instance.ram} MB</td>
                <td>{instance.account || 'Brak'}</td>
                <td>
                  <button onClick={() => launchInstance(instance.name)}>Uruchom</button>
                  <button onClick={() => deleteInstance(instance.name)}>Usuń</button>
                </td>
              </tr>
            ))
          ) : (
            <tr>
              <td colSpan="5">Brak instancji</td>
            </tr>
          )}
        </tbody>
      </table>
    </div>
  );
};

export default Instances;