// Os relatórios nunca são gravados no navegador. A única informação local é o
// token do dispositivo autorizado a criar commits no repositório.
const GITHUB_TOKEN_KEY = 'coral-jubilo-github-token'
const GITHUB_OWNER = 'marcelofaria'
const GITHUB_REPOSITORY = 'coral-jubilo-celeste'
const GITHUB_BRANCH = 'main'
const GITHUB_FILE = 'dados/relatorios.csv'
const GITHUB_CONTENTS_URL = `https://api.github.com/repos/${GITHUB_OWNER}/${GITHUB_REPOSITORY}/contents/${GITHUB_FILE}`
const REPORT_FIELDS = ['data', 'atividade', 'hinos', 'regencia', 'musicos', 'oferta', 'observacoes']

const $ = selector => document.querySelector(selector)
const today = () => {
    const date = new Date()
    return new Date(date.getTime() - date.getTimezoneOffset() * 60_000).toISOString().slice(0, 10)
}
const escapeHtml = value => String(value || '').replace(/[&<>'"]/g, character => ({ '&': '&amp;', '<': '&lt;', '>': '&gt;', "'": '&#039;', '"': '&quot;' }[character]))
const formatDate = date => new Intl.DateTimeFormat('pt-BR', { day: '2-digit', month: 'short', year: 'numeric' }).format(new Date(`${date}T12:00:00`))
const toActivityClass = value => String(value).normalize('NFD').replace(/[\u0300-\u036f]/g, '').toLocaleLowerCase('pt-BR').replace(/[^a-z0-9]+/g, '-').replace(/(^-|-$)/g, '') || 'outro'

let state = { reports: [], editingId: null }
let baseReports = []
let repositorySha = null
let githubToken = localStorage.getItem(GITHUB_TOKEN_KEY)
let isLoading = false
let isSaving = false
let isReady = false
let hasUnsavedChanges = false

function setStatus(message) {
    $('#save-status').textContent = message
}

function newReportId() {
    return crypto.randomUUID?.() || `report-${Date.now()}-${Math.random().toString(36).slice(2)}`
}

function hashText(value) {
    let hash = 2166136261
    for (let index = 0; index < value.length; index += 1) {
        hash ^= value.charCodeAt(index)
        hash = Math.imul(hash, 16777619)
    }
    return (hash >>> 0).toString(36)
}

function legacyReportId(record, index) {
    return `legacy-${hashText([...REPORT_FIELDS.map(field => record[field] || ''), index].join('\u001f'))}`
}

function normaliseReport(record, index = 0) {
    const report = {
        id: String(record.id || legacyReportId(record, index)),
        data: String(record.data || today()),
        atividade: String(record.atividade || 'Ensaio'),
        hinos: String(record.hinos || record.hinos_ensaio || record.hinos_culto || ''),
        regencia: String(record.regencia || ''),
        musicos: String(record.musicos || ''),
        oferta: String(record.oferta || ''),
        observacoes: String(record.observacoes || '')
    }
    return report
}

function cloneReports(reports) {
    return reports.map(report => ({ ...report }))
}

function sortReports(reports) {
    return [...reports].sort((first, second) => first.data.localeCompare(second.data) || first.id.localeCompare(second.id))
}

function updateControls() {
    const busy = isLoading || isSaving
    $('#new-report').disabled = busy || !isReady
    $('#save-reports').disabled = busy || !isReady || !hasUnsavedChanges
    $('#refresh-from-github').disabled = busy
    $('#configure-github').disabled = busy
    $('#cancel-edit').disabled = busy || !isReady
    $('#clear-form').disabled = busy || !isReady
    Array.from($('#report-form').elements).forEach(element => { element.disabled = busy || !isReady })
    $('#year-filter').disabled = busy
    $('#activity-filter').disabled = busy
    $('#configure-github').textContent = githubToken ? 'remover configuração' : 'configurar GitHub'
    document.body.toggleAttribute('data-github-busy', busy)
}

function markDirty(message = 'alterações pendentes · salve no GitHub') {
    hasUnsavedChanges = true
    setStatus(message)
    updateControls()
}

function csvValue(value) {
    return `"${String(value || '').replace(/"/g, '""')}"`
}

function buildCsv(reports = state.reports) {
    const headers = ['id', 'tipo', ...REPORT_FIELDS]
    const rows = sortReports(reports).map(report => [report.id, 'relatorio', ...REPORT_FIELDS.map(field => report[field] || '')])
    return [headers, ...rows].map(row => row.map(csvValue).join(';')).join('\r\n') + '\r\n'
}

function parseCsvLine(line) {
    const values = []
    let value = ''
    let quoted = false
    for (let index = 0; index < line.length; index += 1) {
        const character = line[index]
        if (character === '"') {
            if (quoted && line[index + 1] === '"') {
                value += '"'
                index += 1
            } else quoted = !quoted
        } else if (character === ';' && !quoted) {
            values.push(value)
            value = ''
        } else value += character
    }
    values.push(value)
    return values
}

function reportsFromCsv(csv) {
    const lines = csv.replace(/^\uFEFF/, '').split(/\r?\n/).filter(Boolean)
    const headers = parseCsvLine(lines.shift() || '')
    if (!headers.includes('tipo') || !headers.includes('data')) throw new Error('O arquivo de relatórios não tem o formato esperado.')
    const usedIds = new Set()
    return lines.map((line, index) => {
        const values = parseCsvLine(line)
        const record = Object.fromEntries(headers.map((header, column) => [header, values[column] || '']))
        return { record, index }
    }).filter(({ record }) => !record.tipo || record.tipo === 'relatorio').map(({ record, index }) => {
        const report = normaliseReport(record, index)
        const originalId = report.id
        let suffix = 2
        while (usedIds.has(report.id)) {
            report.id = `${originalId}-${suffix}`
            suffix += 1
        }
        usedIds.add(report.id)
        return report
    })
}

function renderFilters() {
    const yearFilter = $('#year-filter')
    const activityFilter = $('#activity-filter')
    const selectedYear = yearFilter.value || 'all'
    const selectedActivity = activityFilter.value || 'all'
    const years = [...new Set(state.reports.map(report => report.data.slice(0, 4)).filter(Boolean))].sort().reverse()
    const activities = [...new Set(state.reports.map(report => report.atividade).filter(Boolean))].sort((first, second) => first.localeCompare(second, 'pt-BR'))
    yearFilter.innerHTML = '<option value="all">todos os anos</option>' + years.map(year => `<option value="${escapeHtml(year)}">${escapeHtml(year)}</option>`).join('')
    activityFilter.innerHTML = '<option value="all">todas as atividades</option>' + activities.map(activity => `<option value="${escapeHtml(activity)}">${escapeHtml(activity)}</option>`).join('')
    yearFilter.value = years.includes(selectedYear) ? selectedYear : 'all'
    activityFilter.value = activities.includes(selectedActivity) ? selectedActivity : 'all'
}

function render() {
    renderFilters()
    const year = $('#year-filter').value
    const activity = $('#activity-filter').value
    const reports = state.reports.filter(report => (year === 'all' || report.data.startsWith(year)) && (activity === 'all' || report.atividade === activity)).sort((first, second) => second.data.localeCompare(first.data) || second.id.localeCompare(first.id))
    $('#report-list').innerHTML = reports.map(report => {
        const hymns = report.hinos || ''
        const offer = report.oferta ? `R$ ${escapeHtml(report.oferta)}` : 'sem oferta'
        return `<article class="report-card"><div class="report-date"><strong>${formatDate(report.data)}</strong><span>${escapeHtml(report.data.slice(0, 4))}</span></div><div class="report-activity activity-${toActivityClass(report.atividade)}"><strong>${escapeHtml(report.atividade)}</strong><span>${offer}</span></div><div class="report-content"><h3>${escapeHtml(hymns || 'Registro sem hinos informados')}</h3>${report.regencia ? `<p><b>Regência:</b> ${escapeHtml(report.regencia)}</p>` : ''}${report.musicos ? `<p><b>Músicos:</b> ${escapeHtml(report.musicos)}</p>` : ''}${report.observacoes && report.observacoes !== hymns ? `<p><b>Notas:</b> ${escapeHtml(report.observacoes)}</p>` : ''}</div><div class="report-actions"><button class="icon-button" type="button" data-edit="${escapeHtml(report.id)}" aria-label="Editar relatório de ${escapeHtml(formatDate(report.data))}">✎</button><button class="icon-button delete" type="button" data-delete="${escapeHtml(report.id)}" aria-label="Excluir relatório de ${escapeHtml(formatDate(report.data))}">×</button></div></article>`
    }).join('')
    $('#empty-state').hidden = reports.length > 0
    updateControls()
}

function fillForm(report) {
    if (!report || isLoading || isSaving) return
    state.editingId = report.id
    $('#editor-title').textContent = 'Editar relatório'
    $('#report-id').value = report.id
    const fields = { 'report-date': 'data', 'report-activity': 'atividade', hymns: 'hinos', conductors: 'regencia', musicians: 'musicos', offer: 'oferta', notes: 'observacoes' }
    Object.entries(fields).forEach(([id, field]) => { $(`#${id}`).value = report[field] || '' })
    $('#editor-section').scrollIntoView({ behavior: 'smooth', block: 'start' })
}

function clearForm() {
    state.editingId = null
    $('#editor-title').textContent = 'Novo relatório'
    $('#report-form').reset()
    $('#report-id').value = ''
    $('#report-date').value = today()
    $('#report-activity').value = 'Ensaio'
}

function formHasDraft() {
    return Boolean(state.editingId || $('#hymns').value.trim() || $('#conductors').value.trim() || $('#musicians').value.trim() || $('#offer').value || $('#notes').value.trim() || $('#report-date').value !== today() || $('#report-activity').value !== 'Ensaio')
}

function githubHeaders(authenticated = false) {
    const headers = { Accept: 'application/vnd.github+json', 'X-GitHub-Api-Version': '2022-11-28' }
    if (authenticated && githubToken) headers.Authorization = `Bearer ${githubToken}`
    return headers
}

async function responseError(response) {
    const details = await response.json().catch(() => null)
    return details?.message || `GitHub respondeu com ${response.status}.`
}

function decodeBase64(value) {
    const binary = atob(value.replace(/\s/g, ''))
    const bytes = Uint8Array.from(binary, character => character.charCodeAt(0))
    return new TextDecoder().decode(bytes)
}

function encodeBase64(value) {
    const bytes = new TextEncoder().encode(value)
    let binary = ''
    bytes.forEach(byte => { binary += String.fromCharCode(byte) })
    return btoa(binary)
}

async function readRepositoryFile({ authenticated = false } = {}) {
    if (authenticated && !githubToken) throw new Error('Configure o GitHub neste navegador antes de salvar.')
    const url = `${GITHUB_CONTENTS_URL}?ref=${encodeURIComponent(GITHUB_BRANCH)}&cacheBust=${Date.now()}`
    const response = await fetch(url, { headers: githubHeaders(authenticated), cache: 'no-store' })
    if (!response.ok) throw new Error(await responseError(response))
    const file = await response.json()
    if (file.encoding !== 'base64' || !file.content || !file.sha) throw new Error('O GitHub não retornou um arquivo de relatórios válido.')
    return { sha: file.sha, text: decodeBase64(file.content) }
}

async function loadRepositoryCsv() {
    if (isLoading || isSaving) return
    isLoading = true
    setStatus('carregando histórico do GitHub...')
    updateControls()
    try {
        let file
        try {
            file = await readRepositoryFile()
        } catch (publicError) {
            if (!githubToken) throw publicError
            file = await readRepositoryFile({ authenticated: true })
        }
        state.reports = reportsFromCsv(file.text)
        baseReports = cloneReports(state.reports)
        repositorySha = file.sha
        hasUnsavedChanges = false
        isReady = true
        clearForm()
        setStatus('histórico carregado do GitHub')
        render()
    } catch (error) {
        isReady = false
        setStatus('não foi possível carregar o histórico do GitHub')
        window.alert(`Não foi possível carregar os relatórios: ${error.message}`)
        console.warn('Não foi possível carregar o CSV de relatórios do GitHub:', error)
    } finally {
        isLoading = false
        updateControls()
    }
}

function reportsMatch(first, second) {
    return Boolean(first && second && REPORT_FIELDS.every(field => first[field] === second[field]))
}

function changedFields(before, after) {
    return REPORT_FIELDS.filter(field => before[field] !== after[field])
}

function reportLabel(report) {
    return `${formatDate(report.data)} · ${report.atividade}`
}

function mergeReports(base, local, remote) {
    const baseById = new Map(base.map(report => [report.id, report]))
    const localById = new Map(local.map(report => [report.id, report]))
    const mergedById = new Map(remote.map(report => [report.id, { ...report }]))
    const conflicts = []

    localById.forEach((localReport, id) => {
        const baseReport = baseById.get(id)
        const remoteReport = mergedById.get(id)
        if (!baseReport) {
            if (remoteReport && !reportsMatch(localReport, remoteReport)) conflicts.push(reportLabel(localReport))
            else if (!remoteReport) mergedById.set(id, { ...localReport })
            return
        }
        if (!remoteReport) {
            if (!reportsMatch(localReport, baseReport)) conflicts.push(`${reportLabel(localReport)} (foi removido no GitHub)`)
            return
        }
        const localFields = changedFields(baseReport, localReport)
        const remoteFields = changedFields(baseReport, remoteReport)
        const concurrentFields = localFields.filter(field => remoteFields.includes(field) && localReport[field] !== remoteReport[field])
        if (concurrentFields.length) {
            conflicts.push(`${reportLabel(localReport)} (${concurrentFields.join(', ')})`)
            return
        }
        localFields.forEach(field => { remoteReport[field] = localReport[field] })
    })

    baseById.forEach((baseReport, id) => {
        if (localById.has(id)) return
        const remoteReport = mergedById.get(id)
        if (remoteReport && !reportsMatch(baseReport, remoteReport)) conflicts.push(`${reportLabel(baseReport)} (alterado no GitHub)`)
        else mergedById.delete(id)
    })

    if (conflicts.length) return { conflicts: [...new Set(conflicts)] }
    return { reports: sortReports([...mergedById.values()]) }
}

async function saveToGithub() {
    if (isSaving || isLoading || !hasUnsavedChanges) return
    if (!githubToken && !configureGithub()) return

    isSaving = true
    setStatus('verificando a versão mais recente no GitHub...')
    updateControls()
    try {
        const latestFile = await readRepositoryFile({ authenticated: true })
        const latestReports = reportsFromCsv(latestFile.text)
        let reportsToSave = cloneReports(state.reports)
        if (latestFile.sha !== repositorySha) {
            const merged = mergeReports(baseReports, state.reports, latestReports)
            if (merged.conflicts) {
                setStatus('conflito: há uma alteração mais recente no GitHub')
                window.alert(`Outra pessoa alterou estes relatórios no GitHub:\n\n${merged.conflicts.slice(0, 5).join('\n')}\n\nAtualize a página para carregar a versão mais recente antes de salvar.`)
                return
            }
            reportsToSave = merged.reports
            state.reports = cloneReports(reportsToSave)
        }

        setStatus('enviando commit para o GitHub...')
        const response = await fetch(GITHUB_CONTENTS_URL, {
            method: 'PUT',
            headers: { ...githubHeaders(true), 'Content-Type': 'application/json' },
            body: JSON.stringify({
                message: `Atualiza relatórios do coral (${today()})`,
                content: encodeBase64(buildCsv(reportsToSave)),
                branch: GITHUB_BRANCH,
                sha: latestFile.sha
            })
        })
        if (!response.ok) throw new Error(await responseError(response))
        const result = await response.json()
        if (!result.content?.sha || !result.commit?.sha) throw new Error('O GitHub não confirmou o commit dos relatórios.')

        repositorySha = result.content.sha
        baseReports = cloneReports(reportsToSave)
        hasUnsavedChanges = false
        setStatus(`salvo no GitHub · commit ${result.commit.sha.slice(0, 7)}`)
        render()
    } catch (error) {
        setStatus('não foi possível salvar no GitHub')
        window.alert(`Falha ao salvar no GitHub: ${error.message}`)
        console.warn('Não foi possível salvar o CSV de relatórios no GitHub:', error)
    } finally {
        isSaving = false
        updateControls()
    }
}

function configureGithub() {
    const token = window.prompt('Cole um token fine-grained do GitHub com acesso somente a este repositório e permissão Contents: Read and write. O token fica apenas neste navegador; os relatórios não são salvos localmente.')
    if (!token?.trim()) return false
    githubToken = token.trim()
    localStorage.setItem(GITHUB_TOKEN_KEY, githubToken)
    setStatus('GitHub configurado neste navegador')
    updateControls()
    return true
}

$('#report-form').addEventListener('submit', event => {
    event.preventDefault()
    if (isLoading || isSaving || !isReady) return
    const values = {
        data: $('#report-date').value,
        atividade: $('#report-activity').value.trim() || 'Ensaio',
        hinos: $('#hymns').value.trim(),
        regencia: $('#conductors').value.trim(),
        musicos: $('#musicians').value.trim(),
        oferta: $('#offer').value,
        observacoes: $('#notes').value.trim()
    }
    if (state.editingId) state.reports = state.reports.map(report => report.id === state.editingId ? { ...report, ...values } : report)
    else state.reports.push({ id: newReportId(), ...values })
    clearForm()
    markDirty('relatório salvo · salve no GitHub')
    render()
})

$('#new-report').addEventListener('click', () => {
    if (isLoading || isSaving || !isReady) return
    clearForm()
    $('#editor-section').scrollIntoView({ behavior: 'smooth', block: 'start' })
})

$('#clear-form').addEventListener('click', () => {
    if (!isLoading && !isSaving) clearForm()
})

$('#cancel-edit').addEventListener('click', () => {
    if (!isLoading && !isSaving) clearForm()
})

$('#year-filter').addEventListener('change', render)
$('#activity-filter').addEventListener('change', render)

$('#report-list').addEventListener('click', event => {
    if (isLoading || isSaving) return
    const edit = event.target.closest('[data-edit]')
    const remove = event.target.closest('[data-delete]')
    if (edit) fillForm(state.reports.find(report => report.id === edit.dataset.edit))
    if (remove && window.confirm('Excluir este relatório? A alteração só será enviada ao salvar no GitHub.')) {
        state.reports = state.reports.filter(report => report.id !== remove.dataset.delete)
        if (state.editingId === remove.dataset.delete) clearForm()
        markDirty('relatório excluído · salve no GitHub')
        render()
    }
})

$('#save-reports').addEventListener('click', saveToGithub)

$('#configure-github').addEventListener('click', () => {
    if (githubToken && window.confirm('Remover o token salvo somente neste navegador?')) {
        githubToken = null
        localStorage.removeItem(GITHUB_TOKEN_KEY)
        setStatus('configuração do GitHub removida deste navegador')
        updateControls()
        return
    }
    if (!githubToken) configureGithub()
})

$('#refresh-from-github').addEventListener('click', () => {
    if ((hasUnsavedChanges || formHasDraft()) && !window.confirm('Atualizar vai descartar as alterações ainda não salvas neste dispositivo. Continuar?')) return
    loadRepositoryCsv()
})

clearForm()
render()
loadRepositoryCsv()
