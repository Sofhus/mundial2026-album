// ─── Real Panini FIFA World Cup 2026 album data ─────────────────────────────
// Format: TEAMCODE-NUMBER (e.g. MEX-1, ARG-5, FWC-3)
// 48 teams × 20 stickers + FWC special section = 980 total stickers
// Sticker 1 = Badge/Crest (foil for top teams)
// Sticker 2 = Team photo
// Stickers 3-20 = Players (18 players)

export const TEAM_LIST = [
  // Group A
  { code: 'MEX', name: 'México',               flag: '🇲🇽', group: 'A', isHost: true,  star: 'Hirving Lozano' },
  { code: 'RSA', name: 'Sudáfrica',             flag: '🇿🇦', group: 'A', isHost: false, star: 'Percy Tau' },
  { code: 'KOR', name: 'Corea del Sur',         flag: '🇰🇷', group: 'A', isHost: false, star: 'Son Heung-min' },
  { code: 'CZE', name: 'Rep. Checa',            flag: '🇨🇿', group: 'A', isHost: false, star: 'Tomáš Souček' },
  // Group B
  { code: 'CAN', name: 'Canadá',                flag: '🇨🇦', group: 'B', isHost: true,  star: 'Alphonso Davies' },
  { code: 'BIH', name: 'Bosnia y Herzegovina',  flag: '🇧🇦', group: 'B', isHost: false, star: 'Edin Džeko' },
  { code: 'QAT', name: 'Catar',                 flag: '🇶🇦', group: 'B', isHost: false, star: 'Akram Afif' },
  { code: 'SUI', name: 'Suiza',                 flag: '🇨🇭', group: 'B', isHost: false, star: 'Granit Xhaka' },
  // Group C
  { code: 'BRA', name: 'Brasil',                flag: '🇧🇷', group: 'C', isHost: false, star: 'Vinicius Jr.' },
  { code: 'MAR', name: 'Marruecos',             flag: '🇲🇦', group: 'C', isHost: false, star: 'Achraf Hakimi' },
  { code: 'HAI', name: 'Haití',                 flag: '🇭🇹', group: 'C', isHost: false, star: 'Frantzdy Pierrot' },
  { code: 'SCO', name: 'Escocia',               flag: '🏴󠁧󠁢󠁳󠁣󠁴󠁿', group: 'C', isHost: false, star: 'Andrew Robertson' },
  // Group D
  { code: 'USA', name: 'EE.UU.',                flag: '🇺🇸', group: 'D', isHost: true,  star: 'Christian Pulisic' },
  { code: 'PAR', name: 'Paraguay',              flag: '🇵🇾', group: 'D', isHost: false, star: 'Miguel Almirón' },
  { code: 'AUS', name: 'Australia',             flag: '🇦🇺', group: 'D', isHost: false, star: 'Mathew Leckie' },
  { code: 'TUR', name: 'Turquía',               flag: '🇹🇷', group: 'D', isHost: false, star: 'Hakan Çalhanoğlu' },
  // Group E
  { code: 'GER', name: 'Alemania',              flag: '🇩🇪', group: 'E', isHost: false, star: 'Florian Wirtz' },
  { code: 'CUW', name: 'Curaçao',               flag: '🇨🇼', group: 'E', isHost: false, star: 'Cuco Martina' },
  { code: 'CIV', name: 'Costa de Marfil',       flag: '🇨🇮', group: 'E', isHost: false, star: 'Sébastien Haller' },
  { code: 'ECU', name: 'Ecuador',               flag: '🇪🇨', group: 'E', isHost: false, star: 'Moisés Caicedo' },
  // Group F
  { code: 'NED', name: 'Países Bajos',          flag: '🇳🇱', group: 'F', isHost: false, star: 'Virgil van Dijk' },
  { code: 'JPN', name: 'Japón',                 flag: '🇯🇵', group: 'F', isHost: false, star: 'Takefusa Kubo' },
  { code: 'SWE', name: 'Suecia',                flag: '🇸🇪', group: 'F', isHost: false, star: 'Dejan Kulusevski' },
  { code: 'TUN', name: 'Túnez',                 flag: '🇹🇳', group: 'F', isHost: false, star: 'Youssef Msakni' },
  // Group G
  { code: 'BEL', name: 'Bélgica',               flag: '🇧🇪', group: 'G', isHost: false, star: 'Kevin De Bruyne' },
  { code: 'EGY', name: 'Egipto',                flag: '🇪🇬', group: 'G', isHost: false, star: 'Mohamed Salah' },
  { code: 'IRN', name: 'Irán',                  flag: '🇮🇷', group: 'G', isHost: false, star: 'Mehdi Taremi' },
  { code: 'NZL', name: 'Nueva Zelanda',         flag: '🇳🇿', group: 'G', isHost: false, star: 'Chris Wood' },
  // Group H
  { code: 'ESP', name: 'España',                flag: '🇪🇸', group: 'H', isHost: false, star: 'Lamine Yamal' },
  { code: 'CPV', name: 'Cabo Verde',            flag: '🇨🇻', group: 'H', isHost: false, star: 'Júnior Dina Ebimbe' },
  { code: 'KSA', name: 'Arabia Saudita',        flag: '🇸🇦', group: 'H', isHost: false, star: 'Salem Al-Dawsari' },
  { code: 'URU', name: 'Uruguay',               flag: '🇺🇾', group: 'H', isHost: false, star: 'Federico Valverde' },
  // Group I
  { code: 'FRA', name: 'Francia',               flag: '🇫🇷', group: 'I', isHost: false, star: 'Kylian Mbappé' },
  { code: 'SEN', name: 'Senegal',               flag: '🇸🇳', group: 'I', isHost: false, star: 'Sadio Mané' },
  { code: 'IRQ', name: 'Irak',                  flag: '🇮🇶', group: 'I', isHost: false, star: 'Mohanad Ali' },
  { code: 'NOR', name: 'Noruega',               flag: '🇳🇴', group: 'I', isHost: false, star: 'Erling Haaland' },
  // Group J
  { code: 'ARG', name: 'Argentina',             flag: '🇦🇷', group: 'J', isHost: false, star: 'Lionel Messi' },
  { code: 'ALG', name: 'Argelia',               flag: '🇩🇿', group: 'J', isHost: false, star: 'Riyad Mahrez' },
  { code: 'AUT', name: 'Austria',               flag: '🇦🇹', group: 'J', isHost: false, star: 'David Alaba' },
  { code: 'JOR', name: 'Jordania',              flag: '🇯🇴', group: 'J', isHost: false, star: 'Musa Al-Taamari' },
  // Group K
  { code: 'POR', name: 'Portugal',              flag: '🇵🇹', group: 'K', isHost: false, star: 'Cristiano Ronaldo' },
  { code: 'COD', name: 'Congo DR',              flag: '🇨🇩', group: 'K', isHost: false, star: 'Chancel Mbemba' },
  { code: 'UZB', name: 'Uzbekistán',            flag: '🇺🇿', group: 'K', isHost: false, star: 'Eldor Shomurodov' },
  { code: 'COL', name: 'Colombia',              flag: '🇨🇴', group: 'K', isHost: false, star: 'James Rodríguez' },
  // Group L
  { code: 'ENG', name: 'Inglaterra',            flag: '🏴󠁧󠁢󠁥󠁮󠁧󠁿', group: 'L', isHost: false, star: 'Jude Bellingham' },
  { code: 'CRO', name: 'Croacia',               flag: '🇭🇷', group: 'L', isHost: false, star: 'Luka Modrić' },
  { code: 'GHA', name: 'Ghana',                 flag: '🇬🇭', group: 'L', isHost: false, star: 'Mohammed Kudus' },
  { code: 'PAN', name: 'Panamá',                flag: '🇵🇦', group: 'L', isHost: false, star: 'Rolando Blackburn' },
]

