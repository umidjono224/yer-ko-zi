# Yer Ko‘zi

LOVABLE AI — MASTER PROMPT

UZBEKISTON YER UCHASTKALARI VA QURILISH MONITORING TIZIMI

MUHIM:

Ushbu loyiha O‘zbekiston hududidagi yer uchastkalari, kadastr chegaralari, bino/inshootlar va yangi qurilishlarni yuqori aniqlikdagi geospatial/sun’iy yo‘ldosh tasvirlari yordamida tahlil qiluvchi professional GIS + AI platforma bo‘lishi kerak.

==================================================

1. ENG MUHIM TALABLAR

==================================================

1. TIZIM 100% O‘ZBEK TILIDA BO‘LSIN.

Interfeysda:

- inglizcha

- ruscha

- aralash

- texnik inglizcha

matnlar foydalanuvchiga ko‘rinmasin.

Barcha:

- tugmalar

- menyular

- xabarlar

- xatoliklar

- tooltiplar

- modal oynalar

- formalar

- jadval ustunlari

- filtrlar

- hisobotlar

- xarita panellari

- sozlamalar

- loading holatlari

- bo‘sh holatlar

- notificationlar

O‘ZBEK TILIDA bo‘lishi shart.

Texnik koddagi variable/function nomlari inglizcha bo‘lishi mumkin, lekin UI matni 100% o‘zbekcha bo‘lsin.

==================================================

2. TIZIMNING ASOSIY MAQSADI

==================================================

Foydalanuvchi O‘zbekiston hududidan:

- viloyat

- tuman/shahar

- mahalla

- aniq manzil

- koordinata

- xaritada chizilgan hudud

orqali tekshiruv hududini tanlaydi.

Tizim:

1. Tanlangan hudud chegarasini aniqlaydi.

2. Shu hududdagi mavjud yer uchastkalarini topadi.

3. Yer uchastkalari chegaralarini polygon sifatida xaritada ko‘rsatadi.

4. Eng so‘nggi mavjud YUQORI ANIQLIKDAGI sun’iy yo‘ldosh/aerofoto tasvirni oladi.

5. Tasvirni kadastr polygonlari bilan moslashtiradi.

6. Har bir uchastkadagi bino va inshootlarni aniqlaydi.

7. Yangi paydo bo‘lgan yoki o‘zgargan qurilishlarni aniqlaydi.

8. Qurilish maydonini m² da hisoblaydi.

9. Kadastrdagi mavjud bino ma’lumotlari bilan solishtiradi.

10. Natijani xaritada ko‘rsatadi.

11. Hisobot yaratadi.

==================================================

3. YUQORI ANIQLIK — ASOSIY TALAB

==================================================

SENTINEL-2 YAGONA YOKI ASOSIY QURILISH ANIQLASH MANBASI BO‘LMASIN.

Sentinel-2 10 m aniqlikka ega bo‘lgani sababli kichik uylar, qo‘shimcha qurilmalar va kichik qurilishlarni aniqlash uchun yetarli emas.

Shuning uchun tizim birinchi kundanoq HIGH-RESOLUTION PROVIDER arxitekturasi bilan yaratilishi kerak.

Tizimda quyidagi abstraksiya bo‘lsin:

SatelliteProvider

├── HighResolutionSatelliteProvider

├── AerialImageryProvider

├── Sentinel2Provider

└── FutureProvider

DEFAULT:

HighResolutionSatelliteProvider

Sentinel-2 faqat:

- qo‘shimcha tahlil

- katta hududlar

- vaqt bo‘yicha umumiy o‘zgarish

- yuqori aniqlikdagi tasvir mavjud bo‘lmagan holatlar

uchun ishlatilishi mumkin.

==================================================

4. YUQORI ANIQLIKDAGI TASVIR MANBAI

==================================================

Tizim yuqori aniqlikdagi tasvirni qonuniy ravishda foydalanish mumkin bo‘lgan provider orqali olishi kerak.

Birinchi navbatda quyidagi turdagi manbalarni qo‘llab-quvvatlash uchun architecture yarating:

- yuqori aniqlikdagi sun’iy yo‘ldosh tasvirlari

- ortofoto/aerofoto

- davlatning rasmiy aerokosmik/GIS tasvirlari

- boshqa litsenziyalangan geospatial imagery providerlar

Tizim provider URL/API kalitlarini frontendga joylashtirmasin.

