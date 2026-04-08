import React, { useEffect, useMemo, useState } from "react";
import axios from "axios";
import { serverURL } from "../../App.jsx";
import TopNavbar from "../../components/TopNavbar.jsx";
import { useToast } from "../../context/ToastContext.jsx";
import { FaComments, FaPaperPlane, FaTrash } from "react-icons/fa";

function GigChat() {
  const { showToast } = useToast();
  const [conversations, setConversations] = useState([]);
  const [active, setActive] = useState(null);
  const [messages, setMessages] = useState([]);
  const [text, setText] = useState("");
  const [sending, setSending] = useState(false);
  const [search, setSearch] = useState("");

  const avatarFor = (email) => {
    const ch = (email || "?").trim().charAt(0).toUpperCase();
    return ch || "?";
  };
  const formatDate = (iso) => {
    const d = new Date(iso);
    return d.toLocaleDateString(undefined, { year: "numeric", month: "short", day: "numeric" });
  };
  const formatTime = (iso) => {
    const d = new Date(iso);
    return d.toLocaleTimeString(undefined, { hour: "2-digit", minute: "2-digit" });
  };
  const loadConversations = async () => {
    try {
      const res = await axios.get(`${serverURL}/gigs/conversations`, { withCredentials: true });
      setConversations(res.data?.data || []);
    } catch (e) {
      showToast(e?.response?.data?.message || "Failed to load conversations", "error");
    }
  };

  const deleteConversation = async (id) => {
    try {
      await axios.delete(`${serverURL}/gigs/conversations/${id}`, { withCredentials: true });
      setConversations((prev) => prev.filter((c) => c._id !== id));
      if (active === id) {
        setActive(null);
        setMessages([]);
      }
      showToast("Conversation deleted", "success");
    } catch (e) {
      showToast(e?.response?.data?.message || "Failed to delete conversation", "error");
    }
  };

  const loadMessages = async (convId) => {
    try {
      const res = await axios.get(`${serverURL}/gigs/messages/${convId}`, { withCredentials: true });
      setMessages(res.data?.data || []);
    } catch (e) {
      showToast(e?.response?.data?.message || "Failed to load messages", "error");
    }
  };

  const sendMessage = async () => {
    if (!active || !text.trim()) return;
    try {
      setSending(true);
      const res = await axios.post(
        `${serverURL}/gigs/message/${active}`,
        { message_text: text },
        { withCredentials: true }
      );
      showToast(res.data?.message || "Sent", "success");
      setText("");
      loadMessages(active);
    } catch (e) {
      showToast(e?.response?.data?.message || "Failed to send", "error");
    } finally {
      setSending(false);
    }
  };

  useEffect(() => { loadConversations(); }, []);

  const filteredConversations = useMemo(() => {
    const q = search.trim().toLowerCase();
    if (!q) return conversations;
    return conversations.filter((c) => {
      const title = c?.event?.title || c?.event?.name || c?.pool?.pool_name || c?.pool?.name || "";
      return title.toLowerCase().includes(q);
    });
  }, [search, conversations]);

  const selectedConversation = useMemo(
    () => conversations.find((c) => c._id === active) || null,
    [conversations, active]
  );
  const messagesWithSeparators = useMemo(() => {
    const arr = [];
    let lastDate = "";
    (messages || []).forEach((m) => {
      const ds = formatDate(m.createdAt || m.timestamp);
      if (ds !== lastDate) {
        arr.push({ type: "separator", id: `sep-${ds}`, label: ds });
        lastDate = ds;
      }
      arr.push({ type: "message", data: m });
    });
    return arr;
  }, [messages]);
  return (
    <div className="min-h-screen bg-gradient-to-br from-slate-50 via-purple-50 to-indigo-50">
      <TopNavbar title="Chat with Organizer" />
      <main className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8">
        <div className="flex flex-col lg:flex-row gap-6">
          {/* Conversations list */}
          <div className="basis-[30%] shrink-0 bg-white rounded-2xl shadow p-4 h-[75vh] overflow-y-auto">
            <div className="flex items-center justify-between mb-3">
              <h3 className="font-semibold flex items-center gap-2"><FaComments /> Conversations</h3>
            </div>
            <div className="mb-3">
              <input
                value={search}
                onChange={(e) => setSearch(e.target.value)}
                placeholder="Search by event or pool"
                className="w-full border rounded-md px-3 py-2 text-sm"
              />
            </div>
            <div className="space-y-2">
              {filteredConversations.length === 0 ? (
                <p className="text-gray-600">No conversations yet.</p>
              ) : (
                filteredConversations.map((c) => (
                  <div
                    key={c._id}
                    className={`w-full text-left border rounded-md px-3 py-2 hover:bg-gray-50 transition cursor-pointer ${active === c._id ? "bg-indigo-50 border-indigo-600" : ""}`}
                    onClick={() => { setActive(c._id); loadMessages(c._id); }}
                  >
                    <div className="flex items-center gap-3">
                      {c?.pool?.organizer?.avatar || c?.pool?.organizer?.photo ? (
                        <img
                          src={c?.pool?.organizer?.avatar || c?.pool?.organizer?.photo}
                          alt="Organizer"
                          className="w-8 h-8 rounded-full object-cover"
                        />
                      ) : (
                        <div className="w-8 h-8 rounded-full bg-indigo-200 flex items-center justify-center text-indigo-800 text-sm font-bold">
                          {avatarFor(c?.pool?.organizer?.email)}
                        </div>
                      )}
                      <div className="min-w-0 flex-1">
                        <p className="font-semibold text-gray-900 truncate">{c?.event?.title || c?.event?.name || c?.pool?.pool_name || c?.pool?.name || "Conversation"}</p>
                        <p className="text-xs text-gray-600 truncate">
                          {c?.pool?.organizer?.fullName || `${c?.pool?.organizer?.first_name || ""} ${c?.pool?.organizer?.last_name || ""}`.trim() || c?.pool?.organizer?.email || "Organizer"} • Pool: {c?.pool?.pool_name || c?.pool?.name || "N/A"}
                        </p>
                      </div>
                      <button
                        className="ml-auto text-rose-600 hover:text-rose-800 p-2 hover:bg-rose-50 rounded-full transition-colors shrink-0"
                        onClick={(e) => { e.stopPropagation(); deleteConversation(c._id); }}
                        title="Delete conversation"
                      >
                        <FaTrash />
                      </button>
                    </div>
                  </div>
                ))
              )}
            </div>
          </div>

          {/* Chat thread */}
          <div className="basis-[60%] grow bg-white rounded-2xl shadow p-4 h-[75vh] flex flex-col">
            {active && selectedConversation ? (
              <div className="flex flex-col md:h-full">
                <div className="flex items-center justify-between mb-2">
                  <div className="flex items-center gap-3">
                    {selectedConversation?.pool?.organizer?.avatar || selectedConversation?.pool?.organizer?.photo ? (
                      <img
                        src={selectedConversation?.pool?.organizer?.avatar || selectedConversation?.pool?.organizer?.photo}
                        alt="Organizer"
                        className="w-10 h-10 rounded-full object-cover"
                      />
                    ) : (
                      <div className="w-10 h-10 rounded-full bg-indigo-200 flex items-center justify-center text-indigo-800 text-sm font-bold">
                        {avatarFor(selectedConversation?.pool?.organizer?.email)}
                      </div>
                    )}
                    <div>
                      <h3 className="text-lg font-bold text-gray-900">{selectedConversation?.pool?.organizer?.fullName || `${selectedConversation?.pool?.organizer?.first_name || ""} ${selectedConversation?.pool?.organizer?.last_name || ""}`.trim() || selectedConversation?.pool?.organizer?.email || "Organizer"}</h3>
                      <p className="text-xs text-gray-600">{selectedConversation?.event?.title || selectedConversation?.event?.name || "Event"} • Pool: {selectedConversation?.pool?.pool_name || selectedConversation?.pool?.name || "N/A"}</p>
                    </div>
                  </div>
                  <button onClick={() => setMessages([])} className="px-3 py-2 text-xs bg-red-600 text-white rounded-lg flex items-center gap-2">
                    <FaTrash />
                    Clear Chat
                  </button>
                </div>
                <div className="flex-1 overflow-y-auto border rounded-md p-3 space-y-2 bg-slate-50">
                  {messages.length === 0 ? (
                    <p className="text-gray-600">No messages yet. Say hello!</p>
                  ) : (
                    messagesWithSeparators.map((item) =>
                      item.type === "separator" ? (
                        <div key={item.id} className="flex justify-center my-2">
                          <span className="px-3 py-1 text-xs bg-gray-200 text-gray-700 rounded-full">{item.label}</span>
                        </div>
                      ) : (
                        <div
                          key={item.data._id}
                          className={`max-w-[80%] flex items-end gap-2 ${item.data?.sender?.role === "gig" ? "ml-auto flex-row-reverse" : ""}`}
                        >
                        {item.data?.sender?.role === "organizer" && (item.data?.sender?.profile_image_url || item.data?.sender?.avatar || item.data?.sender?.photo) ? (
                          <img
                            src={item.data?.sender?.profile_image_url || item.data?.sender?.avatar || item.data?.sender?.photo}
                            alt="Organizer"
                            className="w-6 h-6 rounded-full object-cover"
                          />
                        ) : (
                          <div className="w-6 h-6 rounded-full bg-gray-200 flex items-center justify-center text-xs text-gray-700">
                            {avatarFor(item.data?.sender?.email)}
                          </div>
                        )}
                          <div className={`p-2 rounded-2xl shadow-sm ${item.data?.sender?.role === "gig" ? "bg-indigo-100" : "bg-gray-100"}`}>
                            <p className="text-xs text-gray-500">{item.data?.sender?.email || item.data?.sender_email}</p>
                            <p className="text-sm text-gray-900 break-words">{item.data?.message_text || item.data?.content || ""}</p>
                            <div className="text-[10px] text-gray-500 mt-1 text-right">
                              {formatTime(item.data?.createdAt || item.data?.timestamp)}
                            </div>
                          </div>
                        </div>
                      )
                    )
                  )}
                </div>
                <div className="mt-3 flex gap-2">
                  <input
                    className="flex-1 border rounded-md px-3 py-2"
                    placeholder="Type a message"
                    value={text}
                    onChange={(e) => setText(e.target.value)}
                    onKeyDown={(e) => {
                      if (e.key === 'Enter' && !e.shiftKey) {
                        e.preventDefault();
                        sendMessage();
                      }
                    }}
                  />
                  <button className="px-4 py-2 bg-indigo-600 text-white rounded-md flex items-center gap-2" onClick={sendMessage} disabled={sending}>
                    <FaPaperPlane />
                    <span>{sending ? "Sending..." : "Send"}</span>
                  </button>
                </div>
              </div>
            ) : (
              <div className="text-center text-gray-600">Select a conversation to start chatting.</div>
            )}
          </div>
        </div>
      </main>
    </div>
  );
}

export default GigChat;
