
import { useCallback, useEffect, useMemo, useState } from 'react'
import {
  Activity, AlertCircle, ArrowUpRight,
  CheckCircle2, ChevronRight, ChevronDown,
  CircleHelp, Eye, Filter, Headphones,
  LayoutDashboard, LogOut, Mail, Lock,
  Menu, Plus, RefreshCw, Search,
  ShieldCheck, Ticket, Users, X,
  Zap, CalendarDays, TrendingUp
} from 'lucide-react'
import './App.css'

const API = '/api'

async function api(path, options = {}) {
  const method = (options.method || 'GET').toUpperCase()

  const headers = {
    ...(options.body ? { 'Content-Type': 'application/json' } : {}),
    ...(options.headers || {})
  }

  // Obtain a CSRF token for every request that changes server data.
  // The token request uses fetch directly to avoid calling api recursively.
  if (!['GET', 'HEAD', 'OPTIONS'].includes(method)) {
    const csrfResponse = await fetch(`${API}/auth/csrf`, {
      method: 'GET',
      credentials: 'include'
    })

    if (!csrfResponse.ok) {
      throw new Error(
        `Unable to obtain security token (${csrfResponse.status})`
      )
    }

    const csrf = await csrfResponse.json()

    if (csrf?.headerName && csrf?.token) {
      headers[csrf.headerName] = csrf.token
    } else {
      throw new Error('The server did not provide a valid CSRF token.')
    }
  }

  const response = await fetch(`${API}${path}`, {
    ...options,
    method,
    credentials: 'include',
    headers
  })

  if (response.status === 204) return null

  const contentType = response.headers.get('content-type') || ''
  const data = contentType.includes('application/json')
    ? await response.json()
    : await response.text()

  if (!response.ok) {
    throw new Error(
      typeof data === 'string'
        ? data
        : data.message || data.detail || `Request failed (${response.status})`
    )
  }

  return data
}

function formatDate(value) {
  if (!value) return '—'
  const date = new Date(value)
  if (Number.isNaN(date.getTime())) return '—'
  return date.toLocaleDateString('en-IN', {
    day: '2-digit',
    month: 'short',
    year: 'numeric'
  })
}

function initials(name = '') {
  return name.split(' ').filter(Boolean).slice(0, 2)
    .map(part => part[0]).join('').toUpperCase() || 'U'
}

function StatusBadge({ status }) {
  const value = (status || 'OPEN').toUpperCase()
  return (
    <span className={`status-badge status-${value.toLowerCase()}`}>
      <span className="status-dot" />
      {value.replace('_', ' ')}
    </span>
  )
}

function PriorityBadge({ priority }) {
  const value = (priority || 'MEDIUM').toUpperCase()
  return (
    <span className={`priority-badge priority-${value.toLowerCase()}`}>
      <span className="priority-dot" />
      {value}
    </span>
  )
}

function Avatar({ name, size = 'normal' }) {
  return (
    <span className={`avatar avatar-${size}`}>
      {initials(name)}
    </span>
  )
}

function StatCard({ title, value, description, icon: Icon, color, trend }) {
  return (
    <div className="stat-card">
      <div className="stat-top">
        <span className={`stat-icon ${color}`}>
          <Icon size={20} />
        </span>
        <span className="stat-trend">
          <TrendingUp size={13} />
          {trend}
        </span>
      </div>
      <div className="stat-value">{value}</div>
      <div className="stat-title">{title}</div>
      <div className="stat-description">{description}</div>
    </div>
  )
}

