import React, { useState, useEffect, useRef } from 'react';
import { HashRouter as Router, Routes, Route, Link, useLocation, useNavigate } from 'react-router-dom';
import { BookOpen, Headphones, Download, Menu, X, FileText, CheckCircle, Sparkles, ListTodo, Search, ChevronDown, ChevronUp, Printer, ArrowRight } from 'lucide-react';
import ReactMarkdown from 'react-markdown';
import remarkGfm from 'remark-gfm';
import mermaid from 'mermaid';
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
  TISK: 'Tiskové verze (PDF/MD)',
  SHRNUTI: 'Bleskové shrnutí'
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
          <Link 
            to="/shrnuti" 
            className={`nav-link summary-nav-link ${location.pathname === '/shrnuti' ? 'active' : ''}`} 
            onClick={() => setMobileMenuOpen(false)}
            style={{ 
              border: '1px dashed rgba(99, 102, 241, 0.4)',
              background: location.pathname === '/shrnuti' ? 'var(--accent-primary)' : 'rgba(99, 102, 241, 0.05)',
              color: location.pathname === '/shrnuti' ? 'white' : 'var(--text-primary)'
            }}
          >
            <Sparkles size={20} style={{ color: location.pathname === '/shrnuti' ? 'white' : 'var(--accent-primary)' }} />
            Rychlé shrnutí
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
          <Route path="/okruh/:id/doc/:docId" element={<MarkdownViewer manifest={manifest} />} />
          <Route path="/tisk" element={<Downloads manifest={manifest} />} />
          <Route path="/tahak" element={<TahakViewer />} />
          <Route path="/shrnuti" element={<SummaryViewer />} />
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
      
      <div className="dashboard-grid">
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
        <Link to="/shrnuti" className="card glass-panel premium-card">
          <div className="card-icon premium-icon" style={{ background: 'rgba(99, 102, 241, 0.15)', color: 'var(--accent-primary)' }}>
            <Sparkles size={24} />
          </div>
          <div>
            <div className="card-title" style={{ display: 'flex', alignItems: 'center', gap: '8px', flexWrap: 'wrap' }}>
              Rychlé shrnutí
              <span className="badge-premium" style={{ fontSize: '0.75rem', padding: '2px 8px', borderRadius: 'var(--radius-full)', background: 'var(--accent-primary)', color: 'white', fontWeight: 'bold' }}>90 otázek</span>
            </div>
            <div className="card-desc">
              Všechny státnicové otázky přehledně v 4–5 klíčových bodech. Ideální pro bleskové opakování a tisk.
            </div>
          </div>
        </Link>
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
              const fileUrl = `./data/${id}/audio/${file}`;
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
                  <a href={`./data/${id}/docs/${file}`} download onClick={(e) => e.stopPropagation()} style={{ color: 'var(--text-secondary)', textDecoration: 'none' }}>Stáhnout (.md)</a>
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

mermaid.initialize({
  startOnLoad: false,
  theme: 'dark',
  securityLevel: 'loose',
});

function MermaidElement({ value }) {
  const [svg, setSvg] = useState('');
  const [error, setError] = useState(null);

  useEffect(() => {
    let active = true;
    const uniqueId = `mermaid-${Math.random().toString(36).substring(2, 9)}`;

    const renderDiagram = async () => {
      try {
        setError(null);
        const { svg: renderedSvg } = await mermaid.render(uniqueId, value);
        if (active) {
          setSvg(renderedSvg);
        }
      } catch (err) {
        console.error("Mermaid parsing error: ", err);
        const badElement = document.getElementById(uniqueId);
        if (badElement) badElement.remove();
        const bindElement = document.getElementById(`d${uniqueId}`);
        if (bindElement) bindElement.remove();
        
        if (active) {
          setError(err);
        }
      }
    };

    renderDiagram();

    return () => {
      active = false;
    };
  }, [value]);

  if (error) {
    return (
      <pre style={{ 
        color: '#ef4444', 
        background: 'rgba(239, 68, 68, 0.08)', 
        padding: '16px', 
        borderRadius: 'var(--radius-md)',
        border: '1px solid rgba(239, 68, 68, 0.2)',
        fontSize: '0.85rem',
        overflowX: 'auto',
        margin: '1.5em 0'
      }}>
        <code>{`[Mermaid Chyba] V diagramu je chyba: ${error.message || error}`}</code>
      </pre>
    );
  }

  if (!svg) {
    return (
      <div style={{ 
        display: 'flex', 
        justifyContent: 'center', 
        alignItems: 'center',
        padding: '30px', 
        color: 'var(--text-muted)',
        fontSize: '0.9rem' 
      }}>
        Generuji diagram...
      </div>
    );
  }

  return (
    <div 
      className="mermaid-diagram"
      dangerouslySetInnerHTML={{ __html: svg }} 
      style={{ 
        display: 'flex', 
        justifyContent: 'center', 
        margin: '2em 0', 
        background: 'rgba(255, 255, 255, 0.01)', 
        padding: '24px', 
        borderRadius: 'var(--radius-lg)',
        border: '1px solid var(--border-color)',
        overflowX: 'auto'
      }}
    />
  );
}

