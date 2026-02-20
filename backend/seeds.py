"""
Seed script for Sonora database.
Creates realistic bot users, album cache entries, reviews, and curated lists.
Run: python seeds.py
"""
import asyncio
import random
import os
import httpx
from datetime import datetime, timedelta, timezone
from dotenv import load_dotenv
from database import SessionLocal, engine, Base
from auth import hash_password
import models

load_dotenv()

async def get_spotify_token() -> str:
    """Get a Spotify API token using Client Credentials flow."""
    client_id = os.getenv("SPOTIFY_CLIENT_ID")
    client_secret = os.getenv("SPOTIFY_CLIENT_SECRET")
    if not client_id or not client_secret:
        return None
    async with httpx.AsyncClient() as client:
        response = await client.post(
            "https://accounts.spotify.com/api/token",
            data={"grant_type": "client_credentials"},
            auth=(client_id, client_secret),
        )
        if response.status_code == 200:
            return response.json()["access_token"]
    return None

async def fetch_cover_url(token: str, spotify_id: str) -> str:
    """Fetch album cover URL from Spotify API."""
    if not token:
        return None
    async with httpx.AsyncClient() as client:
        response = await client.get(
            f"https://api.spotify.com/v1/albums/{spotify_id}",
            headers={"Authorization": f"Bearer {token}"},
            params={"market": "BR"},
        )
        if response.status_code == 200:
            images = response.json().get("images", [])
            if images:
                return images[0]["url"]  # largest image
    return None


# ===================== Seed Albums =====================
# Real albums from the user's playlists + classic placeholders

