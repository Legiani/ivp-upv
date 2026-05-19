import React, { useState, useEffect, useRef } from 'react';
import { HashRouter as Router, Routes, Route, Link, useLocation, useNavigate } from 'react-router-dom';
import { BookOpen, Headphones, Download, Menu, X, FileText, CheckCircle } from 'lucide-react';
import ReactMarkdown from 'react-markdown';
import './App.css';

const getSavedProgress = () => {
  try {
    const saved = localStorage.getItem('ivp_audio_progress');
    return saved ? JSON.parse(saved) : {};
  } catch (e) {
    return {};
  }
};

const saveProgressToLocal = (url, currentTime, duration) => {
  try {
    const saved = getSavedProgress();
    const completed = duration > 0 && (currentTime / duration) > 0.95; // 95% = posloucháno do konce
    saved[url] = { currentTime, duration, completed };
    localStorage.setItem('ivp_audio_progress', JSON.stringify(saved));
    return saved;
  } catch (e) {
    return {};
  }
};

const sections = {
  A: 'A - Pedagogika',
  B: 'B - Oborová didaktika',
  C: 'C - Psychologie',
  TISK: 'Tiskové verze (PDF/MD)'
};

function Layout({ manifest }) {
  const [mobileMenuOpen, setMobileMenuOpen] = useState(false);
  const location = useLocation();

  const toggleMenu = () => setMobileMenuOpen(!mobileMenuOpen);

  return (
    <div className="app-container">
      <button className="mobile-nav-toggle" onClick={toggleMenu}>
        {mobileMenuOpen ? <X size={24} /> : <Menu size={24} />}
      </button>

      <aside className={`sidebar ${mobileMenuOpen ? 'open' : ''}`}>
        <Link to="/" className="brand" onClick={() => setMobileMenuOpen(false)}>
          <BookOpen className="brand-icon" size={28} />
          <span>Skripta IVP</span>
        </Link>
        
        <nav className="nav-section">
          <div className="nav-label">Okruhy ke státnicím</div>
          <Link to="/okruh/A" className={`nav-link ${location.pathname === '/okruh/A' ? 'active' : ''}`} onClick={() => setMobileMenuOpen(false)}>
            <Headphones size={20} />
            Pedagogika
          </Link>
          <Link to="/okruh/B" className={`nav-link ${location.pathname === '/okruh/B' ? 'active' : ''}`} onClick={() => setMobileMenuOpen(false)}>
            <Headphones size={20} />
            Oborová didaktika
          </Link>
          <Link to="/okruh/C" className={`nav-link ${location.pathname === '/okruh/C' ? 'active' : ''}`} onClick={() => setMobileMenuOpen(false)}>
            <Headphones size={20} />
            Psychologie
          </Link>
        </nav>

        <nav className="nav-section" style={{ marginTop: 'auto' }}>
          <div className="nav-label">Materiály</div>
          <Link to="/tisk" className={`nav-link ${location.pathname === '/tisk' ? 'active' : ''}`} onClick={() => setMobileMenuOpen(false)}>
            <Download size={20} />
            Tiskové verze
          </Link>
        </nav>
      </aside>

      <main className="main-content">
        <Routes>
          <Route path="/" element={<Dashboard manifest={manifest} />} />
          <Route path="/okruh/:id" element={<Okruh manifest={manifest} />} />
          <Route path="/okruh/:id/doc/:docId" element={<MarkdownViewer />} />
          <Route path="/tisk" element={<Downloads manifest={manifest} />} />
        </Routes>
      </main>
    </div>
  );
}

function Dashboard({ manifest }) {
  return (
    <div>
      <div className="section-header">
        <h1 className="section-title">Vítej ve svých skriptech</h1>
        <p style={{ color: 'var(--text-secondary)' }}>
          Připrav se na státnice efektivně. Vyber si okruh, přečti si poznámky a poslouchej vygenerované podcasty.
        </p>
      </div>
      
      <div className="grid grid-cols-3">
        {['A', 'B', 'C'].map(id => (
          <Link key={id} to={`/okruh/${id}`} className="card glass-panel">
            <div className="card-icon">
              <Headphones size={24} />
            </div>
            <div>
              <div className="card-title">{sections[id]}</div>
              <div className="card-desc">
                {manifest[id]?.docs?.length || 0} témat • {manifest[id]?.audio?.length || 0} podcastů
              </div>
            </div>
          </Link>
        ))}
      </div>
    </div>
  );
}