const getQuestionIdsFromText = (text) => {
  const ids = [];
  const regex = /(PES|ODIP|PSY)\s*(\d+)/gi;
  let match;
  while ((match = regex.exec(text)) !== null) {
    ids.push(`${match[1].toLowerCase()}-${match[2]}`);
  }
  return ids;
};

const markdownComponents = {
  pre({ children, ...props }) {
    if (children && React.isValidElement(children)) {
      const codeProps = children.props;
      if (codeProps && codeProps.className === 'language-mermaid') {
        const value = String(codeProps.children || '').replace(/\n$/, '');
        return <MermaidElement value={value} />;
      }
    }
    return <pre {...props}>{children}</pre>;
  },
  h3({ children, ...props }) {
    const text = React.Children.toArray(children)
      .map(c => {
        if (typeof c === 'string' || typeof c === 'number') return c;
        if (c && c.props && c.props.children) {
          if (typeof c.props.children === 'string') return c.props.children;
          if (Array.isArray(c.props.children)) return c.props.children.join('');
        }
        return '';
      })
      .join('');
    
    const questionIds = getQuestionIdsFromText(text);
    const slug = text
      .toLowerCase()
      .replace(/[^a-z0-9\s-–]/g, '')
      .trim()
      .replace(/[\s–-]+/g, '-');
      
    return (
      <h3 id={slug} {...props} style={{ position: 'relative' }}>
        {questionIds.map(qId => (
          <span 
            key={qId} 
            id={qId} 
            className="question-anchor"
            style={{ 
              position: 'absolute', 
              top: '-80px', 
              left: 0,
              width: 0,
              height: 0,
              visibility: 'hidden'
            }} 
          />
        ))}
        {children}
      </h3>
    );
  }
};

function MarkdownViewer({ manifest }) {
  const { pathname, hash } = useLocation();
  const parts = pathname.split('/');
  const docId = parts.pop();
  const id = parts[parts.length - 2];
  
  const [content, setContent] = useState('');

  useEffect(() => {
    fetch(`./data/${id}/docs/${docId}`)
      .then(res => res.text())
      .then(text => setContent(text))
      .catch(err => setContent('# Chyba při načítání souboru'));
  }, [id, docId]);

  useEffect(() => {
    if (hash && content) {
      const timer = setTimeout(() => {
        const targetId = decodeURIComponent(hash.replace('#', '')).toLowerCase();
        const element = document.getElementById(targetId);
        if (element) {
          element.scrollIntoView({ behavior: 'smooth', block: 'center' });
          
          let highlightTarget = element;
          if (element.classList.contains('question-anchor')) {
            highlightTarget = element.parentElement;
          }
          
          highlightTarget.classList.add('glowing-target');
          
          setTimeout(() => {
            highlightTarget.classList.remove('glowing-target');
          }, 3000);
        }
      }, 300);
      return () => clearTimeout(timer);
    }
  }, [hash, content]);

  // Calculate Next Chapter / Okruh link
  const docsList = manifest?.[id]?.docs || [];
  const currentIndex = docsList.indexOf(docId);
  let nextLink = null;
  let nextLabel = '';
  let nextSublabel = '';

  if (currentIndex !== -1 && currentIndex < docsList.length - 1) {
    const nextDocId = docsList[currentIndex + 1];
    nextLink = `/okruh/${id}/doc/${nextDocId}`;
    nextLabel = 'Další kapitola';
    nextSublabel = nextDocId.replace('.md', '').replace(/_/g, ' ');
  } else {
    // End of the current okruh reached
    let nextId = null;
    if (id === 'A') nextId = 'B';
    else if (id === 'B') nextId = 'C';

    if (nextId && manifest?.[nextId]?.docs?.length > 0) {
      const nextDocId = manifest[nextId].docs[0];
      nextLink = `/okruh/${nextId}/doc/${nextDocId}`;
      nextLabel = `Další okruh (${sections[nextId]?.split(' - ')?.[1] || sections[nextId]})`;
      nextSublabel = nextDocId.replace('.md', '').replace(/_/g, ' ');
    } else {
      // End of everything
      nextLink = '/';
      nextLabel = 'Dokončeno!';
      nextSublabel = 'Zpět na přehled všech okruhů';
    }
  }

  return (
    <div style={{ paddingBottom: '60px' }}>
      <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '24px' }} className="hide-on-print">
        <Link to={`/okruh/${id}`} style={{ color: 'var(--accent-primary)', textDecoration: 'none', fontWeight: '500' }}>
          ← Zpět na {sections[id]}
        </Link>
        <div style={{ display: 'flex', gap: '12px' }}>
          <a href={`./data/${id}/docs/${docId}`} download className="glass-panel" style={{ padding: '8px 16px', borderRadius: 'var(--radius-sm)', textDecoration: 'none', color: 'var(--text-secondary)', fontSize: '0.875rem' }}>
            Stáhnout (.md)
          </a>
          <button onClick={() => window.print()} className="glass-panel" style={{ padding: '8px 16px', borderRadius: 'var(--radius-sm)', border: '1px solid var(--accent-primary)', background: 'var(--accent-primary)', color: 'white', fontSize: '0.875rem', cursor: 'pointer' }}>
            Uložit jako PDF
          </button>
        </div>
      </div>
      
      <div className="markdown-container glass-panel printable-content">
        <ReactMarkdown remarkPlugins={[remarkGfm]} components={markdownComponents}>{content}</ReactMarkdown>
      </div>

      {nextLink && (
        <div className="next-chapter-container hide-on-print">
          <Link to={nextLink} className="next-chapter-btn glass-panel">
            <div className="next-chapter-content">
              <span className="next-chapter-tag">{nextLabel}</span>
              <span className="next-chapter-title">{nextSublabel}</span>
            </div>
            <div className="next-chapter-icon-wrapper">
              <ArrowRight className="arrow-icon" size={20} />
            </div>
          </Link>
        </div>
      )}
    </div>
  );
}

