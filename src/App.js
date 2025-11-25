import React, { useState, useEffect, useRef } from 'react';
import { Settings, Plus, Upload, Clock, Cloud, Edit, Save, X } from 'lucide-react';

import { 
  db, 
  auth, 
  signInAnonymously, 
  signInWithCustomToken,
  onAuthStateChanged,
  doc,
  setDoc,
  addDoc,
  updateDoc,
  deleteDoc,
  collection,
  onSnapshot
} from "./firebase";


// Default chibi animations (represented as pixel art style emoji combos for now)
const defaultAnimations = {
  sleep: ['😴', '💤'],
  work: ['💼', '⌨️'],
  walk: ['🚶', '🚶‍♂️'],
  unknown: ['❓', '🤔']
};

const getDefaultEmoji = (animation) => {
  return (defaultAnimations[animation] || defaultAnimations.unknown)[0];
};

const getSidebarIcon = (person) => {
    const { animation, customAnimations } = person;

    // If this animation exists in customAnimations and has at least one frame
    if (customAnimations?.[animation]?.length > 0) {
      return (
        <img
          src={customAnimations[animation][0]}
          alt={animation}
          className="w-8 h-8 object-contain"
        />
      );
    }

    // Otherwise fallback to default emoji
    return <span className="text-2xl">{getDefaultEmoji(animation)}</span>;
  };