function Okruh({ manifest }) {
  const { pathname } = useLocation();
  const navigate = useNavigate();
  const id = pathname.split('/').pop();
  const section = manifest[id];
  const [progressData, setProgressData] = useState(() => getSavedProgress());
  const [currentAudio, setCurrentAudio] = useState(null);
  const audioRef = useRef(null);
  const lastSavedTime = useRef(0);

  const handleSpeedChange = (e) => {
    const speed = parseFloat(e.target.value);
    if (audioRef.current) {
      audioRef.current.playbackRate = speed;
    }
  };

  const handleTimeUpdate = () => {
    if (audioRef.current && currentAudio) {
      const ct = audioRef.current.currentTime;
      const dur = audioRef.current.duration;
      
      // Ukládáme každých 5 sekund, abychom nezatěžovali React zbytečnými rendery každou ms
      if (Math.abs(ct - lastSavedTime.current) > 5 || ct === dur) {
        lastSavedTime.current = ct;
        const newProg = saveProgressToLocal(currentAudio, ct, dur);
        setProgressData(newProg);
      }
    }
  };

  const handleLoadedMetadata = () => {
    if (audioRef.current && currentAudio) {
      const saved = progressData[currentAudio];
      // Pokud už bylo puštěno a nedohrálo úplně do konce (necháme 5 sekund rezervu), skočíme tam
      if (saved && saved.currentTime && saved.currentTime < audioRef.current.duration - 5) {
        audioRef.current.currentTime = saved.currentTime;
      }
      lastSavedTime.current = audioRef.current.currentTime;
    }
  };

  if (!section) return <div>Načítám...</div>;

  return (
    <div style={{ paddingBottom: '100px' }}>
      <div className="section-header">
        <h1 className="section-title">{sections[id]}</h1>
        <p style={{ color: 'var(--text-secondary)' }}>Studijní texty a vygenerované podcasty pro tento okruh.</p>
      </div>

      <div className="grid grid-cols-3" style={{ gridTemplateColumns: '1fr 1fr', gap: '40px' }}>
        <div>
          <h2 style={{ fontSize: '1.25rem', marginBottom: '16px', color: 'var(--text-primary)' }}>Podcasty (Epizody)</h2>
          <div className="file-list">
            {section.audio.map(file => {
              const fileUrl = `/data/${id}/audio/${file}`;
              const prog = progressData[fileUrl];
              const isCompleted = prog?.completed;
              const progressPercent = prog && prog.duration ? (prog.currentTime / prog.duration) * 100 : 0;

              return (
                <div key={file} className="file-item glass-panel" style={{ cursor: 'pointer', position: 'relative', overflow: 'hidden' }} onClick={() => setCurrentAudio(fileUrl)}>
                  {progressPercent > 0 && (
                    <div style={{ position: 'absolute', bottom: 0, left: 0, height: '3px', background: isCompleted ? '#10b981' : 'var(--accent-primary)', width: `${progressPercent}%`, transition: 'width 1s' }} />
                  )}
                  <div className="file-info">
                    <Headphones className="file-icon" size={20} />
                    <span className="file-name">{file.replace('.m4a', '').replace(/_/g, ' ')}</span>
                    {isCompleted && <CheckCircle size={16} color="#10b981" style={{ marginLeft: '8px', minWidth: '16px' }} />}
                  </div>
                  <div className="file-action" style={{ display: 'flex', gap: '16px' }}>
                    <span style={{ color: 'var(--accent-primary)' }}>Přehrát</span>
                    <a href={fileUrl} download onClick={(e) => e.stopPropagation()} style={{ color: 'var(--text-secondary)', textDecoration: 'none' }}>Stáhnout</a>
                  </div>
                </div>
              );
            })}
            {section.audio.length === 0 && <p style={{ color: 'var(--text-muted)' }}>Zatím žádné podcasty.</p>}
          </div>
        </div>

        <div>
          <h2 style={{ fontSize: '1.25rem', marginBottom: '16px', color: 'var(--text-primary)' }}>Studijní texty (Kapitoly)</h2>
          <div className="file-list">
            {section.docs.map(file => (
              <div key={file} onClick={() => navigate(`/okruh/${id}/doc/${file}`)} className="file-item glass-panel" style={{ cursor: 'pointer' }}>
                <div className="file-info">
                  <FileText className="file-icon" size={20} />
                  <span className="file-name">{file.replace('.md', '').replace(/_/g, ' ')}</span>
                </div>
                <div className="file-action" style={{ display: 'flex', gap: '16px' }}>
                  <span style={{ color: 'var(--accent-primary)' }}>Číst</span>
                  <a href={`/data/${id}/docs/${file}`} download onClick={(e) => e.stopPropagation()} style={{ color: 'var(--text-secondary)', textDecoration: 'none' }}>Stáhnout (.md)</a>
                </div>
              </div>
            ))}
            {section.docs.length === 0 && <p style={{ color: 'var(--text-muted)' }}>Zatím žádné texty.</p>}
          </div>
        </div>
      </div>

      {currentAudio && (
        <div className="audio-player-wrapper glass-panel">
          <div className="now-playing">
            <div className="now-playing-label">Nyní hraje</div>
            <div className="now-playing-title" title={currentAudio.split('/').pop()}>{currentAudio.split('/').pop().replace('.m4a', '').replace(/_/g, ' ')}</div>
          </div>
          <audio 
            ref={audioRef} 
            className="custom-audio" 
            controls 
            autoPlay 
            src={currentAudio}
            onTimeUpdate={handleTimeUpdate}
            onLoadedMetadata={handleLoadedMetadata}
            onEnded={() => {
              if (audioRef.current) {
                const newProg = saveProgressToLocal(currentAudio, audioRef.current.duration, audioRef.current.duration);
                setProgressData(newProg);
              }
            }}
          >
            Váš prohlížeč nepodporuje přehrávání audia.
          </audio>
          <div style={{ display: 'flex', alignItems: 'center', gap: '8px', minWidth: '120px' }}>
            <label style={{ fontSize: '0.875rem', color: 'var(--text-secondary)' }}>Rychlost:</label>
            <select 
              onChange={handleSpeedChange} 
              defaultValue={1}
              className="glass-panel"
              style={{ 
                padding: '4px 8px', 
                color: 'var(--text-primary)', 
                border: '1px solid var(--border-color)', 
                borderRadius: 'var(--radius-sm)',
                outline: 'none',
                cursor: 'pointer'
              }}
            >
              <option value="0.75" style={{ color: 'black' }}>0.75x</option>
              <option value="1" style={{ color: 'black' }}>1x</option>
              <option value="1.25" style={{ color: 'black' }}>1.25x</option>
              <option value="1.5" style={{ color: 'black' }}>1.5x</option>
              <option value="1.75" style={{ color: 'black' }}>1.75x</option>
              <option value="2" style={{ color: 'black' }}>2x</option>
            </select>
          </div>
        </div>
      )}
    </div>
  );
}