function SummaryViewer() {
  const [data, setData] = useState([]);
  const [filteredData, setFilteredData] = useState([]);
  const [categoryFilter, setCategoryFilter] = useState('ALL');
  const [searchQuery, setSearchQuery] = useState('');
  const [expandedCards, setExpandedCards] = useState({});
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    fetch('./data/summary.json')
      .then(res => res.json())
      .then(json => {
        setData(json);
        setFilteredData(json);
        setLoading(false);
      })
      .catch(err => {
        console.error("Error loading summary.json", err);
        setLoading(false);
      });
  }, []);

  useEffect(() => {
    let result = data;

    if (categoryFilter !== 'ALL') {
      result = result.filter(item => item.category === categoryFilter);
    }

    if (searchQuery.trim() !== '') {
      const q = searchQuery.toLowerCase().trim();
      result = result.filter(item => {
        const matchesId = item.id.toLowerCase().includes(q);
        const matchesTitle = item.title.toLowerCase().includes(q);
        const matchesBullets = item.bullets.some(b => b.toLowerCase().includes(q));
        return matchesId || matchesTitle || matchesBullets;
      });
    }

    setFilteredData(result);
  }, [categoryFilter, searchQuery, data]);

  const toggleCard = (id) => {
    setExpandedCards(prev => ({
      ...prev,
      [id]: !prev[id]
    }));
  };

  const expandAll = () => {
    const nextExpanded = {};
    filteredData.forEach(item => {
      nextExpanded[item.id] = true;
    });
    setExpandedCards(nextExpanded);
  };

  const collapseAll = () => {
    setExpandedCards({});
  };

  if (loading) {
    return (
      <div style={{ display: 'flex', height: '60vh', alignItems: 'center', justifyContent: 'center', color: 'white' }}>
        <div style={{ textAlign: 'center' }}>
          <Sparkles className="animate-spin" size={40} style={{ color: 'var(--accent-primary)', marginBottom: '16px' }} />
          <div>Načítám blesková shrnutí...</div>
        </div>
      </div>
    );
  }

  return (
    <div style={{ paddingBottom: '60px' }}>
      <div className="section-header hide-on-print">
        <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'flex-start', flexWrap: 'wrap', gap: '16px' }}>
          <div>
            <h1 className="section-title">Bleskové shrnutí státnic</h1>
            <p style={{ color: 'var(--text-secondary)' }}>
              Všech 90 otázek přehledně v 4–5 klíčových bodech. Ideální pro rychlé zopakování nebo tisk studijního taháku.
            </p>
          </div>
          <button 
            onClick={() => window.print()} 
            className="print-btn glass-panel"
            style={{ 
              display: 'flex', 
              alignItems: 'center', 
              gap: '8px', 
              padding: '10px 20px', 
              borderRadius: 'var(--radius-md)', 
              border: '1px solid var(--accent-primary)', 
              background: 'var(--accent-primary)', 
              color: 'white', 
              fontWeight: '600', 
              cursor: 'pointer',
              boxShadow: 'var(--shadow-glow)'
            }}
          >
            <Printer size={18} />
            Uložit PDF / Tisknout
          </button>
        </div>
      </div>

      {/* Printable Heading */}
      <div className="print-header" style={{ display: 'none' }}>
        <h1>Rychlý přehled státnicových otázek (Tahák)</h1>
        <p>Skripta IVP - celkem {filteredData.length} otázek</p>
      </div>

      {/* Search & Filters */}
      <div className="filters-container glass-panel hide-on-print" style={{ padding: '20px', marginBottom: '24px', display: 'flex', flexDirection: 'column', gap: '16px' }}>
        <div className="search-container" style={{ position: 'relative' }}>
          <Search className="search-icon" size={20} style={{ position: 'absolute', left: '16px', top: '50%', transform: 'translateY(-50%)', color: 'var(--text-muted)' }} />
          <input 
            type="text" 
            placeholder="Hledat v otázkách, tématech nebo bodech..." 
            value={searchQuery}
            onChange={(e) => setSearchQuery(e.target.value)}
            className="search-input"
            style={{ 
              width: '100%', 
              padding: '14px 16px 14px 48px', 
              borderRadius: 'var(--radius-md)', 
              background: 'rgba(255,255,255,0.03)', 
              border: '1px solid var(--border-color)', 
              color: 'white', 
              fontSize: '1rem',
              outline: 'none'
            }}
          />
        </div>

        <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', flexWrap: 'wrap', gap: '16px' }}>
          <div className="tabs" style={{ display: 'flex', gap: '8px' }}>
            {[
              { id: 'ALL', label: 'Všechny' },
              { id: 'A', label: 'A - Pedagogika' },
              { id: 'B', label: 'B - Oborová didaktika' },
              { id: 'C', label: 'C - Psychologie' }
            ].map(tab => (
              <button 
                key={tab.id}
                onClick={() => setCategoryFilter(tab.id)}
                className={`tab-btn ${categoryFilter === tab.id ? 'active' : ''}`}
                style={{ 
                  padding: '8px 16px', 
                  borderRadius: 'var(--radius-full)', 
                  border: '1px solid var(--border-color)', 
                  background: categoryFilter === tab.id ? 'var(--accent-primary)' : 'rgba(255,255,255,0.02)', 
                  color: categoryFilter === tab.id ? 'white' : 'var(--text-secondary)',
                  cursor: 'pointer',
                  fontWeight: '500',
                  boxShadow: categoryFilter === tab.id ? 'var(--shadow-glow)' : 'none'
                }}
              >
                {tab.label}
              </button>
            ))}
          </div>

          <div style={{ display: 'flex', gap: '12px', alignItems: 'center' }}>
            <span style={{ fontSize: '0.875rem', color: 'var(--text-muted)' }}>
              Nalezeno {filteredData.length} z {data.length} otázek
            </span>
            <button 
              onClick={expandAll} 
              className="action-btn-text"
              style={{ background: 'none', border: 'none', color: 'var(--accent-primary)', cursor: 'pointer', fontSize: '0.875rem', fontWeight: '600' }}
            >
              Rozbalit vše
            </button>
            <span style={{ color: 'var(--border-color)' }}>|</span>
            <button 
              onClick={collapseAll} 
              className="action-btn-text"
              style={{ background: 'none', border: 'none', color: 'var(--accent-primary)', cursor: 'pointer', fontSize: '0.875rem', fontWeight: '600' }}
            >
              Sbalit vše
            </button>
          </div>
        </div>
      </div>

      {/* Question Accordion List */}
      <div className="summary-list" style={{ display: 'flex', flexDirection: 'column', gap: '16px' }}>
        {filteredData.map(q => {
          const isOpen = !!expandedCards[q.id];
          const catName = q.category === 'A' ? 'Pedagogika' : q.category === 'B' ? 'Didaktika' : 'Psychologie';
          const catClass = `cat-${q.category.toLowerCase()}`;
          
          return (
            <div key={q.id} className="summary-card glass-panel">
              {/* Card Header */}
              <div 
                className="summary-header" 
                onClick={() => toggleCard(q.id)}
                style={{ 
                  padding: '20px', 
                  display: 'flex', 
                  alignItems: 'center', 
                  justifyContent: 'space-between', 
                  cursor: 'pointer', 
                  gap: '16px',
                  userSelect: 'none'
                }}
              >
                <div style={{ display: 'flex', alignItems: 'center', gap: '16px', flex: 1 }}>
                  <span className={`category-tag ${catClass}`} style={{ 
                    padding: '4px 10px', 
                    borderRadius: 'var(--radius-sm)', 
                    fontSize: '0.85rem', 
                    fontWeight: 'bold',
                    whiteSpace: 'nowrap'
                  }}>
                    {q.id}
                  </span>
                  <span className="summary-title" style={{ fontWeight: '600', fontSize: '1.05rem', color: 'var(--text-primary)' }}>
                    {q.title}
                  </span>
                </div>
                <div className="chevron-icon hide-on-print" style={{ color: 'var(--text-muted)' }}>
                  {isOpen ? <ChevronUp size={20} /> : <ChevronDown size={20} />}
                </div>
              </div>

              {/* Card Content */}
              <div 
                className={`summary-content ${isOpen ? 'open' : ''}`}
                style={{ 
                  maxHeight: isOpen ? '2000px' : '0', 
                  overflow: 'hidden', 
                  transition: 'max-height 0.4s cubic-bezier(0.4, 0, 0.2, 1), padding 0.3s ease',
                  padding: isOpen ? '0 20px 20px 20px' : '0 20px',
                  borderTop: isOpen ? '1px solid var(--border-color)' : 'none'
                }}
              >
                <div style={{ paddingTop: '16px' }}>
                  <ul className="summary-bullets" style={{ paddingLeft: '20px', marginBottom: '20px', color: 'var(--text-secondary)' }}>
                    {q.bullets.map((bullet, idx) => (
                      <li key={idx} style={{ marginBottom: '10px', fontSize: '0.975rem', lineHeight: '1.5' }}>
                        <span dangerouslySetInnerHTML={{ __html: bullet.replace(/\*\*(.*?)\*\*/g, '<strong>$1</strong>') }} />
                      </li>
                    ))}
                  </ul>

                  <div style={{ display: 'flex', justifyContent: 'flex-end', marginTop: '16px' }} className="hide-on-print">
                    <Link 
                      to={`/okruh/${q.category}/doc/${q.sourceFile}#${q.id.toLowerCase().replace(' ', '-')}`}
                      className="detail-link"
                      style={{ 
                        display: 'flex', 
                        alignItems: 'center', 
                        gap: '6px', 
                        color: 'var(--accent-primary)', 
                        textDecoration: 'none', 
                        fontSize: '0.875rem', 
                        fontWeight: '600',
                        transition: 'var(--transition)'
                      }}
                    >
                      Přejít na detail v materiálech <ArrowRight size={16} />
                    </Link>
                  </div>
                </div>
              </div>
            </div>
          );
        })}
        {filteredData.length === 0 && (
          <div className="glass-panel" style={{ padding: '40px', textAlign: 'center', color: 'var(--text-muted)' }}>
            Žádné otázky neodpovídají zadanému filtru nebo vyhledávání.
          </div>
        )}
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
          <a key={file} href={`./data/TISK/${file}`} download className="file-item glass-panel">
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