function Login({ onLogin }) {
  const [email, setEmail] = useState('')
  const [password, setPassword] = useState('')
  const [visible, setVisible] = useState(false)
  const [loading, setLoading] = useState(false)
  const [error, setError] = useState('')

  async function submit(event) {
    event.preventDefault()
    setError('')
    setLoading(true)

    try {
      await api('/auth/login', {
        method: 'POST',
        body: JSON.stringify({ email, password })
      })
      await onLogin()
    } catch (err) {
      setError(err.message || 'Unable to sign in. Check your credentials.')
    } finally {
      setLoading(false)
    }
  }

  return (
    <div className="login-page">
      <div className="login-decoration decoration-one" />
      <div className="login-decoration decoration-two" />

      <div className="login-card">
        <div className="login-brand">
          <div className="login-brand-icon"><Headphones size={30} /></div>
          <div className="eyebrow">WORKPLACE SUPPORT PORTAL</div>
          <h1>NexaDesk</h1>
          <p>One workspace. Every solution.</p>
        </div>

        <div className="login-heading">
          <h2>Welcome back</h2>
          <p>Sign in to manage your support workspace.</p>
        </div>

        <form onSubmit={submit}>
          <label htmlFor="login-email">Company email</label>
          <div className="login-input">
            <Mail size={18} />
            <input
              id="login-email"
              type="email"
              placeholder="you@company.com"
              value={email}
              onChange={e => setEmail(e.target.value)}
              required
            />
          </div>

          <label htmlFor="login-password">Password</label>
          <div className="login-input">
            <Lock size={18} />
            <input
              id="login-password"
              type={visible ? 'text' : 'password'}
              placeholder="Enter your password"
              value={password}
              onChange={e => setPassword(e.target.value)}
              required
            />
            <button
              type="button"
              className="password-eye"
              onClick={() => setVisible(!visible)}
              aria-label={visible ? 'Hide password' : 'Show password'}
            >
              <Eye size={18} />
            </button>
          </div>

          {error && (
            <div className="error-message">
              <AlertCircle size={16} />
              {error}
            </div>
          )}

          <button className="primary-button login-button" disabled={loading}>
            {loading ? 'Signing in...' : 'Sign in to NexaDesk'}
            {!loading && <ArrowUpRight size={18} />}
          </button>
        </form>

        <div className="login-security">
          <ShieldCheck size={17} />
          Secure access to your company support portal
        </div>
      </div>

      <div className="login-copyright">
        © 2026 NexaDesk. All rights reserved.
      </div>
    </div>
  )
}

function NewTicketModal({ onClose, onCreate }) {
  const [subject, setSubject] = useState('')
  const [description, setDescription] = useState('')
  const [priority, setPriority] = useState('MEDIUM')
  const [loading, setLoading] = useState(false)
  const [error, setError] = useState('')

  async function submit(e) {
    e.preventDefault()
    setLoading(true)
    setError('')

    try {
      await onCreate({ subject, description, priority })
      onClose()
    } catch (err) {
      setError(err.message)
    } finally {
      setLoading(false)
    }
  }

  return (
    <div className="modal-overlay" onMouseDown={e => {
      if (e.target === e.currentTarget) onClose()
    }}>
      <div className="modal">
        <div className="modal-header">
          <div>
            <span className="modal-icon"><Ticket size={20} /></span>
            <h2>Create support ticket</h2>
            <p>Describe the issue so your support team can help.</p>
          </div>
          <button className="icon-button" onClick={onClose}>
            <X />
          </button>
        </div>

        <form onSubmit={submit} className="modal-form">
          <label>Ticket subject</label>
          <input
            value={subject}
            onChange={e => setSubject(e.target.value)}
            placeholder="Briefly describe your issue"
            maxLength={200}
            required
          />

          <label>Description</label>
          <textarea
            value={description}
            onChange={e => setDescription(e.target.value)}
            placeholder="Provide details about the issue..."
            rows={5}
            required
          />

          <label>Priority</label>
          <select value={priority} onChange={e => setPriority(e.target.value)}>
            <option value="LOW">Low</option>
            <option value="MEDIUM">Medium</option>
            <option value="HIGH">High</option>
          </select>

          {error && <div className="error-message">{error}</div>}

          <div className="modal-actions">
            <button type="button" className="secondary-button" onClick={onClose}>
              Cancel
            </button>
            <button className="primary-button" disabled={loading}>
              {loading ? 'Creating...' : 'Create ticket'}
              <ArrowUpRight size={16} />
            </button>
          </div>
        </form>
      </div>
    </div>
  )
}

