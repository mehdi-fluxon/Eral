import OpenAI from 'openai'

const openai = new OpenAI({
  apiKey: process.env.OPENAI_API_KEY,
})

const assistantId = process.env.OPENAI_ASSISTANT_ID

async function updateAssistant() {
  try {
    const assistant = await openai.beta.assistants.update(assistantId, {
      model: "gpt-4o"
    })
    console.log('✅ Assistant updated to gpt-4o:', assistant.id)
  } catch (error) {
    console.error('❌ Error:', error.message)
  }
}

updateAssistant()
