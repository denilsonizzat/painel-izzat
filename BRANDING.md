# 🎨 Branding — Painel Izzat (Design System)
### Fonte única de verdade · base: BIG_APP_PROTOTIPO

> Tudo deve "conversar entre si". Use SEMPRE os tokens abaixo — nunca a paleta genérica
> do Tailwind (`#10b981`, `#3b82f6`...). Esses tons foram extraídos do protótipo de referência.

---

## 🎯 Paleta

### Base (navy premium + ouro)
| Token | Valor | Uso |
|-------|-------|-----|
| `--bg` | `#0A1626` | fundo geral |
| `--bg2` | `#0C1A2C` | navy profundo (sidebar/gradientes) |
| `--card` / surface | `#112239` | card padrão |
| `--surface2` | `#152C47` | superfície elevada / hover |
| `--gold` | `#C9A442` / `#c9a84c` | ouro da marca (acento principal) |
| `--gold-br` | `#E8C462` | ouro brilhante (destaques, valores) |
| `--gold-soft` | `rgba(201,164,66,.10)` | fundo de pill/badge dourado |
| `--text` | `#EDF1F6` | texto principal |
| `--gray` / muted | `#8FA1B6` | texto secundário |
| `--muted2` | `#5E728A` | texto terciário (legendas) |

### Bordas douradas (escala oficial — nunca `rgba()`+dígitos)
| Token | Valor | Uso |
|-------|-------|-----|
| `--border-subtle` | `rgba(201,164,66,.12)` | divisórias internas |
| `--border` | `rgba(201,164,66,.16)` | cards/listas (hairline padrão) |
| `--border-strong` | `rgba(201,164,66,.30)` | destaque |
| `--border-bright` | `rgba(201,164,66,.34)` | foco / ativo |

### Semântica curada (substitui a genérica do Tailwind)
| Token | Valor | Substituiu | Uso |
|-------|-------|-----------|-----|
| `--green` | `#36C98E` | ~~#10b981~~ | sucesso / online / progresso |
| `--blue` | `#4D9DE0` | ~~#3b82f6~~ | info / links / tarefas |
| `--red` | `#F2545B` | ~~#ef4444~~ | erro / urgente / atrasado |
| `--amber` | `#E8A33D` | ~~#f59e0b~~ | atenção / pendente |
| `--purple` | `#7C6FE0` | ~~#8b5cf6~~ | XP / impostos / destaque 2º |
| `--orange` | `#E8733D` | ~~#f97316~~ | reprovado / alerta quente |

> Alpha: hex aceita sufixo (`#36C98E25`), a `var()` não. Para opacidade em CSS var, use `rgba()`.

---

## 🔤 Tipografia
- **Corpo:** Manrope (300–800)
- **Títulos/display:** Bricolage Grotesque, `letter-spacing: -0.02em` (aperto premium)
- Aplicado automático em `h1–h4` + `.text-page-title/.text-kpi/.text-value` via `globals.css`

---

## ✨ Fundo vívido
`body` tem 2 brilhos radiais sutis sobre o navy (igual ao BIG APP):
```css
radial-gradient(1200px 600px at 78% -8%,  rgba(201,164,66,.10), transparent 60%),  /* ouro topo-dir */
radial-gradient(900px 500px at -5% 100%,  rgba(77,157,224,.07), transparent 55%),  /* azul base-esq */
var(--bg);
background-attachment: fixed;  /* não rola com o conteúdo */
```

## 🌑 Sombras / glow
| Token | Valor |
|-------|-------|
| `--shadow-card` | `0 2px 12px rgba(0,0,0,.35)` |
| `--shadow-card-hover` | `0 16px 44px rgba(0,0,0,.55)` |
| `--glow-gold` | `0 6px 20px rgba(201,164,66,.35)` |
| `--glow-green` | `0 0 24px rgba(54,201,142,.22)` |
| `--glow-blue` | `0 0 24px rgba(77,157,224,.22)` |

## 🔘 Botão primário (ouro)
`--gold-grad: linear-gradient(135deg, #E8C462, #B8912F)` · hover: `translateY(-1px)` + `--glow-gold`

---

## 📐 Raio / espaçamento
`--r-card 16px` · `--r-ui 12px` · `--r-sm 8px` · `--r-badge 999px`

---

## ⚠️ Regras
1. **Cor nova?** Adicione um token aqui primeiro. Nunca espalhe hex solto.
2. **Bordas** só nos 4 tons da escala. Nunca `rgba(...)NN` (CSS inválido — borda some).
3. **Identidade de avatar** (cores por pessoa em `lib/data.ts`) é separada da semântica — não unificar.
4. Tema runtime (`lib/themes.ts`) sobrescreve `--bg/--card/--border/--gold` — o tema `izzat` é o oficial.
