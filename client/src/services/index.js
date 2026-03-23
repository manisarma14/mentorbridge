import api from './api'

export const authService = {
  register:       (data)  => api.post('/auth/register', data),
  login:          (data)  => api.post('/auth/login', data),
  me:             ()      => api.get('/auth/me'),
  updateMe:       (data)  => api.put('/auth/me', data),
  changePassword: (data)  => api.put('/auth/change-password', data),
}

export const mentorService = {
  getAll:         (params) => api.get('/mentors', { params }),
  getById:        (id)     => api.get(`/mentors/${id}`),
  getMatches:     ()       => api.get('/mentors/matches'),
  toggleBookmark: (id)     => api.post(`/mentors/${id}/bookmark`),
  addReview:      (id, d)  => api.post(`/mentors/${id}/reviews`, d),
}

export const messageService = {
  getConversations: ()      => api.get('/messages/conversations'),
  getMessages:      (uid)   => api.get(`/messages/${uid}`),
  send:             (data)  => api.post('/messages', data),
}

export const connectionService = {
  getAll:    ()      => api.get('/connections'),
  send:      (data)  => api.post('/connections', data),
  respond:   (id, d) => api.put(`/connections/${id}`, d),
}

export const aiService = {
  search:         (query)  => api.post('/ai/search',  { query }),
  generateRoadmap:(goal)   => api.post('/ai/roadmap', { goal }),
  chat:           (data)   => api.post('/ai/chat',    data),
  getRoadmaps:    ()       => api.get('/ai/roadmaps'),
  updateStep:     (rid, sid, data) => api.put(`/ai/roadmaps/${rid}/steps/${sid}`, data),
}

export const notificationService = {
  getAll:    ()      => api.get('/notifications'),
  markRead:  ()      => api.put('/notifications/read'),
  delete:    (id)    => api.delete(`/notifications/${id}`),
}
