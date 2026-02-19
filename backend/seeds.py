"""
Seed script for Sonora database.
Creates realistic bot users, album cache entries, reviews, and curated lists.
Run: python seeds.py
"""
import random
from datetime import datetime, timedelta, timezone
from database import SessionLocal, engine, Base
from auth import hash_password
import models

# ===================== Seed Albums =====================
# Real albums from the user's playlists + classic placeholders

SEED_ALBUMS = [
    # Vibes part I
    {"spotify_id": "5EzDhyVKteSxPGbcP0MNiA", "name": "BALLADS 1", "artist": "Joji", "cover_url": "https://i.scdn.co/image/ab67616d0000b273f8e43213b9bbb1e9ee3132af", "release_date": "2018-10-26"},
    {"spotify_id": "3ShSHhniOtu1hc6w4OAfNB", "name": "Nectar", "artist": "Joji", "cover_url": "https://i.scdn.co/image/ab67616d0000b27378e787a51d4e36c0c1c65eb8", "release_date": "2020-09-25"},
    {"spotify_id": "0C6NLOdVWQ7e3UzH7j3eeV", "name": "i am > i was", "artist": "21 Savage", "cover_url": "https://i.scdn.co/image/ab67616d0000b273c45f858ec3892d7d4e3a3c79", "release_date": "2018-12-21"},
    {"spotify_id": "6ocxMCJSMokUFw5BiTKSMB", "name": "AmarElo", "artist": "Emicida", "cover_url": "https://i.scdn.co/image/ab67616d0000b2738bd416ec07b45e5f0e38bb6a", "release_date": "2019-10-30"},
    {"spotify_id": "2Ti79nwTsont5ZHfdxIzAm", "name": "?", "artist": "XXXTENTACION", "cover_url": "https://i.scdn.co/image/ab67616d0000b273806c160566580d6d0485550d", "release_date": "2018-03-16"},
    {"spotify_id": "5bBYWJhLvZ2G9fDECGSBaB", "name": "17", "artist": "XXXTENTACION", "cover_url": "https://i.scdn.co/image/ab67616d0000b2732f3a8e77f7aba16a1d4b0768", "release_date": "2017-08-25"},
    {"spotify_id": "4g1ZRSBuWGhKidaJFlYbje", "name": "Hollywood's Bleeding", "artist": "Post Malone", "cover_url": "https://i.scdn.co/image/ab67616d0000b2739478c87599550dd73bfa1b04", "release_date": "2019-09-06"},
    {"spotify_id": "6trNtQUgC8cgbWcqoMYkOR", "name": "beerbongs & bentleys", "artist": "Post Malone", "cover_url": "https://i.scdn.co/image/ab67616d0000b27395e5b5ba8fde1a06e7560899", "release_date": "2018-04-27"},
    # Vibes part II
    {"spotify_id": "5ht6gDP1z6bVpXy4hKI17N", "name": "SYRE", "artist": "Jaden", "cover_url": "https://i.scdn.co/image/ab67616d0000b2730f94056c7e96e7e80f1a4f41", "release_date": "2017-11-17"},
    {"spotify_id": "4EKqTLh2eyxOKOY7kGI7Mh", "name": "Samba Esquema Novo", "artist": "Jorge Ben Jor", "cover_url": "https://i.scdn.co/image/ab67616d0000b2732e481e1a7e3ab488c7c6b1d2", "release_date": "1963-01-01"},
    {"spotify_id": "1Py2SluTSBQ9qTxfT7y0EH", "name": "Cru", "artist": "Seu Jorge", "cover_url": "https://i.scdn.co/image/ab67616d0000b27364a5f3d47f48f5399c50b72c", "release_date": "2005-01-01"},
    {"spotify_id": "5fmIolIOsVaIVkTGzJZVHO", "name": "French Exit", "artist": "TV Girl", "cover_url": "https://i.scdn.co/image/ab67616d0000b273f2e3f5e1c23053a4e2b1a5ef", "release_date": "2014-08-21"},
    # Vibes part III
    {"spotify_id": "3HHNR44YbP7XogYdivVadR", "name": "Austin", "artist": "Post Malone", "cover_url": "https://i.scdn.co/image/ab67616d0000b2738b6cd164a03bfb8e8f5b7a98", "release_date": "2023-07-28"},
    {"spotify_id": "6JeoPC8u9sDjjlfeS8f1yr", "name": "Landmarks", "artist": "Hollow Coves", "cover_url": "https://i.scdn.co/image/ab67616d0000b2734c9c06f7f39f3ebd1e8c3b4a", "release_date": "2022-03-04"},
    {"spotify_id": "2kJVdmxl5n4gZwvcpMCOh5", "name": "Veneer", "artist": "José González", "cover_url": "https://i.scdn.co/image/ab67616d0000b273893489768d0f39a6fbb4c1b3", "release_date": "2003-01-01"},
    {"spotify_id": "3BPp3OZi3YMhq5TuDnzzv2", "name": "An Awesome Wave", "artist": "alt-J", "cover_url": "https://i.scdn.co/image/ab67616d0000b273ba25899acf0be0fb6c2d26f5", "release_date": "2012-05-25"},
    {"spotify_id": "0FKKHT0YrfxKm9JIdUclDd", "name": "I'm Wide Awake, It's Morning", "artist": "Bright Eyes", "cover_url": "https://i.scdn.co/image/ab67616d0000b273e2db76c8a66a37d9b1e08b2e", "release_date": "2005-01-25"},
    {"spotify_id": "2aOD4fxfHpxh6JwJuUTZvV", "name": "If You Leave", "artist": "Daughter", "cover_url": "https://i.scdn.co/image/ab67616d0000b2738b7b0ee68db2a0e84b0e6d27", "release_date": "2013-03-18"},
    {"spotify_id": "1M0L8FxbEsPdFXVYMUjvEa", "name": "Not to Disappear", "artist": "Daughter", "cover_url": "https://i.scdn.co/image/ab67616d0000b273e1f1f8cd6a8e8a9ed25fd6e2", "release_date": "2016-01-15"},
    {"spotify_id": "4PMqSO8JJaJdIAFQeGmoQ3", "name": "Evergreen", "artist": "BROODS", "cover_url": "https://i.scdn.co/image/ab67616d0000b273c3e93ebb07891a8346b8a2a5", "release_date": "2014-08-22"},
    {"spotify_id": "5Dbfp8uL5sA4jOT0pR9D9P", "name": "Down the Way", "artist": "Angus & Julia Stone", "cover_url": "https://i.scdn.co/image/ab67616d0000b273ff6e0e84db2a1f6dbf7c2dba", "release_date": "2010-03-05"},
    {"spotify_id": "0dJ06GfEjR7PWR1c0TUbCv", "name": "My Love Is Cool", "artist": "Wolf Alice", "cover_url": "https://i.scdn.co/image/ab67616d0000b2733c46a5f28b700ec939d147a8", "release_date": "2015-06-22"},
    # Rodeo trip
    {"spotify_id": "18NOKLkZETa4sWwLMIm0UZ", "name": "UTOPIA", "artist": "Travis Scott", "cover_url": "https://i.scdn.co/image/ab67616d0000b273881d8d8378cd01099babcd44", "release_date": "2023-07-28"},
    {"spotify_id": "41GuZcammIkupMPKH2OJ6I", "name": "Astroworld", "artist": "Travis Scott", "cover_url": "https://i.scdn.co/image/ab67616d0000b273072e9faef2ef7b6db63834a3", "release_date": "2018-08-03"},
    {"spotify_id": "1Sf5md0IPb7bMJa4XRPXMI", "name": "HEROES & VILLAINS", "artist": "Metro Boomin & Future", "cover_url": "https://i.scdn.co/image/ab67616d0000b2732081e3aec15d3eb96565e982", "release_date": "2022-12-02"},
    {"spotify_id": "3Gs8NhyoNpkEMmKkfV0Y7D", "name": "Over It", "artist": "Summer Walker", "cover_url": "https://i.scdn.co/image/ab67616d0000b27377fdcfda6535601aff081b6a", "release_date": "2019-10-04"},
    {"spotify_id": "2E8r3bwdQGyOPGLzrhHSaL", "name": "Make It Big", "artist": "Wham!", "cover_url": "https://i.scdn.co/image/ab67616d0000b273d73fd9d15tried18b89d6d6b5", "release_date": "1984-10-23"},
    # Classics placeholders
    {"spotify_id": "4LH4d3cOWNNsVw41Gqt2kv", "name": "The Dark Side of the Moon", "artist": "Pink Floyd", "cover_url": "https://i.scdn.co/image/ab67616d0000b273ea7caaff71dea1051d49b2fe", "release_date": "1973-03-01"},
    {"spotify_id": "6dVIqQ8qmQ5GBnJ9shOYGE", "name": "OK Computer", "artist": "Radiohead", "cover_url": "https://i.scdn.co/image/ab67616d0000b273c8b444df094c181e82df0ee0", "release_date": "1997-05-21"},
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

def seed_database():
    """Populate database with realistic seed data."""
    print("🌱 Starting database seeding...")

    # Reset tables
    Base.metadata.create_all(bind=engine)
    db = SessionLocal()

    try:
        # Check if seed data already exists
        existing_bots = db.query(models.User).filter(
            models.User.email.like("%@seedbot.needle")
        ).count()
        if existing_bots > 0:
            print("⚠️  Seed data already exists. Clearing old seed data...")
            # Delete old seed users (cascades to reviews, lists)
            db.query(models.User).filter(
                models.User.email.like("%@seedbot.needle")
            ).delete(synchronize_session=False)
            db.commit()

        # --- 1. Create Albums ---
        print("📀 Creating album cache entries...")
        album_map = {}  # name -> spotify_id
        for album_data in SEED_ALBUMS:
            existing = db.query(models.Album).filter(
                models.Album.spotify_id == album_data["spotify_id"]
            ).first()
            if not existing:
                album = models.Album(
                    spotify_id=album_data["spotify_id"],
                    name=album_data["name"],
                    artist_name=album_data["artist"],
                    cover_url=album_data["cover_url"],
                    release_date=album_data["release_date"],
                )
                db.add(album)
            album_map[album_data["name"]] = album_data["spotify_id"]
        db.commit()
        print(f"   ✅ {len(SEED_ALBUMS)} albums cached")

        # --- 2. Create Bot Users ---
        print("👤 Creating bot users...")
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
        print(f"   ✅ {len(bot_users)} bot users created")

        # --- 3. Create Reviews ---
        print("📝 Creating reviews...")
        review_count = 0
        for album_name, review_options in REVIEW_TEMPLATES.items():
            spotify_id = album_map.get(album_name)
            if not spotify_id:
                continue

            # Each bot has a chance to review each album (not all bots review everything)
            reviewers = random.sample(bot_users, k=min(len(review_options), len(bot_users)))
            for i, reviewer in enumerate(reviewers):
                if i >= len(review_options):
                    break
                rating, text = review_options[i]

                # Randomize dates over the past 3 months
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
        print(f"   ✅ {review_count} reviews created")

        # --- 4. Create Lists ---
        print("📋 Creating curated lists...")
        list_count = 0
        for i, list_data in enumerate(SEED_LISTS):
            # Assign lists to different bots round-robin
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

            # Add albums to the list
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
        print(f"   ✅ {list_count} curated lists created")

        # --- 5. Add some follower relationships ---
        print("🤝 Creating follower relationships...")
        follow_count = 0
        for i, user in enumerate(bot_users):
            # Each bot follows 2-3 others
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
        print(f"   ✅ {follow_count} follower relationships created")

        print("\n🎉 Database seeded successfully!")
        print(f"   📊 Summary: {len(bot_users)} users, {len(SEED_ALBUMS)} albums, {review_count} reviews, {list_count} lists")
        print(f"   🔑 Bot login: any bot email (e.g. ana@seedbot.needle) / password: seed123456")

    except Exception as e:
        db.rollback()
        print(f"\n❌ Error during seeding: {e}")
        raise
    finally:
        db.close()


if __name__ == "__main__":
    seed_database()
