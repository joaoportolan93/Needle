import * as spotify from './spotifyAPI';

async function runTests() {
    console.log("Iniciando testes de integração com a API do Spotify...\n");

    const tests = [
        { type: 'artist', query: 'Matuê' },
        { type: 'album', query: '333' }, // Pode ser necessário refinar se muitos álbuns se chamarem "333"
        { type: 'artist', query: 'Plumasdecera' },
        { type: 'artist', query: 'Big Rush' },
        { type: 'track', query: 'Jardim' }, // Pode ser necessário refinar com artista se for muito genérico
        { type: 'artist', query: 'Veigh' },
        { type: 'track', query: 'Taylor' }, // Pode ser necessário refinar com artista
        { type: 'artist', query: 'Travis Scott' },
        { type: 'album', query: 'Astroworld' },
    ];

    for (const test of tests) {
        console.log(`--- Testando busca por ${test.type}: "${test.query}" ---`);
        try {
            let results;
            if (test.type === 'artist') {
                results = await spotify.searchSpotify(test.query, ['artist']);
                if (results && results.artists && results.artists.items.length > 0) {
                    console.log(`Artistas encontrados para "${test.query}":`);
                    results.artists.items.slice(0, 3).forEach(artist => {
                        console.log(`  - Nome: ${artist.name}, ID: ${artist.id}, Popularidade: ${artist.popularity}`);
                    });
                } else {
                    console.log(`Nenhum artista encontrado para "${test.query}".`);
                }
            } else if (test.type === 'album') {
                results = await spotify.searchSpotify(test.query, ['album']);
                if (results && results.albums && results.albums.items.length > 0) {
                    console.log(`Álbuns encontrados para "${test.query}":`);
                    results.albums.items.slice(0, 3).forEach(album => {
                        console.log(`  - Título: ${album.name}, Artista(s): ${album.artists.map(a => a.name).join(', ')}, ID: ${album.id}`);
                    });
                } else {
                    console.log(`Nenhum álbum encontrado para "${test.query}".`);
                }
            } else if (test.type === 'track') {
                results = await spotify.searchSpotify(test.query, ['track']);
                if (results && results.tracks && results.tracks.items.length > 0) {
                    console.log(`Músicas encontradas para "${test.query}":`);
                    results.tracks.items.slice(0, 3).forEach(track => {
                        console.log(`  - Título: ${track.name}, Artista(s): ${track.artists.map(a => a.name).join(', ')}, Álbum: ${track.album.name}, ID: ${track.id}`);
                    });
                } else {
                    console.log(`Nenhuma música encontrada para "${test.query}".`);
                }
            }
        } catch (error) {
            console.error(`Erro ao buscar ${test.type} "${test.query}":`, error.message);
        }
        console.log('\n');
    }

    // Teste adicional: Novos Lançamentos
    console.log("--- Testando busca por Novos Lançamentos ---");
    try {
        const newReleases = await spotify.getSpotifyNewReleases(5);
        if (newReleases && newReleases.albums && newReleases.albums.items.length > 0) {
            console.log("Novos Lançamentos (primeiros 5):");
            newReleases.albums.items.forEach(album => {
                console.log(`  - Título: ${album.name}, Artista(s): ${album.artists.map(a => a.name).join(', ')}, ID: ${album.id}`);
            });
        } else {
            console.log("Nenhum novo lançamento encontrado ou erro na API.");
        }
    } catch (error) {
        console.error("Erro ao buscar Novos Lançamentos:", error.message);
    }
    console.log('\n');

    // Teste adicional: Categorias
    console.log("--- Testando busca por Categorias ---");
    try {
        const categories = await spotify.getSpotifyCategories(5, 0, 'BR');
        if (categories && categories.categories && categories.categories.items.length > 0) {
            console.log("Categorias (primeiras 5 do Brasil):");
            categories.categories.items.forEach(category => {
                console.log(`  - Nome: ${category.name}, ID: ${category.id}`);
            });
        } else {
            console.log("Nenhuma categoria encontrada ou erro na API.");
        }
    } catch (error) {
        console.error("Erro ao buscar Categorias:", error.message);
    }
    console.log('\n');

    console.log("Testes de integração concluídos.");
}

runTests();

