interface WidgetConfig {
  apiBase: string;
  agentKey: string;
  theme?: 'light' | 'dark';
}

declare global {
  interface Window {
    OneBridgeWidget: { mount: (selector: string, config: WidgetConfig) => void };
  }
}

function mount(selector: string, config: WidgetConfig) {
  const el = document.querySelector(selector);
  if (!el) return;

  const sessionKey = `ob_session_${config.agentKey}`;
  let sessionId = localStorage.getItem(sessionKey);

  el.innerHTML = `
    <div style="font-family: sans-serif; border:1px solid #d1d5db; border-radius:12px; overflow:hidden; width:320px;">
      <div style="padding:10px; background:${config.theme === 'dark' ? '#111827' : '#f8fafc'}; color:${config.theme === 'dark' ? '#fff' : '#111'};">OneBridge Assistant</div>
      <div id="ob-log" style="height:260px; overflow:auto; padding:10px; background:white"></div>
      <form id="ob-form" style="display:flex; gap:8px; padding:10px; border-top:1px solid #e5e7eb;">
        <input id="ob-input" style="flex:1; padding:8px; border:1px solid #cbd5e1; border-radius:8px" placeholder="Type your message" />
        <button style="padding:8px 10px">Send</button>
      </form>
    </div>
  `;

  const log = el.querySelector('#ob-log') as HTMLDivElement;
  const form = el.querySelector('#ob-form') as HTMLFormElement;
  const input = el.querySelector('#ob-input') as HTMLInputElement;

  form.addEventListener('submit', async (event) => {
    event.preventDefault();
    const prompt = input.value.trim();
    if (!prompt) return;

    append(log, 'You', prompt);
    input.value = '';

    const response = await fetch(`${config.apiBase}/v1/execute/sync`, {
      method: 'POST',
      headers: {
        'content-type': 'application/json',
        'x-agent-api-key': config.agentKey
      },
      body: JSON.stringify({ prompt, sessionId })
    });

    const payload = await response.json();
    sessionId = payload.sessionId;
    localStorage.setItem(sessionKey, sessionId);
    append(log, 'Agent', payload.output || payload.error || 'No response');
  });
}

function append(log: HTMLElement, label: string, text: string) {
  const row = document.createElement('div');
  row.style.marginBottom = '8px';
  row.innerHTML = `<strong>${label}:</strong> ${text}`;
  log.appendChild(row);
  log.scrollTop = log.scrollHeight;
}

window.OneBridgeWidget = { mount };

export { mount };
