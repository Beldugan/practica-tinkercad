# Caiet de practică IX E · Tinkercad și imprimare 3D · Roverul FM-R2

Aplicație web pentru predarea și evaluarea modulului de practică (5 săptămâni, 150 de ore) la clasa a IX-a E,
Liceul Tehnologic „Lazăr Edeleanu” Năvodari. Este gândită pentru **tabla interactivă cu touch screen**:
butoane mari, ecran complet, text mărit, navigare cu degetul sau cu săgețile tastaturii.

## Ce conține

- **Predare** – cele 25 de lecții, pe săptămâni: scopul, „La final știu să”, SSM, comenzile noi, pașii de lucru
  (bifabili sau „pas cu pas” pe tot ecranul), fișa piesei cu vederile și cotele, verificare rapidă (întrebări cu
  variante), lista de control, întrebarea de reflecție și feedbackul în trei întrebări.
  Bara „ciclului de lucru” (Informare → Planificare → Decizie → Execuție → Control → Evaluare) arată clasei în ce fază e lecția.
  Semaforul echipelor (verde / galben / roșu) arată cine are nevoie de ajutor.
- **Clasa** – lista elevilor, cele 7 echipe, repartizarea pieselor pe echipe, prezența pe zile și orele efectuate.
- **Evaluare** – grila S / B / E pe criteriile C1–C5 (elevul se autoevaluează primul, apoi profesorul; diferențele de 2 trepte
  sunt semnalate), controlul pieselor cu calculul automat al abaterilor și al conformității, situația săptămânală
  și nota finală după formula din caiet, fișa fiecărui elev, export CSV pentru Excel.
- **Instrumente** – cronometru (inclusiv pauza 45 / 5), alegere aleatorie elev / echipă, calculatoare pentru regula riglei,
  abatere, repetare liniară și polară, jocuri de montaj, lanț de cote.
- **Resurse** – standardele clasei (alese pe șablonul E1), interfețele standardizate, SSM, piesele roverului,
  comenzile Tinkercad, materiale și defecte, ajustaje și inserții, fișa procesului, glosar RO–EN cu cartonașe,
  criteriile și calculul notei, calendarul.

## Publicare pe GitHub Pages (o singură dată)

1. Intrați pe <https://github.com> și creați un depozit nou (**New repository**), de exemplu `practica-ixe-tinkercad`.
   Bifați **Public**.
2. În depozit: **Add file → Upload files**. Trageți în pagină **tot conținutul** acestui folder
   (`index.html`, `sw.js`, `manifest.webmanifest`, `.nojekyll`, `README.md` și folderele `css`, `js`, `img`, `docs`).
   Apăsați **Commit changes**.
   > Dacă fișierul `.nojekyll` nu se vede în Windows, nu e o problemă: aplicația funcționează și fără el.
3. **Settings → Pages → Build and deployment → Source: Deploy from a branch**, ramura `main`, folderul `/ (root)` → **Save**.
4. După 1–2 minute aplicația este la adresa `https://<numele-vostru>.github.io/practica-ixe-tinkercad/`.
   Deschideți-o pe tabla interactivă și puneți-o la favorite.

Pentru actualizări: încărcați din nou fișierele modificate (de regulă doar `js/data.js` sau `js/app.js`).

## Unde se păstrează datele clasei

Elevii, evaluările, măsurătorile și prezența se salvează **doar în browserul în care lucrați** (nu pe GitHub,
deci numele elevilor nu devin publice). De aceea:

- lucrați evaluările de pe același calculator / aceeași tablă;
- din **Setări → Salvează copia (JSON)** descărcați periodic o copie;
- pe alt calculator: **Setări → Încarcă o copie**.

După prima deschidere, aplicația funcționează și fără internet.

## Folosire rapidă la oră

1. **Acasă** arată lecția zilei (după dată). Atingeți **Deschide**.
2. Butonul ⛶ (dreapta-sus) = ecran complet. În **Setări** alegeți textul „Mare” pentru tablă.
3. Treceți prin file cu săgeata portocalie (jos-dreapta) sau cu tastele ← →.
4. La final: fila **Evaluare** – elevul vine la tablă și își bifează nivelul, apoi bifați dumneavoastră.

## Structura

```
index.html            pagina aplicației
css/style.css         aspectul
js/data.js            conținutul caietului (lecții, fișe, anexe, întrebări)
js/app.js             logica aplicației
img/                  roverul și vederile pieselor
docs/                 caietul de practică (PDF)
sw.js, manifest       funcționare offline / instalare ca aplicație
```

prof. ing. Adrian-Mircea Beldugan · Catedra Mecanică
