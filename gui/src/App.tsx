import { useState, useEffect, useCallback } from 'react';

// ═══════════════════════════════════════════════════════════════════════════════
// TYPES
// ═══════════════════════════════════════════════════════════════════════════════

interface AgentStatus {
  isRunning: boolean;
  activeBounties: number;
  completedBounties: number;
  totalPayouts: number;
  network: string;
  walletAddress?: string;
  walletBalance?: string;
}

interface Config {
  chainId: number;
  rpcUrl: string;
  poidhContractAddress: string;
  pollingInterval: number;
  maxGasPriceGwei: number;
  autoApproveGas: boolean;
  logLevel: string;
  demoMode: boolean;
  openaiVisionModel: string;
}

interface BountyTemplate {
  id: string;
  name: string;
  description: string;
  selectionMode: string;
  rewardEth: string;
  deadlineHours: number;
  tags: string[];
}

interface Bounty {
  id: string;
  name: string;
  status: string;
  onChainId?: string;
  rewardEth: string;
  submissionCount: number;
  deadlineFormatted: string;
  winner?: string;
  selectionMode: string;
}

interface LogEntry {
  timestamp: string;
  level: string;
  message: string;
}

interface ApiResponse<T> {
  success: boolean;
  data?: T;
  error?: string;
}

// ═══════════════════════════════════════════════════════════════════════════════
// API HELPER
// ═══════════════════════════════════════════════════════════════════════════════

async function api<T>(path: string, options?: RequestInit): Promise<T> {
  const res = await fetch(`/api${path}`, {
    headers: { 'Content-Type': 'application/json' },
    ...options,
  });
  const json: ApiResponse<T> = await res.json();
  if (!json.success) throw new Error(json.error || 'API error');
  return json.data!;
}

// ═══════════════════════════════════════════════════════════════════════════════
// COMPONENTS
// ═══════════════════════════════════════════════════════════════════════════════

type TabType = 'status' | 'config' | 'bounties' | 'logs';

function Toggle({
  label,
  description,
  checked,
  onChange,
  disabled = false,
}: {
  label: string;
  description: string;
  checked: boolean;
  onChange: (value: boolean) => void;
  disabled?: boolean;
}) {
  return (
    <label className={`toggle-row ${disabled ? 'disabled' : ''}`}>
      <div>
        <p className="toggle-label">{label}</p>
        <p className="toggle-desc">{description}</p>
      </div>
      <button
        type="button"
        onClick={() => !disabled && onChange(!checked)}
        className={`toggle-switch ${checked ? 'on' : ''}`}
        disabled={disabled}
      >
        <span className="toggle-knob" />
      </button>
    </label>
  );
}

