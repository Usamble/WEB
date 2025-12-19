# 🎯 Rýchle nastavenie pre 3D Snowman generovanie

## Problém
Bezplatné Hugging Face modely (Stable Diffusion) nie sú dobré pre 3D cartoon štýl. Potrebujete lepší model.

## ✅ Riešenie 1: Replicate API (ODPORÚČANÉ - Najlepšie výsledky)

### Krok 1: Získajte Replicate API token
1. Choďte na https://replicate.com
2. Zaregistrujte sa (môžete použiť GitHub)
3. Choďte na https://replicate.com/account/api-tokens
4. Vytvorte nový token (napr. `r8_xxxxxxxxxxxxx`)

### Krok 2: Pridajte token do .env
```bash
# Otvorte .env súbor a pridajte:
VITE_REPLICATE_API_TOKEN=r8_vaš_token_tu
VITE_USE_MOCK_AI=false
```

### Krok 3: Reštartujte dev server
```bash
# Zastavte server (Ctrl+C) a spustite znova:
npm run dev
```

**Výsledok:** Skutočný 3D cartoon snowman s bielym pozadím! 🎉

---

## ✅ Riešenie 2: Hugging Face API (Bezplatné, ale horšie výsledky)

### Krok 1: Získajte Hugging Face token
1. Choďte na https://huggingface.co
2. Zaregistrujte sa
3. Choďte na https://huggingface.co/settings/tokens
4. Vytvorte nový token s "read" oprávneniami

### Krok 2: Pridajte token do .env
```bash
VITE_HUGGINGFACE_API_TOKEN=hf_vaš_token_tu
VITE_USE_MOCK_AI=false
```

### Krok 3: Reštartujte dev server

**Výsledok:** Lepšie ako bez tokenu, ale stále nie ideálne pre 3D.

---

## ⚠️ Riešenie 3: Bez tokenu (Fallback)

Ak nemáte token, kód použije fallback snowman generator (2D canvas snowman).

**Výsledok:** Funguje, ale nie je to skutočný 3D AI snowman.

---

## 🧪 Testovanie

1. Otvorte http://localhost:5173
2. Scrollujte na "Snowy-ify Your Profile"
3. Zadajte popis alebo nahrajte obrázok
4. Kliknite "Transform to Snowman!"
5. Počkajte 30-50 sekúnd

## 📊 Porovnanie

| Riešenie | Kvalita | 3D efekt | Cena |
|----------|---------|----------|------|
| Replicate API | ⭐⭐⭐⭐⭐ | ✅ Skutočný 3D | ~$0.002-0.01 per image |
| Hugging Face (s tokenom) | ⭐⭐⭐ | ⚠️ Čiastočne 3D | Bezplatné |
| Bez tokenu | ⭐⭐ | ❌ 2D fallback | Bezplatné |

## 💡 Tip

**Najlepšie riešenie:** Replicate API token
- Najlepšie výsledky
- Skutočný 3D cartoon štýl
- Čisté biele pozadie
- Unikátne snowmani

Začnite s $5 kreditom (stačí na stovky generovaní)!

