# Contribuindo para o Sonora

Obrigado pelo seu interesse em contribuir para o Sonora! Aceitamos contribuições de todos. Ao participar deste projeto, você concorda em seguir nosso [Código de Conduta](CODE_OF_CONDUCT_PT.md).

## Como Contribuir

### Relatando Bugs

Se você encontrar um bug, por favor crie uma issue no GitHub descrevendo o problema, incluindo:
- Passos para reproduzir
- Comportamento esperado
- Comportamento atual
- Screenshots (se aplicável)

### Sugerindo Melhorias

Adoramos novas ideias! Abra uma issue para discutir sua sugestão antes de começar a trabalhar.

### Pull Requests

1. Faça um fork do repositório
2. Crie uma nova branch para sua feature (`git checkout -b feature/minha-feature`)
3. Faça o commit das suas alterações (`git commit -m 'Adiciona minha feature incrível'`)
4. Faça o push para a branch (`git push origin feature/minha-feature`)
5. Abra um Pull Request

## Configuração do Ambiente

### Backend (FastAPI)

1. Navegue até o diretório do backend:
   ```bash
   cd backend
   ```
2. Crie e ative um ambiente virtual:
   ```bash
   python -m venv .venv
   source .venv/bin/activate  # No Windows: .venv\Scripts\activate
   ```
3. Instale as dependências:
   ```bash
   pip install -r requirements.txt
   ```
4. Configure o arquivo `.env` (veja o README para variáveis).
5. Execute o servidor:
   ```bash
   python main.py
   ```

### Frontend (React + Vite)

1. Navegue até a raiz do projeto:
   ```bash
   cd ..
   ```
2. Instale as dependências:
   ```bash
   npm install
   ```
3. Execute o servidor de desenvolvimento:
   ```bash
   npm run dev
   ```

## Guia de Estilo

- **Python**: Siga as diretrizes PEP 8.
- **JavaScript/React**: Siga as melhores práticas padrão do React. Use componentes funcionais e hooks.
- **Commits**: Escreva mensagens de commit claras e descritivas (se possível em inglês, mas português também é aceito).

## Licença

Ao contribuir, você concorda que suas contribuições serão licenciadas sob a Licença MIT usada por este projeto.