function AssignmentModal({ ticket, employees, onClose, onAssign }) {
  const [employeeId, setEmployeeId] = useState(
    ticket.assignedTo ? String(ticket.assignedTo) : ''
  )
  const [loading, setLoading] = useState(false)
  const [error, setError] = useState('')

  async function submit(e) {
    e.preventDefault()
    setLoading(true)

    try {
      await onAssign(ticket.id, Number(employeeId))
      onClose()
    } catch (err) {
      setError(err.message)
    } finally {
      setLoading(false)
    }
  }

  return (
    <div className="modal-overlay">
      <div className="modal">
        <div className="modal-header">
          <div>
            <span className="modal-icon"><Users size={20} /></span>
            <h2>Assign ticket</h2>
            <p>Ticket #{ticket.id} · {ticket.subject}</p>
          </div>
          <button className="icon-button" onClick={onClose}>
            <X />
          </button>
        </div>

        <form onSubmit={submit} className="modal-form">
          <label>Select employee</label>
          <select
            value={employeeId}
            onChange={e => setEmployeeId(e.target.value)}
            required
          >
            <option value="">Choose an employee</option>
            {employees
              .filter(user => user.role?.toUpperCase() === 'EMPLOYEE')
              .map(user => (
                <option key={user.id} value={user.id}>
                  {user.fullName} ({user.email})
                </option>
              ))}
          </select>

          {error && <div className="error-message">{error}</div>}

          <div className="modal-actions">
            <button type="button" className="secondary-button" onClick={onClose}>
              Cancel
            </button>
            <button className="primary-button" disabled={loading || !employeeId}>
              {loading ? 'Assigning...' : 'Assign ticket'}
            </button>
          </div>
        </form>
      </div>
    </div>
  )
}

function TicketDetails({
  ticket, user, isAdmin, employees,
  onClose, onStatus, onAssign
}) {
  const [status, setStatus] = useState(ticket.status || 'OPEN')
  const [saving, setSaving] = useState(false)
  const [error, setError] = useState('')

  async function update() {
    setSaving(true)
    setError('')

    try {
      await onStatus(ticket.id, status)
      onClose()
    } catch (err) {
      setError(err.message)
    } finally {
      setSaving(false)
    }
  }

  const assigned = employees.find(u => u.id === ticket.assignedTo)

  return (
    <div className="modal-overlay">
      <div className="modal details-modal">
        <div className="modal-header">
          <div>
            <div className="ticket-reference">TICKET #{ticket.id}</div>
            <h2>{ticket.subject}</h2>
            <p>Created {formatDate(ticket.createdAt)}</p>
          </div>
          <button className="icon-button" onClick={onClose}>
            <X />
          </button>
        </div>

        <div className="detail-badges">
          <StatusBadge status={ticket.status} />
          <PriorityBadge priority={ticket.priority} />
        </div>

        <div className="detail-section">
          <h4>Description</h4>
          <p className="ticket-description">{ticket.description}</p>
        </div>

        <div className="detail-section detail-grid">
          <div>
            <h4>Created by</h4>
            <p>User #{ticket.createdBy}</p>
          </div>
          <div>
            <h4>Assigned to</h4>
            <p>
              {assigned?.fullName ||
                (ticket.assignedTo ? `User #${ticket.assignedTo}` : 'Unassigned')}
            </p>
          </div>
        </div>

        {(isAdmin ||
          ticket.createdBy === user.id ||
          ticket.assignedTo === user.id) && (
          <div className="detail-section">
            <h4>Update ticket status</h4>
            <select value={status} onChange={e => setStatus(e.target.value)}>
              <option value="OPEN">Open</option>
              <option value="IN_PROGRESS">In progress</option>
              <option value="CLOSED">Closed</option>
            </select>
          </div>
        )}

        {error && <div className="error-message">{error}</div>}

        <div className="modal-actions">
          {isAdmin && (
            <button
              className="secondary-button"
              onClick={() => onAssign(ticket)}
            >
              <Users size={16} /> Assign
            </button>
          )}
          <button className="primary-button" onClick={update} disabled={saving}>
            {saving ? 'Saving...' : 'Save changes'}
          </button>
        </div>
      </div>
    </div>
  )
}

