import React, { useState, useEffect, useCallback } from 'react';
import { Plus, Trash2, Edit2, LogOut, CheckCircle, ChevronRight, MessageCircle, User, Check, X } from 'lucide-react';
import { supabase } from './lib/supabase';

import ProgressCircle from './components/ProgressCircle';
import Leaderboard from './components/Leaderboard';

const App = () => {
  const [globalTotal, setGlobalTotal] = useState(0);
  const [leaderboard, setLeaderboard] = useState([]);
  const [currentHadith, setCurrentHadith] = useState({});
  const [userProfile, setUserProfile] = useState(null);
  const [userEntries, setUserEntries] = useState([]);
  const [isLoggedIn, setIsLoggedIn] = useState(false);
  const [isLoggingIn, setIsLoggingIn] = useState(false);

  const [nameInput, setNameInput] = useState('');
  const [phoneInput, setPhoneInput] = useState('');
  const [countInput, setCountInput] = useState('');
  const [showConfirm, setShowConfirm] = useState(false);
  const [isSubmitting, setIsSubmitting] = useState(false);

  // Edit states
  const [editingId, setEditingId] = useState(null);
  const [editValue, setEditValue] = useState('');

  const GOAL = 1000000;

  // Sound effects utility
  const playSound = useCallback((type) => {
    try {
      const audioCtx = new (window.AudioContext || window.webkitAudioContext)();
      const oscillator = audioCtx.createOscillator();
      const gainNode = audioCtx.createGain();
      oscillator.connect(gainNode);
      gainNode.connect(audioCtx.destination);
      const now = audioCtx.currentTime;

      if (type === 'success') {
        oscillator.frequency.setValueAtTime(523.25, now);
        oscillator.frequency.exponentialRampToValueAtTime(880, now + 0.1);
        gainNode.gain.linearRampToValueAtTime(0.2, now + 0.05);
        gainNode.gain.linearRampToValueAtTime(0, now + 0.3);
        oscillator.start(now); oscillator.stop(now + 0.3);
      } else if (type === 'click') {
        oscillator.type = 'triangle';
        oscillator.frequency.setValueAtTime(400, now);
        gainNode.gain.linearRampToValueAtTime(0.1, now + 0.01);
        gainNode.gain.linearRampToValueAtTime(0, now + 0.05);
        oscillator.start(now); oscillator.stop(now + 0.05);
      }
    } catch (e) { console.error('Audio failed', e); }
  }, []);

  // Initialize App
  useEffect(() => {
  checkLocalUser();
  fetchGlobalData();
  fetchLeaderboard();
  fetchDailyHadith(); // Initial fetch

  // Set up the 1-hour timer (3600000 milliseconds)
  const hadithTimer = setInterval(() => {
    fetchDailyHadith();
  }, 3600000); 

  const channel = supabase
    .channel('swalath_changes')
    .on('postgres_changes', { event: '*', schema: 'public', table: 'swalath_entries' }, () => {
      fetchGlobalData();
      fetchLeaderboard();
    })
    .subscribe();

  return () => {
    supabase.removeChannel(channel);
    clearInterval(hadithTimer); // Clean up the timer when the app closes
  };
}, []);


  useEffect(() => {
    if (userProfile) {
      fetchUserHistory(userProfile.phone);
    }
  }, [userProfile]);

  const checkLocalUser = () => {
    const savedPhone = localStorage.getItem('swalath_user_phone');
    const savedName = localStorage.getItem('swalath_user_name');
    if (savedPhone && savedName) {
      setUserProfile({ phone: savedPhone, full_name: savedName });
      setIsLoggedIn(true);
    }
  };

  const fetchDailyHadith = async () => {
  // We fetch all IDs first, then pick one at random
  const { data: ids } = await supabase.from('daily_hadiths').select('id');
  
  if (ids && ids.length > 0) {
    const randomId = ids[Math.floor(Math.random() * ids.length)].id;
    const { data: hadith } = await supabase
      .from('daily_hadiths')
      .select('*')
      .eq('id', randomId)
      .single();
      
    if (hadith) setCurrentHadith(hadith);
  }
};


  const fetchGlobalData = async () => {
    const { data, error } = await supabase.from('swalath_entries').select('count');
    if (!error && data) {
      const total = data.reduce((acc, entry) => acc + entry.count, 0);
      setGlobalTotal(total);
    }
  };

  const fetchLeaderboard = async () => {
    const { data, error } = await supabase
      .from('profiles')
      .select('*')
      .order('total_count', { ascending: false })
      .limit(10);
    if (!error && data) setLeaderboard(data);
  };

  const fetchUserHistory = async (phone) => {
    const { data, error } = await supabase
      .from('swalath_entries')
      .select('*')
      .eq('user_phone', phone)
      .order('created_at', { ascending: false });
    if (!error && data) setUserEntries(data);
  };

  const handleLogin = async (e) => {
  e.preventDefault();
  if (!nameInput || !phoneInput || isLoggingIn) return;
  
  setIsLoggingIn(true); // Start loading
  playSound('click');

  try {
    const { data: existingUser } = await supabase
      .from('profiles')
      .select('*')
      .eq('phone', phoneInput)
      .single();

    if (existingUser) {
      localStorage.setItem('swalath_user_phone', existingUser.phone);
      localStorage.setItem('swalath_user_name', existingUser.full_name);
      setUserProfile(existingUser);
    } else {
      const { error: insertError } = await supabase
        .from('profiles')
        .insert({ phone: phoneInput, full_name: nameInput });

      if (insertError) throw insertError;

      localStorage.setItem('swalath_user_phone', phoneInput);
      localStorage.setItem('swalath_user_name', nameInput);
      setUserProfile({ phone: phoneInput, full_name: nameInput });
    }

    // Small delay to ensure state updates before switching screens
    setTimeout(() => {
      setIsLoggedIn(true);
      setIsLoggingIn(false);
    }, 100);

  } catch (error) {
    setIsLoggingIn(false);
    alert("Login Error: " + error.message);
  }
};


  const handleSubmitSwalath = async () => {
    if (!countInput || !userProfile || isSubmitting) return;
    setIsSubmitting(true);
    playSound('click');

    const { error } = await supabase.from('swalath_entries').insert({
      user_phone: userProfile.phone,
      count: parseInt(countInput)
    });

    if (!error) {
      setShowConfirm(true);
      setCountInput('');
      playSound('success');
      fetchUserHistory(userProfile.phone);
      setTimeout(() => setShowConfirm(false), 2000);
    }
    setIsSubmitting(false);
  };

  const handleUpdateEntry = async () => {
    if (!editingId || !userProfile) return;
    const newValue = parseInt(editValue);
    
    const { error } = await supabase
      .from('swalath_entries')
      .update({ count: newValue })
      .eq('id', editingId);

    if (!error) {
      setEditingId(null);
      playSound('success');
      fetchUserHistory(userProfile.phone);
    }
  };

  const handleDeleteEntry = async (id) => {
    if (window.confirm('ഈ വരി ഒഴിവാക്കണോ?')) {
      const { error } = await supabase.from('swalath_entries').delete().eq('id', id);
      if (!error) fetchUserHistory(userProfile.phone);
    }
  };

  const handleLogout = () => {
    localStorage.clear();
    setIsLoggedIn(false);
    setUserProfile(null);
  };

  return (
    <div className="min-h-screen bg-[#FDFCF0]">

      {/* Header Section */}
      <header className="relative z-30 bg-[#064E3B] pt-2 pb-4 px-6 rounded-b-[40px] shadow-2xl border-b-4 border-[#D4AF37]">
        <div className="relative z-10 flex justify-between items-center max-w-md mx-auto mb-4">
          <div className="w-10 h-10 bg-white/10 rounded-full flex items-center justify-center border border-white/20">
            <span className="text-[#D4AF37] font-bold text-[10px]">SSF</span>
          </div>
          <div className="relative z-10 text-center pb-0">
            <h1 className="text-[#D4AF37] text-xl font-bold italic drop-shadow-md">اللهم صل على محمد</h1>
            <p className="text-white/70 text-[9px] uppercase tracking-widest mt-0.5">SHA'BAN 1 MILLION SWALATH</p>
          </div>
          <div className="w-10 h-10 bg-white/10 rounded-full flex items-center justify-center border border-white/20">
             <span className="text-[#D4AF37] font-bold text-[10px]">1447</span>
          </div>
        </div>

        <div className="flex justify-center mb-4">
          <ProgressCircle current={globalTotal} goal={GOAL} />
        </div>

        <Leaderboard topProfiles={leaderboard} />

        <div className="max-w-sm mx-auto mt-4 text-center">
          <p className="text-white/90 text-[12px] italic leading-snug px-4">{currentHadith.hadith_text}</p>
          <p className="text-[9px] text-white/30 mt-1">— {currentHadith.reference}</p>
        </div>
      </header>

      {/* Main Content */}
      <main className="max-w-md mx-auto px-6 py-8">
        {!isLoggedIn ? (
          <form onSubmit={handleLogin} className="bg-white rounded-3xl p-8 shadow-xl space-y-6">
            <h2 className="text-2xl font-bold text-[#064E3B] text-center">സ്വാഗതം</h2>
            <input 
              type="text" 
              placeholder="പേര് (Name)"
              onChange={(e) => setNameInput(e.target.value)}
              className="w-full bg-gray-50 border-2 border-transparent focus:border-[#D4AF37] rounded-2xl py-4 px-4 outline-none transition-all"
              required 
            />
            <input 
              type="tel" 
              placeholder="വാട്ട്‌സ്ആപ്പ് നമ്പർ"
              onChange={(e) => setPhoneInput(e.target.value)}
              className="w-full bg-gray-50 border-2 border-transparent focus:border-[#D4AF37] rounded-2xl py-4 px-4 outline-none transition-all"
              required 
            />
            <button
  type="submit"
  disabled={isLoggingIn}
  className={`w-full py-4 rounded-2xl font-bold text-white transition-all ${
    isLoggingIn ? 'bg-gray-400' : 'bg-[#064E3B] active:scale-95'
  }`}
>
  {isLoggingIn ? (
    <div className="flex items-center justify-center gap-2">
      <div className="w-4 h-4 border-2 border-white/30 border-t-white rounded-full animate-spin"></div>
      <span>കാത്തിരിക്കൂ...</span> {/* "Please wait..." in Malayalam */}
    </div>
  ) : (
    'തുടങ്ങാം' /* "Let's start" */
  )}
</button>
          </form>
        ) : (
          <div className="space-y-6">
            <div className="flex justify-between items-center bg-white/60 p-4 rounded-2xl border border-white">
              <h3 className="text-lg font-bold text-[#064E3B]">{userProfile?.full_name}</h3>
              <button onClick={handleLogout} className="text-gray-400 hover:text-red-500"><LogOut className="w-5 h-5" /></button>
            </div>

            <div className="bg-white rounded-3xl p-6 shadow-xl space-y-4">
              <input 
                type="number" 
                inputMode="numeric"
                value={countInput}
                onChange={(e) => setCountInput(e.target.value)}
                placeholder="0"
                className="w-full bg-gray-50 rounded-3xl py-4 text-center text-4xl font-black text-[#064E3B] outline-none"
              />
              <button 
                onClick={handleSubmitSwalath}
                disabled={!countInput || isSubmitting}
                className="w-full bg-[#D4AF37] text-[#064E3B] py-4 rounded-2xl text-xl font-black shadow-lg disabled:opacity-50"
              >
                സമർപ്പിക്കുക
              </button>
            </div>

            <div className="space-y-3">
              <h4 className="text-[11px] font-bold text-gray-400 uppercase tracking-widest px-2">നിങ്ങളുടെ വിവരങ്ങൾ</h4>
              {userEntries.map((entry) => (
                <div key={entry.id} className="bg-white p-4 rounded-2xl shadow-sm flex justify-between items-center border border-gray-100">
                  <div className="flex-1">
                    {editingId === entry.id ? (
                      <div className="flex gap-2">
                        <input type="number" value={editValue} onChange={(e) => setEditValue(e.target.value)} className="w-20 border-2 border-[#D4AF37] rounded-lg px-2" />
                        <button onClick={handleUpdateEntry} className="bg-[#064E3B] text-white p-1 rounded-lg"><Check className="w-4 h-4" /></button>
                      </div>
                    ) : (
                      <>
                        <p className="text-xl font-black text-[#064E3B]">{entry.count}</p>
                        <p className="text-[9px] text-gray-400">{new Date(entry.created_at).toLocaleString('en-IN', {
  day: '2-digit',
  month: 'short',
  hour: '2-digit',
  minute: '2-digit',
  hour12: true
})}
</p>
                      </>
                    )}
                  </div>
                  <div className="flex gap-2">
                    <button onClick={() => { setEditingId(entry.id); setEditValue(entry.count); }} className="text-gray-300 hover:text-[#D4AF37]"><Edit2 className="w-4 h-4" /></button>
                    <button onClick={() => handleDeleteEntry(entry.id)} className="text-gray-300 hover:text-red-500"><Trash2 className="w-4 h-4" /></button>
                  </div>
                </div>
              ))}
            </div>
          </div>
        )}
      </main>

      {/* Success Modal */}
      {showConfirm && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-6 backdrop-blur-sm animate-in fade-in">
          <div className="bg-[#064E3B] rounded-[40px] p-8 text-center border-4 border-[#D4AF37] shadow-2xl">
            <CheckCircle className="text-[#D4AF37] w-16 h-16 mx-auto mb-4" />
            <h3 className="text-[#D4AF37] text-2xl font-black">അൽഹംദുലില്ലാഹ്!</h3>
            <p className="text-white/90">രേഖപ്പെടുത്തിക്കഴിഞ്ഞു.</p>
          </div>
        </div>
      )}
    </div>
  );
};

export default App;
