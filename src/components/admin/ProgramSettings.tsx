'use client'

interface ProgramSettingsProps {
  programName: string
  setProgramName: (v: string) => void
  client: string
  setClient: (v: string) => void
  clients: string[]
  totalWeeks: number
  setTotalWeeks: (v: number) => void
  password: string
  setPassword: (v: string) => void
  description: string
  setDescription: (v: string) => void
  onClose: () => void
  isNew: boolean
}

export default function ProgramSettings({
  programName, setProgramName,
  client, setClient, clients,
  totalWeeks, setTotalWeeks,
  password, setPassword,
  description, setDescription,
  onClose, isNew,
}: ProgramSettingsProps) {
  const canClose = programName && client && password

  return (
    <div style={{
      position: 'fixed',
      inset: 0,
      background: 'rgba(0,0,0,0.7)',
      display: 'flex',
      alignItems: 'center',
      justifyContent: 'center',
      zIndex: 100,
      padding: '20px',
    }}>
      <div style={{
        background: 'var(--brand-card)',
        border: '1px solid var(--brand-border)',
        borderRadius: '16px',
        padding: '28px',
        width: '100%',
        maxWidth: '460px',
      }}>
        <h2 style={{ fontSize: '20px', fontWeight: 600, margin: '0 0 20px' }}>
          {isNew ? '🆕 New Program' : '⚙️ Program Settings'}
        </h2>

        <div style={{ display: 'flex', flexDirection: 'column', gap: '14px' }}>
          <div>
            <label style={{ fontSize: '12px', color: 'var(--brand-muted)', display: 'block', marginBottom: '4px' }}>Program Name *</label>
            <input
              className="input-field"
              value={programName}
              onChange={e => setProgramName(e.target.value)}
              placeholder="e.g., Mika - Phase 1 Strength"
              autoFocus
            />
          </div>

          <div>
            <label style={{ fontSize: '12px', color: 'var(--brand-muted)', display: 'block', marginBottom: '4px' }}>Client *</label>
            <select className="input-field" value={client} onChange={e => setClient(e.target.value)}>
              <option value="">Select client...</option>
              {clients.map(c => <option key={c} value={c}>{c}</option>)}
            </select>
            <p style={{ fontSize: '11px', color: 'var(--brand-muted)', marginTop: '4px' }}>
              Add new clients in your Notion Exercise Library
            </p>
          </div>

          <div>
            <label style={{ fontSize: '12px', color: 'var(--brand-muted)', display: 'block', marginBottom: '4px' }}>Total Weeks</label>
            <input
              className="input-field"
              type="number"
              min={1}
              max={52}
              value={totalWeeks}
              onChange={e => setTotalWeeks(parseInt(e.target.value) || 1)}
            />
          </div>

          <div>
            <label style={{ fontSize: '12px', color: 'var(--brand-muted)', display: 'block', marginBottom: '4px' }}>Client Password *</label>
            <input
              className="input-field"
              value={password}
              onChange={e => setPassword(e.target.value)}
              placeholder="The code your client will use to access their workouts"
            />
          </div>

          <div>
            <label style={{ fontSize: '12px', color: 'var(--brand-muted)', display: 'block', marginBottom: '4px' }}>Description / Message</label>
            <textarea
              className="input-field"
              value={description}
              onChange={e => setDescription(e.target.value)}
              placeholder="Motivational message or program overview for your client"
              rows={3}
              style={{ resize: 'vertical' }}
            />
          </div>
        </div>

        <div style={{ display: 'flex', gap: '8px', marginTop: '20px', justifyContent: 'flex-end' }}>
          {!isNew && (
            <button className="btn-secondary" onClick={onClose}>Cancel</button>
          )}
          <button
            className="btn-primary"
            onClick={onClose}
            disabled={!canClose}
          >
            {isNew ? 'Start Building →' : 'Done'}
          </button>
        </div>
      </div>
    </div>
  )
}
