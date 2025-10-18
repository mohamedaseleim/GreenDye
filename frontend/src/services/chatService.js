export async function createChatSession(userId) {
  const response = await fetch('/api/chat/sessions', {
    method: 'POST',
    headers: {
      'Content-Type': 'application/json'
    },
    body: JSON.stringify({ userId })
  });
  return response.json();
}

export async function sendChatMessage(sessionId, message) {
  const response = await fetch('/api/chat/' + sessionId + '/messages', {
    method: 'POST',
    headers: {
      'Content-Type': 'application/json'
    },
    body: JSON.stringify({ message })
  });
  return response.json();
}

export async function getChatMessages(sessionId) {
  const response = await fetch('/api/chat/' + sessionId + '/messages');
  return response.json();
}
