import React, { useState, useEffect } from 'react';
import axios from 'axios';
import './Versions.css';

const Versions = ({ showPopup }) => {
  const [versions, setVersions] = useState([]);
  const [downloadedVersions, setDownloadedVersions] = useState([]);

  useEffect(() => {
    fetchVersions();
    checkDownloadedVersions();
  }, []);

  const fetchVersions = async () => {
    try {
      const res = await axios.get('/api/minecraft/versions');
      console.log('Wczytano wersje Minecrafta:', res.data);
      setVersions(res.data || []);
    } catch (error) {
      console.error('Błąd pobierania wersji:', error.message);
      showPopup('Błąd wczytywania wersji Minecrafta');
    }
  };

  const checkDownloadedVersions = async () => {
    try {
      const versionsDir = window.ipcRenderer.sendSync('get-versions-dir');
      const files = await window.ipcRenderer.invoke('read-dir', versionsDir);
      const downloaded = files
        .filter(file => file.endsWith('.json'))
        .map(file => file.replace('.json', ''));
      console.log('Pobrane wersje:', downloaded);
      setDownloadedVersions(downloaded);
    } catch (error) {
      console.error('Błąd sprawdzania pobranych wersji:', error.message);
    }
  };

  const downloadVersion = async (versionId) => {
    try {
      await axios.post(`/api/versions/download/${versionId}`);
      console.log(`Pobrano wersję: ${versionId}`);
      await checkDownloadedVersions();
      showPopup(`Pobrano wersję ${versionId}`);
    } catch (error) {
      console.error('Błąd pobierania wersji:', error.message);
      showPopup(`Błąd pobierania wersji: ${error.response?.data?.error || error.message}`);
    }
  };

  return (
    <div className="versions">
      <h2>Wersje Minecraft</h2>
      <table>
        <thead>
          <tr>
            <th>Wersja</th>
            <th>Typ</th>
            <th>Data wydania</th>
            <th>Akcje</th>
          </tr>
        </thead>
        <tbody>
          {versions.length > 0 ? (
            versions.map(version => (
              <tr key={version.id}>
                <td>{version.id}</td>
                <td>{version.type}</td>
                <td>{new Date(version.releaseTime).toLocaleDateString()}</td>
                <td>
                  {downloadedVersions.includes(version.id) ? (
                    <button disabled>Pobrano</button>
                  ) : (
                    <button onClick={() => downloadVersion(version.id)}>Pobierz</button>
                  )}
                </td>
              </tr>
            ))
          ) : (
            <tr>
              <td colSpan="4">Brak wersji</td>
            </tr>
          )}
        </tbody>
      </table>
    </div>
  );
};

export default Versions;