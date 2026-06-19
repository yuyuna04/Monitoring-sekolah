import React, { useState, useEffect, useRef } from 'react';
import { useNavigate } from 'react-router-dom';
import { supabase } from '../../lib/supabase';
import { FiArrowLeft, FiSend } from 'react-icons/fi';

export default function ChatAdmin() {
  const navigate = useNavigate();
  const chatEndRef = useRef(null);
  const [ortuList, setOrtuList] = useState([]);
  const [selectedOrtu, setSelectedOrtu] = useState(null);
  const [chatList, setChatList] = useState([]);
  const [chatInput, setChatInput] = useState('');
  const [sending, setSending] = useState(false);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    fetchOrtuList();
    const channel = supabase
      .channel('pesan_bantuan_admin_view')
      .on('postgres_changes', { event: '*', schema: 'public', table: 'pesan_bantuan' }, () => {
        fetchOrtuList();
        if (selectedOrtu) fetchChat(selectedOrtu.orangtua_id);
      })
      .subscribe();
    return () => supabase.removeChannel(channel);
  }, []); // eslint-disable-line

  useEffect(() => {
    chatEndRef.current?.scrollIntoView({ behavior: 'smooth' });
  }, [chatList]);

  const fetchOrtuList = async () => {
    setLoading(true);
    const { data: pesanData, error } = await supabase
      .from('pesan_bantuan')
      .select('orangtua_id, isi_pesan, created_at, pengirim, dibaca')
      .order('created_at', { ascending: false });

    if (error) {
      console.error('Gagal memuat daftar chat:', error.message);
      setLoading(false);
      return;
    }

    if (!pesanData || pesanData.length === 0) { setOrtuList([]); setLoading(false); return; }

    const grouped = {};
    pesanData.forEach(p => {
      if (!grouped[p.orangtua_id]) {
        grouped[p.orangtua_id] = {
          orangtua_id: p.orangtua_id,
          lastMessage: p.isi_pesan,
          lastTime: p.created_at,
          unread: 0,
        };
      }
      if (p.pengirim === 'orangtua' && !p.dibaca) {
        grouped[p.orangtua_id].unread += 1;
      }
    });

    const ortuIds = Object.keys(grouped);
    if (ortuIds.length === 0) { setOrtuList([]); setLoading(false); return; }

    const { data: profiles } = await supabase
      .from('profiles').select('id, full_name, email').in('id', ortuIds);

    const merged = ortuIds.map(id => ({
      ...grouped[id],
      profile: profiles?.find(p => p.id === id)
    })).sort((a, b) => new Date(b.lastTime) - new Date(a.lastTime));

    setOrtuList(merged);
    setLoading(false);
  };

  const fetchChat = async (orangtuaId) => {
    const { data, error } = await supabase.from('pesan_bantuan').select('*')
      .eq('orangtua_id', orangtuaId).order('created_at', { ascending: true });

    if (error) {
      console.error('Gagal memuat chat:', error.message);
      return;
    }
    setChatList(data || []);

    await supabase.from('pesan_bantuan').update({ dibaca: true })
      .eq('orangtua_id', orangtuaId).eq('pengirim', 'orangtua');
    fetchOrtuList();
  };

  const handleSelectOrtu = (ortu) => {
    setSelectedOrtu(ortu);
    fetchChat(ortu.orangtua_id);
  };

  const handleSend = async () => {
    if (!chatInput.trim() || !selectedOrtu) return;
    setSending(true);
    const { error } = await supabase.from('pesan_bantuan').insert({
      orangtua_id: selectedOrtu.orangtua_id, pengirim: 'admin', isi_pesan: chatInput.trim(), dibaca: true
    });
    setSending(false);
    if (error) {
      alert('Gagal mengirim pesan: ' + error.message);
      return;
    }
    setChatInput('');
    fetchChat(selectedOrtu.orangtua_id);
  };

  if (selectedOrtu) {
    return (
      <div className="min-h-screen bg-gray-100 flex flex-col">
        <div className="bg-red-600 text-white px-4 py-4 flex items-center gap-3">
          <button type="button" onClick={() => setSelectedOrtu(null)}>
            <FiArrowLeft size={22} />
          </button>
          <div className="bg-white bg-opacity-20 w-10 h-10 rounded-full flex items-center justify-center font-bold">
            {selectedOrtu.profile?.full_name?.charAt(0) || 'O'}
          </div>
          <div className="flex-1">
            <p className="font-bold text-sm">{selectedOrtu.profile?.full_name || 'Orang Tua'}</p>
            <p className="text-xs text-red-100">{selectedOrtu.profile?.email}</p>
          </div>
        </div>

        <div style={{ flex: 1, overflowY: 'auto', padding: '16px' }}>
          {chatList.length === 0 ? (
            <div className="text-center py-10 text-gray-400">
              <p className="text-4xl mb-2">💬</p>
              <p className="text-sm">Belum ada percakapan</p>
            </div>
          ) : chatList.map(msg => (
            <div key={msg.id} style={{ display: 'flex', justifyContent: msg.pengirim === 'admin' ? 'flex-end' : 'flex-start', marginBottom: '10px' }}>
              <div style={{
                maxWidth: '75%', padding: '10px 14px', borderRadius: '16px',
                background: msg.pengirim === 'admin' ? '#CC0000' : 'white',
                color: msg.pengirim === 'admin' ? 'white' : '#1a1a1a',
                boxShadow: msg.pengirim === 'admin' ? 'none' : '0 1px 4px rgba(0,0,0,0.08)'
              }}>
                <p className="text-sm">{msg.isi_pesan}</p>
                <p style={{ fontSize: '10px', opacity: 0.7, marginTop: '4px' }}>
                  {new Date(msg.created_at).toLocaleString('id-ID', { day: 'numeric', month: 'short', hour: '2-digit', minute: '2-digit' })}
                </p>
              </div>
            </div>
          ))}
          <div ref={chatEndRef} />
        </div>

        <div className="bg-white border-t p-3 flex items-center gap-2">
          <input
            value={chatInput}
            onChange={e => setChatInput(e.target.value)}
            onKeyDown={e => e.key === 'Enter' && handleSend()}
            placeholder="Balas pesan..."
            className="flex-1 px-4 py-2.5 border rounded-full focus:outline-none focus:ring-2 focus:ring-red-500 text-sm"
          />
          <button type="button" onClick={handleSend} disabled={sending || !chatInput.trim()}
            className="bg-red-600 text-white p-3 rounded-full disabled:opacity-50">
            <FiSend size={18} />
          </button>
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-gray-100">
      <div className="bg-red-600 text-white px-6 py-4 flex items-center gap-4">
        <button type="button" onClick={() => navigate('/admin/dashboard')}>
          <FiArrowLeft size={22} />
        </button>
        <h1 className="text-xl font-bold flex-1">Live Chat Orang Tua</h1>
      </div>

      <div className="p-4 space-y-2">
        {loading ? (
          <div className="text-center py-10 text-gray-500">Memuat...</div>
        ) : ortuList.length === 0 ? (
          <div className="text-center py-10 text-gray-400">
            <p className="text-5xl mb-3">💬</p>
            <p>Belum ada percakapan dari orang tua</p>
          </div>
        ) : ortuList.map(ortu => (
          <button key={ortu.orangtua_id} type="button" onClick={() => handleSelectOrtu(ortu)}
            className="w-full bg-white rounded-2xl p-4 shadow-sm flex items-center gap-3 text-left">
            <div className="bg-red-100 text-red-600 w-12 h-12 rounded-full flex items-center justify-center font-bold flex-shrink-0">
              {ortu.profile?.full_name?.charAt(0) || 'O'}
            </div>
            <div className="flex-1 overflow-hidden">
              <div className="flex items-center justify-between">
                <p className="font-semibold text-gray-800 text-sm">{ortu.profile?.full_name || 'Orang Tua'}</p>
                <p className="text-xs text-gray-400">
                  {new Date(ortu.lastTime).toLocaleDateString('id-ID', { day: 'numeric', month: 'short' })}
                </p>
              </div>
              <p className="text-sm text-gray-500 truncate">{ortu.lastMessage}</p>
            </div>
            {ortu.unread > 0 && (
              <div className="bg-red-600 text-white rounded-full min-w-[22px] h-[22px] flex items-center justify-center text-xs font-bold px-1.5">
                {ortu.unread}
              </div>
            )}
          </button>
        ))}
      </div>
    </div>
  );
}