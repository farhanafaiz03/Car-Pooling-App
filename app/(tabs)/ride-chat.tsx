import React, { useState, useEffect, useRef } from 'react';
import {
  ScrollView,
  TouchableOpacity,
  View,
  Text,
  StyleSheet,
  Image,
  TextInput,
  KeyboardAvoidingView,
  Platform,
  Alert,
  ActivityIndicator,
} from 'react-native';
import { ArrowLeft, Send, Bot, User } from 'lucide-react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import { router } from 'expo-router';
import { aiChatAPI } from '../../services/api';

interface Message {
  id: number;
  sender: 'user' | 'bot';
  text: string;
  timestamp: Date;
}

export default function RideChatScreen() {
  const [input, setInput] = useState('');
  const [messages, setMessages] = useState<Message[]>([
    { 
      id: 1, 
      sender: 'bot', 
      text: 'Hi there! I\'m your AI assistant for Commute.io. How can I help you with your rideshare experience today?',
      timestamp: new Date()
    },
  ]);
  const [sending, setSending] = useState(false);
  const [aiStatus, setAiStatus] = useState<{available: boolean, status: string} | null>(null);
  const scrollViewRef = useRef<ScrollView>(null);

  useEffect(() => {
    checkAIStatus();
  }, []);

  useEffect(() => {
    // Auto-scroll to bottom when new messages are added
    setTimeout(() => {
      scrollViewRef.current?.scrollToEnd({ animated: true });
    }, 100);
  }, [messages]);

  const checkAIStatus = async () => {
    try {
      const status = await aiChatAPI.getStatus();
      setAiStatus(status);
      
      if (!status.available) {
        setMessages(prev => [...prev, {
          id: Date.now(),
          sender: 'bot',
          text: 'I\'m currently offline. The AI service may not be configured properly. You can still use the app\'s other features!',
          timestamp: new Date()
        }]);
      }
    } catch (error) {
      console.error('Failed to check AI status:', error);
      setAiStatus({ available: false, status: 'error' });
    }
  };

  const handleBack = () => {
    router.push('/(tabs)');
  };

  const handleSend = async () => {
    const trimmed = input.trim();
    if (!trimmed) {
      Alert.alert('Validation Error', 'Please enter a valid message.');
      return;
    }
    if (trimmed.length > 1000) {
      Alert.alert('Validation Error', 'Message cannot exceed 1000 characters.');
      return;
    }

    setSending(true);
    
    // Add user message immediately
    const userMessage: Message = {
      id: Date.now(),
      sender: 'user',
      text: trimmed,
      timestamp: new Date()
    };
    
    setMessages(prev => [...prev, userMessage]);
    setInput('');

    try {
      // Prepare conversation history for context
      const conversationHistory = messages.map(msg => ({
        sender: msg.sender,
        text: msg.text
      }));

      // Get AI response
      const response = await aiChatAPI.sendMessage(trimmed, conversationHistory, 'rideshare');
      
      // Add AI response
      const aiMessage: Message = {
        id: Date.now() + 1,
        sender: 'bot',
        text: response.response,
        timestamp: new Date()
      };
      
      setMessages(prev => [...prev, aiMessage]);

    } catch (error) {
      console.error('Error sending message:', error);
      
      // Add error message
      const errorMessage: Message = {
        id: Date.now() + 1,
        sender: 'bot',
        text: 'I\'m sorry, I\'m having trouble responding right now. Please try again in a moment, or contact support if the issue persists.',
        timestamp: new Date()
      };
      
      setMessages(prev => [...prev, errorMessage]);
    } finally {
      setSending(false);
    }
  };

  const renderMessage = (message: Message) => {
    const isUser = message.sender === 'user';
    
    return (
      <View
        key={message.id}
        style={[
          styles.messageRow,
          isUser ? styles.userMessageRow : styles.botMessageRow,
        ]}
      >
        {!isUser && (
          <View style={styles.avatarContainer}>
            <Bot size={20} color="#4ECDC4" />
          </View>
        )}
        
        <View style={[
          styles.messageBubble,
          isUser ? styles.userBubble : styles.botBubble
        ]}>
          <Text style={[
            styles.messageText,
            isUser ? styles.userMessageText : styles.botMessageText
          ]}>
            {message.text}
          </Text>
          <Text style={[
            styles.timestamp,
            isUser ? styles.userTimestamp : styles.botTimestamp
          ]}>
            {message.timestamp.toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })}
          </Text>
        </View>
        
        {isUser && (
          <View style={styles.avatarContainer}>
            <User size={20} color="#ffffff" />
          </View>
        )}
      </View>
    );
  };

  return (
    <KeyboardAvoidingView
      behavior={Platform.OS === 'ios' ? 'padding' : 'height'}
      style={{ flex: 1 }}
    >
      <SafeAreaView style={styles.container}>
        {/* Header */}
        <View style={styles.header}>
          <TouchableOpacity style={styles.backButton} onPress={handleBack}>
            <ArrowLeft size={24} color="#2d3748" />
          </TouchableOpacity>
          <View style={styles.headerInfo}>
            <Text style={styles.title}>AI Assistant</Text>
            <View style={styles.statusContainer}>
              <View style={[
                styles.statusDot, 
                { backgroundColor: aiStatus?.available ? '#10B981' : '#EF4444' }
              ]} />
              <Text style={styles.statusText}>
                {aiStatus?.available ? 'Online' : 'Offline'}
              </Text>
            </View>
          </View>
          <View style={styles.placeholder} />
        </View>

        {/* Messages */}
        <ScrollView
          ref={scrollViewRef}
          style={styles.messagesContainer}
          contentContainerStyle={{ paddingVertical: 16 }}
          showsVerticalScrollIndicator={false}
        >
          {messages.map(renderMessage)}
          
          {sending && (
            <View style={[styles.messageRow, styles.botMessageRow]}>
              <View style={styles.avatarContainer}>
                <Bot size={20} color="#4ECDC4" />
              </View>
              <View style={[styles.messageBubble, styles.botBubble, styles.typingBubble]}>
                <ActivityIndicator size="small" color="#4ECDC4" />
                <Text style={styles.typingText}>AI is typing...</Text>
              </View>
            </View>
          )}
        </ScrollView>

        {/* Input */}
        <View style={styles.inputContainer}>
          <TextInput
            placeholder="Ask me anything about rideshare..."
            style={styles.input}
            placeholderTextColor="#9CA3AF"
            value={input}
            onChangeText={setInput}
            editable={!sending}
            maxLength={1000}
            multiline
            onSubmitEditing={handleSend}
          />
          <TouchableOpacity
            onPress={handleSend}
            style={[
              styles.sendButton,
              { backgroundColor: sending || !input.trim() ? '#E5E7EB' : '#4ECDC4' },
            ]}
            disabled={sending || !input.trim()}
          >
            {sending ? (
              <ActivityIndicator size="small" color="#ffffff" />
            ) : (
              <Send size={20} color="#ffffff" />
            )}
          </TouchableOpacity>
        </View>
      </SafeAreaView>
    </KeyboardAvoidingView>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: '#f8fffe',
  },
  header: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    paddingHorizontal: 24,
    paddingVertical: 16,
    backgroundColor: '#ffffff',
    borderBottomWidth: 1,
    borderBottomColor: '#E5E7EB',
  },
  backButton: {
    width: 40,
    height: 40,
    borderRadius: 20,
    backgroundColor: '#F9FAFB',
    justifyContent: 'center',
    alignItems: 'center',
  },
  headerInfo: {
    alignItems: 'center',
  },
  title: {
    fontSize: 18,
    fontFamily: 'Inter-SemiBold',
    color: '#2d3748',
    marginBottom: 4,
  },
  statusContainer: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 6,
  },
  statusDot: {
    width: 8,
    height: 8,
    borderRadius: 4,
  },
  statusText: {
    fontSize: 12,
    fontFamily: 'Inter-Regular',
    color: '#6B7280',
  },
  placeholder: {
    width: 40,
  },
  messagesContainer: {
    flex: 1,
    paddingHorizontal: 16,
  },
  messageRow: {
    flexDirection: 'row',
    alignItems: 'flex-end',
    marginVertical: 8,
    gap: 12,
  },
  userMessageRow: {
    justifyContent: 'flex-end',
  },
  botMessageRow: {
    justifyContent: 'flex-start',
  },
  avatarContainer: {
    width: 36,
    height: 36,
    borderRadius: 18,
    backgroundColor: '#4ECDC4',
    justifyContent: 'center',
    alignItems: 'center',
  },
  messageBubble: {
    maxWidth: '75%',
    padding: 12,
    borderRadius: 16,
  },
  botBubble: {
    backgroundColor: '#ffffff',
    borderBottomLeftRadius: 4,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 1 },
    shadowOpacity: 0.1,
    shadowRadius: 4,
    elevation: 2,
  },
  userBubble: {
    backgroundColor: '#4ECDC4',
    borderBottomRightRadius: 4,
  },
  messageText: {
    fontSize: 16,
    fontFamily: 'Inter-Regular',
    lineHeight: 22,
  },
  botMessageText: {
    color: '#2d3748',
  },
  userMessageText: {
    color: '#ffffff',
  },
  timestamp: {
    fontSize: 11,
    fontFamily: 'Inter-Regular',
    marginTop: 4,
  },
  botTimestamp: {
    color: '#9CA3AF',
  },
  userTimestamp: {
    color: 'rgba(255, 255, 255, 0.8)',
  },
  typingBubble: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 8,
  },
  typingText: {
    fontSize: 14,
    fontFamily: 'Inter-Regular',
    color: '#6B7280',
    fontStyle: 'italic',
  },
  inputContainer: {
    flexDirection: 'row',
    alignItems: 'flex-end',
    paddingHorizontal: 16,
    paddingVertical: 12,
    backgroundColor: '#ffffff',
    borderTopWidth: 1,
    borderTopColor: '#E5E7EB',
    gap: 12,
  },
  input: {
    flex: 1,
    fontSize: 16,
    fontFamily: 'Inter-Regular',
    color: '#2d3748',
    paddingVertical: 12,
    paddingHorizontal: 16,
    backgroundColor: '#F9FAFB',
    borderRadius: 20,
    borderWidth: 1,
    borderColor: '#E5E7EB',
    maxHeight: 100,
  },
  sendButton: {
    width: 44,
    height: 44,
    borderRadius: 22,
    justifyContent: 'center',
    alignItems: 'center',
    shadowColor: '#4ECDC4',
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.3,
    shadowRadius: 4,
    elevation: 3,
  },
});