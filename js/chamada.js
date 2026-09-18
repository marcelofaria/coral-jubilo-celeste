const STORAGE_KEY = 'coral-jubilo-chamada-v1'
const GITHUB_TOKEN_KEY = 'coral-jubilo-github-token'
const GITHUB_OWNER = 'marcelofaria'
const GITHUB_REPOSITORY = 'coral-jubilo-celeste'
const GITHUB_BRANCH = 'main'
const GITHUB_FILE = 'dados/chamadas.csv'
const initialMembers = ['Alexsandra Mariano da Fonseca', 'Alice Kelly de Oliveira', 'Analice de Souza Oliveira', 'André Tulio da Silva', 'Carlos Antônio Natal Bueno Filho', 'Carlos Roberto Silverio de Almeida', 'Carol Paes de Camargo Oliveira', 'Devanir Nonato Lemos Vieira', 'Eliane Macedo Turquetti André', 'Elizeu Pisano Cabral', 'Fabiane Gomes Belarmino', 'Gustavo Ramos de Oliveira', 'Ismael Ramos Sousa Santos', 'Ivone Barbosa de Souza', 'Jair Inácio de Souza', 'Jayme Nunes de Oliveira Júnior', 'Jeferson Nunes de Oliveira', 'Joaquim Eduardo de França', 'José Dorival Silvério de Almeida', 'José Francisco Belarmino Júnior', 'Késya Gomes Belarmino', 'Laura Beatriz Francisco', 'Lindinalva Mariano da Fonseca', 'Lucas Paulino de Siqueira', 'Luciana Alves de França', 'Luciana Cristina Messias Bueno', 'Maeli Gonçalves Alves', 'Marcelo Augusto Stefanini Faria', 'Marco Antonio Araújo André', 'Maria de Souza Oliveira', 'Maria Núbia Ramos dos Santos Almeida', 'Natã Lopes Silva', 'Natalina da Silva de Oliveira', 'Nicoli Victória de França Rocha', 'Oriel Francisco Fortunato', 'Otávio Ramos de Oliveira', 'Pietra Sousa Santos', 'Raiane França de Sousa', 'Rosilene Maria de França de Souza', 'Severino Gomes dos Santos', 'Silvana Celestino dos Santos Luiz', 'Simone Ramos Santos de Oliveira', 'Sulamita Mota de Almeida', 'Talita Celestino dos Santos Luiz']
const today = () => new Date().toISOString().slice(0, 10)
const sortMembers = members => [...members].sort((a, b) => a.localeCompare(b, 'pt-BR'))
const makeState = () => ({ members: sortMembers(initialMembers), attendances: {}, activeDate: today() })
let storedState = null
try { storedState = JSON.parse(localStorage.getItem(STORAGE_KEY)) } catch { storedState = null }
let state = storedState || makeState()
state.members = sortMembers(state.members || initialMembers); state.attendances ||= {}; state.activeDate ||= today()
const $ = selector => document.querySelector(selector)
const dateInput = $('#attendance-date')
const save = message => {
    localStorage.setItem(STORAGE_KEY, JSON.stringify(state))
    $('#save-status').textContent = message || 'alterações salvas neste dispositivo'
}
const attendance = () => state.attendances[state.activeDate] || {}
const formatDate = value => new Intl.DateTimeFormat('pt-BR', { dateStyle: 'long' }).format(new Date(`${value}T12:00:00`))
const escapeHtml = value => value.replace(/[&<>'"]/g, character => ({ '&': '&amp;', '<': '&lt;', '>': '&gt;', "'": '&#039;', '"': '&quot;' }[character]))
function balanceFor(member) { const records = Object.values(state.attendances).map(call => call[member]).filter(Boolean); const presents = records.filter(status => status === 'present').length; return { total: records.length, percentage: records.length ? Math.round(presents / records.length * 100) : null } }
function render() {
    dateInput.value = state.activeDate; const query = $('#member-search').value.trim().toLocaleLowerCase('pt-BR'); const current = attendance()
    const visibleMembers = state.members.filter(member => member.toLocaleLowerCase('pt-BR').includes(query))
    $('#members-list').innerHTML = visibleMembers.map(member => { const status = current[member]; const balance = balanceFor(member); return `<tr><td>${escapeHtml(member)}</td><td><div class="attendance-buttons"><button class="mark ${status === 'present' ? 'selected' : ''}" data-member="${escapeHtml(member)}" data-status="present" aria-label="Marcar ${escapeHtml(member)} como presente">P</button><button class="mark absent ${status === 'absent' ? 'selected' : ''}" data-member="${escapeHtml(member)}" data-status="absent" aria-label="Marcar ${escapeHtml(member)} como ausente">A</button></div></td><td><span class="balance ${balance.percentage === null ? 'empty' : ''}">${balance.percentage === null ? '—' : `${balance.percentage}%`}</span></td><td><button class="remove-member" data-remove="${escapeHtml(member)}" aria-label="Remover ${escapeHtml(member)}">×</button></td></tr>` }).join('')
    $('#empty-state').hidden = visibleMembers.length > 0; const records = Object.values(current); $('#member-count').textContent = state.members.length; $('#present-count').textContent = records.filter(status => status === 'present').length; $('#absent-count').textContent = records.filter(status => status === 'absent').length; renderHistory()
}
function renderHistory() { const dates = Object.keys(state.attendances).sort().reverse(); $('#history-list').innerHTML = dates.length ? dates.map(date => { const records = Object.values(state.attendances[date]); return `<div class="history-item ${date === state.activeDate ? 'active' : ''}"><button class="history-select" type="button" data-date="${date}"><strong>${formatDate(date)}</strong><span>${records.filter(status => status === 'present').length} presentes · ${records.filter(status => status === 'absent').length} ausências</span></button><button class="delete-attendance" type="button" data-delete-date="${date}" aria-label="Excluir chamada de ${formatDate(date)}">×</button></div>` }).join('') : '<p class="history-hint">A primeira chamada aparecerá aqui ao marcar alguém.</p>' }
function ensureAttendance() { state.attendances[state.activeDate] ||= {} }
dateInput.addEventListener('change', event => { state.activeDate = event.target.value || today(); ensureAttendance(); save(); render() })
$('#member-search').addEventListener('input', render)
$('#members-list').addEventListener('click', event => { const mark = event.target.closest('.mark'); if (mark) { ensureAttendance(); const member = mark.dataset.member; const status = mark.dataset.status; attendance()[member] = attendance()[member] === status ? undefined : status; if (!attendance()[member]) delete attendance()[member]; save(); render(); return } const remove = event.target.closest('[data-remove]'); if (remove && window.confirm(`Remover ${remove.dataset.remove} da lista?`)) { state.members = state.members.filter(member => member !== remove.dataset.remove); Object.values(state.attendances).forEach(call => delete call[remove.dataset.remove]); save('membro removido'); render() } })
$('#history-list').addEventListener('click', event => { const deleteButton = event.target.closest('[data-delete-date]'); if (deleteButton) { const date = deleteButton.dataset.deleteDate; if (window.confirm(`Excluir a chamada de ${formatDate(date)}? Esta ação não pode ser desfeita antes de salvar no GitHub.`)) { delete state.attendances[date]; state.activeDate = today(); save('chamada excluída neste dispositivo'); render() } return } const item = event.target.closest('[data-date]'); if (item) { state.activeDate = item.dataset.date; save(); render() } })
$('#add-member-form').addEventListener('submit', event => { event.preventDefault(); const input = $('#new-member'); const name = input.value.trim(); if (!name || state.members.some(member => member.toLocaleLowerCase('pt-BR') === name.toLocaleLowerCase('pt-BR'))) return; state.members = sortMembers([...state.members, name]); input.value = ''; save('membro adicionado'); render() })
function csvValue(value) { return `"${String(value).replace(/"/g, '""')}"` }
function buildCsv() {
    const rows = [['tipo', 'data', 'membro', 'status']]
    state.members.forEach(member => rows.push(['membro', '', member, '']))
    Object.keys(state.attendances).sort().forEach(date => Object.entries(state.attendances[date]).forEach(([member, status]) => rows.push(['chamada', date, member, status === 'present' ? 'presente' : 'ausente'])))
    return rows.map(row => row.map(csvValue).join(';')).join('\r\n') + '\r\n'
}
function parseCsvLine(line) { return line.match(/(?:^|;)("(?:[^"]|"")*"|[^;]*)/g).map(value => value.replace(/^;/, '').replace(/^"|"$/g, '').replace(/""/g, '"')) }
async function loadRepositoryCsv() {
    if (storedState) return
    try {
        const response = await fetch('../dados/chamadas.csv', { cache: 'no-store' })
        if (!response.ok) return
        const lines = (await response.text()).trim().split(/\r?\n/).slice(1).filter(Boolean)
        const importedMembers = []
        const importedAttendances = {}
        lines.forEach(line => {
            const [type, date, member, status] = parseCsvLine(line)
            if (type === 'membro' && member) importedMembers.push(member)
            if (type === 'chamada' && date && member && status) { importedAttendances[date] ||= {}; importedAttendances[date][member] = status === 'presente' ? 'present' : 'absent' }
        })
        if (importedMembers.length) state.members = sortMembers(importedMembers)
        state.attendances = importedAttendances
        ensureAttendance()
        render()
    } catch (error) { console.warn('Não foi possível carregar o CSV do repositório:', error) }
}
let githubToken = localStorage.getItem(GITHUB_TOKEN_KEY)
const configureGithub = () => {
    const token = window.prompt('Cole seu token fine-grained do GitHub com Contents: Read and write. Ele ficará salvo somente neste navegador.')
    if (!token) return
    githubToken = token.trim()
    localStorage.setItem(GITHUB_TOKEN_KEY, githubToken)
    $('#configure-github').textContent = 'remover configuração'
    $('#save-status').textContent = 'GitHub configurado neste navegador'
}
const updateGithubButton = () => { $('#configure-github').textContent = githubToken ? 'remover configuração' : 'configurar GitHub' }
function encodeBase64(value) {
    const bytes = new TextEncoder().encode(value)
    let binary = ''
    bytes.forEach(byte => { binary += String.fromCharCode(byte) })
    return btoa(binary)
}
async function saveCsvToGitHub() {
    if (!githubToken) {
        $('#save-status').textContent = 'configure o GitHub antes de salvar'
        configureGithub()
        if (!githubToken) return
    }
    const apiUrl = `https://api.github.com/repos/${GITHUB_OWNER}/${GITHUB_REPOSITORY}/contents/${GITHUB_FILE}`
    const headers = { Accept: 'application/vnd.github+json', Authorization: `Bearer ${githubToken}`, 'X-GitHub-Api-Version': '2022-11-28' }
    $('#save-status').textContent = 'enviando commit para o GitHub...'
    try {
        const currentFile = await fetch(`${apiUrl}?ref=${GITHUB_BRANCH}`, { headers })
        if (![200, 404].includes(currentFile.status)) throw new Error(`Não foi possível localizar o CSV (${currentFile.status}).`)
        const fileData = currentFile.status === 200 ? await currentFile.json() : {}
        const commitPayload = { message: `Atualiza chamada do coral (${today()})`, content: encodeBase64(buildCsv()), branch: GITHUB_BRANCH }
        if (fileData.sha) commitPayload.sha = fileData.sha
        const commit = await fetch(apiUrl, { method: 'PUT', headers: { ...headers, 'Content-Type': 'application/json' }, body: JSON.stringify(commitPayload) })
        if (!commit.ok) { const details = await commit.json(); throw new Error(details.message || `GitHub respondeu com ${commit.status}.`) }
        $('#save-status').textContent = 'salvo no GitHub · commit criado'
    } catch (error) {
        $('#save-status').textContent = 'não foi possível salvar no GitHub'
        window.alert(`Falha ao salvar no GitHub: ${error.message}`)
    }
}
$('#configure-github').addEventListener('click', () => {
    if (githubToken && window.confirm('Remover o token salvo deste navegador?')) {
        githubToken = null
        localStorage.removeItem(GITHUB_TOKEN_KEY)
        $('#save-status').textContent = 'configuração do GitHub removida'
        updateGithubButton()
        return
    }
    if (!githubToken) configureGithub()
})
$('#save-csv').addEventListener('click', saveCsvToGitHub)
ensureAttendance(); render(); updateGithubButton(); loadRepositoryCsv()