function StatusTab({
  status,
  onStartAgent,
  onStopAgent,
  actionLoading,
}: {
  status: AgentStatus | null;
  onStartAgent: () => void;
  onStopAgent: () => void;
  actionLoading: string | null;
}) {
  return (
    <div className="tab-content">
      <div className="stats-grid">
        <div className="stat-card">
          <div className="label">Agent Status</div>
          <div className="value">
            <span className={`status-indicator ${status?.isRunning ? 'running' : 'stopped'}`}>
              {status?.isRunning ? '● Running' : '○ Stopped'}
            </span>
          </div>
          <div className="stat-action">
            {status?.isRunning ? (
              <button
                className="btn btn-danger"
                onClick={onStopAgent}
                disabled={actionLoading === 'stop'}
              >
                {actionLoading === 'stop' ? 'Stopping...' : 'Stop Agent'}
              </button>
            ) : (
              <button
                className="btn btn-success"
                onClick={onStartAgent}
                disabled={actionLoading === 'start'}
              >
                {actionLoading === 'start' ? 'Starting...' : 'Start Agent'}
              </button>
            )}
          </div>
        </div>
        <div className="stat-card">
          <div className="label">Network</div>
          <div className="value">{status?.network || 'Unknown'}</div>
        </div>
        <div className="stat-card">
          <div className="label">Active Bounties</div>
          <div className="value">{status?.activeBounties || 0}</div>
        </div>
        <div className="stat-card">
          <div className="label">Completed</div>
          <div className="value">{status?.completedBounties || 0}</div>
        </div>
        <div className="stat-card">
          <div className="label">Total Payouts</div>
          <div className="value">{status?.totalPayouts?.toFixed(4) || '0'} ETH</div>
        </div>
      </div>

      {status?.walletAddress && (
        <div className="card" style={{ marginTop: '20px' }}>
          <h3>💰 Wallet</h3>
          <div className="wallet-info">
            <div>
              <span className="label-inline">Address: </span>
              <code className="address">{status.walletAddress}</code>
            </div>
            <div>
              <span className="label-inline">Balance: </span>
              <strong>{status.walletBalance}</strong>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}

function ConfigTab({
  config,
  onConfigChange,
  onSave,
  saving,
  saved,
}: {
  config: Config | null;
  onConfigChange: (updates: Partial<Config>) => void;
  onSave: () => void;
  saving: boolean;
  saved: boolean;
}) {
  if (!config) return <div className="loading">Loading configuration...</div>;

  return (
    <div className="tab-content">
      <div className="card">
        <h3>⚙️ Configuration</h3>
        <p className="card-subtitle">Configure the autonomous bounty bot settings</p>

        <div className="config-grid">
          <div className="config-section">
            <h4>Network</h4>
            <div className="config-item">
              <label>Chain</label>
              <select
                value={config.chainId}
                onChange={(e) => onConfigChange({ chainId: parseInt(e.target.value) })}
                className="select-input"
                disabled
              >
                <option value={8453}>Base Mainnet (8453)</option>
                <option value={84532}>Base Sepolia (84532)</option>
              </select>
              <span className="help-text">Change requires .env update and restart</span>
            </div>
            <div className="config-item">
              <label>Contract</label>
              <input
                type="text"
                value={config.poidhContractAddress}
                className="text-input"
                disabled
              />
            </div>
          </div>

          <div className="config-section">
            <h4>Performance</h4>
            <div className="config-item">
              <label>Polling Interval: {config.pollingInterval}s</label>
              <input
                type="range"
                min="5"
                max="120"
                value={config.pollingInterval}
                onChange={(e) => onConfigChange({ pollingInterval: parseInt(e.target.value) })}
                className="range-input"
              />
              <div className="range-labels">
                <span>5s (fast)</span>
                <span>120s (slow)</span>
              </div>
            </div>
            <div className="config-item">
              <label>Max Gas Price (Gwei)</label>
              <input
                type="number"
                value={config.maxGasPriceGwei}
                onChange={(e) => onConfigChange({ maxGasPriceGwei: parseInt(e.target.value) })}
                className="text-input"
                min={1}
                max={500}
              />
            </div>
          </div>

          <div className="config-section">
            <h4>AI Settings</h4>
            <div className="config-item">
              <label>OpenAI Vision Model</label>
              <select
                value={config.openaiVisionModel}
                onChange={(e) => onConfigChange({ openaiVisionModel: e.target.value })}
                className="select-input"
                disabled
              >
                <option value="gpt-4o">GPT-4o (Recommended)</option>
                <option value="gpt-4o-mini">GPT-4o Mini</option>
                <option value="gpt-4-turbo">GPT-4 Turbo</option>
              </select>
              <span className="help-text">Change requires .env update and restart</span>
            </div>
            <div className="config-item">
              <label>Log Level</label>
              <select
                value={config.logLevel}
                onChange={(e) => onConfigChange({ logLevel: e.target.value })}
                className="select-input"
              >
                <option value="debug">Debug</option>
                <option value="info">Info</option>
                <option value="warn">Warning</option>
                <option value="error">Error</option>
              </select>
            </div>
          </div>

          <div className="config-section">
            <h4>Toggles</h4>
            <Toggle
              label="Auto-approve Gas"
              description="Automatically approve gas transactions without confirmation"
              checked={config.autoApproveGas}
              onChange={(v) => onConfigChange({ autoApproveGas: v })}
            />
            <Toggle
              label="Demo Mode"
              description="Run in demo mode without real transactions"
              checked={config.demoMode}
              onChange={(v) => onConfigChange({ demoMode: v })}
            />
          </div>
        </div>

        <div className="config-actions">
          <button
            className="btn btn-primary"
            onClick={onSave}
            disabled={saving}
          >
            {saving ? 'Saving...' : 'Save Configuration'}
          </button>
          {saved && <span className="success-text">✓ Saved (some changes require restart)</span>}
        </div>
      </div>
    </div>
  );
}

function BountyTab({
  templates,
  bounties,
  onLaunchBounty,
  actionLoading,
}: {
  templates: BountyTemplate[];
  bounties: Bounty[];
  onLaunchBounty: (templateId: string, overrides?: Record<string, unknown>) => void;
  actionLoading: string | null;
}) {
  const [selectedTemplate, setSelectedTemplate] = useState<string | null>(null);
  const [customReward, setCustomReward] = useState('');
  const [customDeadline, setCustomDeadline] = useState('');

  const selectedTemplateData = templates.find((t) => t.id === selectedTemplate);

  const handleLaunch = () => {
    if (!selectedTemplate) return;
    const overrides: Record<string, unknown> = {};
    if (customReward) overrides.rewardEth = customReward;
    if (customDeadline) {
      const hours = parseInt(customDeadline);
      if (!isNaN(hours)) {
        overrides.deadline = Math.floor(Date.now() / 1000) + hours * 3600;
      }
    }
    onLaunchBounty(selectedTemplate, Object.keys(overrides).length > 0 ? overrides : undefined);
    setSelectedTemplate(null);
    setCustomReward('');
    setCustomDeadline('');
  };

  return (
    <div className="tab-content">
      <div className="card">
        <h3>🚀 Launch Bounty</h3>
        <p className="card-subtitle">Select a template to create a new bounty</p>

        <div className="template-selector">
          <div className="templates-grid">
            {templates.map((template) => (
              <div
                key={template.id}
                className={`template-card ${selectedTemplate === template.id ? 'selected' : ''}`}
                onClick={() => setSelectedTemplate(template.id)}
              >
                <h4>{template.name}</h4>
                <p>{template.description.substring(0, 80)}...</p>
                <div className="template-meta">
                  <span>💰 {template.rewardEth} ETH</span>
                  <span>⏰ {template.deadlineHours}h</span>
                </div>
                <div className="template-tags">
                  <span className={`mode-badge ${template.selectionMode}`}>
                    {template.selectionMode === 'first_valid' ? '🎯 First Valid' : '🤖 AI Judged'}
                  </span>
                </div>
              </div>
            ))}
          </div>

          {selectedTemplateData && (
            <div className="launch-config">
              <h4>Customize "{selectedTemplateData.name}"</h4>
              <div className="customize-grid">
                <div className="config-item">
                  <label>Reward (ETH)</label>
                  <input
                    type="text"
                    placeholder={selectedTemplateData.rewardEth}
                    value={customReward}
                    onChange={(e) => setCustomReward(e.target.value)}
                    className="text-input"
                  />
                </div>
                <div className="config-item">
                  <label>Deadline (hours)</label>
                  <input
                    type="number"
                    placeholder={String(selectedTemplateData.deadlineHours)}
                    value={customDeadline}
                    onChange={(e) => setCustomDeadline(e.target.value)}
                    className="text-input"
                    min={1}
                  />
                </div>
              </div>
              <button
                className="btn btn-primary btn-large"
                onClick={handleLaunch}
                disabled={actionLoading === selectedTemplate}
              >
                {actionLoading === selectedTemplate ? 'Launching...' : '🚀 Launch Bounty'}
              </button>
            </div>
          )}
        </div>
      </div>

      <div className="card" style={{ marginTop: '20px' }}>
        <h3>📋 Active Bounties</h3>
        {bounties.length === 0 ? (
          <div className="empty-state">
            No bounties yet. Launch one from the templates above!
          </div>
        ) : (
          <div className="bounties-list">
            {bounties.map((bounty) => (
              <div key={bounty.id} className="bounty-item">
                <div className="bounty-info">
                  <h4>{bounty.name}</h4>
                  <div className="bounty-meta">
                    {bounty.onChainId && <span>#{bounty.onChainId}</span>}
                    <span>{bounty.rewardEth} ETH</span>
                    <span>{bounty.submissionCount} submissions</span>
                    <span className={`mode-badge small ${bounty.selectionMode}`}>
                      {bounty.selectionMode === 'first_valid' ? 'First Valid' : 'AI Judged'}
                    </span>
                    {bounty.winner && <span className="winner">Winner: {bounty.winner.slice(0, 10)}...</span>}
                  </div>
                </div>
                <span className={`bounty-status ${bounty.status.toLowerCase()}`}>
                  {bounty.status}
                </span>
              </div>
            ))}
          </div>
        )}
      </div>
    </div>
  );
}

function LogsTab({
  logs,
  onRefresh,
}: {
  logs: LogEntry[];
  onRefresh: () => void;
}) {
  return (
    <div className="tab-content">
      <div className="card">
        <div className="logs-header">
          <h3>📜 Recent Logs</h3>
          <button className="btn btn-secondary" onClick={onRefresh}>
            Refresh
          </button>
        </div>
        <div className="logs-container">
          {logs.length === 0 ? (
            <div className="empty-state">No logs yet</div>
          ) : (
            logs.map((log, i) => (
              <div key={i} className={`log-entry ${log.level}`}>
                <span className="timestamp">
                  {new Date(log.timestamp).toLocaleTimeString()}
                </span>
                <span className={`level ${log.level}`}>[{log.level.toUpperCase()}]</span>
                <span className="message">{log.message}</span>
              </div>
            ))
          )}
        </div>
      </div>
    </div>
  );
}

// ═══════════════════════════════════════════════════════════════════════════════
// MAIN APP
// ═══════════════════════════════════════════════════════════════════════════════

function App() {
  const [activeTab, setActiveTab] = useState<TabType>('status');
  const [status, setStatus] = useState<AgentStatus | null>(null);
  const [config, setConfig] = useState<Config | null>(null);
  const [templates, setTemplates] = useState<BountyTemplate[]>([]);
  const [bounties, setBounties] = useState<Bounty[]>([]);
  const [logs, setLogs] = useState<LogEntry[]>([]);
  const [loading, setLoading] = useState(true);
  const [actionLoading, setActionLoading] = useState<string | null>(null);
  const [configSaving, setConfigSaving] = useState(false);
  const [configSaved, setConfigSaved] = useState(false);

  const fetchData = useCallback(async () => {
    try {
      const [statusData, configData, templatesData, bountiesData, logsData] = await Promise.all([
        api<AgentStatus>('/status'),
        api<Config>('/config'),
        api<BountyTemplate[]>('/templates'),
        api<Bounty[]>('/bounties'),
        api<LogEntry[]>('/logs?limit=50'),
      ]);
      setStatus(statusData);
      setConfig(configData);
      setTemplates(templatesData);
      setBounties(bountiesData);
      setLogs(logsData.reverse());
    } catch (err) {
      console.error('Failed to fetch data:', err);
    } finally {
      setLoading(false);
    }
  }, []);

  useEffect(() => {
    fetchData();
    const interval = setInterval(fetchData, 5000);
    return () => clearInterval(interval);
  }, [fetchData]);

  const handleStartAgent = async () => {
    setActionLoading('start');
    try {
      await api('/agent/start', { method: 'POST' });
      await fetchData();
    } catch (err) {
      console.error('Failed to start agent:', err);
      alert(`Failed to start agent: ${(err as Error).message}`);
    } finally {
      setActionLoading(null);
    }
  };

  const handleStopAgent = async () => {
    setActionLoading('stop');
    try {
      await api('/agent/stop', { method: 'POST' });
      await fetchData();
    } catch (err) {
      console.error('Failed to stop agent:', err);
    } finally {
      setActionLoading(null);
    }
  };

  const handleLaunchBounty = async (templateId: string, overrides?: Record<string, unknown>) => {
    setActionLoading(templateId);
    try {
      await api(`/bounties/launch/${templateId}`, {
        method: 'POST',
        body: overrides ? JSON.stringify(overrides) : undefined,
      });
      await fetchData();
    } catch (err) {
      console.error('Failed to launch bounty:', err);
      alert(`Failed to launch bounty: ${(err as Error).message}`);
    } finally {
      setActionLoading(null);
    }
  };

  const handleConfigChange = (updates: Partial<Config>) => {
    if (config) {
      setConfig({ ...config, ...updates });
      setConfigSaved(false);
    }
  };

  const handleSaveConfig = async () => {
    if (!config) return;
    setConfigSaving(true);
    try {
      await api('/config', {
        method: 'POST',
        body: JSON.stringify({
          pollingInterval: config.pollingInterval,
          maxGasPriceGwei: config.maxGasPriceGwei,
          autoApproveGas: config.autoApproveGas,
          logLevel: config.logLevel,
          demoMode: config.demoMode,
        }),
      });
      setConfigSaved(true);
      setTimeout(() => setConfigSaved(false), 3000);
    } catch (err) {
      alert(`Failed to save config: ${(err as Error).message}`);
    } finally {
      setConfigSaving(false);
    }
  };

  if (loading) {
    return (
      <div className="app">
        <div className="loading">Loading...</div>
      </div>
    );
  }

  return (
    <div className="app">
      <header className="header">
        <h1>🤖 Autonomous Bounty Bot</h1>
        <div className="header-status">
          <span className={`status-badge ${status?.isRunning ? 'running' : 'stopped'}`}>
            <span className="status-dot" />
            {status?.isRunning ? 'Running' : 'Stopped'}
          </span>
          <span className="network-badge">{status?.network}</span>
        </div>
      </header>

      <nav className="tabs">
        <button
          className={`tab ${activeTab === 'status' ? 'active' : ''}`}
          onClick={() => setActiveTab('status')}
        >
          📊 Status
        </button>
        <button
          className={`tab ${activeTab === 'config' ? 'active' : ''}`}
          onClick={() => setActiveTab('config')}
        >
          ⚙️ Config
        </button>
        <button
          className={`tab ${activeTab === 'bounties' ? 'active' : ''}`}
          onClick={() => setActiveTab('bounties')}
        >
          🎯 Bounties
        </button>
        <button
          className={`tab ${activeTab === 'logs' ? 'active' : ''}`}
          onClick={() => setActiveTab('logs')}
        >
          📜 Logs
        </button>
      </nav>

      {activeTab === 'status' && (
        <StatusTab
          status={status}
          onStartAgent={handleStartAgent}
          onStopAgent={handleStopAgent}
          actionLoading={actionLoading}
        />
      )}
      {activeTab === 'config' && (
        <ConfigTab
          config={config}
          onConfigChange={handleConfigChange}
          onSave={handleSaveConfig}
          saving={configSaving}
          saved={configSaved}
        />
      )}
      {activeTab === 'bounties' && (
        <BountyTab
          templates={templates}
          bounties={bounties}
          onLaunchBounty={handleLaunchBounty}
          actionLoading={actionLoading}
        />
      )}
      {activeTab === 'logs' && (
        <LogsTab logs={logs} onRefresh={fetchData} />
      )}
    </div>
  );
}

export default App;
