import React, { useState, useEffect, useRef, useCallback } from "react";
import { BsThreeDots } from "react-icons/bs";
import CentroAdminBg from "../images/CENTRO_ADMIN.png";
import Sidebar from "../components/Sidebar";
import supabase from "../config/supabaseClient";

// Send Button SVG
import SendButtonIcon from "../images/send.png";

export default function MessagesPage() {
  const [activeButton, setActiveButton] = useState("Messages");
  const [selectedChat, setSelectedChat] = useState(null);
  const [messageText, setMessageText] = useState("");
  const [menuOpen, setMenuOpen] = useState(false);
  const [conversations, setConversations] = useState([]);
  const [messages, setMessages] = useState({});
  const [loading, setLoading] = useState(true);
  const [loadingMessages, setLoadingMessages] = useState(false);
  const [loadingOlderMessages, setLoadingOlderMessages] = useState(false);
  const [hasMoreMessages, setHasMoreMessages] = useState({});
  const [currentUser, setCurrentUser] = useState(null);
  const [userProfiles, setUserProfiles] = useState({});
  
  const messagesEndRef = useRef(null);
  const messagesContainerRef = useRef(null);
  const scrollPositionRef = useRef(0);
  const realtimeChannelRef = useRef(null);
  const [sidebarCollapsed, setSidebarCollapsed] = useState(
    localStorage.getItem("sidebarCollapsed") === "true" || false
  );

  const MESSAGES_PER_PAGE = 20;

  const handleButtonClick = (button) => {
    setActiveButton(button);
  };

  // Get current admin user
  useEffect(() => {
    const adminData = JSON.parse(localStorage.getItem("admin"));
    if (adminData?.admin_id) {
      setCurrentUser(adminData.admin_id);
    }
  }, []);

  // Get Philippine time
  const getPhilippineTime = () => {
    return new Date().toLocaleString("en-US", {
      timeZone: "Asia/Manila",
      year: "numeric",
      month: "2-digit",
      day: "2-digit",
      hour: "2-digit",
      minute: "2-digit",
      second: "2-digit",
      hour12: false
    }).replace(/(\d{2})\/(\d{2})\/(\d{4}), (\d{2}):(\d{2}):(\d{2})/, '$3-$1-$2 $4:$5:$6');
  };

  // Format date for dividers
  const formatDateDivider = (timestamp) => {
    try {
      const date = new Date(timestamp);
      const now = new Date();
      
      // Convert to Philippine time
      const phDate = new Date(date.toLocaleString("en-US", { timeZone: "Asia/Manila" }));
      const phNow = new Date(now.toLocaleString("en-US", { timeZone: "Asia/Manila" }));
      
      // Get start of today and yesterday in Philippine time
      const today = new Date(phNow);
      today.setHours(0, 0, 0, 0);
      
      const yesterday = new Date(today);
      yesterday.setDate(yesterday.getDate() - 1);
      
      const messageDate = new Date(phDate);
      messageDate.setHours(0, 0, 0, 0);
      
      if (messageDate.getTime() === today.getTime()) {
        return 'Today';
      } else if (messageDate.getTime() === yesterday.getTime()) {
        return 'Yesterday';
      } else {
        return phDate.toLocaleDateString('en-US', { 
          weekday: 'long', 
          year: 'numeric', 
          month: 'long', 
          day: 'numeric' 
        });
      }
    } catch (error) {
      return '';
    }
  };

  // Check if two dates are on the same day
  const isSameDay = (date1, date2) => {
    const d1 = new Date(date1);
    const d2 = new Date(date2);
    
    const ph1 = new Date(d1.toLocaleString("en-US", { timeZone: "Asia/Manila" }));
    const ph2 = new Date(d2.toLocaleString("en-US", { timeZone: "Asia/Manila" }));
    
    return ph1.toDateString() === ph2.toDateString();
  };

  // Process messages with date dividers
  const processMessagesWithDividers = (messages) => {
    if (!messages || messages.length === 0) return [];
    
    const result = [];
    let currentDate = null;
    
    messages.forEach((message, index) => {
      const messageDate = formatDateDivider(message.timestamp);
      
      // Add date divider if this is the first message or date changed
      if (index === 0 || !isSameDay(messages[index - 1].timestamp, message.timestamp)) {
        result.push({
          type: 'divider',
          date: messageDate,
          id: `divider-${message.timestamp}`
        });
      }
      
      result.push({
        ...message,
        type: 'message'
      });
    });
    
    return result;
  };

  // Scroll to bottom with slight delay to ensure DOM is updated
  const scrollToBottom = (smooth = true) => {
    setTimeout(() => {
      if (messagesEndRef.current) {
        messagesEndRef.current.scrollIntoView({ 
          behavior: smooth ? 'smooth' : 'auto',
          block: 'end'
        });
      }
    }, 100);
  };

  // Fetch user profiles for message display
  const fetchUserProfiles = useCallback(async (userIds) => {
    try {
      const newUserIds = userIds.filter(id => !userProfiles[id] && !id.startsWith('0'));
      
      if (newUserIds.length === 0) return;

      const { data, error } = await supabase
        .from('LoginInformation')
        .select('user_id, firstname, lastname, profile_picture')
        .in('user_id', newUserIds);

      if (error) throw error;

      const profiles = {};
      data.forEach(profile => {
        profiles[profile.user_id] = {
          name: `${profile.firstname || ''} ${profile.lastname || ''}`.trim(),
          avatar: profile.profile_picture && profile.profile_picture.trim() !== '' ? profile.profile_picture : null,
          initials: `${profile.firstname?.charAt(0) || ''}${profile.lastname?.charAt(0) || ''}`
        };
      });

      setUserProfiles(prev => ({ ...prev, ...profiles }));
    } catch (error) {
      console.error('Error fetching user profiles:', error);
    }
  }, [userProfiles]);

  // Get user display name
  const getUserDisplayName = (userId) => {
    if (!userId) return 'Unknown';
    if (userId === currentUser) return 'You';
    if (userId.startsWith('0')) return 'Admin';
    
    const profile = userProfiles[userId];
    if (profile?.name && profile.name !== '') {
      return profile.name;
    }
    
    return 'Unknown User';
  };

  // Get user profile picture
  const getUserAvatar = (userId) => {
    if (!userId || userId === currentUser || userId.startsWith('0')) {
      return null;
    }
    
    const profile = userProfiles[userId];
    return profile?.avatar || null;
  };

  // Get user initials from firstname + lastname
  const getUserInitials = (userId) => {
    if (userId === currentUser) return 'Y';
    if (userId.startsWith('0')) return 'A';
    
    const profile = userProfiles[userId];
    if (profile?.initials && profile.initials !== '') {
      return profile.initials;
    }
    
    return 'U';
  };

  // Format message time for display
  const formatMessageTime = (timestamp) => {
    try {
      const date = new Date(timestamp);
      const now = new Date();
      
      // Convert to Philippine time for comparison
      const phDate = new Date(date.toLocaleString("en-US", { timeZone: "Asia/Manila" }));
      const phNow = new Date(now.toLocaleString("en-US", { timeZone: "Asia/Manila" }));
      
      const diffInHours = (phNow - phDate) / (1000 * 60 * 60);

      if (diffInHours < 24) {
        return phDate.toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' });
      } else if (diffInHours < 48) {
        return 'Yesterday';
      } else {
        return phDate.toLocaleDateString([], { month: 'short', day: 'numeric' });
      }
    } catch (error) {
      return '';
    }
  };

  // Start real-time listener for the selected chat
  const startRealtimeListener = useCallback((eventId) => {
    if (!eventId || !currentUser) return;

    console.log(`🔄 Starting realtime listener for event: ${eventId}`);

    // Clean up existing subscription
    if (realtimeChannelRef.current) {
      realtimeChannelRef.current.unsubscribe();
    }

    // Create new channel for this event
    const channel = supabase.channel(`messages_channel_${eventId}`)
      .on(
        'postgres_changes',
        {
          event: 'INSERT',
          schema: 'public',
          table: 'Messages',
          filter: `event_id=eq.${eventId}`
        },
        async (payload) => {
          console.log('📨 New payload received:', payload.new);
          
          const newData = payload.new;
          if (!newData) return;

          // Prevent double-message for the current user
          if (newData.sender_id === currentUser) {
            console.log('🚫 Skipping own message to prevent duplicate');
            return;
          }

          // Fetch sender info if not already cached
          let senderName = getUserDisplayName(newData.sender_id);
          if (senderName === 'Unknown User' && !newData.sender_id.startsWith('0')) {
            try {
              const { data: userRes } = await supabase
                .from('LoginInformation')
                .select('firstname, lastname, profile_picture')
                .eq('user_id', newData.sender_id)
                .single();

              if (userRes) {
                const fullName = `${userRes.firstname || ''} ${userRes.lastname || ''}`.trim();
                const newProfile = {
                  name: fullName,
                  avatar: userRes.profile_picture && userRes.profile_picture.trim() !== '' ? userRes.profile_picture : null,
                  initials: `${userRes.firstname?.charAt(0) || ''}${userRes.lastname?.charAt(0) || ''}`
                };

                // Update user profiles cache
                setUserProfiles(prev => ({
                  ...prev,
                  [newData.sender_id]: newProfile
                }));

                senderName = fullName || 'Unknown User';
              }
            } catch (error) {
              console.error('Error fetching sender info:', error);
              senderName = 'Unknown User';
            }
          }

          // Parse timestamp safely
          const timestamp = new Date(newData.created_at);
          const phTime = new Date(timestamp.toLocaleString("en-US", { timeZone: "Asia/Manila" }));

          const newMessage = {
            id: newData.id,
            sender: senderName,
            senderId: newData.sender_id,
            senderInitial: getUserInitials(newData.sender_id),
            senderAvatar: getUserAvatar(newData.sender_id),
            text: newData.content,
            time: phTime.toLocaleTimeString([], {
              hour: '2-digit',
              minute: '2-digit'
            }),
            timestamp: newData.created_at,
            mine: false // always false since it's NOT the current user
          };

          // Add message to the selected chat
          setMessages(prev => ({
            ...prev,
            [eventId]: [...(prev[eventId] || []), newMessage]
          }));

          // Update conversation list with latest message
          setConversations(prev =>
            prev.map(c => c.id === eventId ? {
              ...c,
              msg: `${senderName}: ${newMessage.text}`,
              time: newMessage.time,
              lastMessageTime: newMessage.timestamp,
              unread: selectedChat !== eventId ? true : false // Mark as unread if not currently viewing
            } : c)
          );

          // Auto-scroll to bottom for new messages
          scrollToBottom();

          console.log('✅ New message added to state');
        }
      )
      .subscribe((status, err) => {
        console.log(`🔔 Realtime status: ${status}`);
        if (err) console.error('❌ Realtime error:', err);
      });

    realtimeChannelRef.current = channel;
  }, [currentUser, selectedChat, getUserDisplayName, getUserInitials, getUserAvatar]);

  // Clean up real-time subscription on unmount or chat change
  useEffect(() => {
    return () => {
      if (realtimeChannelRef.current) {
        console.log('🧹 Cleaning up realtime subscription');
        realtimeChannelRef.current.unsubscribe();
      }
    };
  }, []);

  // Start real-time listener when chat is selected
  useEffect(() => {
    if (selectedChat && currentUser) {
      startRealtimeListener(selectedChat);
    }
  }, [selectedChat, currentUser, startRealtimeListener]);

  // Fetch events that the current admin's NGO is involved in
  const fetchConversations = useCallback(async () => {
    if (!currentUser) return;

    try {
      setLoading(true);
      
      // Get admin's NGO code
      const { data: ngoData, error: ngoError } = await supabase
        .from('NGO_Information')
        .select('ngo_code, name')
        .eq('admin_id', currentUser)
        .single();

      if (ngoError) throw ngoError;

      // Get events for this NGO
      const { data: events, error: eventsError } = await supabase
        .from('Event_Information')
        .select('event_id, event_title, event_image, ngo_id')
        .eq('ngo_id', ngoData.ngo_code)
        .order('created_at', { ascending: false });

      if (eventsError) throw eventsError;

      // Get all user IDs from messages for profile fetching
      const allUserIds = new Set();

      // Get latest message for each event and collect user IDs
      const conversationsData = await Promise.all(
        events.map(async (event) => {
          const { data: latestMessage } = await supabase
            .from('Messages')
            .select('*')
            .eq('event_id', event.event_id)
            .order('created_at', { ascending: false })
            .limit(1);

          if (latestMessage?.[0]?.sender_id) {
            allUserIds.add(latestMessage[0].sender_id);
          }

          // Get member count for this event
          const { data: members } = await supabase
            .from('Event_User')
            .select('user_id')
            .eq('event_id', event.event_id)
            .eq('status', 'ONGOING');

          const memberCount = (members?.length || 0) + 1;

          return {
            id: event.event_id,
            title: event.event_title,
            img: event.event_image || '/default-event-image.jpg',
            members: `${memberCount} members`,
            msg: latestMessage?.[0] ? 
              `${latestMessage[0].sender_id === currentUser ? 'You' : 'User'}: ${latestMessage[0].content}` : 
              'No messages yet',
            time: latestMessage?.[0] ? 
              formatMessageTime(latestMessage[0].created_at) : 
              '',
            unread: false,
            lastMessageTime: latestMessage?.[0]?.created_at,
            lastMessageSenderId: latestMessage?.[0]?.sender_id
          };
        })
      );

      // Fetch all user profiles at once
      if (allUserIds.size > 0) {
        await fetchUserProfiles(Array.from(allUserIds));
        
        // Update conversation messages with proper names after profiles are fetched
        setTimeout(() => {
          setConversations(prev => prev.map(conv => {
            if (conv.lastMessageSenderId) {
              const senderName = getUserDisplayName(conv.lastMessageSenderId);
              const messageContent = conv.msg.split(': ').slice(1).join(': ');
              return {
                ...conv,
                msg: `${senderName}: ${messageContent}`
              };
            }
            return conv;
          }));
        }, 100);
      }

      // Sort by last message time
      conversationsData.sort((a, b) => {
        if (!a.lastMessageTime) return 1;
        if (!b.lastMessageTime) return -1;
        return new Date(b.lastMessageTime) - new Date(a.lastMessageTime);
      });

      setConversations(conversationsData);
    } catch (error) {
      console.error('Error fetching conversations:', error);
    } finally {
      setLoading(false);
    }
  }, [currentUser, fetchUserProfiles]);

  // Fetch messages for selected conversation
  const fetchMessages = useCallback(async (eventId, offset = 0, isLoadingOlder = false) => {
    if (!eventId) return;

    try {
      if (isLoadingOlder) {
        setLoadingOlderMessages(true);
      } else {
        setLoadingMessages(true);
      }

      const { data, error } = await supabase
        .from('Messages')
        .select('*')
        .eq('event_id', eventId)
        .order('created_at', { ascending: false })
        .range(offset, offset + MESSAGES_PER_PAGE - 1);

      if (error) throw error;

      // Get unique user IDs for profile fetching
      const userIds = [...new Set(data.map(msg => msg.sender_id))];
      await fetchUserProfiles(userIds);

      const formattedMessages = data.reverse().map(msg => {
        const msgDate = new Date(msg.created_at);
        const phTime = new Date(msgDate.toLocaleString("en-US", { timeZone: "Asia/Manila" }));
        
        return {
          id: msg.id,
          sender: getUserDisplayName(msg.sender_id),
          senderId: msg.sender_id,
          senderInitial: getUserInitials(msg.sender_id),
          senderAvatar: getUserAvatar(msg.sender_id),
          text: msg.content,
          time: phTime.toLocaleTimeString([], {
            hour: '2-digit',
            minute: '2-digit'
          }),
          timestamp: msg.created_at,
          mine: msg.sender_id === currentUser
        };
      });

      setMessages(prev => ({
        ...prev,
        [eventId]: isLoadingOlder ? 
          [...formattedMessages, ...(prev[eventId] || [])] :
          formattedMessages
      }));

      setHasMoreMessages(prev => ({
        ...prev,
        [eventId]: data.length === MESSAGES_PER_PAGE
      }));

      // Scroll to bottom for new chats, maintain position for older messages
      if (!isLoadingOlder) {
        scrollToBottom(false); // Immediate scroll for new chats
      }

    } catch (error) {
      console.error('Error fetching messages:', error);
    } finally {
      if (isLoadingOlder) {
        setLoadingOlderMessages(false);
      } else {
        setLoadingMessages(false);
      }
    }
  }, [currentUser, fetchUserProfiles, getUserDisplayName, getUserInitials, getUserAvatar]);

  // Handle scroll to load older messages
  const handleScroll = useCallback(() => {
    const container = messagesContainerRef.current;
    if (!container || !selectedChat || loadingOlderMessages) return;

    if (container.scrollTop === 0 && hasMoreMessages[selectedChat]) {
      const currentMessages = messages[selectedChat] || [];
      fetchMessages(selectedChat, currentMessages.length, true);
    }
  }, [selectedChat, loadingOlderMessages, hasMoreMessages, messages, fetchMessages]);

  // Handle chat selection
  const handleSelectChat = async (eventId) => {
    setSelectedChat(eventId);
    
    // Mark as read
    setConversations(prev =>
      prev.map(c => c.id === eventId ? { ...c, unread: false } : c)
    );

    // Fetch messages if not already loaded
    if (!messages[eventId]) {
      await fetchMessages(eventId);
    } else {
      // If messages already loaded, scroll to bottom immediately
      scrollToBottom(false);
    }
  };

  // Send message
  const handleSend = async () => {
    if (!messageText.trim() || !selectedChat || !currentUser) return;

    try {
      const messageId = `MSG_${Date.now()}`;
      const phTime = getPhilippineTime();
      
      const { error } = await supabase
        .from('Messages')
        .insert({
          id: messageId,
          sender_id: currentUser,
          event_id: selectedChat,
          content: messageText.trim(),
          created_at: phTime
        });

      if (error) throw error;

      // Add message to local state immediately (optimistic update)
      const newMessage = {
        id: messageId,
        sender: 'You',
        senderId: currentUser,
        senderInitial: 'Y',
        senderAvatar: null,
        text: messageText.trim(),
        time: new Date().toLocaleTimeString([], {
          hour: '2-digit',
          minute: '2-digit'
        }),
        timestamp: phTime,
        mine: true
      };

      setMessages(prev => ({
        ...prev,
        [selectedChat]: [...(prev[selectedChat] || []), newMessage]
      }));

      // Update conversation list
      setConversations(prev =>
        prev.map(c => c.id === selectedChat ? {
          ...c,
          msg: `You: ${newMessage.text}`,
          time: newMessage.time,
          lastMessageTime: newMessage.timestamp
        } : c)
      );

      setMessageText('');
      
      // Auto-scroll to bottom after sending
      scrollToBottom();
    } catch (error) {
      console.error('Error sending message:', error);
      alert('Failed to send message. Please try again.');
    }
  };

  // Initialize
  useEffect(() => {
    if (currentUser) {
      fetchConversations();
    }
  }, [currentUser, fetchConversations]);

  // Update conversation names when user profiles are loaded
  useEffect(() => {
    if (Object.keys(userProfiles).length > 0) {
      setConversations(prev => prev.map(conv => {
        if (conv.lastMessageSenderId && conv.lastMessageSenderId !== currentUser) {
          const senderName = getUserDisplayName(conv.lastMessageSenderId);
          const messageContent = conv.msg.split(': ').slice(1).join(': ');
          return {
            ...conv,
            msg: `${senderName}: ${messageContent}`
          };
        }
        return conv;
      }));

      // Update existing messages with proper names
      setMessages(prev => {
        const updated = { ...prev };
        Object.keys(updated).forEach(eventId => {
          updated[eventId] = updated[eventId].map(msg => ({
            ...msg,
            sender: getUserDisplayName(msg.senderId),
            senderInitial: getUserInitials(msg.senderId),
            senderAvatar: getUserAvatar(msg.senderId)
          }));
        });
        return updated;
      });
    }
  }, [userProfiles, currentUser]);

  const currentChat = conversations.find(c => c.id === selectedChat);
  const currentMessages = messages[selectedChat] || [];
  const messagesWithDividers = processMessagesWithDividers(currentMessages);

  if (loading) {
    return (
      <div
        className="flex min-h-screen bg-no-repeat bg-center"
        style={{
          backgroundImage: `url(${CentroAdminBg})`,
          backgroundSize: "cover",
        }}
      >
         <Sidebar onCollapseChange={setSidebarCollapsed} />

<main className="flex-1 p-4 overflow-y-auto transition-all duration-300"
        style={{ marginLeft: sidebarCollapsed ? "5rem" : "16rem" }}
      >  
          <div className="text-center">
            <div className="animate-spin rounded-full h-16 w-16 border-b-4 border-emerald-900 mx-auto"></div>
            <p className="mt-4 text-emerald-900 font-semibold text-lg">Loading chats...</p>
          </div>
        </main>
      </div>
    );
  }

  return (
    <div
      className="flex min-h-screen bg-no-repeat bg-center"
      style={{
        backgroundImage: `url(${CentroAdminBg})`,
        backgroundSize: "cover",
      }}
    >
         <Sidebar onCollapseChange={setSidebarCollapsed} />

      <main className="flex-1 ml-64 flex h-screen" style={{ marginLeft: sidebarCollapsed ? "5rem" : "16rem" }}>
        {/* Chat List */}
            <div className="w-[480px] flex flex-col bg-white border-r border-gray-300 shadow-lg flex-shrink-0">

          <div className="px-5 h-16 flex items-center justify-between border-b border-gray-400 bg-emerald-800">
            <h2 className="text-xl font-bold text-white">Chats</h2>
          </div>
          <div className="flex-1 overflow-y-auto p-3 space-y-3">
            {conversations.length === 0 ? (
              <div className="text-center text-gray-500 mt-10">
                <p>No events found</p>
              </div>
            ) : (
              conversations.map(({ id, img, title, members, msg, time, unread }) => (
                <div
                  key={id}
                  onClick={() => handleSelectChat(id)}
                  className={`flex items-center justify-between p-4 rounded-lg border-2 shadow cursor-pointer transition-all ${
                    selectedChat === id
                      ? "bg-gray-300 border-gray-500"
                      : "bg-white border-gray-300 hover:border-gray-500"
                  }`}
                >
                  <div className="flex items-center gap-3">
                    <img
                      src={img}
                      alt={title}
                      className="w-12 h-12 rounded-full object-cover shadow-md border-2 border-white"
                      onError={(e) => {
                        e.target.src = '/default-event-image.jpg';
                      }}
                    />
                    <div className="w-40">
                      <h3
                        className={`truncate ${
                          unread ? "font-bold text-black" : "font-semibold text-gray-700"
                        }`}
                      >
                        {title}
                      </h3>
                      <p className="text-[10px] text-gray-500">{members}</p>
                      {msg && (
                        <p
                          className={`text-xs ${
                            unread ? "font-bold text-black" : "text-gray-600"
                          } truncate w-64`}
                        >
                          {msg}
                        </p>
                      )}
                    </div>
                  </div>
                  <div className="flex flex-col items-end gap-1">
                    <span
                      className={`text-xs ${
                        unread ? "font-bold text-black" : "text-gray-600"
                      }`}
                    >
                      {time}
                    </span>
                    {unread && selectedChat !== id && (
                      <span className="w-2.5 h-2.5 rounded-full bg-emerald-600"></span>
                    )}
                  </div>
                </div>
              ))
            )}
          </div>
        </div>

        {/* Chat Window */}
        <div className="flex-1 h-screen flex flex-col bg-emerald-50 shadow-inner">
          {currentChat ? (
            <>
              {/* Header */}
              <div className="flex items-center justify-between px-5 h-16 border-b border-gray-400 bg-emerald-800 shadow relative">
                <div className="flex items-center gap-3">
                  <img
                    src={currentChat.img}
                    alt={currentChat.title}
                    className="w-12 h-12 rounded-full object-cover shadow"
                    onError={(e) => {
                      e.target.src = '/default-event-image.jpg';
                    }}
                  />
                  <div>
                    <h3 className="font-semibold text-white text-lg">
                      {currentChat.title}
                    </h3>
                    <p className="text-xs text-white">{currentChat.members}</p>
                  </div>
                </div>
                <div className="relative">
                  <button
                    className="text-white text-2xl hover:text-gray-300 cursor-pointer"
                    onClick={() => setMenuOpen(prev => !prev)}
                  >
                    <BsThreeDots />
                  </button>
                  {menuOpen && (
                    <div className="absolute top-full right-6 mt-2 bg-white border border-gray-200 rounded-lg shadow-lg z-50 flex">
                      <button className="px-4 py-2 text-sm text-gray-700 hover:bg-emerald-100 whitespace-nowrap">
                        View Event Details
                      </button>
                    </div>
                  )}
                </div>
              </div>

              {/* Messages Container */}
              <div 
                ref={messagesContainerRef}
                className="flex-1 p-5 space-y-3 overflow-y-auto bg-gradient-to-b from-emerald-100 to-emerald-200"
                onScroll={handleScroll}
              >
                {/* Loading older messages indicator */}
                {loadingOlderMessages && (
                  <div className="text-center py-4">
                    <div className="animate-spin rounded-full h-6 w-6 border-b-2 border-emerald-900 mx-auto"></div>
                    <p className="text-sm text-gray-600 mt-2">Loading older messages...</p>
                  </div>
                )}

                {loadingMessages ? (
                  <div className="text-center py-10">
                    <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-emerald-900 mx-auto"></div>
                    <p className="text-gray-600 mt-4">Loading messages...</p>
                  </div>
                ) : messagesWithDividers.length === 0 ? (
                  <div className="text-center py-10 text-gray-500">
                    <p>No messages yet. Start the conversation!</p>
                  </div>
                ) : (
                  messagesWithDividers.map((item, index) => {
                    if (item.type === 'divider') {
                      return (
                        <div key={item.id} className="flex justify-center my-6">
                          <div className="px-3 py-1 bg-gray-300 rounded-full shadow-sm border border-gray-400">
                            <span className="text-xs font-medium text-gray-700">
                              {item.date}
                            </span>
                          </div>
                        </div>
                      );
                    }

                    const m = item;
                    const showSenderName = !m.mine && (
                      index === 0 || 
                      messagesWithDividers[index - 1].type === 'divider' ||
                      messagesWithDividers[index - 1].senderId !== m.senderId ||
                      messagesWithDividers[index - 1].mine
                    );

                    return (
                      <div
                        key={m.id}
                        className={`flex items-end gap-2 ${
                          m.mine ? "justify-end" : "justify-start"
                        }`}
                      >
                        {!m.mine && (
                          <div className="flex items-end">
                            {showSenderName ? (
                              <div className="w-8 h-8 rounded-full overflow-hidden shadow-sm flex-shrink-0 bg-emerald-700">
                                {m.senderAvatar ? (
                                  <img
                                    src={m.senderAvatar}
                                    alt={m.sender}
                                    className="w-full h-full object-cover"
                                    onError={(e) => {
                                      e.target.style.display = 'none';
                                      const initials = e.target.parentElement.querySelector('.initials-fallback');
                                      if (initials) {
                                        initials.style.display = 'flex';
                                      }
                                    }}
                                  />
                                ) : null}
                                <div 
                                  className={`initials-fallback w-full h-full bg-emerald-700 text-white flex items-center justify-center text-xs font-bold ${
                                    m.senderAvatar ? 'hidden' : 'flex'
                                  }`}
                                >
                                  {m.senderInitial}
                                </div>
                              </div>
                            ) : (
                              <div className="w-8"></div>
                            )}
                          </div>
                        )}

                        <div
                          className={`max-w-sm px-4 py-2 rounded-2xl text-sm shadow-md ${
                            m.mine
                              ? "bg-emerald-600 text-white rounded-br-none self-end ml-auto"
                              : "bg-white text-gray-800 rounded-bl-none"
                          }`}
                        >
                          {showSenderName && (
                            <p className="text-xs font-semibold text-emerald-700 mb-1">
                              {m.sender}
                            </p>
                          )}
                          <p className="whitespace-pre-line leading-snug break-words">
                            {m.text}
                          </p>
                          <span
                            className={`block text-[10px] mt-1 ${
                              m.mine ? "text-gray-200 text-right" : "text-gray-500"
                            }`}
                          >
                            {m.time}
                          </span>
                        </div>
                      </div>
                    );
                  })
                )}
                <div ref={messagesEndRef} />
              </div>

              {/* Message Input */}
              <div className="px-5 py-3 border-t border-gray-300 bg-white flex items-center gap-3 shadow">
                <input
                  type="text"
                  placeholder="Type a message..."
                  value={messageText}
                  onChange={(e) => setMessageText(e.target.value)}
                  onKeyDown={(e) => e.key === "Enter" && handleSend()}
                  className="flex-1 border rounded-full px-4 py-2 text-sm focus:outline-none focus:ring focus:ring-emerald-500"
                />
                
                <button
                  onClick={handleSend}
                  disabled={!messageText.trim()}
                  className="bg-emerald-200 p-3 rounded-full hover:bg-emerald-700 shadow flex items-center justify-center disabled:opacity-50 disabled:cursor-not-allowed"
                >
                  <img src={SendButtonIcon} alt="Send" className="w-5 h-5" />
                </button>
              </div>
            </>
          ) : (
            <div className="flex-1 flex items-center justify-center text-gray-500 text-lg">
              Select an event chat to start messaging
            </div>
          )}
        </div>
      </main>
    </div>
  );
}