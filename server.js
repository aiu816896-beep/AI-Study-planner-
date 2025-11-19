import express from 'express'
import cors from 'cors'
import dotenv from 'dotenv'

dotenv.config()

const app = express()
const port = process.env.PORT || 3001

app.use(cors())
app.use(express.json())

app.get('/', (req, res) => {
  res.send({status: 'ok', message: 'AI proxy server running'})
})

app.post('/api/ai', async (req, res) => {
  const { question } = req.body || {}
  if (!question) return res.status(400).json({ error: 'Missing question in request body' })

  const OPENAI_KEY = process.env.OPENAI_API_KEY || process.env.OPENAI_KEY
  if (!OPENAI_KEY) {
    return res.status(500).json({ error: 'OPENAI_API_KEY not set in environment' })
  }

  try {
    const response = await fetch('https://api.openai.com/v1/chat/completions', {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        'Authorization': `Bearer ${OPENAI_KEY}`
      },
      body: JSON.stringify({
        model: 'gpt-3.5-turbo',
        messages: [
          { role: 'system', content: 'You are a helpful study assistant.' },
          { role: 'user', content: question }
        ],
        max_tokens: 800,
        temperature: 0.6
      })
    })

    if (!response.ok) {
      const errText = await response.text()
      return res.status(500).json({ error: 'Upstream API error', details: errText })
    }

    const data = await response.json()
    const aiText = data?.choices?.[0]?.message?.content || 'No response from model.'
    return res.json({ answer: aiText })
  } catch (err) {
    console.error('AI proxy error:', err)
    return res.status(500).json({ error: 'Server error', details: err.message })
  }
})

app.listen(port, () => {
  console.log(`AI proxy server listening on http://localhost:${port}`)
})