function TahakViewer() {
  const [content, setContent] = useState('');

  useEffect(() => {
    fetch('./data/BP_NAVIGACE_KOMISE.md')
      .then(res => res.text())
      .then(text => setContent(text))
      .catch(err => setContent('# Chyba při načítání taháku'));
  }, []);

  return (
    <div style={{ paddingBottom: '40px' }}>
      <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '24px' }} className="hide-on-print">
        <Link to="/" style={{ color: 'var(--accent-primary)', textDecoration: 'none', fontWeight: '500' }}>
          ← Zpět na hlavní stranu
        </Link>
        <div style={{ display: 'flex', gap: '12px' }}>
          <button onClick={() => window.print()} className="glass-panel" style={{ padding: '8px 16px', borderRadius: 'var(--radius-sm)', border: '1px solid var(--accent-primary)', background: 'var(--accent-primary)', color: 'white', fontSize: '0.875rem', cursor: 'pointer' }}>
            Vytisknout / Uložit PDF
          </button>
        </div>
      </div>
      <div className="markdown-container glass-panel printable-content">
        <ReactMarkdown remarkPlugins={[remarkGfm]} components={markdownComponents}>{content}</ReactMarkdown>
      </div>
    </div>
  );
}

export default function App() {
  const [manifest, setManifest] = useState(null);

  useEffect(() => {
    fetch('./data/manifest.json')
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
