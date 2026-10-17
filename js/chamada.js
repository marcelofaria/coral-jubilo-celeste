// A chamada nunca é gravada no navegador. A única informação local é o token
// do dispositivo autorizado a criar commits no repositório.
const GITHUB_TOKEN_KEY = 'coral-jubilo-github-token'
const GITHUB_OWNER = 'marcelofaria'
const GITHUB_REPOSITORY = 'coral-jubilo-celeste'
const GITHUB_BRANCH = 'main'
const GITHUB_FILE = 'dados/chamadas.csv'
const GITHUB_CONTENTS_URL = `https://api.github.com/repos/${GITHUB_OWNER}/${GITHUB_REPOSITORY}/contents/${GITHUB_FILE}`

const $ = selector => document.querySelector(selector)
const today = () => {
    const date = new Date()
    return new Date(date.getTime() - date.getTimezoneOffset() * 60_000).toISOString().slice(0, 10)
}
const sortMembers = members => [...members].sort((a, b) => a.localeCompare(b, 'pt-BR'))
const escapeHtml = value => String(value).replace(/[&<>'"]/g, character => ({ '&': '&amp;', '<': '&lt;', '>': '&gt;', "'": '&#039;', '"': '&quot;' }[character]))
const formatDate = value => new Intl.DateTimeFormat('pt-BR', { dateStyle: 'long' }).format(new Date(`${value}T12:00:00`))

const dateInput = $('#attendance-date')
let state = { members: [], attendances: {}, activeDate: today() }
let baseData = { members: [], attendances: {} }
let repositorySha = null
let githubToken = localStorage.getItem(GITHUB_TOKEN_KEY)
let isLoading = false
let isSaving = false
let isReady = false
let hasUnsavedChanges = false
let editingMember = null

function setStatus(message) {
    $('#save-status').textContent = message
}

function cloneData(data) {
    return {
        members: [...data.members],
        attendances: Object.fromEntries(Object.entries(data.attendances).map(([date, call]) => [date, { ...call }]))
    }
}

function currentData() {
    return { members: state.members, attendances: state.attendances }
}

function attendanceFor(date = state.activeDate) {
    return state.attendances[date] || {}
}

function updateControls() {
    const busy = isLoading || isSaving
    $('#save-csv').disabled = busy || !isReady || !hasUnsavedChanges
    $('#refresh-from-github').disabled = busy
    $('#configure-github').disabled = busy
    dateInput.disabled = busy || !isReady
    $('#new-member').disabled = busy || !isReady
    $('#add-member-form').querySelectorAll('button').forEach(button => { button.disabled = busy || !isReady })
    $('#configure-github').textContent = githubToken ? 'remover configuração' : 'configurar GitHub'
    document.body.toggleAttribute('data-github-busy', busy)
}

function markDirty(message = 'alterações pendentes · salve no GitHub') {
    hasUnsavedChanges = true
    setStatus(message)
    updateControls()
}

function render() {
    dateInput.value = state.activeDate
    const query = $('#member-search').value.trim().toLocaleLowerCase('pt-BR')
    const current = attendanceFor()
    const visibleMembers = state.members.filter(member => member.toLocaleLowerCase('pt-BR').includes(query))

    $('#members-list').innerHTML = visibleMembers.map(member => {
        const status = current[member]
        const balance = balanceFor(member)
        return `<tr><td data-label="Membro">${escapeHtml(member)}</td><td data-label="Chamada"><div class="attendance-buttons"><button class="mark ${status === 'present' ? 'selected' : ''}" data-member="${escapeHtml(member)}" data-status="present" aria-label="Marcar ${escapeHtml(member)} como presente">P</button><button class="mark absent ${status === 'absent' ? 'selected' : ''}" data-member="${escapeHtml(member)}" data-status="absent" aria-label="Marcar ${escapeHtml(member)} como ausente">A</button></div></td><td data-label="Balanço"><span class="balance ${balance.percentage === null ? 'empty' : ''}">${balance.percentage === null ? '—' : `${balance.percentage}%`}</span></td><td data-label="Ações"><div class="member-actions"><button class="edit-member" data-edit-member="${escapeHtml(member)}" aria-label="Editar nome de ${escapeHtml(member)}">✎</button><button class="remove-member" data-remove="${escapeHtml(member)}" aria-label="Remover ${escapeHtml(member)}">×</button></div></td></tr>`
    }).join('')
    $('#empty-state').hidden = visibleMembers.length > 0
    const records = Object.values(current)
    $('#member-count').textContent = state.members.length
    $('#present-count').textContent = records.filter(status => status === 'present').length
    $('#absent-count').textContent = records.filter(status => status === 'absent').length
    renderHistory()
    updateControls()
}

function renderHistory() {
    const dates = Object.keys(state.attendances).filter(date => Object.keys(state.attendances[date]).length).sort().reverse()
    $('#history-list').innerHTML = dates.length
        ? dates.map(date => {
            const records = Object.values(state.attendances[date])
            return `<div class="history-item ${date === state.activeDate ? 'active' : ''}"><button class="history-select" type="button" data-date="${date}"><strong>${formatDate(date)}</strong><span>${records.filter(status => status === 'present').length} presentes · ${records.filter(status => status === 'absent').length} ausências</span></button><button class="delete-attendance" type="button" data-delete-date="${date}" aria-label="Excluir chamada de ${formatDate(date)}">×</button></div>`
        }).join('')
        : '<p class="history-hint">A primeira chamada aparecerá aqui depois de marcar alguém.</p>'
}

function balanceFor(member) {
    const records = Object.values(state.attendances).map(call => call[member]).filter(Boolean)
    const presents = records.filter(status => status === 'present').length
    return { total: records.length, percentage: records.length ? Math.round(presents / records.length * 100) : null }
}

function setAttendance(date, member, status) {
    const call = state.attendances[date] ||= {}
    if (call[member] === status) delete call[member]
    else call[member] = status
    if (!Object.keys(call).length) delete state.attendances[date]
}

function csvValue(value) {
    return `"${String(value).replace(/"/g, '""')}"`
}

function buildCsv(data = currentData()) {
    const rows = [['tipo', 'data', 'membro', 'status']]
    data.members.forEach(member => rows.push(['membro', '', member, '']))
    Object.keys(data.attendances).sort().forEach(date => {
        Object.entries(data.attendances[date]).forEach(([member, status]) => {
            rows.push(['chamada', date, member, status === 'present' ? 'presente' : 'ausente'])
        })
    })
    return rows.map(row => row.map(csvValue).join(';')).join('\r\n') + '\r\n'
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

function dataFromCsv(csv) {
    const members = []
    const memberKeys = new Set()
    const attendances = {}
    csv.replace(/^\uFEFF/, '').split(/\r?\n/).slice(1).filter(Boolean).forEach(line => {
        const [type, date, member, status] = parseCsvLine(line)
        if (type === 'membro' && member) {
            const key = member.toLocaleLowerCase('pt-BR')
            if (!memberKeys.has(key)) {
                memberKeys.add(key)
                members.push(member)
            }
        }
        if (type === 'chamada' && date && member && ['presente', 'ausente'].includes(status)) {
            attendances[date] ||= {}
            attendances[date][member] = status === 'presente' ? 'present' : 'absent'
        }
    })
    return { members: sortMembers(members), attendances }
}

function encodeBase64(value) {
    const bytes = new TextEncoder().encode(value)
    let binary = ''
    bytes.forEach(byte => { binary += String.fromCharCode(byte) })
    return btoa(binary)
}

function decodeBase64(value) {
    const binary = atob(value.replace(/\s/g, ''))
    const bytes = Uint8Array.from(binary, character => character.charCodeAt(0))
    return new TextDecoder().decode(bytes)
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

async function readRepositoryFile({ authenticated = false } = {}) {
    if (authenticated && !githubToken) throw new Error('Configure o GitHub neste navegador antes de salvar.')
    const url = `${GITHUB_CONTENTS_URL}?ref=${encodeURIComponent(GITHUB_BRANCH)}&cacheBust=${Date.now()}`
    const response = await fetch(url, { headers: githubHeaders(authenticated), cache: 'no-store' })
    if (!response.ok) throw new Error(await responseError(response))
    const file = await response.json()
    if (file.encoding !== 'base64' || !file.content || !file.sha) throw new Error('O GitHub não retornou um arquivo de chamadas válido.')
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
        const imported = dataFromCsv(file.text)
        state = { ...cloneData(imported), activeDate: state.activeDate || today() }
        baseData = cloneData(imported)
        repositorySha = file.sha
        hasUnsavedChanges = false
        isReady = true
        setStatus('histórico carregado do GitHub')
        render()
    } catch (error) {
        isReady = false
        setStatus('não foi possível carregar o histórico do GitHub')
        window.alert(`Não foi possível carregar as chamadas: ${error.message}`)
        console.warn('Não foi possível carregar o CSV do GitHub:', error)
    } finally {
        isLoading = false
        updateControls()
    }
}

function memberChanges(from, to) {
    const names = new Set([...from.members, ...to.members])
    return [...names].map(member => ({
        member,
        before: from.members.includes(member),
        after: to.members.includes(member)
    })).filter(change => change.before !== change.after)
}

function attendanceChanges(from, to) {
    const dates = new Set([...Object.keys(from.attendances), ...Object.keys(to.attendances)])
    const changes = []
    dates.forEach(date => {
        const members = new Set([...Object.keys(from.attendances[date] || {}), ...Object.keys(to.attendances[date] || {})])
        members.forEach(member => {
            const before = from.attendances[date]?.[member]
            const after = to.attendances[date]?.[member]
            if (before !== after) changes.push({ date, member, before, after })
        })
    })
    return changes
}

function removeMemberFromData(data, member) {
    data.members = data.members.filter(name => name !== member)
    Object.values(data.attendances).forEach(call => delete call[member])
}

function resetMemberEditor() {
    editingMember = null
    $('#manage-title').textContent = 'Membros do coral'
    $('#new-member').value = ''
    $('#new-member').placeholder = 'Nome completo'
    $('#member-form-submit').textContent = 'adicionar'
    $('#cancel-member-edit').hidden = true
}

function editMember(member) {
    if (isLoading || isSaving || !state.members.includes(member)) return
    editingMember = member
    $('#manage-title').textContent = 'Editar membro'
    $('#new-member').value = member
    $('#new-member').placeholder = 'Nome completo'
    $('#member-form-submit').textContent = 'salvar nome'
    $('#cancel-member-edit').hidden = false
    $('.manage-section').scrollIntoView({ behavior: 'smooth', block: 'center' })
    $('#new-member').focus()
}

function renameMember(previousName, nextName) {
    state.members = sortMembers(state.members.map(member => member === previousName ? nextName : member))
    Object.values(state.attendances).forEach(call => {
        if (!call[previousName]) return
        call[nextName] = call[previousName]
        delete call[previousName]
    })
}

function mergeChanges(base, local, remote) {
    const localMembers = memberChanges(base, local)
    const remoteMembers = memberChanges(base, remote)
    const remoteMemberMap = new Map(remoteMembers.map(change => [change.member, change]))
    const conflicts = []

    localMembers.forEach(change => {
        const remoteChange = remoteMemberMap.get(change.member)
        if (remoteChange && remoteChange.after !== change.after) conflicts.push(`${change.member} (cadastro)`)
    })

    const localAttendance = attendanceChanges(base, local)
    const localAddedMembers = new Set(localMembers.filter(change => change.after).map(change => change.member))
    const remoteAttendanceMap = new Map(attendanceChanges(base, remote).map(change => [`${change.date}\u0000${change.member}`, change]))
    localAttendance.forEach(change => {
        const remoteChange = remoteAttendanceMap.get(`${change.date}\u0000${change.member}`)
        if (remoteChange && remoteChange.after !== change.after) conflicts.push(`${formatDate(change.date)} · ${change.member}`)
        if (!remote.members.includes(change.member) && !localAddedMembers.has(change.member)) conflicts.push(`${formatDate(change.date)} · ${change.member} (membro removido)`)
    })

    if (conflicts.length) return { conflicts: [...new Set(conflicts)] }

    const merged = cloneData(remote)
    localMembers.forEach(change => {
        if (change.after && !merged.members.includes(change.member)) merged.members.push(change.member)
        if (!change.after) removeMemberFromData(merged, change.member)
    })
    localAttendance.forEach(change => {
        if (!change.after) {
            if (merged.attendances[change.date]) {
                delete merged.attendances[change.date][change.member]
                if (!Object.keys(merged.attendances[change.date]).length) delete merged.attendances[change.date]
            }
            return
        }
        merged.attendances[change.date] ||= {}
        merged.attendances[change.date][change.member] = change.after
    })
    merged.members = sortMembers(merged.members)
    return { data: merged }
}

async function saveCsvToGitHub() {
    if (isSaving || isLoading || !hasUnsavedChanges) return
    if (!githubToken) {
        if (!configureGithub()) return
    }

    isSaving = true
    setStatus('verificando a versão mais recente no GitHub...')
    updateControls()
    try {
        const latestFile = await readRepositoryFile({ authenticated: true })
        const latestData = dataFromCsv(latestFile.text)
        let dataToSave = cloneData(currentData())

        if (latestFile.sha !== repositorySha) {
            const merged = mergeChanges(baseData, currentData(), latestData)
            if (merged.conflicts) {
                setStatus('conflito: há uma alteração mais recente no GitHub')
                window.alert(`Outra pessoa alterou estas informações no GitHub:\n\n${merged.conflicts.slice(0, 5).join('\n')}\n\nAtualize a página para carregar a versão mais recente antes de salvar.`)
                return
            }
            dataToSave = merged.data
            state = { ...cloneData(dataToSave), activeDate: state.activeDate }
        }

        setStatus('enviando commit para o GitHub...')
        const response = await fetch(GITHUB_CONTENTS_URL, {
            method: 'PUT',
            headers: { ...githubHeaders(true), 'Content-Type': 'application/json' },
            body: JSON.stringify({
                message: `Atualiza chamada do coral (${state.activeDate})`,
                content: encodeBase64(buildCsv(dataToSave)),
                branch: GITHUB_BRANCH,
                sha: latestFile.sha
            })
        })
        if (!response.ok) throw new Error(await responseError(response))
        const result = await response.json()
        if (!result.content?.sha || !result.commit?.sha) throw new Error('O GitHub não confirmou o commit da chamada.')

        repositorySha = result.content.sha
        baseData = cloneData(dataToSave)
        hasUnsavedChanges = false
        setStatus(`salvo no GitHub · commit ${result.commit.sha.slice(0, 7)}`)
        render()
    } catch (error) {
        setStatus('não foi possível salvar no GitHub')
        window.alert(`Falha ao salvar no GitHub: ${error.message}`)
        console.warn('Não foi possível salvar o CSV do GitHub:', error)
    } finally {
        isSaving = false
        updateControls()
    }
}

function configureGithub() {
    const token = window.prompt('Cole um token fine-grained do GitHub com acesso somente a este repositório e permissão Contents: Read and write. O token fica apenas neste navegador; as chamadas não são salvas localmente.')
    if (!token?.trim()) return false
    githubToken = token.trim()
    localStorage.setItem(GITHUB_TOKEN_KEY, githubToken)
    setStatus('GitHub configurado neste navegador')
    updateControls()
    return true
}

dateInput.addEventListener('change', event => {
    if (isLoading || isSaving) return
    state.activeDate = event.target.value || today()
    render()
})

$('#member-search').addEventListener('input', render)

$('#members-list').addEventListener('click', event => {
    if (isLoading || isSaving) return
    const mark = event.target.closest('.mark')
    if (mark) {
        setAttendance(state.activeDate, mark.dataset.member, mark.dataset.status)
        markDirty()
        render()
        return
    }
    const edit = event.target.closest('[data-edit-member]')
    if (edit) {
        editMember(edit.dataset.editMember)
        return
    }
    const remove = event.target.closest('[data-remove]')
    if (remove && window.confirm(`Remover ${remove.dataset.remove} da lista e de todas as chamadas?`)) {
        removeMemberFromData(state, remove.dataset.remove)
        if (editingMember === remove.dataset.remove) resetMemberEditor()
        markDirty('membro removido · salve no GitHub')
        render()
    }
})

$('#history-list').addEventListener('click', event => {
    if (isLoading || isSaving) return
    const deleteButton = event.target.closest('[data-delete-date]')
    if (deleteButton) {
        const date = deleteButton.dataset.deleteDate
        if (window.confirm(`Excluir a chamada de ${formatDate(date)}? Esta alteração só será enviada ao salvar no GitHub.`)) {
            delete state.attendances[date]
            if (state.activeDate === date) state.activeDate = today()
            markDirty('chamada excluída · salve no GitHub')
            render()
        }
        return
    }
    const item = event.target.closest('[data-date]')
    if (item) {
        state.activeDate = item.dataset.date
        render()
    }
})

$('#add-member-form').addEventListener('submit', event => {
    event.preventDefault()
    if (isLoading || isSaving) return
    const input = $('#new-member')
    const name = input.value.trim()
    if (!name) return
    const sameName = member => member.toLocaleLowerCase('pt-BR') === name.toLocaleLowerCase('pt-BR')
    if (editingMember) {
        if (name !== editingMember && state.members.some(member => member !== editingMember && sameName(member))) {
            setStatus('já existe um membro com este nome')
            return
        }
        if (name === editingMember) {
            resetMemberEditor()
            return
        }
        renameMember(editingMember, name)
        resetMemberEditor()
        markDirty('nome do membro atualizado · salve no GitHub')
    } else {
        if (state.members.some(sameName)) {
            setStatus('já existe um membro com este nome')
            return
        }
        state.members = sortMembers([...state.members, name])
        input.value = ''
        markDirty('membro adicionado · salve no GitHub')
    }
    render()
})

$('#cancel-member-edit').addEventListener('click', resetMemberEditor)

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

$('#save-csv').addEventListener('click', saveCsvToGitHub)
$('#refresh-from-github').addEventListener('click', () => {
    if (hasUnsavedChanges && !window.confirm('Atualizar vai descartar as alterações ainda não salvas neste dispositivo. Continuar?')) return
    loadRepositoryCsv()
})

render()
loadRepositoryCsv()
