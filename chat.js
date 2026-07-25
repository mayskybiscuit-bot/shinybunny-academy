// Vercel Serverless Function - Proxy для OpenRouter API
// Путь: /api/chat.js
// Это защищает API ключ от видимости в браузере

export default async function handler(req, res) {
  // Только POST запросы
  if (req.method !== 'POST') {
    return res.status(405).json({ error: 'Method not allowed' });
  }

  try {
    const { messages, model } = req.body;

    // Валидация
    if (!messages || !Array.isArray(messages)) {
      return res.status(400).json({ error: 'Invalid messages format' });
    }

    if (!model) {
      return res.status(400).json({ error: 'Model not specified' });
    }

    // API ключ хранится в environment переменной (НЕ видимой в браузере!)
    const apiKey = process.env.OPENROUTER_API_KEY;
    if (!apiKey) {
      console.error('Missing OPENROUTER_API_KEY environment variable');
      return res.status(500).json({ error: 'API not configured' });
    }

    // Запрос к OpenRouter
    const response = await fetch('https://openrouter.ai/api/v1/chat/completions', {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        'Authorization': `Bearer ${apiKey}`,
        'HTTP-Referer': process.env.VERCEL_URL || 'http://localhost:3000',
        'X-Title': 'ShinyBunny Academy'
      },
      body: JSON.stringify({
        model: model,
        messages: messages,
        temperature: 0.7,
        max_tokens: 1000
      })
    });

    // Проверяем статус
    if (!response.ok) {
      const errorData = await response.json();
      console.error('OpenRouter error:', errorData);
      return res.status(response.status).json({
        error: errorData.error?.message || 'API request failed'
      });
    }

    // Возвращаем результат
    const data = await response.json();

    // Извлекаем только нужное (для экономии bandwidth)
    const result = {
      content: data.choices[0]?.message?.content || '',
      model: data.model,
      usage: data.usage
    };

    res.status(200).json(result);

  } catch (error) {
    console.error('Error in chat API:', error);
    res.status(500).json({
      error: error.message || 'Internal server error'
    });
  }
}
