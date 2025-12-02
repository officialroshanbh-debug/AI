'use client';

import { useState } from 'react';
import { Play, Copy, Check, Terminal, Key } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { Textarea } from '@/components/ui/textarea';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import { MODEL_IDS } from '@/types/ai-models';

const CODE_EXAMPLES = {
  curl: `curl https://your-domain.com/api/v1/chat \\
  -H "Authorization: Bearer YOUR_API_KEY" \\
  -H "Content-Type: application/json" \\
  -d '{
    "messages": [
      {"role": "user", "content": "Hello!"}
    ],
    "model": "gpt-4.1",
    "temperature": 0.7
  }'`,
  javascript: `const response = await fetch('https://your-domain.com/api/v1/chat', {
  method: 'POST',
  headers: {
    'Authorization': 'Bearer YOUR_API_KEY',
    'Content-Type': 'application/json',
  },
  body: JSON.stringify({
    messages: [
      { role: 'user', content: 'Hello!' }
    ],
    model: 'gpt-4.1',
    temperature: 0.7,
  }),
});

const data = await response.json();
console.log(data.choices[0].message.content);`,
  python: `import requests

response = requests.post(
    'https://your-domain.com/api/v1/chat',
    headers={
        'Authorization': 'Bearer YOUR_API_KEY',
        'Content-Type': 'application/json',
    },
    json={
        'messages': [
            {'role': 'user', 'content': 'Hello!'}
        ],
        'model': 'gpt-4.1',
        'temperature': 0.7,
    },
)

data = response.json()
print(data['choices'][0]['message']['content'])`,
};

export function ApiPlayground() {
  const [apiKey, setApiKey] = useState('');
  const [model, setModel] = useState('gpt-4.1');
  const [messages, setMessages] = useState('[{"role": "user", "content": "Hello!"}]');
  const [temperature, setTemperature] = useState('0.7');
  const [response, setResponse] = useState('');
  const [isLoading, setIsLoading] = useState(false);
  const [copied, setCopied] = useState(false);
  const [selectedTab, setSelectedTab] = useState('curl');

  const handleTest = async () => {
    if (!apiKey) {
      alert('Please enter your API key');
      return;
    }

    setIsLoading(true);
    setResponse('');

    try {
      let parsedMessages;
      try {
        parsedMessages = JSON.parse(messages);
      } catch {
        alert('Invalid JSON in messages');
        setIsLoading(false);
        return;
      }

      const res = await fetch('/api/v1/chat', {
        method: 'POST',
        headers: {
          Authorization: `Bearer ${apiKey}`,
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({
          messages: parsedMessages,
          model,
          temperature: parseFloat(temperature),
        }),
      });

      const data = await res.json();
      setResponse(JSON.stringify(data, null, 2));
    } catch (error) {
      setResponse(`Error: ${error instanceof Error ? error.message : 'Unknown error'}`);
    } finally {
      setIsLoading(false);
    }
  };

  const copyToClipboard = async (text: string) => {
    await navigator.clipboard.writeText(text);
    setCopied(true);
    setTimeout(() => setCopied(false), 2000);
  };

  return (
    <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
      {/* Request Panel */}
      <Card>
        <CardHeader>
          <CardTitle>Request</CardTitle>
          <CardDescription>Configure and test API requests</CardDescription>
        </CardHeader>
        <CardContent className="space-y-4">
          <div>
            <Label htmlFor="apiKey">API Key *</Label>
            <div className="flex gap-2">
              <Input
                id="apiKey"
                type="password"
                value={apiKey}
                onChange={(e) => setApiKey(e.target.value)}
                placeholder="sk-..."
              />
              <Button
                variant="outline"
                onClick={() => window.location.href = '/settings?tab=api-keys'}
              >
                <Key className="h-4 w-4 mr-2" />
                Manage Keys
              </Button>
            </div>
          </div>

          <div className="grid grid-cols-2 gap-4">
            <div>
              <Label htmlFor="model">Model</Label>
              <Select value={model} onValueChange={setModel}>
                <SelectTrigger id="model">
                  <SelectValue />
                </SelectTrigger>
                <SelectContent>
                  {Object.values(MODEL_IDS).map((id) => (
                    <SelectItem key={id} value={id}>
                      {id}
                    </SelectItem>
                  ))}
                </SelectContent>
              </Select>
            </div>

            <div>
              <Label htmlFor="temperature">Temperature</Label>
              <Input
                id="temperature"
                type="number"
                min="0"
                max="2"
                step="0.1"
                value={temperature}
                onChange={(e) => setTemperature(e.target.value)}
              />
            </div>
          </div>

          <div>
            <Label htmlFor="messages">Messages (JSON)</Label>
            <Textarea
              id="messages"
              value={messages}
              onChange={(e) => setMessages(e.target.value)}
              rows={8}
              className="font-mono text-sm"
              placeholder='[{"role": "user", "content": "Hello!"}]'
            />
          </div>

          <Button onClick={handleTest} disabled={isLoading} className="w-full">
            <Play className="h-4 w-4 mr-2" />
            {isLoading ? 'Sending...' : 'Send Request'}
          </Button>
        </CardContent>
      </Card>

      {/* Response & Examples Panel */}
      <div className="space-y-6">
        <Card>
          <CardHeader>
            <CardTitle>Response</CardTitle>
            <CardDescription>API response will appear here</CardDescription>
          </CardHeader>
          <CardContent>
            {response ? (
              <div className="relative">
                <Button
                  variant="ghost"
                  size="sm"
                  className="absolute top-2 right-2"
                  onClick={() => copyToClipboard(response)}
                >
                  {copied ? <Check className="h-4 w-4" /> : <Copy className="h-4 w-4" />}
                </Button>
                <pre className="p-4 rounded-lg bg-muted text-sm overflow-auto max-h-96">
                  {response}
                </pre>
              </div>
            ) : (
              <div className="p-8 text-center text-muted-foreground">
                <Terminal className="h-12 w-12 mx-auto mb-2 opacity-50" />
                <p>Response will appear here after sending a request</p>
              </div>
            )}
          </CardContent>
        </Card>

        <Card>
          <CardHeader>
            <CardTitle>Code Examples</CardTitle>
            <CardDescription>Copy code snippets for your language</CardDescription>
          </CardHeader>
          <CardContent>
            <Tabs value={selectedTab} onValueChange={setSelectedTab}>
              <TabsList className="grid w-full grid-cols-3">
                <TabsTrigger value="curl">cURL</TabsTrigger>
                <TabsTrigger value="javascript">JavaScript</TabsTrigger>
                <TabsTrigger value="python">Python</TabsTrigger>
              </TabsList>
              {Object.entries(CODE_EXAMPLES).map(([lang, code]) => (
                <TabsContent key={lang} value={lang} className="mt-4">
                  <div className="relative">
                    <Button
                      variant="ghost"
                      size="sm"
                      className="absolute top-2 right-2"
                      onClick={() => copyToClipboard(code)}
                    >
                      {copied ? <Check className="h-4 w-4" /> : <Copy className="h-4 w-4" />}
                    </Button>
                    <pre className="p-4 rounded-lg bg-muted text-xs overflow-auto">
                      <code>{code}</code>
                    </pre>
                  </div>
                </TabsContent>
              ))}
            </Tabs>
          </CardContent>
        </Card>
      </div>
    </div>
  );
}