// FWC special stickers (all foil/special)
const FWC_STICKERS = [
  { id: 'FWC-1',  label: 'Trofeo FIFA™',              isRare: true,  rareReason: 'Laminado holográfico dorado — 1 por cada 100 sobres' },
  { id: 'FWC-2',  label: 'Logo Oficial',               isRare: true,  rareReason: 'Foil plateado especial — tirada reducida' },
  { id: 'FWC-3',  label: 'Mascota Oficial',            isRare: true,  rareReason: 'Estampa mascota con acabado brillante — muy buscada' },
  { id: 'FWC-4',  label: 'Balón Oficial',              isRare: true,  rareReason: 'Foil dorado — difícil en sobres normales' },
  { id: 'FWC-5',  label: 'Embajador México',           isRare: true,  rareReason: 'Foil especial país anfitrión' },
  { id: 'FWC-6',  label: 'Embajador EE.UU.',           isRare: true,  rareReason: 'Foil especial país anfitrión' },
  { id: 'FWC-7',  label: 'Embajador Canadá',           isRare: true,  rareReason: 'Foil especial país anfitrión' },
  { id: 'FWC-8',  label: 'Escudo Anfitriones',         isRare: true,  rareReason: 'Foil combinado — edición única' },
  { id: 'FWC-9',  label: 'Uruguay 1930 — Campeón',     isRare: true,  rareReason: 'Colección Museo FIFA — foil plateado' },
  { id: 'FWC-10', label: 'Italia 1934 — Campeón',      isRare: true,  rareReason: 'Colección Museo FIFA — foil plateado' },
  { id: 'FWC-11', label: 'Italia 1938 — Campeón',      isRare: true,  rareReason: 'Colección Museo FIFA — foil plateado' },
  { id: 'FWC-12', label: 'Uruguay 1950 — Campeón',     isRare: true,  rareReason: 'Colección Museo FIFA — foil plateado' },
  { id: 'FWC-13', label: 'Alemania 1954 — Campeón',    isRare: true,  rareReason: 'Colección Museo FIFA — foil plateado' },
  { id: 'FWC-14', label: 'Brasil 1958 — Campeón',      isRare: true,  rareReason: 'Colección Museo FIFA — foil plateado' },
  { id: 'FWC-15', label: 'Brasil 1962 — Campeón',      isRare: true,  rareReason: 'Colección Museo FIFA — foil plateado' },
  { id: 'FWC-16', label: 'Inglaterra 1966 — Campeón',  isRare: true,  rareReason: 'Colección Museo FIFA — foil plateado' },
  { id: 'FWC-17', label: 'Brasil 1970 — Campeón',      isRare: true,  rareReason: 'Colección Museo FIFA — foil plateado' },
  { id: 'FWC-18', label: 'Argentina 1986 — Campeón',   isRare: true,  rareReason: 'Colección Museo FIFA — muy codiciada' },
  { id: 'FWC-19', label: 'Francia 2018 — Campeón',     isRare: true,  rareReason: 'Colección Museo FIFA — foil plateado' },
  { id: 'FWC-20', label: 'Argentina 2022 — Campeón',   isRare: true,  rareReason: 'Colección Museo FIFA — la más difícil de conseguir' },
]