function MarkdownViewer() {
  const { pathname } = useLocation();
  const parts = pathname.split('/');
  const docId = parts.pop();
  const id = parts[parts.length - 2];
  
  const [content, setContent] = useState('');

  useEffect(() => {
    fetch(`/data/${id}/docs/${docId}`)
      .then(res => res.text())
      .then(text => setContent(text))
      .catch(err => setContent('# Chyba při načítání souboru'));
  }, [id, docId]);

  return (
    <div style={{ paddingBottom: '40px' }}>
      <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '24px' }} className="hide-on-print">
        <Link to={`/okruh/${id}`} style={{ color: 'var(--accent-primary)', textDecoration: 'none', fontWeight: '500' }}>
          ← Zpět na {sections[id]}
        </Link>
        <div style={{ display: 'flex', gap: '12px' }}>
          <a href={`/data/${id}/docs/${docId}`} download className="glass-panel" style={{ padding: '8px 16px', borderRadius: 'var(--radius-sm)', textDecoration: 'none', color: 'var(--text-secondary)', fontSize: '0.875rem' }}>
            Stáhnout (.md)
          </a>
          <button onClick={() => window.print()} className="glass-panel" style={{ padding: '8px 16px', borderRadius: 'var(--radius-sm)', border: '1px solid var(--accent-primary)', background: 'var(--accent-primary)', color: 'white', fontSize: '0.875rem', cursor: 'pointer' }}>
            Uložit jako PDF
          </button>
        </div>
      </div>
      <div className="markdown-container glass-panel printable-content">
        <ReactMarkdown>{content}</ReactMarkdown>
      </div>
    </div>
  );
}

function Downloads({ manifest }) {
  const tiskFiles = manifest.TISK || [];
  
  return (
    <div>
      <div className="section-header">
        <h1 className="section-title">Verze pro tisk</h1>
        <p style={{ color: 'var(--text-secondary)' }}>Stáhni si sloučené soubory TISK.md pro tisk, nebo pro export do PDF.</p>
      </div>
      
      <div className="file-list" style={{ maxWidth: '600px' }}>
        {tiskFiles.map(file => (
          <a key={file} href={`/data/TISK/${file}`} download className="file-item glass-panel">
            <div className="file-info">
              <Download className="file-icon" size={20} />
              <span className="file-name">{file}</span>
            </div>
          </a>
        ))}
        {tiskFiles.length === 0 && <p style={{ color: 'var(--text-muted)' }}>Žádné soubory k tisku.</p>}
      </div>
    </div>
  );
}

export default function App() {
  const [manifest, setManifest] = useState(null);

  useEffect(() => {
    fetch('/data/manifest.json')
      .then(r => r.json())
      .then(d => setManifest(d))
      .catch(e => console.error("Could not load manifest", e));
  }, []);

  if (!manifest) {
    return <div style={{ display: 'flex', height: '100vh', alignItems: 'center', justifyContent: 'center', color: 'white' }}>Načítám data...</div>;
  }

  return (
    <Router>
      <Layout manifest={manifest} />
    </Router>
  );
}