SEED_ALBUMS = [
    # Vibes part I
    {"spotify_id": "5mIImcsuqpiSXg8XvFr81I", "name": "BALLADS 1", "artist": "Joji", "cover_url": "https://i.scdn.co/image/ab67616d0000b2734cc52cd7a712842234e4fce2", "release_date": "2018-10-26"},
    {"spotify_id": "6gJ8VKn5PAFcCIVaf3B2uE", "name": "Nectar", "artist": "Joji", "cover_url": "https://i.scdn.co/image/ab67616d0000b273f733e50079838090eebc3fe4", "release_date": "2020-09-25"},
    {"spotify_id": "007DWn799UWvfY1wwZeENR", "name": "i am > i was", "artist": "21 Savage", "cover_url": "https://i.scdn.co/image/ab67616d0000b2731afd2e526e3723dd4a9fb4c8", "release_date": "2018-12-21"},
    {"spotify_id": "5cUY5chmS86cdonhoFdn8h", "name": "AmarElo", "artist": "Emicida", "cover_url": "https://i.scdn.co/image/ab67616d0000b273856b38f6f4209513625d087d", "release_date": "2019-10-30"},
    {"spotify_id": "2Ti79nwTsont5ZHfdxIzAm", "name": "?", "artist": "XXXTENTACION", "cover_url": "https://i.scdn.co/image/ab67616d0000b273806c160566580d6335d1f16c", "release_date": "2018-03-16"},
    {"spotify_id": "5VdyJkLe3yvOs0l4xXbWp0", "name": "17", "artist": "XXXTENTACION", "cover_url": "https://i.scdn.co/image/ab67616d0000b273203c89bd4391468eea4cc3f5", "release_date": "2017-08-25"},
    {"spotify_id": "4g1ZRSBuWGhKidaJFlYbje", "name": "Hollywood's Bleeding", "artist": "Post Malone", "cover_url": "https://i.scdn.co/image/ab67616d0000b2739478c87599550dd73bfa1b04", "release_date": "2019-09-06"},
    {"spotify_id": "6trNtQUgC8cgbWcqoMYkOR", "name": "beerbongs & bentleys", "artist": "Post Malone", "cover_url": "https://i.scdn.co/image/ab67616d0000b273b1c4b76e23414c9f20242268", "release_date": "2018-04-27"},
    # Vibes part II
    {"spotify_id": "4IFpj2jyRcugt1yzH82m3E", "name": "SYRE", "artist": "Jaden", "cover_url": "https://i.scdn.co/image/ab67616d0000b2736aafb01504b69173c877bdca", "release_date": "2017-11-17"},
    {"spotify_id": "3xWp6y0HGsHZlXljNs7VRy", "name": "Samba Esquema Novo", "artist": "Jorge Ben Jor", "cover_url": "https://i.scdn.co/image/ab67616d0000b2732daa87c238a78a680511da3c", "release_date": "1963-01-01"},
    {"spotify_id": "6KFJoqStaKw7VRMmoh1d6j", "name": "Cru", "artist": "Seu Jorge", "cover_url": "https://i.scdn.co/image/ab67616d0000b27348fd36a5f603cf1cfbd8128e", "release_date": "2005-01-01"},
    {"spotify_id": "4Hai0uVzRbyTSaTPzxTY4e", "name": "French Exit", "artist": "TV Girl", "cover_url": "https://i.scdn.co/image/ab67616d0000b273e1bc1af856b42dd7fdba9f84", "release_date": "2014-08-21"},
    # Vibes part III
    {"spotify_id": "6r1lh7fHMB499vGKtIyJLy", "name": "Austin", "artist": "Post Malone", "cover_url": "https://i.scdn.co/image/ab67616d0000b27371cae34ad5a39bdab78af13e", "release_date": "2023-07-28"},
    {"spotify_id": "6JeoPC8u9sDjjlfeS8f1yr", "name": "Landmarks", "artist": "Hollow Coves", "cover_url": "https://i.scdn.co/image/ab67616d0000b27339f867a6a9a9e9f2614b3a42", "release_date": "2022-03-04"},
    {"spotify_id": "0PtqooT6O0E1uyizFZevFY", "name": "Veneer", "artist": "José González", "cover_url": "https://i.scdn.co/image/ab67616d0000b27376557bf2d3926bf5a607cd92", "release_date": "2003-01-01"},
    {"spotify_id": "6HbJlAnTRhWae1F3lEwGkv", "name": "An Awesome Wave", "artist": "alt-J", "cover_url": "https://i.scdn.co/image/ab67616d0000b2731e1ca90cd8fdbb0ac890a926", "release_date": "2012-05-25"},
    {"spotify_id": "6MwSuZphL6GmuSVIYUGUF7", "name": "I'm Wide Awake, It's Morning", "artist": "Bright Eyes", "cover_url": "https://i.scdn.co/image/ab67616d0000b2738eded59eb143ee6000a77c62", "release_date": "2005-01-25"},
    {"spotify_id": "74ShfU6i2GfPyqwdc5uGl7", "name": "If You Leave", "artist": "Daughter", "cover_url": "https://i.scdn.co/image/ab67616d0000b273f9e7f5cc42ac959998ca90ee", "release_date": "2013-03-18"},
    {"spotify_id": "2vRh4R0ACSdHA5WORLP3Zg", "name": "Not to Disappear", "artist": "Daughter", "cover_url": "https://i.scdn.co/image/ab67616d0000b2732b39f574d17e45fad82194f0", "release_date": "2016-01-15"},
    {"spotify_id": "0HrAEwPOV0brDG0wvTWXUB", "name": "Evergreen", "artist": "BROODS", "cover_url": "https://i.scdn.co/image/ab67616d0000b2734016d72958f2aa2b00df37bf", "release_date": "2014-08-22"},
    {"spotify_id": "78BXB0tWspQKtatJK5DTXZ", "name": "Down the Way", "artist": "Angus & Julia Stone", "cover_url": "https://i.scdn.co/image/ab67616d0000b27334a4ab124ec70f633f23a891", "release_date": "2010-03-05"},
    {"spotify_id": "2L82g2rqAlNBcADFzayJBU", "name": "My Love Is Cool", "artist": "Wolf Alice", "cover_url": "https://i.scdn.co/image/ab67616d0000b2731355ee57ae4c00720f7dacee", "release_date": "2015-06-22"},
    # Rodeo trip
    {"spotify_id": "18NOKLkZETa4sWwLMIm0UZ", "name": "UTOPIA", "artist": "Travis Scott", "cover_url": "https://i.scdn.co/image/ab67616d0000b27304481c826dd292e5e4983b3f", "release_date": "2023-07-28"},
    {"spotify_id": "41GuZcammIkupMPKH2OJ6I", "name": "Astroworld", "artist": "Travis Scott", "cover_url": "https://i.scdn.co/image/ab67616d0000b273daec894c14c0ca42d76eeb32", "release_date": "2018-08-03"},
    {"spotify_id": "7txGsnDSqVMoRl6RQ9XyZP", "name": "HEROES & VILLAINS", "artist": "Metro Boomin & Future", "cover_url": "https://i.scdn.co/image/ab67616d0000b273c4fee55d7b51479627c31f89", "release_date": "2022-12-02"},
    {"spotify_id": "1qgJNWnPIeK9rx7hF8JCPK", "name": "Over It", "artist": "Summer Walker", "cover_url": "https://i.scdn.co/image/ab67616d0000b27393e2baf7cebd1613156afd60", "release_date": "2019-10-04"},
    {"spotify_id": "02f3y3NTsddjdUMoNiBppI", "name": "Make It Big", "artist": "Wham!", "cover_url": "https://i.scdn.co/image/ab67616d0000b273a2fc41b0dd6ce4f0d16a4c46", "release_date": "1984-10-23"},
    # Classics
    {"spotify_id": "4LH4d3cOWNNsVw41Gqt2kv", "name": "The Dark Side of the Moon", "artist": "Pink Floyd", "cover_url": "https://i.scdn.co/image/ab67616d0000b273db216ca805faf5fe35df4ee6", "release_date": "1973-03-01"},
    {"spotify_id": "6dVIqQ8qmQ5GBnJ9shOYGE", "name": "OK Computer", "artist": "Radiohead", "cover_url": "https://i.scdn.co/image/ab67616d0000b273c8b444df094279e70d0ed856", "release_date": "1997-05-21"},
    {"spotify_id": "4eLPsYPBmXABThSJ821sqY", "name": "DAMN.", "artist": "Kendrick Lamar", "cover_url": "https://i.scdn.co/image/ab67616d0000b2738b52c6b9bc4e43d873869699", "release_date": "2017-04-14"},
]


