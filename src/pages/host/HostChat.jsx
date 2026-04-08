import React, { useEffect, useState, useMemo } from "react";
import { useNavigate, useParams } from "react-router-dom";
import axios from "axios";
import { serverURL } from "../../App";
import { FaComments, FaArrowLeft, FaPaperPlane, FaTrash } from "react-icons/fa";

function HostChat() {
  const navigate = useNavigate();
  const { conversationId } = useParams();
  const [conversations, setConversations] = useState([]);
  const [messages, setMessages] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);
  const [messageText, setMessageText] = useState("");
  const [sending, setSending] = useState(false);
  const [conversationSearch, setConversationSearch] = useState("");

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

  useEffect(() => {
    const init = async () => {
      await loadConversations();
      if (conversationId) {
        await loadMessages(conversationId);
      }
      setLoading(false);
    };
    init();
  }, [conversationId]);

  const loadConversations = async () => {
    try {
      const res = await axios.get(`${serverURL}/host/conversations`, { withCredentials: true });
      setConversations(res.data?.data || []);
    } catch (e) {
      setError(e.response?.data?.message || "Failed to fetch conversations");
    }
  };

  const deleteConversation = async (id) => {
    try {
      await axios.delete(`${serverURL}/host/conversations/${id}`, { withCredentials: true });
      setConversations((prev) => prev.filter((c) => c._id !== id));
      if (conversationId === id) {
        setMessages([]);
      }
    } catch (e) {
      setError(e.response?.data?.message || "Failed to delete conversation");
    }
  };

  const loadMessages = async (id) => {
    try {
      const res = await axios.get(`${serverURL}/host/messages/${id}`, { withCredentials: true });
      setMessages(res.data?.data || []);
    } catch (e) {
      setError(e.response?.data?.message || "Failed to fetch messages");
    }
  };

  const sendMessage = async () => {
    if (!conversationId || !messageText.trim()) return;
    setSending(true);
    try {
      await axios.post(
        `${serverURL}/host/message/${conversationId}`,
        { message_text: messageText },
        { withCredentials: true }
      );
      setMessageText("");
      await loadMessages(conversationId);
    } catch (e) {
      setError(e.response?.data?.message || "Failed to send message");
    } finally {
      setSending(false);
    }
  };

  const selectedConversation = useMemo(
    () => conversations.find((c) => c._id === conversationId) || null,
    [conversations, conversationId]
  );

  const filteredConversations = useMemo(() => {
    const q = conversationSearch.trim().toLowerCase();
    if (!q) return conversations;
    return conversations.filter((c) => {
      const title = c?.event?.title || c?.pool?.pool_name || "";
      const org = c?.organizer?.name || c?.organizer?.email || "";
      return title.toLowerCase().includes(q) || org.toLowerCase().includes(q);
    });
  }, [conversationSearch, conversations]);

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

  if (loading) {
    return (
      <div className="min-h-screen flex items-center justify-center bg-gradient-to-br from-slate-50 via-purple-50 to-indigo-50">
        <div className="text-center">
          <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-purple-600 mx-auto mb-4"></div>
          <p className="text-gray-600">Loading chat...</p>
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-gradient-to-br from-slate-50 via-gray-50 to-indigo-50">
      <header className="bg-white/95 backdrop-blur-md shadow-lg sticky top-0 z-40">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="flex items-center justify-between h-16">
            <div className="flex items-center space-x-3">
              <button onClick={() => navigate(-1)} className="p-2 text-gray-600 hover:text-purple-600">
                <FaArrowLeft />
              </button>
              <h1 className="text-xl font-extrabold bg-gradient-to-r from-purple-600 via-indigo-600 to-pink-600 bg-clip-text text-transparent">
                Host Chat
              </h1>
            </div>
          </div>
        </div>
      </header>

      <main className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-6">
        {error && (
          <div className="mb-4 p-3 bg-red-50 text-red-600 rounded-lg">{error}</div>
        )}

        <div className="flex flex-col lg:flex-row gap-6">
          {/* Conversations list */}
          <div className="basis-[30%] shrink-0 bg-white rounded-2xl shadow-lg p-6 h-[75vh] overflow-y-auto">
            <div className="flex items-center justify-between mb-4">
              <h3 className="text-lg font-bold text-gray-900 flex items-center gap-2">
                <FaComments />
                Conversations
              </h3>
            </div>
            <div className="mb-4">
              <input
                value={conversationSearch}
                onChange={(e) => setConversationSearch(e.target.value)}
                placeholder="Search by event or organizer"
                className="w-full border rounded-lg px-3 py-2 text-sm"
              />
            </div>

            {filteredConversations.length === 0 ? (
              <p className="text-gray-600">No conversations yet.</p>
            ) : (
              <div className="space-y-2">
                {filteredConversations.map((c) => (
                  <div
                    key={c._id}
                    onClick={() => navigate(`/host/chat/${c._id}`)}
                    className={`w-full text-left p-3 border rounded-lg hover:bg-gray-50 transition cursor-pointer ${c._id === conversationId ? "border-indigo-600" : ""}`}
                  >
                    <div className="flex items-center gap-3">
                      {c?.pool?.organizer?.profile_image_url || c?.pool?.organizer?.avatar || c?.pool?.organizer?.photo ? (
                        <img
                          src={c?.pool?.organizer?.profile_image_url || c?.pool?.organizer?.avatar || c?.pool?.organizer?.photo}
                          alt="Organizer"
                          className="w-8 h-8 rounded-full object-cover"
                        />
                      ) : (
                        <div className="w-8 h-8 rounded-full bg-green-200 flex items-center justify-center text-green-800 text-sm font-bold">
                          {avatarFor(c?.pool?.organizer?.email)}
                        </div>
                      )}
                      <div className="min-w-0 flex-1">
                        <p className="font-semibold text-gray-900 truncate">{c?.event?.title || c?.pool?.pool_name || "Conversation"}</p>
                        <p className="text-xs text-gray-600 truncate">{c?.pool?.organizer?.fullName || `${c?.pool?.organizer?.first_name} ${c?.pool?.organizer?.last_name}` || c?.pool?.organizer?.email || "Organizer"} • Pool: {c?.pool?.pool_name || "N/A"}</p>
                      </div>
                      <button
                        className="ml-auto text-rose-600 hover:text-rose-800 p-2 hover:bg-rose-50 rounded-full transition-colors shrink-0"
                        onClick={(e) => {
                          e.stopPropagation();
                          deleteConversation(c._id);
                        }}
                        title="Delete conversation"
                      >
                        <FaTrash />
                      </button>
                    </div>
                  </div>
                ))}
              </div>
            )}
          </div>

          {/* Chat thread */}
          <div className="basis-[60%] grow bg-white rounded-2xl shadow-lg p-6 h-[75vh] flex flex-col">
            {conversationId && selectedConversation ? (
              <div className="flex flex-col md:h-full">
                <div className="flex items-center justify-between mb-4">
                  <div className="flex items-center gap-3">
                    {selectedConversation?.pool?.organizer?.profile_image_url || selectedConversation?.pool?.organizer?.avatar || selectedConversation?.pool?.organizer?.photo ? (
                      <img
                        src={selectedConversation?.pool?.organizer?.profile_image_url || selectedConversation?.pool?.organizer?.avatar || selectedConversation?.pool?.organizer?.photo}
                        alt="Organizer"
                        className="w-10 h-10 rounded-full object-cover"
                      />
                    ) : (
                      <div className="w-10 h-10 rounded-full bg-green-200 flex items-center justify-center text-green-800 font-bold">
                        {avatarFor(selectedConversation?.pool?.organizer?.email)}
                      </div>
                    )}
                    <div>
                      <h3 className="text-lg font-bold text-gray-900">{selectedConversation?.pool?.organizer?.fullName || `${selectedConversation?.pool?.organizer?.first_name} ${selectedConversation?.pool?.organizer?.last_name}` || selectedConversation?.pool?.organizer?.email || "Organizer"}</h3>
                      <p className="text-xs text-gray-600">{selectedConversation?.event?.title || "Event"} • Pool: {selectedConversation?.pool?.pool_name || "N/A"}</p>
                    </div>
                  </div>
                  <button onClick={() => setMessages([])} className="px-3 py-2 text-xs bg-red-600 text-white rounded-lg flex items-center gap-2">
                    <FaTrash />
                    Clear Chat
                  </button>
                </div>

                <div className="flex-1 overflow-y-auto space-y-2 border rounded-lg p-3 bg-slate-50">
                  {messages.length === 0 ? (
                    <p className="text-gray-600">No messages yet. Say hello!</p>
                  ) : (
                    messagesWithSeparators.map((item) =>
                      item.type === "separator" ? (
                        <div key={item.id} className="flex justify-center my-2">
                          <span className="px-3 py-1 text-xs bg-gray-200 text-gray-700 rounded-full">{item.label}</span>
                        </div>
                      ) : (
                        <div key={item.data._id} className={`max-w-[80%] flex items-end gap-2 ${item.data?.sender?.role === "host" ? "ml-auto flex-row-reverse" : ""}`}>
                        {item.data?.sender?.role === "organizer" && (selectedConversation?.pool?.organizer?.profile_image_url || selectedConversation?.pool?.organizer?.avatar || selectedConversation?.pool?.organizer?.photo) ? (
                          <img
                            src={selectedConversation?.pool?.organizer?.profile_image_url || selectedConversation?.pool?.organizer?.avatar || selectedConversation?.pool?.organizer?.photo}
                            alt="Organizer"
                            className="w-6 h-6 rounded-full object-cover"
                          />
                        ) : (
                          <div className="w-6 h-6 rounded-full bg-gray-200 flex items-center justify-center text-xs text-gray-700">
                            {avatarFor(item.data?.sender?.email)}
                          </div>
                        )}
                          <div className={`p-2 rounded-2xl shadow-sm ${item.data?.sender?.role === "host" ? "bg-green-100" : "bg-gray-100"}`}>
                            <p className="text-xs text-gray-500">{item.data?.sender?.email}</p>
                            <p className="text-sm text-gray-900">{item.data?.message_text}</p>
                            <div className="text-[10px] text-gray-500 mt-1 text-right">
                              {formatTime(item.data?.createdAt || item.data?.timestamp)}
                            </div>
                          </div>
                        </div>
                      )
                    )
                  )}
                </div>

                <div className="mt-3 flex items-center gap-2">
                  <input
                    value={messageText}
                    onChange={(e) => setMessageText(e.target.value)}
                    placeholder="Type your message"
                    className="flex-1 border rounded-lg px-3 py-2 text-sm"
                    onKeyDown={(e) => {
                      if (e.key === 'Enter' && !e.shiftKey) {
                        e.preventDefault();
                        sendMessage();
                      }
                    }}
                  />
                  <button
                    onClick={sendMessage}
                    disabled={sending}
                    className="px-3 py-2 bg-indigo-600 text-white rounded-lg text-sm flex items-center gap-2"
                  >
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

export default HostChat;
