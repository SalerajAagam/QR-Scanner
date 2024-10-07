import React, { useState } from "react";
import { useEffect } from "react";
import { QRCodeCanvas } from "qrcode.react";
import "./App.css";

import { gapi } from "gapi-script";

const CLIENT_ID = process.env.REACT_APP_CLIENT_ID;
const API_KEY = process.env.REACT_APP_API_KEY;
const SCOPE = "https://www.googleapis.com/auth/drive.file";
const DISCOVERY_DOCS = ["https://www.googleapis.com/discovery/v1/apis/drive/v3/rest"];

function App() {
  const [isAuthenticated, setIsAuthenticated] = useState(false);
  const [folderId, setFolderId] = useState(null);
  const [imageFiles, setImageFiles] = useState([]);
  const [folderUrl, setFolderUrl] = useState(null);

  useEffect(() => {
    const initClient = () => {
      gapi.client
        .init({
          apiKey: API_KEY,
          clientId: CLIENT_ID,
          discoveryDocs: DISCOVERY_DOCS,
          scope: SCOPE,
        })
        .then(() => {
          gapi.auth2.getAuthInstance().isSignedIn.listen(setIsAuthenticated);
          setIsAuthenticated(gapi.auth2.getAuthInstance().isSignedIn.get());
        });
    };
    gapi.load("client:auth2", initClient);
  }, []);

  const handleSignIn = () => {
    gapi.auth2.getAuthInstance().signIn();
  };

  const handleSignOut = () => {
    gapi.auth2.getAuthInstance().signOut();
  };

  const handleFileChange = (e) => {
    setImageFiles(e.target.files);
  };

  const createFolder = async () => {
    const folderName = `Images_${new Date().toISOString()}`;
    const fileMetadata = {
      name: folderName,
      mimeType: "application/vnd.google-apps.folder",
    };

    const response = await gapi.client.drive.files.create({
      resource: fileMetadata,
      fields: "id",
    });
    console.log(response);
    const folderId = response.result.id;
    setFolderId(folderId);
    setFolderUrl(`https://drive.google.com/drive/folders/${folderId}`);

    for (const file of imageFiles) {
      await uploadFileToDrive(folderId, file);
    }

    alert("Images uploaded successfully!");
  };

  const uploadFileToDrive = async (folderId, file) => {
    const fileMetadata = {
      name: file.name,
      parents: [folderId],
    };

    const formData = new FormData();
    formData.append(
      "metadata",
      new Blob([JSON.stringify(fileMetadata)], { type: "application/json" })
    );
    formData.append("file", file);

    await fetch(
      "https://www.googleapis.com/upload/drive/v3/files?uploadType=multipart&fields=id",
      {
        method: "POST",
        headers: {
          Authorization: `Bearer ${gapi.auth.getToken().access_token}`,
        },
        body: formData,
      }
    );
  };

  return (
    <div className="App">
      <h1>Google Drive Image Uploader with QR Code</h1>

      {!isAuthenticated ? (
        <button onClick={handleSignIn}>Sign in with Google</button>
      ) : (
        <button onClick={handleSignOut}>Sign out</button>
      )}

      {isAuthenticated && (
        <div>
          <input
            type="file"
            onChange={handleFileChange}
            multiple
            accept="image/*"
          />
          <button onClick={createFolder}>Upload Images to Google Drive</button>

          {folderUrl && (
            <div>
              <h3>Scan to get your pictures or</h3>
              <p>
                <a href={folderUrl} target="_blank" rel="noopener noreferrer">
                  Click here
                </a>
              </p>
              <QRCodeCanvas value={folderUrl} />
            </div>
          )}
        </div>
      )}
    </div>
  );
}

export default App;
