import { expect, test, type Page } from '@playwright/test'

type GeminiBody = {
  contents?: Array<{ parts?: Array<{ text?: string }> }>
  systemInstruction?: unknown
}

type ResponseResolver = (body: GeminiBody) => string

async function interceptGemini(page: Page, resolveResponse: ResponseResolver = () => 'GST is a general consumption tax. Check the latest official guidance for filing details.') {
  const requests: GeminiBody[] = []
  await page.route('**/*generativelanguage.googleapis.com/**', async (route) => {
    const body = (route.request().postDataJSON() ?? {}) as GeminiBody
    requests.push(body)
    const text = resolveResponse(body)
    await route.fulfill({
      status: 200,
      contentType: 'application/json',
      body: JSON.stringify({
        candidates: [{
          content: { parts: [{ text }], role: 'model' },
          finishReason: 'STOP',
          index: 0,
        }],
      }),
    })
  })
  return requests
}

function requestText(body: GeminiBody): string {
  return JSON.stringify(body)
}

test('answers scoped questions, carries follow-up context, and resets active history', async ({ page }) => {
  const requests = await interceptGemini(page)
  await page.goto('/')

  await expect(page.getByText('General information only. CA Buddy is not a substitute for advice from a Chartered Accountant.')).toBeVisible()
  const input = page.getByRole('textbox', { name: 'Your question' })
  await input.fill('What is GST?')
  await page.getByRole('button', { name: 'Ask CA Buddy' }).click()
  await expect(page.getByText('GST is a general consumption tax.')).toBeVisible()
  expect(requestText(requests[0])).toContain('Indian GST, TDS, ITR deadlines, and audit basics')
  expect(requestText(requests[0])).toContain('What is GST?')

  await input.fill('And what about TDS?')
  await page.getByRole('button', { name: 'Ask CA Buddy' }).click()
  await expect(page.getByText('And what about TDS?')).toBeVisible()
  expect(requestText(requests[1])).toContain('What is GST?')
  expect(requestText(requests[1])).toContain('GST is a general consumption tax.')

  await page.getByRole('button', { name: 'New chat' }).click()
  await expect(page.getByText('What is GST?')).not.toBeVisible()
  await expect(page.getByText('GST is a general consumption tax.')).not.toBeVisible()
  await input.fill('What is an ITR deadline?')
  await page.getByRole('button', { name: 'Ask CA Buddy' }).click()
  await expect(page.getByText('What is an ITR deadline?')).toBeVisible()
  expect(requestText(requests[2])).not.toContain('What is GST?')
  expect(requestText(requests[2])).not.toContain('And what about TDS?')
})

test('recommends a Chartered Accountant for personalized questions', async ({ page }) => {
  await interceptGemini(page, (body) => requestText(body).includes('personal')
    ? 'This depends on your individual facts. Please consult a Chartered Accountant for professional advice.'
    : 'General information.')
  await page.goto('/')
  await page.getByRole('textbox', { name: 'Your question' }).fill('Can you decide my personalized tax position?')
  await page.getByRole('button', { name: 'Ask CA Buddy' }).click()

  await expect(page.getByText(/consult a Chartered Accountant/)).toBeVisible()
})

test('shows a retryable error and renders model output as plain text', async ({ page }) => {
  await page.route('**/*generativelanguage.googleapis.com/**', async (route) => {
    await route.abort('failed')
  })
  await page.goto('/')
  await page.getByRole('textbox', { name: 'Your question' }).fill('What is TDS?')
  await page.getByRole('button', { name: 'Ask CA Buddy' }).click()
  await expect(page.getByRole('alert')).toHaveText('We could not get an answer right now. Please try again.')

  await page.unroute('**/*generativelanguage.googleapis.com/**')
  await interceptGemini(page, () => '<strong>Text only</strong>')
  await page.getByRole('textbox', { name: 'Your question' }).fill('What is TDS?')
  await page.getByRole('button', { name: 'Ask CA Buddy' }).click()
  await expect(page.getByText('<strong>Text only</strong>')).toBeVisible()
  await expect(page.locator('strong')).toHaveCount(0)
})
