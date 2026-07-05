import React, { useState, useEffect, useRef } from 'react';
import { useNavigate } from 'react-router-dom';
import { supabase } from '../../lib/supabase';
import { FiArrowLeft, FiSend, FiUpload, FiX, FiExternalLink } from 'react-icons/fi';

export default function ChatOrangtuaKepsek() {
  const navigate = useNavigate();
  const chatEndRef = useRef(null);
  const [daftarOrtu, setDaftarOrtu] = useState([]);
  const [selectedOrtu, setSelectedOrtu] = useState(null);
  const [chatList, setChatList] = useState([]);
  const [input, setInput] = useState('');
  const [sending, setSending] = useState(false);
  const [uploading, setUploading] = useState(false);
  const [fileUrl, setFileUrl] = useState('');
  const [fileName, setFileName] = useState('');
  const [unreadMap, setUnreadMap] = useState({});

  useEffect(() => { fetchDaftarOrtu(); }, []);

  useEffect(() => {
    if (selectedOrtu) {
      fetchChat(selectedOrtu.id);
      markAsRead(selectedOrtu.id);
      const channel = supabase
        .channel('chat_kepsek_' + selectedOrtu.id)
        .on('postgres_changes', { event: '*', schema: 'public', table: 'pesan_bantuan' }, () => {
          fetchChat(selectedOrtu.id);
          fetchDaftarOrtu();
        })
        .subscribe();
      return () => supabase.removeChannel(channel);
    }
  }, [selectedOrtu]); // eslint-disable-line

  useEffect(() => {
    chatEndRef.current?.scrollIntoView({ behavior: 'smooth' });
  }, [chatList]);

  const fetchDaftarOrtu = async () => {
    const { data } = await supabase
      .from('pesan_bantuan')
      .select('orangtua_id, profiles!orangtua_id(full_name)')
      .order('created_at', { ascending: false });
    if (!data) return;
    const unique = {};
    data.forEach(d => {
      if (!unique[d.orangtua_id]) {
        unique[d.orangtua_id] = {
          id: d.orangtua_id,
          nama: d.profiles?.full_name || 'Orang Tua'
        };
      }
    });
    setDaftarOrtu(Object.values(unique));
    const unread = {};
    for (const ortu of Object.values(unique)) {
      const { count } = await supabase.from('pesan_bantuan')
        .select('*', { count: 'exact', head: true })
        .eq('orangtua_id', ortu.id)
        .eq('pengirim', 'orangtua')
        .eq('dibaca', false);
      unread[ortu.id] = count || 0;
    }
    setUnreadMap(unread);
  };

  const fetchChat = async (ortuId) => {
    const { data } = await supabase.from('pesan_bantuan')
      .select('*').eq('orangtua_id', ortuId)
      .order('created_at', { ascending: true });
    setChatList(data || []);
  };

  const markAsRead = async (ortuId) => {
    await supabase.from('pesan_bantuan')
      .update({ dibaca: true })
      .eq('orangtua_id', ortuId).eq('pengirim', 'orangtua');
    setUnreadMap(prev => ({ ...prev, [ortuId]: 0 }));
  };

  const handleUpload = async (e) => {
    const file = e.target.files[0];
    if (!file) return;
    if (file.size > 10 * 1024 * 1024) { alert('Maksimal 10MB!'); return; }
    setUploading(true);
    const ext = file.name.split('.').pop();
    const name = `chat_${Date.now()}.${ext}`;
    const { error } = await supabase.storage.from('chat-files').upload(name, file, { upsert: true });
    if (error) { alert('Gagal upload: ' + error.message); setUploading(false); return; }
    const { data: urlData } = supabase.storage.from('chat-files').getPublicUrl(name);
    setFileUrl(urlData.publicUrl);
    setFileName(file.name);
    setUploading(false);
  };

  const handleSend = async () => {
    if (!input.trim() && !fileUrl) return;
    if (!selectedOrtu) return;
    setSending(true);
    await supabase.from('pesan_bantuan').insert({
      orangtua_id: selectedOrtu.id,
      pengirim: 'admin',
      isi_pesan: input.trim() || (fileName ? `📎 ${fileName}` : ''),
      file_url: fileUrl || null,
      dibaca: false
    });
    setSending(false);
    setInput('');
    setFileUrl('');
    setFileName('');
    fetchChat(selectedOrtu.id);
  };

  const isImage = (url) => url && /\.(jpg|jpeg|png|gif|webp)$/i.test(url);

  return (
    <div className="min-h-screen bg-gray-100 flex flex-col">
      <div className="bg-purple-600 text-white px-6 py-4 flex items-center gap-4">
        <button type="button" onClick={() => navigate('/kepsek/dashboard')}>
          <FiArrowLeft size={22} />
        </button>
        <div className="flex-1">
          <h1 className="text-xl font-bold">Chat Orang Tua</h1>
          <p className="text-purple-200 text-xs">{daftarOrtu.length} orang tua aktif</p>
        </div>
      </div>

      <div className="flex flex-1" style={{ height: 'calc(100vh - 72px)' }}>
        {/* Sidebar */}
        <div className="w-1/3 bg-white border-r overflow-y-auto">
          {daftarOrtu.length === 0 ? (
            <div className="text-center py-10 text-gray-400 text-sm p-4">
              <p className="text-4xl mb-2">💬</p>
              <p>Belum ada pesan</p>
            </div>
          ) : daftarOrtu.map(ortu => (
            <button key={ortu.id} type="button"
              onClick={() => setSelectedOrtu(ortu)}
              className={`w-full px-4 py-3 flex items-center gap-3 border-b text-left transition ${selectedOrtu?.id === ortu.id ? 'bg-purple-50' : 'hover:bg-gray-50'}`}>
              <div className="w-10 h-10 rounded-full bg-purple-100 text-purple-600 flex items-center justify-center font-bold text-sm flex-shrink-0">
                {ortu.nama?.charAt(0) || 'O'}
              </div>
              <div className="flex-1 min-w-0">
                <p className="font-semibold text-gray-800 text-sm truncate">{ortu.nama}</p>
                <p className="text-xs text-gray-400">Orang Tua</p>
              </div>
              {unreadMap[ortu.id] > 0 && (
                <span className="bg-red-500 text-white text-xs rounded-full w-5 h-5 flex items-center justify-center flex-shrink-0">
                  {unreadMap[ortu.id]}
                </span>
              )}
            </button>
          ))}
        </div>

        {/* Chat area */}
        <div className="flex-1 flex flex-col">
          {!selectedOrtu ? (
            <div className="flex-1 flex items-center justify-center text-gray-400">
              <div className="text-center">
                <p className="text-5xl mb-3">💬</p>
                <p>Pilih orang tua untuk mulai chat</p>
              </div>
            </div>
          ) : (
            <>
              <div className="bg-white border-b px-4 py-3 flex items-center gap-3">
                <div className="w-9 h-9 rounded-full bg-purple-100 text-purple-600 flex items-center justify-center font-bold text-sm">
                  {selectedOrtu.nama?.charAt(0)}
                </div>
                <div>
                  <p className="font-semibold text-gray-800">{selectedOrtu.nama}</p>
                  <p className="text-xs text-gray-500">Orang Tua Siswa</p>
                </div>
              </div>

              <div className="flex-1 overflow-y-auto p-4 space-y-3">
                {chatList.length === 0 ? (
                  <div className="text-center py-10 text-gray-400 text-sm">Belum ada pesan</div>
                ) : chatList.map(msg => (
                  <div key={msg.id} style={{ display: 'flex', justifyContent: msg.pengirim !== 'orangtua' ? 'flex-end' : 'flex-start' }}>
                    <div style={{
                      maxWidth: '70%', padding: '10px 14px', borderRadius: '16px',
                      background: msg.pengirim !== 'orangtua' ? '#7C3AED' : '#F3F4F6',
                      color: msg.pengirim !== 'orangtua' ? 'white' : '#1a1a1a'
                    }}>
                      {msg.pengirim === 'orangtua' && (
                        <p className="text-xs font-bold text-purple-600 mb-1">{selectedOrtu.nama}</p>
                      )}
                      {msg.pengirim !== 'orangtua' && (
                        <p className="text-xs font-bold text-purple-200 mb-1">🎓 Kepala Sekolah</p>
                      )}
                      {msg.file_url && isImage(msg.file_url) && (
                        <img src={msg.file_url} alt="foto" className="rounded-lg mb-2 max-w-full" style={{ maxHeight: '200px', objectFit: 'cover' }} />
                      )}
                      {msg.file_url && !isImage(msg.file_url) && (
                        <a href={msg.file_url} target="_blank" rel="noopener noreferrer"
                          className="flex items-center gap-2 text-xs underline mb-2">
                          <FiExternalLink size={12} /> Lihat Dokumen
                        </a>
                      )}
                      {msg.isi_pesan && <p className="text-sm">{msg.isi_pesan}</p>}
                      <p style={{ fontSize: '10px', opacity: 0.65, marginTop: '4px' }}>
                        {new Date(msg.created_at).toLocaleString('id-ID', { day: 'numeric', month: 'short', hour: '2-digit', minute: '2-digit' })}
                      </p>
                    </div>
                  </div>
                ))}
                <div ref={chatEndRef} />
              </div>

              {fileUrl && (
                <div className="bg-purple-50 border-t px-4 py-2 flex items-center gap-2">
                  {isImage(fileUrl)
                    ? <img src={fileUrl} alt="" className="w-12 h-12 rounded-lg object-cover" />
                    : <div className="bg-purple-100 text-purple-600 rounded-lg px-3 py-2 text-xs">📎 {fileName}</div>}
                  <button type="button" onClick={() => { setFileUrl(''); setFileName(''); }} className="ml-auto text-gray-400">
                    <FiX size={18} />
                  </button>
                </div>
              )}

              <div className="bg-white border-t p-3 flex items-center gap-2">
                <label className="text-gray-400 hover:text-purple-600 cursor-pointer flex-shrink-0">
                  <FiUpload size={20} />
                  <input type="file" accept="image/*,.pdf,.doc,.docx" onChange={handleUpload} className="hidden" />
                </label>
                <input
                  value={input}
                  onChange={e => setInput(e.target.value)}
                  onKeyDown={e => e.key === 'Enter' && handleSend()}
                  placeholder={uploading ? '⏳ Mengupload...' : 'Tulis pesan...'}
                  disabled={uploading}
                  className="flex-1 px-4 py-2.5 border rounded-full focus:outline-none focus:ring-2 focus:ring-purple-500 text-sm"
                />
                <button type="button" onClick={handleSend}
                  disabled={sending || uploading || (!input.trim() && !fileUrl)}
                  className="bg-purple-600 text-white p-2.5 rounded-full disabled:opacity-50">
                  <FiSend size={18} />
                </button>
              </div>
            </>
          )}
        </div>
      </div>
    </div>
  );
}