// Teams whose badge sticker is rare/foil
const RARE_BADGE_TEAMS = new Set(['ARG','BRA','FRA','ENG','POR','GER','ESP','CRO','BEL','NED'])
// Teams whose star player sticker is rare (special parallel)
const RARE_STAR_TEAMS  = new Set(['ARG','BRA','FRA','ENG','NOR','EGY','COL'])

function buildTeamStickers() {
  const stickers = []
  TEAM_LIST.forEach(team => {
    for (let n = 1; n <= 20; n++) {
      const id = `${team.code}-${n}`
      let label, isRare = false, rareReason

      if (n === 1) {
        label = `Escudo (foil) — ${team.name}`
        isRare = RARE_BADGE_TEAMS.has(team.code)
        if (isRare) rareReason = `Escudo foil dorado — solo en sobres especiales para selecciones grandes`
      } else if (n === 2) {
        label = `Foto de equipo — ${team.name}`
      } else if (n === 20) {
        label = team.star
        isRare = RARE_STAR_TEAMS.has(team.code)
        if (isRare) rareReason = `Figura estelar con paralelo especial — impresión reducida`
      } else {
        label = `Jugador ${n - 2} — ${team.name}`
      }

      stickers.push({ id, label, section: team.code, teamCode: team.code, num: n, isRare, rareReason })
    }
  })
  return stickers
}

// ─── Coca-Cola special section (CC-1 to CC-14) ───────────────────────────────
// Regional promo stickers found inside Coca-Cola products
const CC_PLAYER_NAMES = [
  'Lamine Yamal', 'Harry Kane', 'Lautaro Martínez', 'Joshua Kimmich',
  'Bukayo Saka', 'Pedri', 'Rodri', 'Phil Foden',
  'Gavi', 'Marcus Rashford', 'Jamal Musiala', 'Leroy Sané',
  'Nico Williams', 'Ferran Torres',
]