# ===================== Seed Users (Bots) =====================

SEED_USERS = [
    {
        "username": "melodia_ana",
        "email": "ana@seedbot.needle",
        "password": "seed123456",
        "avatar_url": "https://api.dicebear.com/7.x/avataaars/svg?seed=Ana&backgroundColor=b6e3f4",
        "bio": "Apaixonada por indie e MPB. Se não estou ouvindo Daughter, estou redescobonhendo Jorge Ben 🎶",
    },
    {
        "username": "beatdrop_lucas",
        "email": "lucas@seedbot.needle",
        "password": "seed123456",
        "avatar_url": "https://api.dicebear.com/7.x/avataaars/svg?seed=Lucas&backgroundColor=c0aede",
        "bio": "Produtor musical nas horas vagas. Trap, boom bap e tudo que tem bass pesado 🔊",
    },
    {
        "username": "vinylvibe_mari",
        "email": "mari@seedbot.needle",
        "password": "seed123456",
        "avatar_url": "https://api.dicebear.com/7.x/avataaars/svg?seed=Mari&backgroundColor=ffd5dc",
        "bio": "Colecionadora de vinil. Do lo-fi ao post-rock, se o som é bonito eu tô dentro 💿",
    },
    {
        "username": "hiphophead_pedro",
        "email": "pedro@seedbot.needle",
        "password": "seed123456",
        "avatar_url": "https://api.dicebear.com/7.x/avataaars/svg?seed=Pedro&backgroundColor=d1d4f9",
        "bio": "Hip-hop é cultura. De Emicida a Travis Scott, o rap conta histórias que precisam ser ouvidas 🎤",
    },
    {
        "username": "chill_sofia",
        "email": "sofia@seedbot.needle",
        "password": "seed123456",
        "avatar_url": "https://api.dicebear.com/7.x/avataaars/svg?seed=Sofia&backgroundColor=ffdfbf",
        "bio": "Playlist de domingo: café, chuva e som acústico. José González no repeat ☕",
    },
]


# ===================== Review Templates =====================
# Realistic Portuguese reviews with varied opinions

