import logo from "./logo.svg";
import "./App.css";
import { useEffect, useState, useRef } from "react";
import { redirectToAuthCodeFlow, getAccessToken } from "./authPKCE";

function App() {
  const [profile, setProfile] = useState(undefined);
  const [playlists, setPlaylists] = useState([]);
  const renderAfterCalled = useRef(false); // Only needed for dev as the page will only render once it is built

  const { REACT_APP_SPOTIFY_CLIENT_ID } = process.env;
  const clientId = REACT_APP_SPOTIFY_CLIENT_ID;
  useEffect(() => {
    const getStatus = async () => {
      const params = new URLSearchParams(window.location.search);
      const code = params.get("code");
      const err = params.get("error");

      if ((localStorage.getItem("verifier") != null) & !err) {
        // Obtain a new access code if 1) there is none yet or 2) if it expired
        if (
          !localStorage.getItem("spotify_access_token") ||
          compareTimeStamps(
            localStorage.getItem("spotify_access_token_created"),
            Date.now()
          )
        ) {
          const accessToken = await getAccessToken(clientId, code);
          console.log("generate and saved new access token");
          console.log(accessToken);
        }

        // Retrieve profile and playlists
        const profile = await fetchProfile(
          localStorage.getItem("spotify_access_token")
        );
        setProfile(profile);
        getPlaylists();
      }
    };

    const getPlaylists = async () => {
      var downloading = true;
      var offset = 0;
      var playlistsSaved = [];
      while (downloading) {
        const playlistsDownload = await fetchPlaylists(
          localStorage.getItem("spotify_access_token"),
          offset
        );
        playlistsDownload.items.map((p) => playlistsSaved.push(p));
        if (playlistsDownload.items.length === 20) {
          offset = offset + 20;
        } else {
          console.log(playlistsSaved);
          setPlaylists(playlistsSaved);
          downloading = false;
        }
      }
    };

    if (!renderAfterCalled.current) {
      getStatus().catch(console.error);
    }
    renderAfterCalled.current = true;
  });

  // Check if the token needs to be refreshed
  const compareTimeStamps = (a, b) => {
    const timeDifference = Math.abs(a - b);
    const oneHourInMilliseconds = 60 * 60 * 1000;
    console.log("age of token in min:");
    console.log(timeDifference / 60000);
    const expired = timeDifference > oneHourInMilliseconds;
    return expired;
  };

  async function fetchProfile(code) {
    const result = await fetch("https://api.spotify.com/v1/me", {
      method: "GET",
      headers: { Authorization: `Bearer ${code}` },
    });

    return await result.json();
  }

  async function fetchPlaylists(code, offset) {
    const result = await fetch(
      "https://api.spotify.com/v1/users/smedjan/playlists?offset=" + offset,
      {
        method: "GET",
        headers: { Authorization: `Bearer ${code}` },
      }
    );

    return await result.json();
  }

  return (
    <div className="App">
      {profile ? (
        <h1>{profile.display_name}'s playlists</h1>
      ) : (
        <div
          style={{
            height: 400,
            justifyContent: "center",
            alignItems: "center",
            display: "flex",
          }}
        >
          <button
            onClick={() => {
              redirectToAuthCodeFlow(clientId);
            }}
          >
            Log in to Spotify
          </button>
        </div>
      )}

      {profile ? (
        <button
          onClick={() => {
            localStorage.removeItem("spotify_access_token");
            localStorage.removeItem("verifier");
            localStorage.removeItem("spotify_access_token_created");
            window.location.reload();
          }}
        >
          Log out
        </button>
      ) : (
        <></>
      )}
      {playlists.map((pl) => {
        return <h3 key={pl.id}>{pl.name}</h3>;
      })}
    </div>
  );
}

export default App;