export const CC_STICKERS = CC_PLAYER_NAMES.map((name, i) => ({
  id:         `CC-${i + 1}`,
  label:      name,
  section:    'CC',
  teamCode:   null,
  num:        i + 1,
  isRare:     true,
  rareReason: 'Estampa exclusiva Coca-Cola — solo dentro de productos participantes',
}))

// ─── Sticker lists ────────────────────────────────────────────────────────────
const BASE_STICKERS = [
  ...FWC_STICKERS.map(s => ({ ...s, section: 'FWC', teamCode: null, num: parseInt(s.id.split('-')[1]) })),
  ...buildTeamStickers(),
]

export const ALL_STICKERS    = BASE_STICKERS
export const ALL_STICKERS_CC = [...BASE_STICKERS, ...CC_STICKERS]

export const TOTAL    = ALL_STICKERS.length      // 980
export const TOTAL_CC = ALL_STICKERS_CC.length   // 994

export const RARE_STICKERS = ALL_STICKERS_CC.filter(s => s.isRare)

export const SECTIONS = [
  { id: 'all', name: 'Todo el álbum' },
  { id: 'FWC', name: 'Especiales FWC' },
  { id: 'CC',  name: 'Coca-Cola' },
  ...TEAM_LIST.map(t => ({ id: t.code, name: t.name, group: t.group }))
]

// ─── Sticker map for fast lookup (includes CC) ───────────────────────────────
export const STICKER_MAP = Object.fromEntries(ALL_STICKERS_CC.map(s => [s.id, s]))

// ─── Parse bulk input: "MEX 1-15, ARG 3 5 10-12" → Set of sticker IDs ───────
export function parseRangeInput(text) {
  const ids = new Set()
  // Match patterns like: MEX 1-15  |  ARG-3  |  ARG 3, 5, 10-12  |  FWC 1-20
  const teamPattern = /([A-Z]{2,3})\s*[-:]?\s*([\d,\s\-]+)/gi
  let m
  while ((m = teamPattern.exec(text)) !== null) {
    const code = m[1].toUpperCase()
    const numsText = m[2]
    const team  = TEAM_LIST.find(t => t.code === code)
    const isFWC = code === 'FWC'
    const isCC  = code === 'CC'
    if (!team && !isFWC && !isCC) continue

    const maxNum = isCC ? 14 : 20
    const numMatches = numsText.matchAll(/(\d+)(?:\s*-\s*(\d+))?/g)
    for (const nm of numMatches) {
      const from = parseInt(nm[1])
      const to = nm[2] ? parseInt(nm[2]) : from
      for (let i = Math.min(from, to); i <= Math.min(Math.max(from, to), maxNum); i++) {
        const sid = `${code}-${i}`
        if (STICKER_MAP[sid]) ids.add(sid)
      }
    }
  }
  return ids
}

// ─── Convert owned IDs to compact export text grouped by team ────────────────
export function idsToRanges(ids) {
  // Group by team code
  const byTeam = {}
  for (const id of ids) {
    const dash = id.lastIndexOf('-')
    const code = id.slice(0, dash)
    const num  = parseInt(id.slice(dash + 1))
    if (!byTeam[code]) byTeam[code] = []
    byTeam[code].push(num)
  }

  const lines = []
  const order = ['FWC', ...TEAM_LIST.map(t => t.code)]
  order.forEach(code => {
    if (!byTeam[code]) return
    const nums = [...new Set(byTeam[code])].sort((a, b) => a - b)
    const ranges = []
    let s = nums[0], e = nums[0]
    for (let i = 1; i < nums.length; i++) {
      if (nums[i] === e + 1) { e = nums[i] }
      else { ranges.push(s === e ? `${s}` : `${s}-${e}`); s = e = nums[i] }
    }
    ranges.push(s === e ? `${s}` : `${s}-${e}`)

    const sec = SECTIONS.find(x => x.id === code)
    lines.push(`${sec?.name || code}: ${ranges.join(', ')}`)
  })
  return lines.join('\n')
}