Barcha maxfiy API credentiallar backend/Supabase Edge Function orqali ishlatilishi kerak.

==================================================

5. TASVIR ANIQLIGI

==================================================

Tizim imkon qadar:

≤ 1 metr/pixel

aniqlikdagi imagery bilan ishlashga mo‘ljallansin.

Agar provider bundan ham yuqori aniqlikni bersa:

0.5 m

0.3 m

0.15 m

va hokazo, tizim undan foydalanishga tayyor bo‘lsin.

Tizim UI'da tasvirning haqiqiy aniqligini ko‘rsatsin:

"Fazoviy aniqlik: 0.5 m"

Hech qachon mavjud bo‘lmagan aniqlikni o‘ylab topmang.

==================================================

6. ENG SO‘NGGI TASVIR QOIDASI

==================================================

Tizimning default rejimi:

"ENG SO‘NGGI TASVIR"

bo‘lishi shart.

Foydalanuvchi hudud tanlaganidan keyin:

1. AOI olinadi.

2. Imagery providerga so‘rov yuboriladi.

3. Hududni to‘liq qamrab oluvchi tasvirlar qidiriladi.

4. Bulutlilik va tasvir sifati tekshiriladi.

5. Eng yangi sifatli tasvir tanlanadi.

Tizim eski tasvirni shunchaki mavjud bo‘lgani uchun ishlatmasin.

UI:

"Eng so‘nggi tasvir"

Tasvir sanasi:

08.09.2026

Tasvir manbasi:

[Haqiqiy provider nomi]

Aniqlik:

0.5 m

Bulutlilik:

3%

==================================================

7. TASVIR SANASI

==================================================

Har bir tasvir uchun:

- olingan sana

- vaqt

- provider

- resolution

- cloud cover

- scene/image ID

saqlansin.

Natijada:

"Tasvir olingan sana: DD.MM.YYYY"

ko‘rsatilishi shart.

==================================================

8. DAVLAT KADASTR MANBAI

==================================================

ASOSIY RASMIY MANBA:

https://open.ngis.uz

Tizim ushbu portal va uning qonuniy ochiq GIS servislarini integratsiya qilish uchun architecturega ega bo‘lsin.

Avval quyidagilarni aniqlashga harakat qil:

- ArcGIS REST

- FeatureServer

- MapServer

- WMS

- WMTS

- WFS

- GeoJSON

- boshqa rasmiy ochiq GIS servislar

MUHIM:

API endpointni o‘ylab topmang.

Agar endpoint haqiqatan mavjud bo‘lsa — foydalaning.

Agar mavjud bo‘lmasa — MOCK API yarating.

Mock ma’lumot UI'da:

"DEMO MA’LUMOT"

deb ko‘rsatilishi shart.

==================================================

9. KADASTR POLYGONLARI

==================================================

Tizim imkon qadar har bir yer uchastkasining:

- polygon chegarasi

- yer maydoni

- kadastr identifikatori

- mavjud bo‘lgan boshqa ochiq atributlari

ni olsin.

Xaritada:

har bir yer uchastkasi alohida polygon bo‘lsin.

Foydalanuvchi polygonni bosganda:

"Yer uchastkasi"

paneli ochilsin.

==================================================

10. SHAXSIY MA’LUMOTLAR

==================================================

Tizim:

- fuqaro F.I.Sh.

- telefon raqami

- JSHSHIR

- shaxsiy hujjat ma’lumotlari

kabi ma’lumotlarni ochiq manbadan noqonuniy yig‘masin.

Faqat qonuniy ravishda foydalanish mumkin bo‘lgan ochiq geospatial ma’lumotlardan foydalanilsin.

==================================================

11. TEKSHIRUV HUDUDINI TANLASH

==================================================

Asosiy tugma:

"Yangi tekshiruv"

Keyin:

"Tekshiruv hududini tanlang"

variantlari:

1. Viloyat bo‘yicha

2. Tuman/shahar bo‘yicha

3. Mahalla bo‘yicha

4. Manzil bo‘yicha

5. Koordinata bo‘yicha

6. Xaritadan chizish

7. GeoJSON yuklash

==================================================

12. XARITADAN HUDUD CHIZISH

==================================================

Foydalanuvchi xaritada:

- polygon

- to‘rtburchak

- aylana

chiza olsin.

Chizilgan hudud darhol:

"Tekshiruv maydoni: 12.43 ga"