REVIEW_TEMPLATES = {
    "BALLADS 1": [
        (5.0, "Joji conseguiu traduzir solidão em música de um jeito que poucos artistas fazem. BALLADS 1 é quase terapêutico."),
        (4.5, "Slow Dancing in the Dark é uma obra-prima. O resto do álbum mantém um clima nostálgico perfeito."),
        (3.5, "Bonito, mas um pouco monótono no meio. As melhores faixas são incríveis, porém."),
    ],
    "Nectar": [
        (4.0, "Evolução clara do Joji. Mais ambicioso, mais produzido, mas sem perder a essência melancólica."),
        (4.5, "Gimme Love e Run me enchem os olhos d'água toda vez. Álbum perfeito pra noites de introspecção."),
        (3.0, "Esperava mais. Tem faixas incríveis mas os feats diluem a identidade do álbum."),
    ],
    "i am > i was": [
        (4.0, "21 Savage mostrando maturidade. A lot é uma das melhores músicas do trap moderno."),
        (3.5, "Bom, mas longo demais. Cortando umas 5 faixas seria um clássico sem discussão."),
        (4.5, "Flows impecáveis, beats pesados, letras reais. O 21 não errou aqui."),
    ],
    "AmarElo": [
        (5.0, "Uma carta de amor ao Brasil. Emicida entregou uma obra que é ao mesmo tempo política e profundamente humana."),
        (5.0, "AmarElo transcende o rap e vira arte brasileira pura. Cada faixa é um documentário em forma de música."),
        (4.5, "Emicida no auge. As participações são certeiras e a produção é impecável."),
    ],
    "?": [
        (4.0, "X mostrou versatilidade absurda aqui. De Moonlight a SAD!, cada faixa é um universo diferente."),
        (3.0, "Interessante mas disperso. Parece mais uma playlist do que um álbum coeso."),
        (4.5, "Polêmicas à parte, musicalmente X era um gênio. Este álbum é a prova."),
    ],
    "17": [
        (4.0, "Minimalista e doloroso. Em 22 minutos, X despejou mais emoção que artistas despejam em carreiras inteiras."),
        (3.5, "Cru demais pra quem não curte lo-fi, mas sincero como poucos álbuns são."),
        (2.0, "Não entendo o hype. É basicamente um diário de adolescente com violão. Achei fraco."),
    ],
    "Hollywood's Bleeding": [
        (4.5, "Post Malone no auge comercial sem perder qualidade. Circles e Hollywood's Bleeding são perfeitas."),
        (4.0, "Acessível mas sofisticado. Mistura de gêneros muito bem feita."),
        (3.5, "Bom, mas genérico em vários momentos. Sunflower salva."),
    ],
    "beerbongs & bentleys": [
        (4.0, "Rockstar + Psycho + Better Now = o melhor trio de singles do pop moderno."),
        (3.0, "Longo demais, com faixas que soam como filler. Mas os hits são imbatíveis."),
        (4.5, "Post Malone redefiniu o que é pop nesse álbum. Influenciou toda uma geração."),
    ],
    "SYRE": [
        (3.0, "Ambicioso mas Jaden ainda não tinha maturidade pra um álbum conceitual desse tamanho."),
        (4.0, "Subestimado. ICON e Ninety são absurdamente boas. Merecia mais reconhecimento."),
        (2.5, "Meio pretensioso demais pro meu gosto. Tem momentos bons, mas são poucos."),
    ],
    "Samba Esquema Novo": [
        (5.0, "Jorge Ben inventou um gênero inteiro nesse álbum. Mais de 60 anos e continua fresco como no primeiro dia."),
        (4.5, "Impossível não sorrir ouvindo Mas Que Nada. Samba-rock na veia."),
        (4.0, "Clássico absoluto. A mistura de bossa nova com ritmo é coisa de visionário."),
    ],
    "Cru": [
        (4.5, "Seu Jorge num formato íntimo. Só violão e voz. Puro, simples, genial."),
        (4.0, "As releituras de Bowie são incríveis, mas as originais mostram que Seu Jorge é muito mais que um ator."),
        (5.0, "Esse álbum é um abraço sonoro. Ouvir de olhos fechados é quase meditação."),
    ],
    "French Exit": [
        (4.5, "TV Girl é a definição de lo-fi com substância. French Exit é um filme em forma de álbum."),
        (4.0, "Samples geniais, letras inteligentes, produção impecável. Subestimadíssimo."),
        (5.0, "Obra-prima do indie pop. Cada música poderia ser trilha sonora de um curta-metragem."),
    ],
    "Austin": [
        (3.5, "Post Malone tentou ir pro country/folk. Tem momentos bonitos, mas sinto falta do Post antigo."),
        (4.0, "Surpreendentemente sincero. Post mostra que sabe cantar de verdade aqui."),
        (2.5, "Achei tedioso. Não é o Post Malone que eu curto. Parece outro artista."),
    ],
    "Landmarks": [
        (4.5, "Hollow Coves fazem folk acústico que acalma a alma. Landmarks é perfeito pra trilhas de viagem."),
        (4.0, "Confortável como um cobertor sonoro. Nada revolucionário, mas consistentemente bonito."),
        (5.0, "O álbum que mais ouvi em 2022. Cada acorde transmite paz."),
    ],
    "Veneer": [
        (5.0, "Heartbeats é uma das músicas mais bonitas já gravadas. O álbum inteiro tem essa qualidade."),
        (4.5, "José González com violão de nylon e voz sussurrada. Minimalismo perfeito."),
        (4.0, "Bonito, mas pode ser monótono pra quem não curte folk acústico."),
    ],
    "An Awesome Wave": [
        (5.0, "alt-J criou algo que não existia antes. Breezeblocks é genial, mas TODO o álbum é uma experiência."),
        (4.5, "Estranho, hipnótico e viciante. Levou 3 ouvidas pra clicar, depois nunca mais largei."),
        (3.5, "Entendo quem ama, mas pra mim é experimental demais. Reconheço a originalidade."),
    ],
    "I'm Wide Awake, It's Morning": [
        (5.0, "Conor Oberst escreveu o álbum indie folk definitivo. Lua é devastadora."),
        (4.0, "Poético e melancólico sem ser piegas. Bright Eyes no melhor momento."),
        (4.5, "Cada música é um poema musicado. Folk americano da mais alta qualidade."),
    ],
    "If You Leave": [
        (5.0, "Daughter faz música pra chorar no escuro. If You Leave é catarse pura."),
        (4.5, "Elena Tonra tem uma das vozes mais emocionantes do indie. Álbum devastador."),
        (4.0, "Lindo mas pesado emocionalmente. Não é pra qualquer momento."),
    ],
    "Not to Disappear": [
        (4.5, "Mais denso e barulhento que o primeiro. Daughter evoluiu sem perder a essência."),
        (4.0, "Numbers e Doing the Right Thing são faixas que machucam de tão bonitas."),
        (3.5, "Bom, mas If You Leave era mais impactante. Esse parece repetição da fórmula."),
    ],
    "Evergreen": [
        (4.0, "BROODS fazem synthpop com coração. Bridges e Mother & Father são destaques."),
        (3.5, "Competente mas não memorável. Falta um pouco de personalidade."),
        (4.5, "Pop eletrônico feito com alma. Georgia Nott tem uma voz incrível."),
    ],
    "Down the Way": [
        (4.5, "Angus & Julia Stone fazem folk de uma beleza absurda. Big Jet Plane é eterna."),
        (4.0, "A harmonia entre os dois irmãos é mágica. Álbum perfeito pra um dia de chuva."),
        (5.0, "Simplicidade na música pode ser a maior genialidade. Este álbum prova isso."),
    ],
    "My Love Is Cool": [
        (4.5, "Wolf Alice misturando grunge, shoegaze e dream pop com maestria. Bros é perfeita."),
        (4.0, "Ellie Rowsell é uma força. O álbum vai do delicado ao caótico num piscar."),
        (3.0, "Bom mas inconsistente. As faixas pesadas são melhores que as calmas."),
    ],
    "UTOPIA": [
        (4.0, "Travis Scott criou um mundo sonoro absurdo. MELTDOWN e FE!N são brutais."),
        (3.0, "Longo demais. Se fosse 12 faixas seria incrível, com 19 fica cansativo."),
        (4.5, "A produção é de outro planeta. Cada faixa parece um filme. Travis se superou."),
    ],
    "Astroworld": [
        (5.0, "O melhor álbum de trap já feito. SICKO MODE, STARGAZING, COFFEE BEAN. Perfeição."),
        (4.5, "Travis Scott construiu um parque de diversões sonoro. Imersivo do início ao fim."),
        (4.0, "Excelente, mas RODEO ainda é o melhor dele pra mim. Astroworld é mais polido."),
    ],
    "HEROES & VILLAINS": [
        (4.0, "Metro Boomin provando que é o melhor produtor do rap atual. Superhero e Creepin' são hinos."),
        (4.5, "Future e Metro juntos nunca erram. A produção cinematográfica é de arrepiar."),
        (3.5, "Bom, mas Metro tem trabalhos melhores. Alguns beats são genéricos."),
    ],
    "Over It": [
        (4.0, "Summer Walker tem uma das vozes mais suaves do R&B. Playing Games é viciante."),
        (3.5, "O álbum todo soa parecido. Bom pra mood, mas falta variedade."),
        (4.5, "R&B moderno no seu melhor. Cada faixa é uma conversa íntima. Summer Walker brilha."),
    ],
    "The Dark Side of the Moon": [
        (5.0, "Não existe álbum mais perfeito. Time sozinha vale mais que discografias inteiras."),
        (5.0, "50 anos de idade e continua o álbum mais relevante da história. Pink Floyd é imortal."),
        (4.5, "Obra-prima absoluta, mas Money é overrated. O resto é transcendental."),
    ],
    "OK Computer": [
        (5.0, "Radiohead previu o futuro e fez a trilha sonora dele. Paranoid Android é genial."),
        (4.5, "Todo mundo deveria ouvir esse álbum pelo menos uma vez na vida. Essencial."),
        (4.0, "Entendo a grandeza, mas Kid A me pega mais. OK Computer é mais acessível."),
    ],
    "DAMN.": [
        (5.0, "Kendrick Lamar não faz álbuns, faz teses. HUMBLE, DNA, LOVE. Cada faixa é uma aula."),
        (4.5, "O Pulitzer foi merecidíssimo. Kendrick é o maior rapper de sua geração."),
        (4.0, "Incrível mas TPAB é mais ambicioso. DAMN. é Kendrick no modo acessível."),
    ],
}