function Dashboard({ user, onLogout }) {
  const isAdmin = user.role?.toUpperCase() === 'ADMIN'

  const [page, setPage] = useState('overview')
  const [tickets, setTickets] = useState([])
  const [employees, setEmployees] = useState([])
  const [loading, setLoading] = useState(true)
  const [loadError, setLoadError] = useState('')
  const [search, setSearch] = useState('')
  const [statusFilter, setStatusFilter] = useState('ALL')
  const [priorityFilter, setPriorityFilter] = useState('ALL')
  const [showNewTicket, setShowNewTicket] = useState(false)
  const [selectedTicket, setSelectedTicket] = useState(null)
  const [assignTicket, setAssignTicket] = useState(null)
  const [sidebarOpen, setSidebarOpen] = useState(false)
  const [notice, setNotice] = useState('')

  const loadData = useCallback(async () => {
    setLoading(true)
    setLoadError('')

    try {
      const ticketData = await api('/tickets')
      setTickets(Array.isArray(ticketData) ? ticketData : [])

      if (isAdmin) {
        const userData = await api('/users')
        setEmployees(Array.isArray(userData) ? userData : [])
      }
    } catch (err) {
      setLoadError(err.message || 'Unable to load workspace data.')
    } finally {
      setLoading(false)
    }
  }, [isAdmin])

  useEffect(() => {
    loadData()
  }, [loadData])

  const stats = useMemo(() => ({
    total: tickets.length,
    open: tickets.filter(t => t.status === 'OPEN').length,
    progress: tickets.filter(t => t.status === 'IN_PROGRESS').length,
    closed: tickets.filter(t => t.status === 'CLOSED').length
  }), [tickets])

  const filteredTickets = useMemo(() => {
    return tickets.filter(ticket => {
      const term = search.toLowerCase()

      const matchesSearch =
        String(ticket.id).includes(term) ||
        (ticket.subject || '').toLowerCase().includes(term) ||
        (ticket.description || '').toLowerCase().includes(term)

      const matchesStatus =
        statusFilter === 'ALL' || ticket.status === statusFilter

      const matchesPriority =
        priorityFilter === 'ALL' || ticket.priority === priorityFilter

      return matchesSearch && matchesStatus && matchesPriority
    })
  }, [tickets, search, statusFilter, priorityFilter])

  async function createTicket(data) {
    const created = await api('/tickets', {
      method: 'POST',
      body: JSON.stringify(data)
    })

    await loadData()
    setNotice('Your support ticket has been created successfully.')
    return created
  }

  async function updateStatus(id, status) {
    await api(`/tickets/${id}/status`, {
      method: 'PUT',
      body: JSON.stringify({ status })
    })

    await loadData()
    setNotice('Ticket status updated successfully.')
  }

  async function assign(id, assignedTo) {
    await api(`/tickets/${id}/assignment`, {
      method: 'PUT',
      body: JSON.stringify({ assignedTo })
    })

    await loadData()
    setNotice('Ticket assigned successfully.')
  }

  function openAssignment(ticket) {
    setSelectedTicket(null)
    setAssignTicket(ticket)
  }

  const navItems = [
    { id: 'overview', label: 'Overview', icon: LayoutDashboard },
    { id: 'tickets', label: 'Tickets', icon: Ticket },
    ...(isAdmin
      ? [{ id: 'employees', label: 'Employees', icon: Users }]
      : [])
  ]

  return (
    <div className="app-shell">
      <aside className={`sidebar ${sidebarOpen ? 'sidebar-open' : ''}`}>
        <div className="sidebar-brand">
          <div className="sidebar-logo"><Headphones size={23} /></div>
          <div>
            <strong>NexaDesk</strong>
            <span>SUPPORT WORKSPACE</span>
          </div>
          <button
            className="sidebar-close icon-button"
            onClick={() => setSidebarOpen(false)}
          >
            <X size={19} />
          </button>
        </div>

        <div className="workspace-label">WORKSPACE</div>

        <nav className="sidebar-nav">
          {navItems.map(item => {
            const Icon = item.icon

            return (
              <button
                key={item.id}
                className={`nav-link ${page === item.id ? 'nav-active' : ''}`}
                onClick={() => {
                  setPage(item.id)
                  setSidebarOpen(false)
                }}
              >
                <Icon size={19} />
                {item.label}
                {item.id === 'tickets' && (
                  <span className="nav-count">{tickets.length}</span>
                )}
              </button>
            )
          })}
        </nav>

        <div className="sidebar-bottom">
          <div className="sidebar-help">
            <div className="help-icon"><CircleHelp size={19} /></div>
            <strong>Need help?</strong>
            <p>Our support team is here to assist you.</p>
            <button onClick={() => setPage('tickets')}>
              View tickets <ArrowUpRight size={14} />
            </button>
          </div>

          <div className="sidebar-profile">
            <Avatar name={user.fullName} />
            <div className="profile-text">
              <strong>{user.fullName}</strong>
              <span>{user.role}</span>
            </div>
            <button
              className="icon-button logout-small"
              title="Sign out"
              onClick={onLogout}
            >
              <LogOut size={17} />
            </button>
          </div>
        </div>
      </aside>

      {sidebarOpen && (
        <div
          className="sidebar-backdrop"
          onClick={() => setSidebarOpen(false)}
        />
      )}

      <main className="main-area">
        <header className="topbar">
          <div className="topbar-left">
            <button
              className="mobile-menu icon-button"
              onClick={() => setSidebarOpen(true)}
            >
              <Menu size={22} />
            </button>

            <div className="breadcrumb">
              <span>Workspace</span>
              <ChevronRight size={15} />
              <strong>
                {page === 'overview'
                  ? 'Overview'
                  : page === 'tickets'
                    ? 'Tickets'
                    : 'Employees'}
              </strong>
            </div>
          </div>

          <div className="topbar-right">
            <span className="topbar-date">
              <CalendarDays size={15} />
              {new Date().toLocaleDateString('en-IN', {
                day: '2-digit',
                month: 'short',
                year: 'numeric'
              })}
            </span>

            <button
              className="icon-button refresh-button"
              title="Refresh"
              onClick={loadData}
            >
              <RefreshCw size={18} />
            </button>

            <div className="topbar-user">
              <Avatar name={user.fullName} />
              <div>
                <strong>{user.fullName}</strong>
                <span>{user.role}</span>
              </div>
              <ChevronDown size={15} />
            </div>
          </div>
        </header>

        <div className="page-content">
          {notice && (
            <div className="success-notice">
              <CheckCircle2 size={17} />
              {notice}
              <button onClick={() => setNotice('')}>
                <X size={16} />
              </button>
            </div>
          )}

          {loadError && (
            <div className="error-banner">
              <AlertCircle size={18} />
              {loadError}
              <button onClick={loadData}>Retry</button>
            </div>
          )}

          {page === 'overview' && (
            <>
              <div className="page-heading">
                <div>
                  <div className="eyebrow">YOUR WORKSPACE</div>
                  <h1>
                    Good {
                      new Date().getHours() < 12
                        ? 'morning'
                        : new Date().getHours() < 17
                          ? 'afternoon'
                          : 'evening'
                    }, {user.fullName.split(' ')[0]} <span>👋</span>
                  </h1>
                  <p>
                    Here's what's happening with your support workspace today.
                  </p>
                </div>

                <button
                  className="primary-button"
                  onClick={() => setShowNewTicket(true)}
                >
                  <Plus size={18} /> Create ticket
                </button>
              </div>

              <div className="stat-grid">
                <StatCard
                  title="Total tickets"
                  value={loading ? '—' : stats.total}
                  description="Tickets in your workspace"
                  icon={Ticket}
                  color="stat-purple"
                  trend="All time"
                />
                <StatCard
                  title="Open tickets"
                  value={loading ? '—' : stats.open}
                  description="Waiting for attention"
                  icon={AlertCircle}
                  color="stat-orange"
                  trend="Needs action"
                />
                <StatCard
                  title="In progress"
                  value={loading ? '—' : stats.progress}
                  description="Currently being resolved"
                  icon={Activity}
                  color="stat-blue"
                  trend="Active"
                />
                <StatCard
                  title="Resolved tickets"
                  value={loading ? '—' : stats.closed}
                  description="Successfully closed"
                  icon={CheckCircle2}
                  color="stat-green"
                  trend="Completed"
                />
              </div>

              <div className="dashboard-grid">
                <section className="panel recent-panel">
                  <div className="panel-heading">
                    <div>
                      <h2>Recent tickets</h2>
                      <p>Keep track of your latest support requests.</p>
                    </div>
                    <button
                      className="text-button"
                      onClick={() => setPage('tickets')}
                    >
                      View all <ArrowUpRight size={15} />
                    </button>
                  </div>

                  <TicketTable
                    tickets={tickets.slice(0, 5)}
                    employees={employees}
                    loading={loading}
                    isAdmin={isAdmin}
                    onSelect={setSelectedTicket}
                    onAssign={openAssignment}
                  />
                </section>

                <section className="panel overview-side-panel">
                  <div className="panel-heading">
                    <div>
                      <h2>Ticket overview</h2>
                      <p>Current ticket distribution.</p>
                    </div>
                  </div>

                  <div className="overview-total">
                    <strong>{stats.total}</strong>
                    <span>Total tickets</span>
                  </div>

                  <div className="distribution-bar">
                    <span
                      className="bar-open"
                      style={{
                        width: `${stats.total ? stats.open / stats.total * 100 : 0}%`
                      }}
                    />
                    <span
                      className="bar-progress"
                      style={{
                        width: `${stats.total ? stats.progress / stats.total * 100 : 0}%`
                      }}
                    />
                    <span
                      className="bar-closed"
                      style={{
                        width: `${stats.total ? stats.closed / stats.total * 100 : 0}%`
                      }}
                    />
                  </div>

                  <div className="distribution-list">
                    <div>
                      <i className="legend-dot dot-open" />
                      <span>Open</span>
                      <strong>{stats.open}</strong>
                    </div>
                    <div>
                      <i className="legend-dot dot-progress" />
                      <span>In progress</span>
                      <strong>{stats.progress}</strong>
                    </div>
                    <div>
                      <i className="legend-dot dot-closed" />
                      <span>Closed</span>
                      <strong>{stats.closed}</strong>
                    </div>
                  </div>

                  <div className="overview-tip">
                    <Zap size={17} />
                    <div>
                      <strong>Stay on top of requests</strong>
                      <p>
                        Review open tickets regularly to keep your workspace
                        running smoothly.
                      </p>
                    </div>
                  </div>
                </section>
              </div>

              {isAdmin && (
                <section className="panel team-panel">
                  <div className="panel-heading">
                    <div>
                      <h2>Your team</h2>
                      <p>Employees registered in your workspace.</p>
                    </div>
                    <button
                      className="text-button"
                      onClick={() => setPage('employees')}
                    >
                      View team <ArrowUpRight size={15} />
                    </button>
                  </div>

                  {loading ? (
                    <div className="loading-state">Loading team...</div>
                  ) : (
                    <div className="team-strip">
                      {employees
                        .filter(e => e.role?.toUpperCase() === 'EMPLOYEE')
                        .slice(0, 5)
                        .map(employee => (
                          <div className="team-member" key={employee.id}>
                            <Avatar name={employee.fullName} />
                            <div>
                              <strong>{employee.fullName}</strong>
                              <span>{employee.email}</span>
                            </div>
                            <span className="employee-tag">EMPLOYEE</span>
                          </div>
                        ))}

                      {employees.filter(
                        e => e.role?.toUpperCase() === 'EMPLOYEE'
                      ).length === 0 && (
                        <p className="empty-text">No employees found.</p>
                      )}
                    </div>
                  )}
                </section>
              )}
            </>
          )}

          {page === 'tickets' && (
            <>
              <div className="page-heading">
                <div>
                  <div className="eyebrow">SUPPORT MANAGEMENT</div>
                  <h1>Tickets</h1>
                  <p>Manage, track and resolve support requests.</p>
                </div>

                <button
                  className="primary-button"
                  onClick={() => setShowNewTicket(true)}
                >
                  <Plus size={18} /> Create ticket
                </button>
              </div>

              <div className="ticket-stats-row">
                <div><span>All tickets</span><strong>{stats.total}</strong></div>
                <div><span>Open</span><strong>{stats.open}</strong></div>
                <div><span>In progress</span><strong>{stats.progress}</strong></div>
                <div><span>Closed</span><strong>{stats.closed}</strong></div>
              </div>

              <section className="panel ticket-management">
                <div className="panel-heading">
                  <div>
                    <h2>All support tickets</h2>
                    <p>{filteredTickets.length} tickets displayed</p>
                  </div>
                </div>

                <div className="filter-row">
                  <div className="search-box">
                    <Search size={17} />
                    <input
                      value={search}
                      onChange={e => setSearch(e.target.value)}
                      placeholder="Search tickets..."
                    />
                  </div>

                  <div className="filter-control">
                    <Filter size={16} />
                    <select
                      value={statusFilter}
                      onChange={e => setStatusFilter(e.target.value)}
                    >
                      <option value="ALL">All statuses</option>
                      <option value="OPEN">Open</option>
                      <option value="IN_PROGRESS">In progress</option>
                      <option value="CLOSED">Closed</option>
                    </select>
                  </div>

                  <div className="filter-control">
                    <select
                      value={priorityFilter}
                      onChange={e => setPriorityFilter(e.target.value)}
                    >
                      <option value="ALL">All priorities</option>
                      <option value="HIGH">High</option>
                      <option value="MEDIUM">Medium</option>
                      <option value="LOW">Low</option>
                    </select>
                  </div>
                </div>

                <TicketTable
                  tickets={filteredTickets}
                  employees={employees}
                  loading={loading}
                  isAdmin={isAdmin}
                  onSelect={setSelectedTicket}
                  onAssign={openAssignment}
                />
              </section>
            </>
          )}

          {page === 'employees' && isAdmin && (
            <>
              <div className="page-heading">
                <div>
                  <div className="eyebrow">PEOPLE MANAGEMENT</div>
                  <h1>Employees</h1>
                  <p>
                    View your NexaDesk team and manage ticket assignments.
                  </p>
                </div>
              </div>

              <div className="employee-summary">
                <div className="employee-summary-icon">
                  <Users size={23} />
                </div>
                <div>
                  <span>Total employees</span>
                  <strong>
                    {employees.filter(
                      e => e.role?.toUpperCase() === 'EMPLOYEE'
                    ).length}
                  </strong>
                </div>
                <div className="employee-summary-note">
                  Registered company employees
                </div>
              </div>

              <section className="panel">
                <div className="panel-heading">
                  <div>
                    <h2>Team directory</h2>
                    <p>Employee accounts in your workspace.</p>
                  </div>
                </div>

                {loading ? (
                  <div className="loading-state">Loading employees...</div>
                ) : (
                  <div className="employee-list">
                    {employees
                      .filter(e => e.role?.toUpperCase() === 'EMPLOYEE')
                      .map(employee => {
                        const assignedCount = tickets.filter(
                          t => t.assignedTo === employee.id &&
                            t.status !== 'CLOSED'
                        ).length

                        return (
                          <div className="employee-row" key={employee.id}>
                            <Avatar name={employee.fullName} size="large" />
                            <div className="employee-info">
                              <strong>{employee.fullName}</strong>
                              <span>{employee.email}</span>
                            </div>
                            <span className="employee-tag">EMPLOYEE</span>
                            <div className="employee-workload">
                              <strong>{assignedCount}</strong>
                              <span>Active tickets</span>
                            </div>
                          </div>
                        )
                      })}

                    {employees.filter(
                      e => e.role?.toUpperCase() === 'EMPLOYEE'
                    ).length === 0 && (
                      <div className="empty-state">
                        <Users size={32} />
                        <h3>No employees yet</h3>
                        <p>
                          Employee accounts will appear here when registered.
                        </p>
                      </div>
                    )}
                  </div>
                )}
              </section>
            </>
          )}
        </div>

        <footer className="app-footer">
          <span>© 2026 NexaDesk</span>
          <span>
            <ShieldCheck size={14} /> Secure company workspace
          </span>
          <span>Built for better support.</span>
        </footer>
      </main>

      {showNewTicket && (
        <NewTicketModal
          onClose={() => setShowNewTicket(false)}
          onCreate={createTicket}
        />
      )}

      {selectedTicket && (
        <TicketDetails
          ticket={selectedTicket}
          user={user}
          isAdmin={isAdmin}
          employees={employees}
          onClose={() => setSelectedTicket(null)}
          onStatus={updateStatus}
          onAssign={openAssignment}
        />
      )}

      {assignTicket && (
        <AssignmentModal
          ticket={assignTicket}
          employees={employees}
          onClose={() => setAssignTicket(null)}
          onAssign={assign}
        />
      )}
    </div>
  )
}

