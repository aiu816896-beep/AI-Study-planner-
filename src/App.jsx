import { useState, useEffect } from 'react'
import './App.css'

function App() {
  const [activeTab, setActiveTab] = useState('dashboard')
  const [subjects, setSubjects] = useState([])
  const [newSubject, setNewSubject] = useState('')
  const [studyHours, setStudyHours] = useState(4)
  const [timetable, setTimetable] = useState([])
  const [streak, setStreak] = useState(0)
  const [completedToday, setCompletedToday] = useState([])
  const [lastStudyDate, setLastStudyDate] = useState(null)
  
  // New states for enhanced features
  const [tasks, setTasks] = useState([])
  const [newTask, setNewTask] = useState('')
  const [taskCategory, setTaskCategory] = useState('Study')
  const [dailyGoalMinutes, setDailyGoalMinutes] = useState(240) // 4 hours default
  const [studyTimeToday, setStudyTimeToday] = useState(0)
  const [pomodoroActive, setPomodoroActive] = useState(false)
  const [pomodoroTime, setPomodoroTime] = useState(25 * 60) // 25 minutes
  const [pomodoroCount, setPomodoroCount] = useState(0)
  const [workDuration, setWorkDuration] = useState(25)
  const [breakDuration, setBreakDuration] = useState(5)
  const [isBreak, setIsBreak] = useState(false)
  const [notes, setNotes] = useState([])
  const [newNote, setNewNote] = useState('')
  const [noteTitle, setNoteTitle] = useState('')
  const [reportPeriod, setReportPeriod] = useState('week')
  const [notifications, setNotifications] = useState({
    dailyReminders: true,
    revisionAlerts: true,
    testAlerts: true
  })
  const [documents, setDocuments] = useState([])
  const [newDocument, setNewDocument] = useState({ name: '', subject: '', type: 'PDF', url: '' })
  const [aiMessages, setAiMessages] = useState([])
  const [userQuestion, setUserQuestion] = useState('')
  const [aiLoading, setAiLoading] = useState(false)

  // Load data from localStorage
  useEffect(() => {
    const saved = localStorage.getItem('studyPlanner')
    if (saved) {
      const data = JSON.parse(saved)
      setSubjects(data.subjects || [])
      setStreak(data.streak || 0)
      setLastStudyDate(data.lastStudyDate || null)
      setCompletedToday(data.completedToday || [])
      setTasks(data.tasks || [])
      setStudyTimeToday(data.studyTimeToday || 0)
      setPomodoroCount(data.pomodoroCount || 0)
      setNotes(data.notes || [])
      setNotifications(data.notifications || { dailyReminders: true, revisionAlerts: true, testAlerts: true })
      setDocuments(data.documents || [])
      setAiMessages(data.aiMessages || [])
    }
  }, [])

  // Save data to localStorage
  useEffect(() => {
    localStorage.setItem('studyPlanner', JSON.stringify({
      subjects,
      streak,
      lastStudyDate,
      completedToday,
      tasks,
      studyTimeToday,
      pomodoroCount,
      notes,
      notifications,
      documents,
      aiMessages
    }))
  }, [subjects, streak, lastStudyDate, completedToday, tasks, studyTimeToday, pomodoroCount, notes, notifications, documents, aiMessages])

  // Check and update streak
  useEffect(() => {
    const today = new Date().toDateString()
    if (lastStudyDate) {
      const last = new Date(lastStudyDate)
      const todayDate = new Date()
      const diffTime = Math.abs(todayDate - last)
      const diffDays = Math.ceil(diffTime / (1000 * 60 * 60 * 24))
      
      if (diffDays > 1) {
        setStreak(0)
        setCompletedToday([])
      } else if (diffDays === 1 && lastStudyDate !== today) {
        setCompletedToday([])
      }
    }
  }, [lastStudyDate])

  const addSubject = () => {
    if (newSubject.trim()) {
      setSubjects([...subjects, {
        id: Date.now(),
        name: newSubject,
        priority: 'Medium',
        lastRevised: null,
        progress: 0
      }])
      setNewSubject('')
    }
  }

  const generateTimetable = () => {
    if (subjects.length === 0) {
      alert('Please add subjects first!')
      return
    }

    const timeSlots = []
    const startHour = 9
    const slotDuration = Math.max(30, (studyHours * 60) / subjects.length)
    
    subjects.forEach((subject, index) => {
      const startTime = startHour + (index * slotDuration / 60)
      const endTime = startTime + (slotDuration / 60)
      
      timeSlots.push({
        subject: subject.name,
        startTime: formatTimeSlot(startTime),
        endTime: formatTimeSlot(endTime),
        duration: Math.round(slotDuration),
        completed: completedToday.includes(subject.id)
      })
    })

    setTimetable(timeSlots)
  }

  const formatTimeSlot = (hour) => {
    const h = Math.floor(hour)
    const m = Math.round((hour - h) * 60)
    const period = h >= 12 ? 'PM' : 'AM'
    const displayHour = h > 12 ? h - 12 : h
    return `${displayHour}:${m.toString().padStart(2, '0')} ${period}`
  }

  const markComplete = (subjectName) => {
    const subject = subjects.find(s => s.name === subjectName)
    if (subject && !completedToday.includes(subject.id)) {
      const newCompleted = [...completedToday, subject.id]
      setCompletedToday(newCompleted)
      
      const today = new Date().toDateString()
      if (lastStudyDate !== today) {
        setStreak(streak + 1)
        setLastStudyDate(today)
      }

      // Update subject progress
      setSubjects(subjects.map(s => 
        s.id === subject.id ? {...s, progress: Math.min(100, s.progress + 10), lastRevised: new Date().toISOString()} : s
      ))
    }
  }

  const deleteSubject = (id) => {
    setSubjects(subjects.filter(s => s.id !== id))
  }

  const updatePriority = (id, priority) => {
    setSubjects(subjects.map(s => s.id === id ? {...s, priority} : s))
  }

  // Task Management
  const addTask = () => {
    if (newTask.trim()) {
      setTasks([...tasks, {
        id: Date.now(),
        text: newTask,
        category: taskCategory,
        completed: false,
        createdAt: new Date().toISOString(),
        duration: 0
      }])
      setNewTask('')
    }
  }

  const toggleTask = (id) => {
    setTasks(tasks.map(t => 
      t.id === id ? {...t, completed: !t.completed} : t
    ))
  }

  const deleteTask = (id) => {
    setTasks(tasks.filter(t => t.id !== id))
  }

  // Pomodoro Timer
  useEffect(() => {
    let interval = null
    if (pomodoroActive && pomodoroTime > 0) {
      interval = setInterval(() => {
        setPomodoroTime(time => time - 1)
        if (!isBreak) {
          setStudyTimeToday(prev => prev + 1)
        }
      }, 1000)
    } else if (pomodoroTime === 0) {
      if (!isBreak) {
        setPomodoroCount(prev => prev + 1)
        setIsBreak(true)
        setPomodoroTime(breakDuration * 60)
      } else {
        setIsBreak(false)
        setPomodoroTime(workDuration * 60)
      }
      setPomodoroActive(false)
    }
    return () => clearInterval(interval)
  }, [pomodoroActive, pomodoroTime, isBreak, workDuration, breakDuration])

  const startPomodoro = () => {
    setPomodoroActive(true)
  }

  const resetPomodoro = () => {
    setPomodoroActive(false)
    setIsBreak(false)
    setPomodoroTime(workDuration * 60)
  }

  // Notes Management
  const addNote = () => {
    if (newNote.trim() && noteTitle.trim()) {
      setNotes([...notes, {
        id: Date.now(),
        title: noteTitle,
        content: newNote,
        createdAt: new Date().toISOString()
      }])
      setNewNote('')
      setNoteTitle('')
    }
  }

  const deleteNote = (id) => {
    setNotes(notes.filter(n => n.id !== id))
  }

  // Document Management
  const addDocument = () => {
    if (newDocument.name.trim() && newDocument.subject.trim()) {
      setDocuments([...documents, {
        id: Date.now(),
        name: newDocument.name,
        subject: newDocument.subject,
        type: newDocument.type,
        url: newDocument.url,
        uploadedAt: new Date().toISOString()
      }])
      setNewDocument({ name: '', subject: '', type: 'PDF', url: '' })
    }
  }

  const deleteDocument = (id) => {
    setDocuments(documents.filter(d => d.id !== id))
  }

  // AI Study Assistant
  const getAIResponse = (question) => {
    // Simulated AI responses based on question keywords
    const lowerQuestion = question.toLowerCase()
    
    // Study tips and techniques
    if (lowerQuestion.includes('how to study') || lowerQuestion.includes('study tips')) {
      return "Here are effective study tips:\n\n1. **Pomodoro Technique**: Study for 25 minutes, then take a 5-minute break\n2. **Active Recall**: Test yourself instead of just re-reading\n3. **Spaced Repetition**: Review material at increasing intervals\n4. **Teach Others**: Explaining concepts helps reinforce learning\n5. **Mind Maps**: Create visual connections between concepts\n6. **Study Environment**: Find a quiet, well-lit space\n7. **Sleep Well**: 7-8 hours of sleep improves memory retention"
    }
    
    // Time management
    if (lowerQuestion.includes('time management') || lowerQuestion.includes('organize time')) {
      return "Time Management Strategies:\n\n• Use the AI Timetable feature to create a balanced schedule\n• Prioritize subjects based on difficulty and deadlines\n• Block time for specific subjects (time blocking)\n• Use the Pomodoro timer to maintain focus\n• Schedule breaks to avoid burnout\n• Track your streak to build consistency\n• Set daily goals and review progress weekly"
    }
    
    // Exam preparation
    if (lowerQuestion.includes('exam') || lowerQuestion.includes('test')) {
      return "Exam Preparation Guide:\n\n✅ Start early (at least 2 weeks before)\n✅ Create a study schedule using the Timetable tab\n✅ Make summary notes for each topic\n✅ Practice past papers and questions\n✅ Focus on weak areas first\n✅ Study in short, focused sessions\n✅ Get enough sleep before the exam\n✅ Review notes on exam morning\n✅ Stay calm and manage stress"
    }
    
    // Memory techniques
    if (lowerQuestion.includes('memory') || lowerQuestion.includes('remember') || lowerQuestion.includes('memorize')) {
      return "Memory Enhancement Techniques:\n\n1. **Mnemonics**: Create acronyms or phrases\n2. **Chunking**: Break information into smaller pieces\n3. **Visualization**: Create mental images\n4. **Association**: Link new info to what you know\n5. **Repetition**: Review multiple times\n6. **Teaching**: Explain to someone else\n7. **Sleep**: Consolidates memories\n8. **Exercise**: Improves brain function"
    }
    
    // Motivation and focus
    if (lowerQuestion.includes('motivation') || lowerQuestion.includes('focus') || lowerQuestion.includes('concentrate')) {
      return "Boost Your Motivation & Focus:\n\n🎯 Set clear, specific goals\n🎯 Break tasks into smaller steps\n🎯 Use the Pomodoro technique\n🎯 Remove distractions (phone, social media)\n🎯 Study in a dedicated space\n🎯 Reward yourself after completing tasks\n🎯 Track your progress and streaks\n🎯 Join study groups for accountability\n🎯 Remember your 'why' - your goals"
    }
    
    // Note-taking
    if (lowerQuestion.includes('notes') || lowerQuestion.includes('note-taking') || lowerQuestion.includes('note taking')) {
      return "Effective Note-Taking Methods:\n\n📝 **Cornell Method**: Divide page into sections\n📝 **Mind Mapping**: Visual, branching diagrams\n📝 **Outline Method**: Hierarchical bullet points\n📝 **Flow Notes**: Combine text and diagrams\n📝 **SQ3R**: Survey, Question, Read, Recite, Review\n\nTips:\n• Use colors and highlighters\n• Review notes within 24 hours\n• Add examples and connections\n• Use the Notes tab in this app!"
    }
    
    // Math/Science specific
    if (lowerQuestion.includes('math') || lowerQuestion.includes('science') || lowerQuestion.includes('physics') || lowerQuestion.includes('chemistry')) {
      return "Math & Science Study Tips:\n\n📊 Practice problems daily\n📊 Understand concepts, don't just memorize\n📊 Work through examples step-by-step\n📊 Create formula sheets\n📊 Draw diagrams and graphs\n📊 Study with practice tests\n📊 Form study groups\n📊 Watch educational videos\n📊 Ask questions when stuck"
    }
    
    // Reading comprehension
    if (lowerQuestion.includes('reading') || lowerQuestion.includes('comprehension')) {
      return "Reading & Comprehension Tips:\n\n📖 Preview: Scan headings and summaries\n📖 Active Reading: Highlight and annotate\n📖 Ask Questions: What, why, how?\n📖 Summarize: Write in your own words\n📖 Visualize: Create mental images\n📖 Connect: Link to prior knowledge\n📖 Review: Reread difficult sections\n📖 Discuss: Talk about what you read"
    }
    
    // Stress management
    if (lowerQuestion.includes('stress') || lowerQuestion.includes('anxiety') || lowerQuestion.includes('overwhelmed')) {
      return "Managing Study Stress:\n\n🧘 Take regular breaks\n🧘 Exercise daily (even 15 minutes helps)\n🧘 Practice deep breathing\n🧘 Get 7-8 hours of sleep\n🧘 Eat healthy meals\n🧘 Stay hydrated\n🧘 Talk to friends/family\n🧘 Use the Pomodoro timer to avoid burnout\n🧘 Remember: It's okay to ask for help!"
    }
    
    // Default response
    return `I can help you with:

• Study tips and techniques
• Time management strategies
• Exam preparation advice
• Memory improvement methods
• Motivation and focus tips
• Note-taking strategies
• Subject-specific guidance
• Stress management

Your question: "${question}"

Try asking about specific topics like:
- "How to study effectively?"
- "Tips for time management"
- "How to prepare for exams?"
- "How to improve memory?"
- "How to stay motivated?"`
  }

  const askAI = () => {
    if (!userQuestion.trim()) return
    
    // Add user message
    const userMsg = {
      id: Date.now(),
      type: 'user',
      text: userQuestion,
      timestamp: new Date().toISOString()
    }
    
    setAiMessages([...aiMessages, userMsg])
    setUserQuestion('')
    setAiLoading(true)
    
    // Simulate AI thinking time
    setTimeout(() => {
      const aiResponse = getAIResponse(userQuestion)
      const aiMsg = {
        id: Date.now() + 1,
        type: 'ai',
        text: aiResponse,
        timestamp: new Date().toISOString()
      }
      setAiMessages(prev => [...prev, aiMsg])
      setAiLoading(false)
    }, 1000)
  }

  const clearAIChat = () => {
    if (window.confirm('Clear all AI chat history?')) {
      setAiMessages([])
    }
  }

  // Data Management
  const exportData = () => {
    const data = {
      subjects,
      tasks,
      notes,
      documents,
      streak,
      studyTimeToday,
      pomodoroCount,
      notifications
    }
    const blob = new Blob([JSON.stringify(data, null, 2)], { type: 'application/json' })
    const url = URL.createObjectURL(blob)
    const a = document.createElement('a')
    a.href = url
    a.download = `study-planner-backup-${new Date().toISOString().split('T')[0]}.json`
    a.click()
  }

  const importData = (e) => {
    const file = e.target.files[0]
    if (file) {
      const reader = new FileReader()
      reader.onload = (event) => {
        try {
          const data = JSON.parse(event.target.result)
          setSubjects(data.subjects || [])
          setTasks(data.tasks || [])
          setNotes(data.notes || [])
          setDocuments(data.documents || [])
          setStreak(data.streak || 0)
          setStudyTimeToday(data.studyTimeToday || 0)
          setPomodoroCount(data.pomodoroCount || 0)
          setNotifications(data.notifications || { dailyReminders: true, revisionAlerts: true, testAlerts: true })
          alert('Data imported successfully!')
        } catch (error) {
          alert('Error importing data. Please check the file format.')
        }
      }
      reader.readAsText(file)
    }
  }

  const clearAllData = () => {
    if (window.confirm('Are you sure you want to clear all data? This cannot be undone!')) {
      localStorage.removeItem('studyPlanner')
      setSubjects([])
      setTasks([])
      setNotes([])
      setDocuments([])
      setStreak(0)
      setStudyTimeToday(0)
      setPomodoroCount(0)
      setCompletedToday([])
      setTimetable([])
      alert('All data cleared!')
    }
  }

  // Calculate stats
  const completedTasks = tasks.filter(t => t.completed).length
  const pendingTasks = tasks.filter(t => !t.completed).length
  const productivity = tasks.length > 0 ? Math.round((completedTasks / tasks.length) * 100) : 0

  const formatTime = (seconds) => {
    const hours = Math.floor(seconds / 3600)
    const minutes = Math.floor((seconds % 3600) / 60)
    return `${hours}h ${minutes}m`
  }

  const formatPomodoroTime = (seconds) => {
    const mins = Math.floor(seconds / 60)
    const secs = seconds % 60
    return `${mins.toString().padStart(2, '0')}:${secs.toString().padStart(2, '0')}`
  }

  return (
    <div className="app">
      <header className="header">
        <h1>📚 AI Study Planner</h1>
        <div className="streak">
          🔥 Streak: {streak} days
        </div>
      </header>

      <nav className="tabs">
        <button 
          className={activeTab === 'dashboard' ? 'active' : ''}
          onClick={() => setActiveTab('dashboard')}
        >
          📊 Dashboard
        </button>
        <button 
          className={activeTab === 'tasks' ? 'active' : ''}
          onClick={() => setActiveTab('tasks')}
        >
          ✓ Tasks
        </button>
        <button 
          className={activeTab === 'planner' ? 'active' : ''}
          onClick={() => setActiveTab('planner')}
        >
          📅 Subjects
        </button>
        <button 
          className={activeTab === 'timetable' ? 'active' : ''}
          onClick={() => setActiveTab('timetable')}
        >
          ⏰ Timetable
        </button>
        <button 
          className={activeTab === 'pomodoro' ? 'active' : ''}
          onClick={() => setActiveTab('pomodoro')}
        >
          🍅 Pomodoro
        </button>
        <button 
          className={activeTab === 'notes' ? 'active' : ''}
          onClick={() => setActiveTab('notes')}
        >
          📝 Notes
        </button>
        <button 
          className={activeTab === 'documents' ? 'active' : ''}
          onClick={() => setActiveTab('documents')}
        >
          📄 Documents
        </button>
        <button 
          className={activeTab === 'ai-assistant' ? 'active' : ''}
          onClick={() => setActiveTab('ai-assistant')}
        >
          🤖 AI Assistant
        </button>
        <button 
          className={activeTab === 'analytics' ? 'active' : ''}
          onClick={() => setActiveTab('analytics')}
        >
          📈 Analytics
        </button>
        <button 
          className={activeTab === 'settings' ? 'active' : ''}
          onClick={() => setActiveTab('settings')}
        >
          ⚙️ Settings
        </button>
      </nav>

      <main className="content">
        {activeTab === 'dashboard' && (
          <div className="tab-content">
            <div className="dashboard-stats">
              <div className="stat-card">
                <h3>{formatTime(studyTimeToday)}</h3>
                <p>Study Today</p>
              </div>
              <div className="stat-card">
                <h3>{completedTasks}</h3>
                <p>Tasks Completed</p>
              </div>
              <div className="stat-card">
                <h3>{pendingTasks}</h3>
                <p>Tasks Pending</p>
              </div>
              <div className="stat-card">
                <h3>{productivity}%</h3>
                <p>Productivity</p>
              </div>
            </div>

            <div className="daily-goal">
              <h2>Daily Goal</h2>
              <div className="goal-progress">
                <div className="goal-bar">
                  <div 
                    className="goal-fill" 
                    style={{width: `${Math.min(100, (studyTimeToday / (dailyGoalMinutes * 60)) * 100)}%`}}
                  ></div>
                </div>
                <p>{formatTime(studyTimeToday)} / {formatTime(dailyGoalMinutes * 60)}</p>
              </div>
            </div>

            <div className="quick-tasks">
              <h2>Today's Quick Tasks</h2>
              <div className="task-list">
                {tasks.slice(0, 5).map(task => (
                  <div key={task.id} className={`task-item ${task.completed ? 'completed' : ''}`}>
                    <input 
                      type="checkbox" 
                      checked={task.completed}
                      onChange={() => toggleTask(task.id)}
                    />
                    <span className="task-text">{task.text}</span>
                    <span className="task-category">{task.category}</span>
                  </div>
                ))}
              </div>
            </div>
          </div>
        )}

        {activeTab === 'tasks' && (
          <div className="tab-content">
            <div className="add-task">
              <input
                type="text"
                placeholder="Add new task..."
                value={newTask}
                onChange={(e) => setNewTask(e.target.value)}
                onKeyPress={(e) => e.key === 'Enter' && addTask()}
              />
              <select value={taskCategory} onChange={(e) => setTaskCategory(e.target.value)}>
                <option value="Study">📚 Study</option>
                <option value="Reading">📖 Reading</option>
                <option value="Notes">✍ Notes</option>
                <option value="Revision">🔁 Revision</option>
                <option value="Assignment">📝 Assignment</option>
                <option value="Test Prep">⏳ Test Prep</option>
              </select>
              <button onClick={addTask}>Add Task</button>
            </div>

            <div className="task-filters">
              <button className="filter-btn active">All</button>
              <button className="filter-btn">📚 Study</button>
              <button className="filter-btn">📖 Reading</button>
              <button className="filter-btn">✍ Notes</button>
              <button className="filter-btn">🔁 Revision</button>
              <button className="filter-btn">📝 Assignment</button>
              <button className="filter-btn">⏳ Test Prep</button>
            </div>

            <div className="tasks-list">
              {tasks.length === 0 ? (
                <p className="empty-state">No tasks yet. Add your first task to get started!</p>
              ) : (
                tasks.map(task => (
                  <div key={task.id} className={`task-card ${task.completed ? 'completed' : ''}`}>
                    <input 
                      type="checkbox" 
                      checked={task.completed}
                      onChange={() => toggleTask(task.id)}
                    />
                    <div className="task-details">
                      <h3>{task.text}</h3>
                      <span className="task-meta">
                        {task.category} • {new Date(task.createdAt).toLocaleDateString()}
                      </span>
                    </div>
                    <button onClick={() => deleteTask(task.id)} className="delete-btn">×</button>
                  </div>
                ))
              )}
            </div>
          </div>
        )}

        {activeTab === 'planner' && (
          <div className="tab-content">
            <div className="add-subject">
              <input
                type="text"
                placeholder="Enter subject name..."
                value={newSubject}
                onChange={(e) => setNewSubject(e.target.value)}
                onKeyPress={(e) => e.key === 'Enter' && addSubject()}
              />
              <button onClick={addSubject}>Add Subject</button>
            </div>

            <div className="subjects-list">
              {subjects.length === 0 ? (
                <p className="empty-state">No subjects yet. Add your first subject to get started!</p>
              ) : (
                subjects.map(subject => (
                  <div key={subject.id} className="subject-card">
                    <div className="subject-info">
                      <h3>{subject.name}</h3>
                      <select 
                        value={subject.priority}
                        onChange={(e) => updatePriority(subject.id, e.target.value)}
                        className="priority-select"
                      >
                        <option value="High">🔴 High</option>
                        <option value="Medium">🟡 Medium</option>
                        <option value="Low">🟢 Low</option>
                      </select>
                    </div>
                    <div className="subject-meta">
                      <span>Progress: {subject.progress}%</span>
                      {subject.lastRevised && (
                        <span className="last-revised">
                          Last: {new Date(subject.lastRevised).toLocaleDateString()}
                        </span>
                      )}
                    </div>
                    <div className="progress-bar">
                      <div className="progress-fill" style={{width: `${subject.progress}%`}}></div>
                    </div>
                    <button onClick={() => deleteSubject(subject.id)} className="delete-btn">
                      Delete
                    </button>
                  </div>
                ))
              )}
            </div>
          </div>
        )}

        {activeTab === 'timetable' && (
          <div className="tab-content">
            <div className="timetable-controls">
              <label>
                Study Hours per Day:
                <input
                  type="range"
                  min="1"
                  max="12"
                  value={studyHours}
                  onChange={(e) => setStudyHours(Number(e.target.value))}
                />
                <span>{studyHours} hours</span>
              </label>
              <button onClick={generateTimetable} className="generate-btn">
                🤖 Generate AI Timetable
              </button>
            </div>

            {timetable.length > 0 && (
              <div className="timetable">
                <h2>Today's Study Schedule</h2>
                {timetable.map((slot, index) => (
                  <div key={index} className={`time-slot ${slot.completed ? 'completed' : ''}`}>
                    <div className="time-info">
                      <span className="time">{slot.startTime} - {slot.endTime}</span>
                      <span className="duration">{slot.duration} min</span>
                    </div>
                    <div className="slot-subject">
                      <h3>{slot.subject}</h3>
                      {!slot.completed && (
                        <button onClick={() => markComplete(slot.subject)} className="complete-btn">
                          ✓ Mark Done
                        </button>
                      )}
                      {slot.completed && <span className="done-badge">✓ Done</span>}
                    </div>
                  </div>
                ))}
              </div>
            )}
          </div>
        )}

        {activeTab === 'progress' && (
          <div className="tab-content">
            <div className="stats">
              <div className="stat-card">
                <h3>Total Subjects</h3>
                <p className="stat-value">{subjects.length}</p>
              </div>
              <div className="stat-card">
                <h3>Current Streak</h3>
                <p className="stat-value">🔥 {streak} days</p>
              </div>
              <div className="stat-card">
                <h3>Completed Today</h3>
                <p className="stat-value">{completedToasks.length}/{subjects.length}</p>
              </div>
              <div className="stat-card">
                <h3>Average Progress</h3>
                <p className="stat-value">
                  {subjects.length > 0 
                    ? Math.round(subjects.reduce((acc, s) => acc + s.progress, 0) / subjects.length)
                    : 0}%
                </p>
              </div>
            </div>

            <div className="subjects-progress">
              <h2>Subject-wise Progress</h2>
              {subjects.map(subject => (
                <div key={subject.id} className="progress-item">
                  <div className="progress-header">
                    <span>{subject.name}</span>
                    <span>{subject.progress}%</span>
                  </div>
                  <div className="progress-bar">
                    <div 
                      className="progress-fill" 
                      style={{width: `${subject.progress}%`}}
                    ></div>
                  </div>
                </div>
              ))}
            </div>
          </div>
        )}

        {activeTab === 'pomodoro' && (
          <div className="tab-content">
            <div className="pomodoro-container">
              <h2>Pomodoro Timer</h2>
              <div className="pomodoro-display">
                <div className="timer-circle">
                  <h1>{formatPomodoroTime(pomodoroTime)}</h1>
                  <p>{isBreak ? 'Break Time' : 'Work Time'}</p>
                </div>
              </div>
              <div className="pomodoro-controls">
                <button onClick={startPomodoro} className="pomodoro-btn" disabled={pomodoroActive}>
                  {pomodoroActive ? 'Running...' : 'Start'}
                </button>
                <button onClick={resetPomodoro} className="pomodoro-btn">Reset</button>
              </div>
              <div className="pomodoro-settings">
                <label>
                  Work Duration (min):
                  <input 
                    type="number" 
                    value={workDuration} 
                    onChange={(e) => setWorkDuration(Number(e.target.value))}
                    min="1"
                    max="60"
                  />
                </label>
                <label>
                  Break Duration (min):
                  <input 
                    type="number" 
                    value={breakDuration} 
                    onChange={(e) => setBreakDuration(Number(e.target.value))}
                    min="1"
                    max="30"
                  />
                </label>
              </div>
              <div className="pomodoro-stats">
                <h3>Today's Pomodoros: {pomodoroCount}</h3>
              </div>
            </div>
          </div>
        )}

        {activeTab === 'notes' && (
          <div className="tab-content">
            <div className="add-note">
              <input
                type="text"
                placeholder="Note title..."
                value={noteTitle}
                onChange={(e) => setNoteTitle(e.target.value)}
              />
              <textarea
                placeholder="Write your notes here..."
                value={newNote}
                onChange={(e) => setNewNote(e.target.value)}
                rows="4"
              />
              <button onClick={addNote}>Add Note</button>
            </div>

            <div className="notes-list">
              {notes.length === 0 ? (
                <p className="empty-state">No notes yet. Create your first note!</p>
              ) : (
                notes.map(note => (
                  <div key={note.id} className="note-card">
                    <div className="note-header">
                      <h3>{note.title}</h3>
                      <button onClick={() => deleteNote(note.id)} className="delete-btn">×</button>
                    </div>
                    <p className="note-content">{note.content}</p>
                    <span className="note-date">{new Date(note.createdAt).toLocaleString()}</span>
                  </div>
                ))
              )}
            </div>
          </div>
        )}

        {activeTab === 'documents' && (
          <div className="tab-content">
            <div className="add-document">
              <input
                type="text"
                placeholder="Document name..."
                value={newDocument.name}
                onChange={(e) => setNewDocument({...newDocument, name: e.target.value})}
              />
              <input
                type="text"
                placeholder="Subject..."
                value={newDocument.subject}
                onChange={(e) => setNewDocument({...newDocument, subject: e.target.value})}
              />
              <select 
                value={newDocument.type}
                onChange={(e) => setNewDocument({...newDocument, type: e.target.value})}
              >
                <option value="PDF">PDF</option>
                <option value="Word">Word</option>
                <option value="PowerPoint">PowerPoint</option>
                <option value="Excel">Excel</option>
                <option value="Image">Image</option>
                <option value="Video">Video</option>
                <option value="Other">Other</option>
              </select>
              <input
                type="text"
                placeholder="URL/Link (optional)..."
                value={newDocument.url}
                onChange={(e) => setNewDocument({...newDocument, url: e.target.value})}
              />
              <button onClick={addDocument}>Add Document</button>
            </div>

            <div className="documents-grid">
              {documents.length === 0 ? (
                <p className="empty-state">No documents yet. Add your first study document!</p>
              ) : (
                <div className="doc-list">
                  {subjects.length > 0 && subjects.map(subject => {
                    const subjectDocs = documents.filter(d => d.subject === subject.name)
                    if (subjectDocs.length === 0) return null
                    return (
                      <div key={subject.id} className="subject-section">
                        <h3>📚 {subject.name}</h3>
                        <div className="docs-grid">
                          {subjectDocs.map(doc => (
                            <div key={doc.id} className="document-card">
                              <div className="doc-icon">
                                {doc.type === 'PDF' && '📝'}
                                {doc.type === 'Word' && '📄'}
                                {doc.type === 'PowerPoint' && '📊'}
                                {doc.type === 'Excel' && '📊'}
                                {doc.type === 'Image' && '🖼️'}
                                {doc.type === 'Video' && '🎥'}
                                {doc.type === 'Other' && '📁'}
                              </div>
                              <div className="doc-details">
                                <h4>{doc.name}</h4>
                                <span className="doc-type">{doc.type}</span>
                                <span className="doc-date">{new Date(doc.uploadedAt).toLocaleDateString()}</span>
                                {doc.url && (
                                  <a href={doc.url} target="_blank" rel="noopener noreferrer" className="doc-link">
                                    🔗 Open Link
                                  </a>
                                )}
                              </div>
                              <button onClick={() => deleteDocument(doc.id)} className="delete-btn">×</button>
                            </div>
                          ))}
                        </div>
                      </div>
                    )
                  })}
                  {documents.filter(d => !subjects.find(s => s.name === d.subject)).length > 0 && (
                    <div className="subject-section">
                      <h3>📁 Other Documents</h3>
                      <div className="docs-grid">
                        {documents.filter(d => !subjects.find(s => s.name === d.subject)).map(doc => (
                          <div key={doc.id} className="document-card">
                            <div className="doc-icon">
                              {doc.type === 'PDF' && '📝'}
                              {doc.type === 'Word' && '📄'}
                              {doc.type === 'PowerPoint' && '📊'}
                              {doc.type === 'Excel' && '📊'}
                              {doc.type === 'Image' && '🖼️'}
                              {doc.type === 'Video' && '🎥'}
                              {doc.type === 'Other' && '📁'}
                            </div>
                            <div className="doc-details">
                              <h4>{doc.name}</h4>
                              <span className="doc-type">{doc.type}</span>
                              <span className="doc-subject">Subject: {doc.subject}</span>
                              <span className="doc-date">{new Date(doc.uploadedAt).toLocaleDateString()}</span>
                              {doc.url && (
                                <a href={doc.url} target="_blank" rel="noopener noreferrer" className="doc-link">
                                  🔗 Open Link
                                </a>
                              )}
                            </div>
                            <button onClick={() => deleteDocument(doc.id)} className="delete-btn">×</button>
                          </div>
                        ))}
                      </div>
                    </div>
                  )}
                </div>
              )}
            </div>
          </div>
        )}

        {activeTab === 'ai-assistant' && (
          <div className="tab-content">
            <div className="ai-assistant-container">
              <div className="ai-header">
                <h2>🤖 AI Study Assistant</h2>
                <p>Ask me anything about studying, time management, exams, or learning strategies!</p>
                {aiMessages.length > 0 && (
                  <button onClick={clearAIChat} className="clear-chat-btn">Clear Chat</button>
                )}
              </div>

              <div className="ai-chat-container">
                {aiMessages.length === 0 ? (
                  <div className="ai-welcome">
                    <div className="ai-icon">🤖</div>
                    <h3>Welcome to your AI Study Assistant!</h3>
                    <p>I'm here to help you with:</p>
                    <div className="suggestion-chips">
                      <button onClick={() => {setUserQuestion('How to study effectively?'); setTimeout(() => askAI(), 100)}} className="chip">Study Tips</button>
                      <button onClick={() => {setUserQuestion('Tips for time management'); setTimeout(() => askAI(), 100)}} className="chip">Time Management</button>
                      <button onClick={() => {setUserQuestion('How to prepare for exams?'); setTimeout(() => askAI(), 100)}} className="chip">Exam Prep</button>
                      <button onClick={() => {setUserQuestion('How to improve memory?'); setTimeout(() => askAI(), 100)}} className="chip">Memory Tips</button>
                      <button onClick={() => {setUserQuestion('How to stay motivated?'); setTimeout(() => askAI(), 100)}} className="chip">Motivation</button>
                      <button onClick={() => {setUserQuestion('How to reduce study stress?'); setTimeout(() => askAI(), 100)}} className="chip">Stress Management</button>
                    </div>
                  </div>
                ) : (
                  <div className="ai-messages">
                    {aiMessages.map(msg => (
                      <div key={msg.id} className={`message ${msg.type}`}>
                        <div className="message-icon">
                          {msg.type === 'user' ? '👤' : '🤖'}
                        </div>
                        <div className="message-content">
                          <div className="message-text">{msg.text}</div>
                          <div className="message-time">{new Date(msg.timestamp).toLocaleTimeString()}</div>
                        </div>
                      </div>
                    ))}
                    {aiLoading && (
                      <div className="message ai">
                        <div className="message-icon">🤖</div>
                        <div className="message-content">
                          <div className="typing-indicator">
                            <span></span><span></span><span></span>
                          </div>
                        </div>
                      </div>
                    )}
                  </div>
                )}
              </div>

              <div className="ai-input-container">
                <input
                  type="text"
                  placeholder="Ask a question about studying..."
                  value={userQuestion}
                  onChange={(e) => setUserQuestion(e.target.value)}
                  onKeyPress={(e) => e.key === 'Enter' && askAI()}
                  disabled={aiLoading}
                />
                <button onClick={askAI} disabled={aiLoading || !userQuestion.trim()}>
                  {aiLoading ? 'Thinking...' : 'Ask 🤖'}
                </button>
              </div>
            </div>
          </div>
        )}

        {activeTab === 'documents' && (
          <div className="tab-content">
            <div className="add-document">
              <input
                type="text"
                placeholder="Document name..."
                value={newDocument.name}
                onChange={(e) => setNewDocument({...newDocument, name: e.target.value})}
              />
              <input
                type="text"
                placeholder="Subject..."
                value={newDocument.subject}
                onChange={(e) => setNewDocument({...newDocument, subject: e.target.value})}
              />
              <select 
                value={newDocument.type}
                onChange={(e) => setNewDocument({...newDocument, type: e.target.value})}
              >
                <option value="PDF">PDF</option>
                <option value="Word">Word</option>
                <option value="PowerPoint">PowerPoint</option>
                <option value="Excel">Excel</option>
                <option value="Image">Image</option>
                <option value="Video">Video</option>
                <option value="Other">Other</option>
              </select>
              <input
                type="text"
                placeholder="URL/Link (optional)..."
                value={newDocument.url}
                onChange={(e) => setNewDocument({...newDocument, url: e.target.value})}
              />
              <button onClick={addDocument}>Add Document</button>
            </div>

            <div className="documents-grid">
              {documents.length === 0 ? (
                <p className="empty-state">No documents yet. Add your first study document!</p>
              ) : (
                <div className="doc-list">
                  {subjects.length > 0 && subjects.map(subject => {
                    const subjectDocs = documents.filter(d => d.subject === subject.name)
                    if (subjectDocs.length === 0) return null
                    return (
                      <div key={subject.id} className="subject-section">
                        <h3>📚 {subject.name}</h3>
                        <div className="docs-grid">
                          {subjectDocs.map(doc => (
                            <div key={doc.id} className="document-card">
                              <div className="doc-icon">
                                {doc.type === 'PDF' && '📝'}
                                {doc.type === 'Word' && '📄'}
                                {doc.type === 'PowerPoint' && '📊'}
                                {doc.type === 'Excel' && '📊'}
                                {doc.type === 'Image' && '🖼️'}
                                {doc.type === 'Video' && '🎥'}
                                {doc.type === 'Other' && '📁'}
                              </div>
                              <div className="doc-details">
                                <h4>{doc.name}</h4>
                                <span className="doc-type">{doc.type}</span>
                                <span className="doc-date">{new Date(doc.uploadedAt).toLocaleDateString()}</span>
                                {doc.url && (
                                  <a href={doc.url} target="_blank" rel="noopener noreferrer" className="doc-link">
                                    🔗 Open Link
                                  </a>
                                )}
                              </div>
                              <button onClick={() => deleteDocument(doc.id)} className="delete-btn">×</button>
                            </div>
                          ))}
                        </div>
                      </div>
                    )
                  })}
                  {documents.filter(d => !subjects.find(s => s.name === d.subject)).length > 0 && (
                    <div className="subject-section">
                      <h3>📁 Other Documents</h3>
                      <div className="docs-grid">
                        {documents.filter(d => !subjects.find(s => s.name === d.subject)).map(doc => (
                          <div key={doc.id} className="document-card">
                            <div className="doc-icon">
                              {doc.type === 'PDF' && '📝'}
                              {doc.type === 'Word' && '📄'}
                              {doc.type === 'PowerPoint' && '📊'}
                              {doc.type === 'Excel' && '📊'}
                              {doc.type === 'Image' && '🖼️'}
                              {doc.type === 'Video' && '🎥'}
                              {doc.type === 'Other' && '📁'}
                            </div>
                            <div className="doc-details">
                              <h4>{doc.name}</h4>
                              <span className="doc-type">{doc.type}</span>
                              <span className="doc-subject">Subject: {doc.subject}</span>
                              <span className="doc-date">{new Date(doc.uploadedAt).toLocaleDateString()}</span>
                              {doc.url && (
                                <a href={doc.url} target="_blank" rel="noopener noreferrer" className="doc-link">
                                  🔗 Open Link
                                </a>
                              )}
                            </div>
                            <button onClick={() => deleteDocument(doc.id)} className="delete-btn">×</button>
                          </div>
                        ))}
                      </div>
                    </div>
                  )}
                </div>
              )}
            </div>
          </div>
        )}

        {activeTab === 'analytics' && (
          <div className="tab-content">
            <div className="analytics-header">
              <h2>Study Analytics</h2>
              <div className="report-filters">
                <button 
                  className={reportPeriod === 'week' ? 'active' : ''}
                  onClick={() => setReportPeriod('week')}
                >Week</button>
                <button 
                  className={reportPeriod === 'month' ? 'active' : ''}
                  onClick={() => setReportPeriod('month')}
                >Month</button>
                <button 
                  className={reportPeriod === 'year' ? 'active' : ''}
                  onClick={() => setReportPeriod('year')}
                >Year</button>
              </div>
            </div>

            <div className="charts">
              <div className="chart-card">
                <h3>Study Hours by Subject</h3>
                <div className="chart-placeholder">
                  {subjects.map(subject => (
                    <div key={subject.id} className="bar-item">
                      <span>{subject.name}</span>
                      <div className="bar">
                        <div className="bar-fill" style={{width: `${subject.progress}%`}}></div>
                      </div>
                      <span>{subject.progress}%</span>
                    </div>
                  ))}
                </div>
              </div>

              <div className="chart-card">
                <h3>Task Completion Rate</h3>
                <div className="completion-circle">
                  <h2>{productivity}%</h2>
                  <p>{completedTasks}/{tasks.length} tasks</p>
                </div>
              </div>

              <div className="chart-card">
                <h3>Category Distribution</h3>
                <div className="category-stats">
                  {['Study', 'Reading', 'Notes', 'Revision', 'Assignment', 'Test Prep'].map(cat => {
                    const count = tasks.filter(t => t.category === cat).length
                    return (
                      <div key={cat} className="category-item">
                        <span>{cat}</span>
                        <span className="count">{count}</span>
                      </div>
                    )
                  })}
                </div>
              </div>
            </div>
          </div>
        )}

        {activeTab === 'settings' && (
          <div className="tab-content">
            <div className="settings-section">
              <h2>Notifications</h2>
              <div className="setting-item">
                <label>
                  <input 
                    type="checkbox" 
                    checked={notifications.dailyReminders}
                    onChange={(e) => setNotifications({...notifications, dailyReminders: e.target.checked})}
                  />
                  Daily Reminders
                </label>
              </div>
              <div className="setting-item">
                <label>
                  <input 
                    type="checkbox" 
                    checked={notifications.revisionAlerts}
                    onChange={(e) => setNotifications({...notifications, revisionAlerts: e.target.checked})}
                  />
                  Revision Alerts
                </label>
              </div>
              <div className="setting-item">
                <label>
                  <input 
                    type="checkbox" 
                    checked={notifications.testAlerts}
                    onChange={(e) => setNotifications({...notifications, testAlerts: e.target.checked})}
                  />
                  Test Alerts
                </label>
              </div>
            </div>

            <div className="settings-section">
              <h2>Daily Goal</h2>
              <div className="setting-item">
                <label>
                  Study Goal (hours):
                  <input 
                    type="number" 
                    value={dailyGoalMinutes / 60} 
                    onChange={(e) => setDailyGoalMinutes(Number(e.target.value) * 60)}
                    min="1"
                    max="12"
                  />
                </label>
              </div>
            </div>

            <div className="settings-section">
              <h2>Data Management</h2>
              <button onClick={exportData} className="data-btn">Export Data</button>
              <label className="data-btn">
                Import Data
                <input type="file" accept=".json" onChange={importData} style={{display: 'none'}} />
              </label>
              <button onClick={clearAllData} className="data-btn danger">Clear All Data</button>
            </div>
          </div>
        )}
      </main>
    </div>
  )
}

export default App
