import { useEffect, useState } from 'react';
import { api } from './lib/api';

type Client = { id: string; name: string; slug: string };
type Agent = { id: string; name: string; clientId: string; model: string; systemPrompt: string; toolList: string[] };

export default function App() {
  const [clients, setClients] = useState<Client[]>([]);
  const [agents, setAgents] = useState<Agent[]>([]);
  const [selectedClientId, setSelectedClientId] = useState('');

  useEffect(() => {
    void refresh();
  }, []);

  async function refresh() {
    const [c, a] = await Promise.all([
      api<Client[]>('/admin/clients'),
      api<Agent[]>('/admin/agents')
    ]);
    setClients(c);
    setAgents(a);
    if (!selectedClientId && c[0]) setSelectedClientId(c[0].id);
  }

  async function createClient(formData: FormData) {
    await api('/admin/clients', {
      method: 'POST',
      body: JSON.stringify({ name: formData.get('name'), slug: formData.get('slug') })
    });
    await refresh();
  }

  async function createAgent(formData: FormData) {
    await api('/admin/agents', {
      method: 'POST',
      body: JSON.stringify({
        clientId: selectedClientId,
        name: formData.get('name'),
        apiKey: formData.get('apiKey'),
        systemPrompt: formData.get('systemPrompt'),
        toolList: ['webFetch', 'knowledgeSearch', 'webhookCall']
      })
    });
    await refresh();
  }

  return (
    <div className="min-h-screen bg-slate-900 text-slate-100 p-6">
      <h1 className="text-2xl font-bold mb-4">OneBridge AaaS Admin</h1>
      <div className="grid grid-cols-1 lg:grid-cols-2 gap-4">
        <section className="rounded border border-slate-700 p-4">
          <h2 className="font-semibold mb-3">Clients</h2>
          <form action={createClient} className="space-y-2 mb-4">
            <input className="w-full bg-slate-800 p-2 rounded" name="name" placeholder="Client name" required />
            <input className="w-full bg-slate-800 p-2 rounded" name="slug" placeholder="slug" required />
            <button className="bg-emerald-500 text-black px-3 py-2 rounded" type="submit">Create client</button>
          </form>
          <ul className="space-y-2">
            {clients.map((client) => (
              <li key={client.id} className="bg-slate-800 rounded p-2 flex justify-between">
                <span>{client.name}</span>
                <button onClick={() => setSelectedClientId(client.id)} className="text-xs text-cyan-300">Select</button>
              </li>
            ))}
          </ul>
        </section>

        <section className="rounded border border-slate-700 p-4">
          <h2 className="font-semibold mb-3">Agents</h2>
          <form action={createAgent} className="space-y-2 mb-4">
            <input className="w-full bg-slate-800 p-2 rounded" name="name" placeholder="Agent name" required />
            <input className="w-full bg-slate-800 p-2 rounded" name="apiKey" placeholder="Agent API key" required />
            <textarea className="w-full bg-slate-800 p-2 rounded" name="systemPrompt" placeholder="System prompt" required />
            <button className="bg-cyan-400 text-black px-3 py-2 rounded" type="submit">Create agent</button>
          </form>
          <ul className="space-y-2 max-h-96 overflow-auto">
            {agents.filter((agent) => !selectedClientId || agent.clientId === selectedClientId).map((agent) => (
              <li key={agent.id} className="bg-slate-800 rounded p-2">
                <div className="font-medium">{agent.name}</div>
                <div className="text-xs text-slate-300">{agent.model}</div>
                <div className="text-xs text-slate-300">Tools: {agent.toolList.join(', ')}</div>
              </li>
            ))}
          </ul>
        </section>
      </div>
    </div>
  );
}