# ===================== Seed Lists =====================

SEED_LISTS = [
    {
        "title": "Top Álbuns pra Programar",
        "description": "Sons que mantêm o foco sem distrair. Perfeito pra sessões de código longas.",
        "album_keys": ["An Awesome Wave", "Veneer", "Landmarks", "French Exit", "If You Leave", "Evergreen"],
    },
    {
        "title": "Clássicos do Rap Nacional e Gringo",
        "description": "O melhor do hip-hop em duas línguas. De Emicida a Kendrick.",
        "album_keys": ["AmarElo", "DAMN.", "i am > i was", "Astroworld", "UTOPIA", "HEROES & VILLAINS"],
    },
    {
        "title": "Indie & Folk Essentials",
        "description": "Pra quem gosta de violão, alma e silêncio entre as notas.",
        "album_keys": ["Veneer", "If You Leave", "Not to Disappear", "Down the Way", "I'm Wide Awake, It's Morning", "My Love Is Cool"],
    },
    {
        "title": "Noites de Introspecção",
        "description": "Álbuns pra ouvir sozinho, no escuro, com fone de ouvido.",
        "album_keys": ["BALLADS 1", "Nectar", "17", "If You Leave", "Cru", "Landmarks"],
    },
    {
        "title": "MPB & Samba: Raízes do Brasil",
        "description": "A alma musical brasileira em sua forma mais pura.",
        "album_keys": ["Samba Esquema Novo", "Cru", "AmarElo"],
    },
    {
        "title": "Melhores Produções de 2018-2023",
        "description": "Os álbuns com a produção sonora mais impressionante dos últimos anos.",
        "album_keys": ["Astroworld", "HEROES & VILLAINS", "Hollywood's Bleeding", "UTOPIA", "An Awesome Wave", "Austin"],
    },
]