kabi ko‘rsatilsin.

Tugmalar:

"Saqlash"

"Bekor qilish"

"Tozalash"

==================================================

13. MAHALLANI TANLASH

==================================================

Agar rasmiy ma’muriy/mahalla chegaralari mavjud bo‘lsa:

Viloyat

↓

Tuman

↓

Mahalla

ketma-ketligi bo‘lsin.

Masalan:

Samarqand viloyati

Pastdarg‘om tumani

[Mahalla]

Mahalla tanlanganda uning polygon chegarasi xaritada ko‘rinsin.

==================================================

14. TEKSHIRUVNI BOSHLASH

==================================================

Tugma:

"Tekshiruvni boshlash"

bosilganda:

1. Hudud tekshiriladi.

2. Kadastr polygonlari yuklanadi.

3. Yuqori aniqlikdagi eng so‘nggi imagery qidiriladi.

4. Tasvir yuklanadi.

5. AI tahlil boshlanadi.

Loading:

"Kadastr ma’lumotlari olinmoqda..."

"Eng so‘nggi tasvir qidirilmoqda..."

"Tasvir qayta ishlanmoqda..."

"Qurilish obyektlari aniqlanmoqda..."

"Natijalar tayyorlanmoqda..."

==================================================

15. XARITA

==================================================

MapLibre GL JS ishlatilsin.

Xarita professional GIS interfeysga ega bo‘lsin.

Layerlar:

☑ Kadastr uchastkalari

☑ Eng so‘nggi yuqori aniqlikdagi tasvir

☑ Rasmiy GIS qatlami

☑ Bino va inshootlar

☑ AI aniqlagan obyektlar

☑ Tekshiruv hududi

☑ Yo‘llar

☑ Belgilar

Har bir layer:

- yoqish/o‘chirish

- opacity

funksiyasiga ega bo‘lsin.

==================================================

16. ASOSIY XARITA INTERFEYSI

==================================================

Xarita ekran markazida bo‘lsin.

Chap tomonda:

Navigatsiya paneli.

O‘ng tomonda:

tanlangan obyekt ma’lumotlari.

Pastda:

xarita asboblari.

Asboblar:

"Tanlash"

"Maydon o‘lchash"

"Masofa o‘lchash"

"Polygon chizish"

"Taqqoslash"

"Tozalash"

==================================================

17. BINO ANIQLASH

==================================================

AI yuqori aniqlikdagi imagerydan:

- uy

- bino

- qo‘shimcha bino

- ombor

- boshqa yirik qurilish footprintlarini

aniqlashga harakat qilsin.

Natija polygon ko‘rinishida chiqsin.

Har bir obyekt:

"AI aniqlagan obyekt"

statusiga ega bo‘lsin.

==================================================

18. QURILISH MAYDONINI ANIQLASH

==================================================

AI aniqlagan bino polygonining geodezik maydoni hisoblanishi kerak.

Misol:

Qurilish maydoni:

126.7 m²

Perimetri:

48.3 m

Hisoblash screen pixel orqali emas.

Turf.js yoki PostGIS geospatial calculation ishlatilsin.

==================================================

19. MANUAL O‘LCHASH

==================================================

Foydalanuvchi binoning chegarasini qo‘lda belgilashi mumkin.

"Maydon o‘lchash"

bosiladi.

Polygon chiziladi.

Real vaqtda:

Maydon:

127.32 m²

Perimetr:

48.91 m

ko‘rsatiladi.

==================================================

20. KADASTR MAYDONI VS QURILISH MAYDONI

==================================================

Har bir uchastka uchun:

Yer maydoni:

1 200 m²

Mavjud bino maydoni:

320 m²

AI aniqlagan yangi obyekt:

85 m²

Yangi obyekt / yer maydoni:

7.08%

ko‘rsatilishi mumkin.

==================================================

21. KADASTR BILAN SOLISHTIRISH

==================================================

AI aniqlagan bino:

Agar kadastr ma’lumotida mos bino mavjud bo‘lsa:

"Rasmiy ma’lumot bilan mos keladi"

Agar mos obyekt topilmasa:

"Rasmiy ma’lumot bilan mos obyekt topilmadi"

Agar geometriya sezilarli farq qilsa:

"Geometrik farq aniqlandi"

Bunday natija:

"NOQONUNIY QURILISH"

deb yozilmasin.

Doimo:

"Ehtimoliy o‘zgarish"

"Qo‘shimcha tekshiruv talab etiladi"

kabi iboralar ishlatilsin.

==================================================

22. AI ISHONCH DARAJASI

==================================================

Har bir aniqlangan obyekt:

Ishonch:

92%

kabi ko‘rsatilishi mumkin.

Darajalar:

Yuqori

O‘rta

Past

Lekin AI confidence qiymati haqiqiy modeldan kelishi kerak.

Fake 95% qiymat yaratmang.

==================================================

23. TASVIRLARNI TAQQOSLASH

==================================================

DEFAULT:

Faqat ENG SO‘NGGI TASVIR.

Tarixiy taqqoslash foydalanuvchi tomonidan alohida yoqiladi.

Tugma:

"Oldingi tasvir bilan solishtirish"

Foydalanuvchi tanlashi mumkin:

30 kun

60 kun

90 kun

Maxsus sana

Masalan:

Oldingi:

12.07.2026

Eng so‘nggi:

08.09.2026

AI:

"Yangi obyekt ehtimoli aniqlandi"

==================================================

24. TAQQOSLASH UI

==================================================

Professional comparison viewer:

Chap:

"Oldingi tasvir"

O‘ng:

"Eng so‘nggi tasvir"

Shuningdek:

"Yonma-yon"

"Sirpantirib taqqoslash"

"Shaffoflik"

rejimlari bo‘lsin.

==================================================

25. ENG MUHIM NATIJA

==================================================

Foydalanuvchi mahallani tanlaganda tizim:

masalan:

Tekshiruv hududi:

15.8 ga

Yer uchastkalari:

243

Aniqlangan obyektlar:

18

Yangi o‘zgarishlar:

7

Qo‘shimcha tekshiruv:

4

kabi statistikani ko‘rsatsin.

==================================================

26. NATIJALAR FILTRI

==================================================

Filtr:

Barchasi

Yangi obyektlar

Geometrik farq

Yuqori ishonch

O‘rta ishonch

Past ishonch

Tekshiruv talab etiladi

==================================================

27. OBYEKT PANELI

==================================================

Obyekt bosilganda:

"Tekshiruv natijasi"

Kadastr ID:

[haqiqiy ma’lumot]

Yer maydoni:

1 250 m²

Aniqlangan obyekt:

1

Obyekt maydoni:

87 m²

Tasvir sanasi:

08.09.2026

Tasvir aniqligi:

0.5 m

AI ishonchi:

[haqiqiy model qiymati]

Holat:

"Qo‘shimcha tekshiruv talab etiladi"

==================================================

28. RASMIY MANBA

==================================================

Har bir natijada manba ko‘rinsin.

Misol:

[KADASTR]

O‘zbekiston Milliy geoaxborot portali

[TA’SIR TASVIRI]

Haqiqiy imagery provider

[AI]

AI tahlili

[O‘LCHOV]

Qo‘lda o‘lchangan

==================================================

29. HISOBOT

==================================================

Tugma:

"Hisobot yaratish"

Hisobot:

- tekshiruv hududi

- sana

- kadastr uchastkalari soni

- imagery sanasi

- imagery aniqligi

- imagery provider

- aniqlangan obyektlar

- obyekt maydonlari

- koordinatalar

- AI ishonchi

- xarita rasmi

- kadastr ma’lumotlari

- tahlil xulosasi

ni o‘z ichiga olsin.

==================================================

30. HUQUQIY OGohlantirish

==================================================

Har bir hisobotda:

"Ushbu natijalar masofadan zondlash, geospatial ma’lumotlar va avtomatlashtirilgan tahlil asosida shakllantirilgan. Natija huquqiy xulosa hisoblanmaydi. Yer uchastkasi yoki qurilishning huquqiy holati vakolatli organ tomonidan rasmiy ma’lumotlar asosida tekshirilishi lozim."

==================================================

31. BACKEND

==================================================

Supabase + PostgreSQL + PostGIS ishlatilsin.

Jadvallar:

inspection_areas

parcels

buildings

satellite_images

imagery_sources

change_detections

measurements

analysis_runs

reports

data_sources

system_settings

Geometry ustunlari PostGIS geometry type bilan saqlansin.

Spatial index yarating.

==================================================

32. API ARXITEKTURASI

==================================================

Frontend hech qachon maxfiy API key bilan ishlamasin.

Backend servislar:

cadastralService

imageryService

aiAnalysisService

measurementService

reportService

==================================================

33. IMAGERY SERVICE

==================================================

Function:

getLatestHighResolutionImage(aoi)

jarayoni:

1. AOI qabul qiladi.

2. Imagery providerga so‘rov yuboradi.

3. AOI bilan kesishadigan tasvirlarni qidiradi.

4. Tasvir sifatini tekshiradi.

5. Eng yangi sifatli tasvirni tanlaydi.

6. Metadata saqlaydi.

7. Tasvirni qaytaradi.

Natija:

image_id

provider

acquisition_date

resolution

cloud_cover

bbox

footprint

==================================================

34. PROVIDER ARCHITECTURE

==================================================

Tizimni bitta providerga bog‘lab qo‘ymang.

Interface:

ImageryProvider

methods:

searchLatest()

getImage()

getMetadata()

getCoverage()

Providerlar:

HighResolutionProvider

AerialImageryProvider

Sentinel2Provider

Admin sozlamalaridan provider almashtirish mumkin bo‘lsin.

==================================================

35. AI ARXITEKTURASI

==================================================

Frontendda "AI" deb oddiy rang/pixel comparison yozib, uni AI sifatida ko‘rsatmang.

AI uchun alohida backend abstraction:

detectBuildings(image, parcelGeometry)

detectChanges(previousImage, latestImage, parcelGeometry)

calculateConfidence()

Natijada keyinchalik:

Python

FastAPI

YOLO

Segmentation model

Change Detection model

kabi texnologiyalarni ulash mumkin bo‘lsin.

==================================================

36. YUQORI ANIQLIKDA AI

==================================================

AI model:

- building footprint segmentation

- object detection

- change detection

uchun tayyor architecturega ega bo‘lsin.

Modelga imagery:

georeferenced raster

ko‘rinishida uzatilishi kerak.

AI natijasi:

GeoJSON polygon

ko‘rinishida qaytarilsin.

==================================================

37. KICHIK OBYEKTLAR

==================================================

Tizim kichik qurilishlarni ham aniqlashga mo‘ljallansin.

Buning uchun:

- yuqori resolution imagery

- tiling

- image normalization

- georeferencing

- segmentation

- object filtering

architecture mavjud bo‘lsin.

Lekin tizim aniqlikni sun’iy ravishda 100% deb ko‘rsatmasin.

==================================================

38. KATTA HUDUDLAR

==================================================

Butun mahallani bitta ulkan rasm sifatida AI'ga bermang.

AOI:

↓

tile/grid

bo‘yicha bo‘linsin.

Har bir tile:

AI analysis

dan o‘tkazilsin.

Keyin natijalar birlashtirilsin.

==================================================

39. CACHE

==================================================

Bir xil hudud uchun bir xil tasvirni qayta-qayta yuklamang.

Cache:

AOI

image_id

date

provider

processing parameters

asosida ishlasin.

==================================================

40. ADMIN PANEL

==================================================

Admin:

Imagery provider

API konfiguratsiyasi

AI provider

AI threshold

kadastr provider

map settings

cache

ni boshqara olsin.

Maxfiy credentiallar UI'da ochiq ko‘rsatilmasin.

==================================================

41. XAVFSIZLIK

==================================================

Supabase RLS ishlatilsin.

Foydalanuvchi faqat o‘ziga ruxsat berilgan inspection/project ma’lumotlarini ko‘rsin.

API kalitlar frontend bundle ichiga kiritilmasin.

==================================================

42. 100% O‘ZBEK TILI

==================================================

Barcha UI matnlari O‘ZBEK LOTIN ALIFBOSIDA bo‘lsin.

Masalan:

Dashboard

emas:

"Boshqaruv paneli"

Settings

emas:

"Sozlamalar"

Search

emas:

"Qidirish"

Select area

emas:

"Tekshiruv hududini tanlash"

Analyze

emas:

"Tahlilni boshlash"

Satellite imagery

emas:

"Sun’iy yo‘ldosh tasviri"

Latest image

emas:

"Eng so‘nggi tasvir"

Parcel

emas:

"Yer uchastkasi"

Building

emas:

"Bino"

Change detection

emas:

"O‘zgarishlarni aniqlash"

Report

emas:

"Hisobot"

==================================================

43. UI DIZAYN

==================================================

Premium professional GIS dashboard.

Asosiy rang:

