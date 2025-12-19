# Testovanie AI Generovania

## Rýchly test

1. **Spustite dev server:**
   ```bash
   npm run dev
   ```

2. **Otvorte prehliadač:**
   - Prejdite na `http://localhost:5173`
   - Scrollujte dole na sekciu "Snowy-ify Your Profile"

3. **Testovanie generovania:**

   **Možnosť A: Text-to-Image (najrýchlejšie)**
   - Zadajte popis: "A friendly snowman with a red scarf"
   - Kliknite "Transform to Snowman!"
   - Počkajte 30-50 sekúnd

   **Možnosť B: Image-to-Image**
   - Nahrajte obrázok (PNG/JPG, max 10MB)
   - Voliteľne zadajte popis
   - Kliknite "Transform to Snowman!"
   - Počkajte 30-50 sekúnd

## Čo sa deje počas generovania

1. **Progress bar** sa zobrazí a postupne sa plní
2. **Kód automaticky skúša:**
   - Replicate API (ak máte token)
   - Hugging Face API (ak máte token)
   - OpenAI DALL-E (ak máte kľúč)
   - **Bezplatné Hugging Face modely** (automaticky)
   - Fallback na DiceBear avatary (ak všetko zlyhá)

## Očakávané výsledky

### S API tokenmi:
- ✅ **Replicate**: Najlepšie výsledky, rýchle (~10-30s)
- ✅ **Hugging Face**: Dobré výsledky, stredne rýchle (~20-40s)
- ✅ **OpenAI**: Vysoká kvalita, pomalšie (~30-60s)

### Bez tokenov (free):
- ✅ **Hugging Face Free**: Funguje, ale môže trvať dlhšie (~30-60s)
- ⚠️ Prvé volanie môže trvať dlhšie (model sa načítava)
- ✅ Automatické retry ak model nie je pripravený

## Riešenie problémov

### "Generation failed"
- Skontrolujte konzolu prehliadača (F12) pre detaily
- Skúste znova - modely môžu byť dočasne nedostupné
- Počkajte 1-2 minúty a skúste znova

### "Model is loading"
- Normálne pri prvom volaní
- Kód automaticky čaká a opakuje pokus
- Môže trvať až 60 sekúnd

### "Timeout"
- AI generovanie môže trvať dlhšie
- Skúste znova
- Ak sa to opakuje, zvážte pridanie API tokenu

### Fallback na DiceBear
- Ak všetky AI API zlyhajú, použije sa DiceBear
- Stále vytvorí unikátny avatar
- Rýchle (~2-4 sekundy)

## Debugging

Otvorte konzolu prehliadača (F12) a sledujte:
- `Model X is loading, waiting...` - model sa načítava
- `Model X error` - konkrétny model zlyhal
- `Free API not available` - všetky free modely zlyhali
- `Generation error:` - detailná chybová správa

## Tipy pre lepšie výsledky

1. **Pridajte API token** do `.env`:
   ```env
   VITE_REPLICATE_API_TOKEN=your_token_here
   ```
   alebo
   ```env
   VITE_HUGGINGFACE_API_TOKEN=your_token_here
   ```

2. **Použite jasný popis:**
   - "A friendly snowman with a red scarf and blue hat"
   - Lepšie ako len "snowman"

3. **Nahrajte kvalitný obrázok:**
   - Jasné svetlo
   - Dobré rozlíšenie
   - Centrálná kompozícia

## Testovanie rôznych scenárov

```bash
# Test 1: Len text
Popis: "A friendly snowman with a red scarf"

# Test 2: Text + obrázok
Nahrajte obrázok + popis: "winter theme"

# Test 3: Len obrázok
Nahrajte obrázok bez popisu

# Test 4: Rýchly test (mock mode)
V .env nastavte: VITE_USE_MOCK_AI=true
```