# ===================== Main Seed Function =====================

async def seed_database():
    """Populate database with realistic seed data."""
    print("Starting database seeding...")

    # Get Spotify token to fetch real covers
    print("Connecting to Spotify API to fetch real album covers...")
    token = await get_spotify_token()
    if token:
        print("   Spotify API connected!")
    else:
        print("   WARNING: Could not connect to Spotify API. Using placeholder covers.")

    # Reset tables
    Base.metadata.create_all(bind=engine)
    db = SessionLocal()

    try:
        # Clear old seed users (cascades to reviews, lists)
        existing_bots = db.query(models.User).filter(
            models.User.email.like("%@seedbot.needle")
        ).count()
        if existing_bots > 0:
            print("Clearing old seed data...")
            db.query(models.User).filter(
                models.User.email.like("%@seedbot.needle")
            ).delete(synchronize_session=False)
            db.commit()

        # Also clear old seeded albums to get fresh cover URLs
        seed_ids = [a["spotify_id"] for a in SEED_ALBUMS]
        db.query(models.Album).filter(
            models.Album.spotify_id.in_(seed_ids)
        ).delete(synchronize_session=False)
        db.commit()

        # --- 1. Create Albums (real covers from Spotify API) ---
        print("Creating album cache entries...")
        album_map = {}  # name -> spotify_id
        added_count = 0
        skipped_count = 0
        for album_data in SEED_ALBUMS:
            cover_url = await fetch_cover_url(token, album_data["spotify_id"])
            if not cover_url:
                # Fallback to hardcoded cover URL from SEED_ALBUMS
                cover_url = album_data.get("cover_url")
                if cover_url:
                    print(f"   FALLBACK (using hardcoded cover): {album_data['name']}")
                else:
                    print(f"   SKIPPED (no cover available): {album_data['name']}")
                    skipped_count += 1
                    continue

            print(f"   OK: {album_data['name']}")
            album = models.Album(
                spotify_id=album_data["spotify_id"],
                name=album_data["name"],
                artist_name=album_data["artist"],
                cover_url=cover_url,
                release_date=album_data["release_date"],
            )
            db.add(album)
            album_map[album_data["name"]] = album_data["spotify_id"]
            added_count += 1
        db.commit()
        print(f"   {added_count} albums cached ({skipped_count} skipped - not available on Spotify)")

        # --- 2. Create Bot Users ---
        print("Creating bot users...")
        bot_users = []
        for user_data in SEED_USERS:
            user = models.User(
                username=user_data["username"],
                email=user_data["email"],
                password_hash=hash_password(user_data["password"]),
                avatar_url=user_data["avatar_url"],
                bio=user_data["bio"],
                theme_preference="dark",
            )
            db.add(user)
            db.flush()  # Get ID without full commit
            bot_users.append(user)
        db.commit()
        print(f"   {len(bot_users)} bot users created")

        # --- 3. Create Reviews ---
        print("Creating reviews...")
        review_count = 0
        for album_name, review_options in REVIEW_TEMPLATES.items():
            spotify_id = album_map.get(album_name)
            if not spotify_id:
                continue

            reviewers = random.sample(bot_users, k=min(len(review_options), len(bot_users)))
            for i, reviewer in enumerate(reviewers):
                if i >= len(review_options):
                    break
                rating, text = review_options[i]

                days_ago = random.randint(1, 90)
                review_date = datetime.now(timezone.utc) - timedelta(days=days_ago)

                review = models.Review(
                    user_id=reviewer.id,
                    album_spotify_id=spotify_id,
                    rating=rating,
                    review_text=text,
                    is_favorite=(rating >= 4.5 and random.random() > 0.5),
                    listened_on=review_date - timedelta(days=random.randint(0, 30)),
                    created_at=review_date,
                )
                db.add(review)
                review_count += 1
        db.commit()
        print(f"   {review_count} reviews created")

        # --- 4. Create Lists ---
        print("Creating curated lists...")
        list_count = 0
        for i, list_data in enumerate(SEED_LISTS):
            owner = bot_users[i % len(bot_users)]

            days_ago = random.randint(1, 60)
            user_list = models.UserList(
                user_id=owner.id,
                title=list_data["title"],
                description=list_data["description"],
                is_public=True,
                created_at=datetime.now(timezone.utc) - timedelta(days=days_ago),
            )
            db.add(user_list)
            db.flush()

            for pos, album_name in enumerate(list_data["album_keys"]):
                spotify_id = album_map.get(album_name)
                if spotify_id:
                    item = models.ListItem(
                        list_id=user_list.id,
                        album_spotify_id=spotify_id,
                        position=pos,
                    )
                    db.add(item)

            list_count += 1
        db.commit()
        print(f"   {list_count} curated lists created")

        # --- 5. Add follower relationships ---
        print("Creating follower relationships...")
        follow_count = 0
        for i, user in enumerate(bot_users):
            others = [u for u in bot_users if u.id != user.id]
            to_follow = random.sample(others, k=min(random.randint(2, 3), len(others)))
            for followed in to_follow:
                try:
                    db.execute(
                        models.followers.insert().values(
                            follower_id=user.id,
                            followed_id=followed.id,
                        )
                    )
                    follow_count += 1
                except Exception:
                    db.rollback()
                    continue
        db.commit()
        print(f"   {follow_count} follower relationships created")

        print("\nDatabase seeded successfully!")
        print(f"   Summary: {len(bot_users)} users, {len(SEED_ALBUMS)} albums, {review_count} reviews, {list_count} lists")
        print(f"   Bot login: any bot email (e.g. ana@seedbot.needle) / password: seed123456")

    except Exception as e:
        db.rollback()
        print(f"\nError during seeding: {e}")
        raise
    finally:
        db.close()


if __name__ == "__main__":
    asyncio.run(seed_database())