to‘q yashil / yashil

Fon:

oq / juda och kulrang

Warning:

sariq

Critical:

qizil

Text:

to‘q kulrang

Minimal dizayn.

Keraksiz gradientlardan foydalanmang.

==================================================

44. DESKTOP LAYOUT

==================================================

1440x900 va 1920x1080 uchun optimallashtiring.

Chap sidebar:

240–280 px

Markaz:

asosiy xarita

O‘ng panel:

320–400 px

Xarita ekran maydonining asosiy qismini egallasin.

==================================================

45. RESPONSIVE

==================================================

Tablet va mobil uchun ham ishlasin.

Mobil:

xarita full-screen

pastdan bottom sheet

obyekt ma’lumotlari bottom sheetda.

==================================================

46. PROFESSIONAL GIS UX

==================================================

Xaritada:

Zoom

+

-

Full screen

Layer manager

Measure

Search

Geolocation

Scale

North

ko‘rinadigan bo‘lsin.

==================================================

47. XATOLIKLAR

==================================================

Agar yuqori aniqlikdagi imagery topilmasa:

"Ushbu hudud uchun hozircha talabga javob beradigan yuqori aniqlikdagi tasvir topilmadi."

Agar kadastr API ishlamasa:

"Kadastr GIS manbasi bilan aloqa o‘rnatilmadi."

Agar AI ishlamasa:

"Sun’iy intellekt tahlilini bajarishda xatolik yuz berdi."

Hech qachon fake result ko‘rsatmang.

==================================================

48. DEMO MODE

==================================================

Development uchun DEMO MODE yarating.

Demo:

- O‘zbekiston hududidan namunaviy AOI

- namunaviy yer uchastkalari

- namunaviy bino polygonlari

- namunaviy imagery metadata

- namunaviy AI natijalari

bo‘lsin.

Lekin barcha demo natijalarda:

"DEMO MA’LUMOT"

yozuvi ko‘rinsin.

==================================================

49. HAQIQIY MA’LUMOT VA DEMO MA’LUMOTNI AJRATISH

==================================================

UI'da badge:

HAQIQIY MANBA

yoki:

DEMO MA’LUMOT

bo‘lsin.

Hech qachon demo ma’lumotni rasmiy ma’lumot sifatida ko‘rsatmang.

==================================================

50. ISHLASH TARTIBI

==================================================

FOYDALANUVCHI:

Yangi tekshiruv

↓

Hudud tanlash

↓

Mahalla yoki polygon

↓

Tekshiruvni boshlash

↓

Kadastr uchastkalari

↓

Eng so‘nggi yuqori aniqlikdagi imagery

↓

AI tahlili

↓

Bino va o‘zgarishlarni aniqlash

↓

Qurilish maydonini hisoblash

↓

Kadastr bilan solishtirish

↓

Natijalar

↓

Hisobot

==================================================

51. MUHIM — OLDINGI TASVIRNI AVTOMATIK ISHLATMA

==================================================

Foydalanuvchi faqat:

"Tekshiruvni boshlash"

desa:

FAQAT ENG SO‘NGGI MOS TASVIRNI OL.

Oldingi tasvirlarni avtomatik yuklama.

Oldingi tasvir faqat:

"Tarixiy taqqoslash"

funksiyasi yoqilganda olinadi.

==================================================

52. MA’LUMOTLARNI KO‘RSATISH

==================================================

Har bir imagery natijasida:

Manba:

[provider]

Olingan sana:

[date]

Aniqlik:

[resolution]

Bulutlilik:

[cloud]

Image ID:

[id]

ko‘rsatilishi shart.

==================================================

53. GEOREFERENSING

==================================================

Tasvirlar:

to‘g‘ri CRS

georeferencing

AOI

bilan ishlasin.

Tasvir va kadastr polygonlari bir koordinata tizimiga moslashtirilsin.

==================================================

54. EKSPORT

==================================================

Foydalanuvchi:

GeoJSON

CSV

PDF

formatlarida natijani eksport qila olsin.

GeoJSON:

parcel polygon

detected building polygon

change polygon

inspection AOI

ni o‘z ichiga olsin.

==================================================

55. AUDIT

==================================================

Har bir tahlil:

foydalanuvchi

sana

AOI

imagery provider

image ID

image date

AI model

AI version

natija

bilan saqlansin.

==================================================

56. MUHIM HUQUQIY CHEGARALAR

