import React, { useState } from "react";
import "./app.css";
import i18n from "./i18n";

export default function App() {
  const [lang, setLang] = useState("cs");
  const [soundOn, setSoundOn] = useState(true);
  const [voiceOn, setVoiceOn] = useState(true);
  const [players, setPlayers] = useState(["Hráč 1"]);
  const [gameStarted, setGameStarted] = useState(false);
  const [mode, setMode] = useState("501");
  const [outMode, setOutMode] = useState("double");
  const [order, setOrder] = useState("fixed");
  const [robot, setRobot] = useState(false);

  const t = (lang, key) => i18n[lang]?.[key] || key;

  const addPlayer = () => {
    const newPlayer = `${t(lang, "player")} ${players.length + 1}`;
    setPlayers([...players, newPlayer]);
  };

  const removePlayer = (index) => {
    setPlayers(players.filter((_, i) => i !== index));
  };

  const toggleOrder = () => {
    setOrder(order === "fixed" ? "random" : "fixed");
  };

  const startGame = () => {
    setGameStarted(true);
  };

  const endGame = () => {
    setGameStarted(false);
  };

  return (
    <div className="container">
      {/* ======= HLAVIČKA ======= */}
      <div className="header">
        <div className="left logo">
          <div className="dart"></div>
          <span>DartScore Pro</span>
        </div>
        <div className="controls">
          <button
            className={`iconBtn ${!soundOn ? "muted" : ""}`}
            onClick={() => setSoundOn((v) => !v)}
            aria-label={t(lang, "sound")}
          >
            <svg
              xmlns="http://www.w3.org/2000/svg"
              className="icon"
              viewBox="0 0 24 24"
            >
              <path d="M5 9v6h4l5 5V4l-5 5H5z" />
            </svg>
          </button>

          <button
            className={`iconBtn ${!voiceOn ? "muted" : ""}`}
            onClick={() => setVoiceOn((v) => !v)}
            aria-label={t(lang, "voice")}
          >
            <span className="iconHead" aria-hidden="true"></span>
          </button>

          <select
            value={lang}
            onChange={(e) => setLang(e.target.value)}
            className="input"
          >
            <option value="cs">Čeština</option>
            <option value="en">English</option>
            <option value="de">Deutsch</option>
            <option value="fr">Français</option>
            <option value="pl">Polski</option>
          </select>
        </div>
      </div>

      {/* ======= LOBBY ======= */}
      {!gameStarted ? (
        <div className="lobbyWrap">
          <div className="lobbyCard">
            <div className="lobbyControls">
              <span>{t(lang, "mode")}:</span>
              {["101", "301", "501", "701", "901"].map((m) => (
                <div
                  key={m}
                  className={`tab ${mode === m ? "active" : ""}`}
                  onClick={() => setMode(m)}
                >
                  {m}
                </div>
              ))}
            </div>

            <div className="lobbyControls">
              <span>{t(lang, "outMode")}:</span>
              {["single", "double", "triple", "master"].map((m) => (
                <div
                  key={m}
                  className={`tab ${outMode === m ? "active" : ""}`}
                  onClick={() => setOutMode(m)}
                >
                  {m.charAt(0).toUpperCase() + m.slice(1)}-Out
                </div>
              ))}
            </div>

            <div className="lobbyControls">
              <span>{t(lang, "order")}:</span>
              <div
                className={`tab ${order === "fixed" ? "active" : ""}`}
                onClick={() => setOrder("fixed")}
              >
                {t(lang, "fixed")}
              </div>
              <div
                className={`tab ${order === "random" ? "active" : ""}`}
                onClick={() => setOrder("random")}
              >
                {t(lang, "random")}
              </div>
            </div>

            <div className="lobbyControls">
              <span>{t(lang, "robot")}:</span>
              <div
                className={`tab ${robot ? "active" : ""}`}
                onClick={() => setRobot((v) => !v)}
              >
                {robot ? t(lang, "on") : t(lang, "off")}
              </div>
            </div>

            <div className="lobbyControls">
              <button className="btn green" onClick={startGame}>
                {t(lang, "start")}
              </button>
            </div>

            <div className="lobbyControls">
              <button className="btn red" onClick={endGame}>
                {t(lang, "end")}
              </button>
            </div>

            <div className="lobbyControls">
              <span>{t(lang, "players")}:</span>
              {players.map((p, i) => (
                <div key={i} className="playerRow">
                  <div className="playerName">
                    <input
                      type="text"
                      value={p}
                      onChange={(e) => {
                        const newPlayers = [...players];
                        newPlayers[i] = e.target.value;
                        setPlayers(newPlayers);
                      }}
                      className="input"
                    />
                  </div>
                  <div className="playerActions">
                    <div className="tab">301</div>
                  </div>
                  <div className="playerDelete">
                    <button
                      className="trash"
                      onClick={() => removePlayer(i)}
                      title={t(lang, "delete")}
                    >
                      🗑
                    </button>
                  </div>
                </div>
              ))}
              <button className="btn" onClick={addPlayer}>
                + {t(lang, "addPlayer")}
              </button>
            </div>
          </div>
        </div>
      ) : (
        <div className="lobbyWrap">
          <h2>{t(lang, "gameInProgress")}</h2>
          <button className="btn red" onClick={endGame}>
            {t(lang, "back")}
          </button>
        </div>
      )}
    </div>
  );
}