// --- ProfileView Component (Extracted) ---
const ProfileView = ({ 
  selectedPerson, 
  setView, 
  people, 
  setPeople, 
  setSelectedPerson,
  renderChibi,
  getTimeForTimezone,
  getWeather,
  db // New prop
}) => {
  const [isEditMode, setIsEditMode] = useState(false);
  const [editedPerson, setEditedPerson] = useState(null);
  
  // 1. ADD REF for the hidden file input
  const fileInputRef = useRef(null);

  useEffect(() => {
    // Initialize editedPerson when selectedPerson changes
    if (selectedPerson) {
      setEditedPerson(selectedPerson);
    }
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [selectedPerson]); 
  
  const person = selectedPerson;

  const handleEditClick = () => {
    setEditedPerson(person ? {...person} : null); 
    setIsEditMode(true);
  };

  // --- UPDATED: Save to Firestore ---
const handleSave = async () => {
  if (!editedPerson || !db) return;
  try {
    const docRef = doc(db, 'people', String(editedPerson.id));
    await setDoc(docRef, {
      ...editedPerson,
      customAnimations: editedPerson.customAnimations || {},
      animation: editedPerson.animation
    }, { merge: true });
    // Update local state
    setPeople(prev => prev.map(p => p.id === editedPerson.id ? editedPerson : p));
    setSelectedPerson(editedPerson);
    setIsEditMode(false);
  } catch (error) {
    console.error("Error updating document: ", error);
  }
};

  const handleCancel = () => {
    setEditedPerson(null);
    setIsEditMode(false);
  };

  const handleFieldChange = (field, value) => {
    setEditedPerson(prev => ({...prev, [field]: value}));
  };
  
  const handleAnimationUpload = (event) => {
    const files = Array.from(event.target.files);
    if (files.length === 0) return;

    const newCustomAnimations = { ...editedPerson.customAnimations };
    let presetIndex = Object.keys(newCustomAnimations).length + 1; // preset1, preset2, etc.

    files.forEach((file) => {
      const reader = new FileReader();
      reader.onload = (e) => {
        const url = e.target.result; // base64 data URL
        const presetName = `preset${presetIndex++}`;
        newCustomAnimations[presetName] = [...(newCustomAnimations[presetName] || []), url];

        handleFieldChange('customAnimations', newCustomAnimations);

        handleFieldChange('animation', presetName);
      };
      reader.readAsDataURL(file);
    });

    event.target.value = null;
  };

  



  const displayPerson = isEditMode ? editedPerson : person;
  // NOTE: Assuming 'Mom' is the current user for editing purposes
  const isOwnProfile = true; 
  
  const timezoneOptions = [
    { value: 'America/New_York', label: '🗽 Eastern (NY)' },
    { value: 'Asia/Kolkata', label: '🇮🇳 India (Kolkata)' },
    { value: 'America/Chicago', label: '🌆 Central (Chicago)' },
    { value: 'America/Denver', label: '⛰️ Mountain (Denver)' },
    { value: 'America/Los_Angeles', label: '🌴 Pacific (LA)' },
    { value: 'Europe/London', label: '🇬🇧 London' },
    { value: 'Europe/Paris', label: '🇫🇷 Paris' },
    { value: 'Asia/Tokyo', label: '🇯🇵 Tokyo' },
    { value: 'Asia/Shanghai', label: '🇨🇳 Shanghai' },
    { value: 'Australia/Sydney', label: '🇦🇺 Sydney' },
  ];

  return (
    <div className="w-full h-full bg-gradient-to-b from-purple-200 to-pink-200 flex flex-col items-center justify-center p-4">
      <button 
        onClick={() => {
          setView('home');
          setIsEditMode(false);
          setEditedPerson(null);
        }}
        className="absolute top-4 left-4 bg-white px-4 py-2 rounded-full shadow-md hover:bg-gray-100 z-10"
      >
        ← Back
      </button>

      <div className="bg-white rounded-2xl shadow-2xl p-8 max-w-md w-full relative">
        {/* Edit button */}
        {isOwnProfile && !isEditMode ? (
          <button
            onClick={handleEditClick}
            className="absolute top-4 right-4 p-2 bg-purple-100 hover:bg-purple-200 rounded-full transition-colors"
          >
            <Edit size={20} className="text-purple-600" />
          </button>
        ) : isOwnProfile && isEditMode && (
          <div className="absolute top-4 right-4 flex gap-2">
            <button
              onClick={handleSave}
              className="p-2 bg-green-100 hover:bg-green-200 rounded-full transition-colors"
            >
              <Save size={20} className="text-green-600" />
            </button>
            <button
              onClick={handleCancel}
              className="p-2 bg-red-100 hover:bg-red-200 rounded-full transition-colors"
            >
              <X size={20} className="text-red-600" />
            </button>
          </div>
        )}

        {/* Chibi display */}
        <div className="flex justify-center mb-6 mt-8">
          <div className="relative">
            <div className="text-8xl">
              {renderChibi(displayPerson)}
            </div>
          </div>
        </div>

        {/* Info */}
        <div className="text-center space-y-3">
          {isEditMode ? (
            <>
              <input
                type="text"
                placeholder="Name..."
                value={editedPerson?.name || ''}
                onChange={(e) => handleFieldChange('name', e.target.value)}
                className="text-2xl font-bold text-purple-600 text-center w-full border-2 border-purple-300 rounded-lg px-3 py-2 focus:outline-none focus:border-purple-500"
              />
              
              <input
                type="text"
                placeholder="Nickname (optional)..."
                value={editedPerson?.nickname || ''}
                onChange={(e) => handleFieldChange('nickname', e.target.value)}
                className="text-sm text-gray-400 text-center w-full border-2 border-gray-300 rounded-lg px-3 py-2 focus:outline-none focus:border-gray-500"
              />
            </>
          ) : (
            <>
              <h2 className="text-2xl font-bold text-purple-600">
                {displayPerson.nickname || displayPerson.name}
              </h2>
              {displayPerson.nickname && (
                <p className="text-sm text-gray-400">{displayPerson.name}</p>
              )}
            </>
          )}
          
          <div className="bg-purple-100 rounded-lg p-3 mt-4">
            {isEditMode ? (
              <input
                type="text"
                placeholder="What are they doing?"
                value={editedPerson?.customStatus || ''}
                onChange={(e) => handleFieldChange('customStatus', e.target.value)}
                className="text-lg font-semibold w-full bg-white rounded px-3 py-2 focus:outline-none focus:ring-2 focus:ring-purple-400"
              />
            ) : (
              <p className="text-lg font-semibold">
                {displayPerson.customStatus || displayPerson.currentActivity}
              </p>
            )}
          </div>

          <div className="flex justify-around mt-6 text-sm text-gray-600">
            <div className="flex items-center gap-1">
              <Clock size={16} />
              <span>{getTimeForTimezone(displayPerson.timezone)}</span>
            </div>
            <div className="flex items-center gap-1">
              <Cloud size={16} />
              <span>{getWeather()} 72°F</span>
            </div>
          </div>
        </div>

        {isEditMode && editedPerson && (
          <div className="mt-6 space-y-3">
            <div>
              <label className="block text-sm font-semibold text-gray-700 mb-1">Animation</label>
              <select
                value={editedPerson.animation}
                onChange={(e) => handleFieldChange('animation', e.target.value)}
                className="w-full px-3 py-2 border-2 border-gray-300 rounded-lg focus:outline-none focus:border-purple-500"
              >
                {/* Default animations */}
                {['sleep', 'work', 'walk', 'unknown'].map(key => (
                  <option key={key} value={key}>
                    {key === 'sleep' ? '💤 Sleep' :
                    key === 'work' ? '💼 Work' :
                    key === 'walk' ? '🚶 Walk' :
                    '❓ Other'}
                  </option>
                ))}

                {/* Custom uploads for this profile */}
                {editedPerson.customAnimations &&
                  Object.keys(editedPerson.customAnimations).map(preset => (
                    <option key={preset} value={preset}>
                      {preset}
                    </option>
                  ))
                }
              </select>
            </div>

            <div>
              <label className="block text-sm font-semibold text-gray-700 mb-1">Timezone</label>
              <select
                value={editedPerson.timezone}
                onChange={(e) => handleFieldChange('timezone', e.target.value)}
                className="w-full px-3 py-2 border-2 border-gray-300 rounded-lg focus:outline-none focus:border-purple-500"
              >
                {timezoneOptions.map(tz => (
                    <option key={tz.value} value={tz.value}>{tz.label}</option>
                ))}
              </select>
            </div>

            <input
                type="file"
                ref={fileInputRef}
                style={{ display: 'none' }}
                onChange={handleAnimationUpload}
                accept=".png, .gif" 
            />
            <button 
                onClick={() => fileInputRef.current?.click()}
                className="w-full bg-purple-500 text-white py-2 rounded-lg hover:bg-purple-600 flex items-center justify-center gap-2"
            >
              <Upload size={16} />
              Upload Custom Animation
            </button>
          </div>
        )}
      </div>
    </div>
  );
};

// --- SettingsView Component (Extracted) ---
const SettingsView = ({ setView, worldBg, setWorldBg, people, setPeople, db }) => {
  
  // Add a new person
  const handleAddPerson = async () => {
  if (!db) return;

  // Assign a temporary unique ID for React key
  const tempId = 'temp-' + Date.now();

  const newPerson = {
    id: tempId,
    name: `New Friend ${people.length + 1}`,
    nickname: '',
    timezone: 'America/New_York',
    currentActivity: 'unknown',
    customStatus: '',
    animation: 'unknown',
    customAnimations: {},
    position: { x: Math.random() * 60 + 20, y: Math.random() * 60 + 20 },
  };

  // Optimistically update local state
  setPeople(prev => [...prev, newPerson]);

  try {
    const docRef = await addDoc(collection(db, 'people'), newPerson);

    // Update Firestore ID in document
    await updateDoc(docRef, { id: docRef.id });

    // Sync local state with Firestore ID
    setPeople(prev =>
      prev.map(p => (p.id === tempId ? { ...p, id: docRef.id } : p))
    );
  } catch (error) {
    console.error("Error adding document: ", error);
    // Optionally remove temp person if failed
    setPeople(prev => prev.filter(p => p.id !== tempId));
  }
};


  // Delete a person
  const handleDeletePerson = async (personId) => {
  if (!db) return;
  // eslint-disable-next-line no-restricted-globals
  if (confirm('Are you sure you want to remove this person?')) {
    try {
      await deleteDoc(doc(db, 'people', String(personId)));
      setPeople(prev => prev.filter(p => p.id !== personId));
    } catch (error) {
      console.error("Error deleting document: ", error);
    }
  }
};



  return (
    <div className="w-full h-full bg-gradient-to-b from-blue-100 to-purple-100 p-6 overflow-auto">
      <button 
        onClick={() => setView('home')}
        className="mb-6 bg-white px-4 py-2 rounded-full shadow-md hover:bg-gray-100"
      >
        ← Back
      </button>

      <div className="max-w-2xl mx-auto space-y-6">
        <div className="bg-white rounded-xl shadow-lg p-6">
          <h2 className="text-2xl font-bold text-purple-600 mb-4">⚙️ Settings</h2>
          
          <div className="space-y-4">
            <div>
              <label className="block text-sm font-semibold mb-2">World Theme</label>
              <select 
                value={worldBg}
                onChange={(e) => setWorldBg(e.target.value)}
                className="w-full px-3 py-2 border rounded-lg focus:ring focus:ring-purple-300"
              >
                <option value="grassland">🌱 Grassland</option>
                <option value="night">🌙 Night Sky</option>
                <option value="beach">🏖️ Beach</option>
              </select>
            </div>

            <div>
              <label className="block text-sm font-semibold mb-2">Connected Calendar</label>
              <button className="w-full bg-blue-500 text-white py-3 rounded-lg hover:bg-blue-600">
                🔗 Connect Google Calendar
              </button>
              <p className="text-xs text-gray-500 mt-2">
                ⚠️ Requires HTTPS for OAuth. No data stored - read-only access.
              </p>
            </div>

            <div>
              <label className="block text-sm font-semibold mb-2">Manage People</label>
              <button 
                onClick={handleAddPerson}
                className="w-full bg-green-500 text-white py-3 rounded-lg hover:bg-green-600 flex items-center justify-center gap-2"
              >
                <Plus size={20} />
                Add Person to Track
              </button>

              <div className="mt-4 space-y-2">
                {people.map(person => (
                  <div key={person.id} className="flex items-center justify-between bg-gray-50 p-3 rounded-lg">
                    <div className="flex items-center gap-3">
                      {getSidebarIcon(person)}
                      <div>
                        <p className="font-semibold">{person.nickname || person.name}</p>
                        <p className="text-xs text-gray-500">{person.timezone}</p>
                      </div>
                    </div>
                    <button
                      onClick={() => handleDeletePerson(person.id)}
                      className="p-2 text-red-500 hover:bg-red-50 rounded-full"
                    >
                      <X size={18} />
                    </button>
                  </div>
                ))}
              </div>
            </div>

            <div className="border-t pt-4">
              <h3 className="font-bold mb-2">Custom Animations</h3>
              <p className="text-sm text-gray-600 mb-3">
                Upload a sequence of images (PNG/GIF) that will cycle every 500ms
              </p>
              <button className="w-full border-2 border-dashed border-gray-300 py-8 rounded-lg hover:border-purple-400 hover:bg-purple-50">
                <Upload className="mx-auto mb-2" size={32} />
                <p className="text-sm">Click to upload animation frames</p>
              </button>
            </div>
          </div>
        </div>

        <div className="bg-white rounded-xl shadow-lg p-6">
          <h3 className="font-bold text-lg mb-3">📱 Deployment Info</h3>
          <div className="text-sm space-y-2 text-gray-700">
            <p>✅ GitHub Pages compatible</p>
            <p>✅ Phone-friendly responsive design</p>
            <p>✅ Touch gestures (zoom/pan on mobile)</p>
            <p>⚠️ Google Calendar API requires HTTPS</p>
            <p>💾 No data stored - everything client-side</p>
          </div>
        </div>
      </div>
    </div>
  );
};


// --- Main CalendarSync Component (CORE LOGIC) ---
const CalendarSync = () => {
  const [userId, setUserId] = useState(null);
  const [isAuthReady, setIsAuthReady] = useState(false);
  
  const [currentUser, setCurrentUser] = useState('Mom');
  const [selectedPerson, setSelectedPerson] = useState(null);
  const [view, setView] = useState('home');
  const [people, setPeople] = useState([]); // INITIALIZED TO EMPTY ARRAY
  
  const [animFrame, setAnimFrame] = useState(0);
  const [worldBg, setWorldBg] = useState('grassland');
  const [scale, setScale] = useState(1);
  const [pan, setPan] = useState({ x: 0, y: 0 });

  // --- 1. FIREBASE READY + AUTH ---
useEffect(() => {
  signInAnonymously(auth)
    .then((userCredential) => {
      console.log("✅ Signed in anonymously:", userCredential.user.uid);
      setUserId(userCredential.user.uid);
      setIsAuthReady(true);
    })
    .catch((err) => {
      console.error("❌ Anonymous sign-in failed:", err);
      setIsAuthReady(false);
    });
}, []);



  useEffect(() => {
  const q = collection(db, 'people'); // Top-level collection

  console.log("📡 Listening to Firestore at:", 'people');

  const unsub = onSnapshot(q, (snapshot) => {
    console.log("📥 Firestore update received:", snapshot.size, "docs");

    const arr = [];
    snapshot.forEach((doc) => arr.push(doc.data()));
    setPeople(arr);
  });

  return () => unsub();
}, [isAuthReady]);


  
  // --- Other Effects/Utilities ---
  // Animation loop
  useEffect(() => {
    const interval = setInterval(() => {
      setAnimFrame(prev => (prev + 1) % 2);
    }, 500);
    return () => clearInterval(interval);
  }, []);

  // Get current time for each timezone
  const getTimeForTimezone = (timezone) => {
    return new Intl.DateTimeFormat('en-US', {
      timeZone: timezone,
      hour: 'numeric',
      minute: '2-digit',
      hour12: true
    }).format(new Date());
  };

  // Get weather emoji (mock for now)
  const getWeather = () => {
    const conditions = ['☀️', '⛅', '☁️', '🌧️'];
    return conditions[Math.floor(Math.random() * conditions.length)];
  };

  const renderChibi = (person) => {
    const { animation, customAnimations } = person;

    let frames = [];
    if (customAnimations && customAnimations[animation]) {
      frames = customAnimations[animation]; // uploaded frames
    } else {
      frames = defaultAnimations[animation] || defaultAnimations.unknown; // emoji fallback
    }

    const frame = Array.isArray(frames) ? frames[animFrame % frames.length] : frames;

    // If frame is a URL (uploaded image), render <img> and animate it
    if (typeof frame === 'string' && (frame.startsWith('data:') || frame.startsWith('http'))) {
      return (
        <img
          src={frame}
          alt="animation frame"
          className="w-12 h-12 animate-bounce object-contain"
          style={{ animationDuration: '1s' }}
        />
      );
    }

    // Otherwise fallback to emoji/text
    return (
      <div className="text-4xl animate-bounce" style={{ animationDuration: '1s' }}>
        {frame}
      </div>
    );
  };



  const PersonCard = ({ person, onClick, isHome }) => (
    <div
      onClick={() => onClick(person)}
      className="cursor-pointer hover:scale-110 transition-transform"
      style={isHome ? {
        position: 'absolute',
        left: `${person.position.x}%`,
        top: `${person.position.y}%`,
        transform: `translate(-50%, -50%)`
      } : {}}
    >
      <div className="flex flex-col items-center bg-white/80 rounded-lg p-2 shadow-lg backdrop-blur-sm">
        {renderChibi(person)}
        <div key={person.id} className="text-xs font-bold mt-1 text-center">
          {person.nickname || person.name}
        </div>
        {isHome && (
          <div className="text-xs text-gray-500">
            {getTimeForTimezone(person.timezone)}
          </div>
        )}
      </div>
    </div>
  );

  const HomeView = () => {
    const bgColors = {
      grassland: 'bg-gradient-to-b from-sky-300 to-green-300',
      night: 'bg-gradient-to-b from-indigo-900 to-purple-900',
      beach: 'bg-gradient-to-b from-sky-400 to-yellow-300'
    };

    return (
      <div className={`relative w-full h-full ${bgColors[worldBg]} overflow-hidden`}>
        <div 
          className="absolute inset-0 transition-transform"
          style={{
            transform: `scale(${scale}) translate(${pan.x}px, ${pan.y}px)`
          }}
        >
          {/* Decorative elements */}
          <div className="absolute bottom-0 left-0 right-0 h-20 bg-green-600/30"></div>
          
          {/* People */}
          {people.map(person => (
            <PersonCard 
              key={person.id} 
              person={person} 
              onClick={(p) => {
                setSelectedPerson(p);
                setView('profile');
              }}
              isHome={true}
            />
          ))}
        </div>

        {/* Top bar */}
        <div className="absolute top-0 left-0 right-0 bg-white/90 p-3 shadow-md flex justify-between items-center z-10">
          <h1 className="text-xl font-bold text-purple-600">📅 Calendar Sync</h1>
          <div className="flex gap-2">
            <button 
              onClick={() => setView('settings')}
              className="p-2 hover:bg-gray-100 rounded-full"
            >
              <Settings size={20} />
            </button>
          </div>
        </div>
      </div>
    );
  };

  return (
    <div className="w-full h-screen overflow-hidden bg-gray-100">
      {view === 'home' && <HomeView />}
      {view === 'profile' && selectedPerson && (
        <ProfileView 
          selectedPerson={selectedPerson}
          setView={setView}
          people={people}
          setPeople={setPeople}
          setSelectedPerson={setSelectedPerson}
          renderChibi={renderChibi}
          getTimeForTimezone={getTimeForTimezone}
          getWeather={getWeather}
          db={db} // Pass Firestore instance
        />
      )}
      {view === 'settings' && (
        <SettingsView 
          setView={setView}
          worldBg={worldBg}
          setWorldBg={setWorldBg}
          people={people}
          setPeople={setPeople}
          db={db} // Pass Firestore instance
        />
      )}

      {/* Bottom navigation (mobile) */}
      {view === 'home' && (
        <div className="absolute bottom-0 left-0 right-0 bg-white/95 p-3 shadow-lg md:hidden flex justify-around z-10">
          {people.map(person => (
            <button
              key={person.id}
              onClick={() => {
                setSelectedPerson(person);
                setView('profile');
              }}
              className="flex flex-col items-center text-xs"
            >
              <div>{getSidebarIcon(person)}</div>
              <span className="truncate w-16">{person.nickname || person.name}</span>
            </button>
          ))}
        </div>
      )}

      {/* Sidebar navigation (desktop) */}
      {view === 'home' && (
        <div className="hidden md:block absolute right-4 top-20 bg-white rounded-xl shadow-lg p-2 space-y-2 z-10">
          {people.map(person => (
            <button
              key={person.id}
              onClick={() => {
                setSelectedPerson(person);
                setView('profile');
              }}
              className="flex flex-col items-center p-2 hover:bg-purple-50 rounded-lg w-20"
            >
              <div>{getSidebarIcon(person)}</div>
              <span className="text-xs truncate w-full text-center">
                {person.nickname || person.name}
              </span>
            </button>
          ))}
        </div>
      )}
    </div>
  );
};

export default CalendarSync;