==================================================

Tizim:

"Bu noqonuniy qurilish."

degan yakuniy huquqiy xulosa bermasin.

To‘g‘ri:

"Ehtimoliy yangi qurilish aniqlandi."

"Rasmiy ma’lumot bilan mos obyekt topilmadi."

"Qo‘shimcha tekshiruv talab etiladi."

==================================================

57. KOD SIFATI

==================================================

TypeScript strict mode.

Reusable components.

Clean architecture.

API abstraction.

Error handling.

Loading states.

Empty states.

Responsive UI.

No hardcoded API keys.

No fake government API endpoints.

No fake satellite URLs.

No unnecessary dependencies.

==================================================

58. MAVJUD LOYIHA BO‘LSA

==================================================

Agar ushbu prompt mavjud Lovable loyihasiga berilayotgan bo‘lsa:

AVVAL LOYIHANI TEKSHIR.

Aniqlang:

- framework

- mavjud komponentlar

- Supabase

- database

- routing

- authentication

- map library

- existing API services

Mavjud ishlaydigan funksiyalarni buzma.

Keraksiz rewrite qilma.

Incremental implementation qil.

==================================================

59. IMPLEMENTATION PRIORITY

==================================================

1.

Professional GIS UI

2.

MapLibre

3.

AOI selection

4.

Kadastr provider abstraction

5.

open.ngis.uz integration

6.

High-resolution imagery provider abstraction

7.

Latest imagery retrieval

8.

Imagery metadata

9.

Parcel polygons

10.

Building measurement

11.

AI building detection architecture

12.

Change detection

13.

Cadastral comparison

14.

Reports

15.

Admin configuration

16.

Security

==================================================

60. YAKUNIY TALAB

==================================================

Birinchi MVP quyidagi real workflow'ni bajarishi kerak:

Foydalanuvchi:

"Yangi tekshiruv"

ni bosadi.

↓

"Samarqand viloyati"

↓

"Tuman"

↓

"Mahalla"

↓

"Tekshiruvni boshlash"

↓

Tizim shu hududdagi mavjud kadastr polygonlarini yuklaydi.

↓

Tizim eng so‘nggi YUQORI ANIQLIKDAGI imageryni qidiradi.

↓

Tasvir sanasi va aniqligi ko‘rsatiladi.

↓

Tasvir xaritada chiqadi.

↓

AI bino/inshootlarni tahlil qiladi.

↓

Har bir uchastka bo‘yicha natija chiqadi.

↓

Foydalanuvchi uchastkani bosadi.

↓

Yer maydoni:

1 250 m²

↓

Aniqlangan bino:

320 m²

↓

Ehtimoliy yangi qurilish:

86 m²

↓

AI ishonchi:

[real model result]

↓

"Kadastr ma’lumotlari bilan moslik"

↓

"Qo‘shimcha tekshiruv talab etiladi"

↓

Foydalanuvchi:

"Qurilish maydonini o‘lchash"

orqali natijani qo‘lda tekshiradi.

↓

"Hisobot yaratish"

==================================================

61. FINAL DEVELOPMENT RULE

==================================================

DO NOT claim that the system has access to a government API unless the API has actually been connected and tested.

DO NOT fabricate cadastral boundaries.

DO NOT fabricate satellite imagery.

DO NOT fabricate imagery dates.

DO NOT fabricate AI confidence.

DO NOT expose private personal information.

DO NOT call satellite detection a legal determination.

Build the application so real official/open GIS data and licensed high-resolution imagery providers can be plugged in without rewriting the application.

The application UI must be 100% Uzbek.

The architecture must be ready for high-resolution imagery from day one.

Do not make Sentinel-2 the primary construction-detection source.

This project was built with [Lovable](https://lovable.dev).

## Build with Lovable

Continue developing this project in the [Lovable editor](https://lovable.dev/projects/644ffd94-f235-468b-814a-5309357c9b87).

- **Ship faster**: describe what you want to build and Lovable handles the code.
- **Stay in sync**: every change made in Lovable is committed straight to this repository.
- **Full ownership**: this code is yours. Push to `main` on GitHub and your changes sync back into Lovable, ready for your next prompt.

## Development

Prefer working locally? You need Node.js and npm — [install with nvm](https://github.com/nvm-sh/nvm#installing-and-updating).

```sh
git clone <this-repository-url>
cd <repository-name>
npm i
npm run dev
```