function TicketTable({
  tickets, employees, loading, isAdmin, onSelect, onAssign
}) {
  if (loading) {
    return (
      <div className="loading-state">
        <RefreshCw size={18} className="spin" />
        Loading tickets...
      </div>
    )
  }

  if (!tickets.length) {
    return (
      <div className="empty-state">
        <div className="empty-icon"><Ticket size={25} /></div>
        <h3>No tickets found</h3>
        <p>Support tickets will appear here when they are created.</p>
      </div>
    )
  }

  return (
    <div className="table-scroll">
      <table className="tickets-table">
        <thead>
          <tr>
            <th>Ticket</th>
            <th>Priority</th>
            <th>Status</th>
            <th>Assigned to</th>
            <th>Created</th>
            <th>Action</th>
          </tr>
        </thead>
        <tbody>
          {tickets.map(ticket => {
            const assigned = employees.find(
              e => e.id === ticket.assignedTo
            )

            return (
              <tr key={ticket.id}>
                <td>
                  <button
                    className="ticket-title-button"
                    onClick={() => onSelect(ticket)}
                  >
                    <span className="ticket-id">#{ticket.id}</span>
                    <strong>{ticket.subject}</strong>
                  </button>
                </td>
                <td><PriorityBadge priority={ticket.priority} /></td>
                <td><StatusBadge status={ticket.status} /></td>
                <td>
                  {assigned ? (
                    <span className="assigned-user">
                      <Avatar name={assigned.fullName} size="small" />
                      {assigned.fullName}
                    </span>
                  ) : (
                    <span className="unassigned">Unassigned</span>
                  )}
                </td>
                <td className="date-cell">
                  {formatDate(ticket.createdAt)}
                </td>
                <td>
                  <div className="table-actions">
                    <button
                      className="icon-button"
                      title="View details"
                      onClick={() => onSelect(ticket)}
                    >
                      <Eye size={16} />
                    </button>
                    {isAdmin && (
                      <button
                        className="icon-button"
                        title="Assign ticket"
                        onClick={() => onAssign(ticket)}
                      >
                        <Users size={16} />
                      </button>
                    )}
                  </div>
                </td>
              </tr>
            )
          })}
        </tbody>
      </table>
    </div>
  )
}

export default function App() {
  const [user, setUser] = useState(null)
  const [checkingSession, setCheckingSession] = useState(true)

  const loadCurrentUser = useCallback(async () => {
    try {
      const current = await api('/auth/me')
      setUser(current)
    } catch {
      setUser(null)
    } finally {
      setCheckingSession(false)
    }
  }, [])

  useEffect(() => {
    loadCurrentUser()
  }, [loadCurrentUser])

  async function logout() {
    try {
      await api('/auth/logout', {
        method: 'POST'
      })
    } catch (error) {
      console.error('Logout request:', error.message)
    } finally {
      setUser(null)
    }
  }

  if (checkingSession) {
    return (
      <div className="app-loading">
        <div className="loading-logo"><Headphones size={26} /></div>
        <strong>NexaDesk</strong>
        <span>Preparing your workspace...</span>
      </div>
    )
  }

  return user
    ? <Dashboard user={user} onLogout={logout} />
    : <Login onLogin={loadCurrentUser} />
}
